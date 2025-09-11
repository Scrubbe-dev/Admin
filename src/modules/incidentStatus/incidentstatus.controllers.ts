import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { TicketStatusChangeData, EmailService } from '../auth/types/nodemailer.types';

export class TicketStatusChangeController {
  constructor(private emailService: EmailService) {}

  async updateTicketStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ticketId, newStatus } = req.body;
      
      // Validate input
      if (!ticketId || !newStatus) {
        res.status(400).json({ error: 'Missing required fields: ticketId and newStatus' });
        return;
      }

      // Get current ticket details
      const ticket = await prisma.incidentTicket.findUnique({
        where: { id: ticketId },
        select: {
          status: true,
          reason: true,
          description: true,
          assignedToEmail: true
        }
      });

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      const previousStatus = ticket.status;
      const assignee = await prisma.invites.findUnique({
        where: { email: ticket.assignedToEmail as string }
      });

      // Prepare data for email
      const emailData: TicketStatusChangeData = {
        ticketId,
        previousStatus,
        newStatus,
        assigneeName: assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Assignee',
        assigneeEmail: ticket.assignedToEmail as string,
        ticketTitle: ticket.reason,
        ticketDescription: ticket.description
      };

      // Update ticket status
      await prisma.incidentTicket.update({
        where: { id: ticketId },
        data: { status: newStatus }
      });

      // Send notification email
      await this.emailService.sendTicketStatusChangeEmail(emailData);

      res.status(200).json({ message: 'Ticket status updated and notification sent' });
    } catch (error: any) {
      res.status(500).json({ 
        error: 'Failed to update ticket status', 
        details: error.message 
      });
    }
  }
}