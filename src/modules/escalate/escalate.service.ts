// src/services/ticketService.ts
import { EscalationStatus } from '@prisma/client';
import { AppError } from './escalate.utils';
import {  EscalateResponse } from './escalate.type';
import prisma from '../../prisma-clients/client';

export class TicketService {

  static async escalateTicket(
    ticketId: string,
    escalatedToEmail: string,
    escalatedById: string, // the user who is performing the escalation
    reason?: string
  ): Promise<EscalateResponse> {
    // Find the ticket with business info
    const ticket = await prisma.incidentTicket.findUnique({
      where: { id: ticketId },
      include: { business: true },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Find the user to escalate to by email
    const escalatedToUser = await prisma.user.findUnique({
      where: { email: escalatedToEmail },
    });

    if (!escalatedToUser) {
      throw new AppError('User to escalate to not found', 404);
    }

    // Check if the user to escalate to is in the same business as the ticket
    if (ticket.businessId !== escalatedToUser?.id) {
      throw new AppError('User does not belong to the same organization', 403);
    }

    // Check if the user performing the escalation is in the same business as the ticket
    const escalatingUser = await prisma.user.findUnique({
      where: { id: escalatedById },
    });

    if (!escalatingUser || escalatingUser.id!== ticket.businessId) {
      throw new AppError('You do not have permission to escalate this ticket', 403);
    }

    // Create the escalation record
    const escalation = await prisma.escalatedIncident.create({
      data: {
        incidentTicketId: ticketId,
        escalatedToUserId: escalatedToUser.id,
        escalatedById: escalatedById,
        escalationReason: reason || '',
        status: EscalationStatus.PENDING,
      },
    });

    // Return the response
    return {
      ticketId: ticket.id,
      escalatedTo: escalatedToUser.role, // Using the user's role as per requirement
      timestamp: escalation.escalatedAt.toISOString(),
    };
  }
}