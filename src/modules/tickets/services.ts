import { PrismaClient } from '@prisma/client';
import { TicketDetailResponse } from './types';
import { TicketHistoryUtils } from './utils/mainutils';

const prisma = new PrismaClient();

export class TicketService {

     static async getTicketHistory(ticketId: string) {
    const history = await TicketHistoryUtils.getTicketHistory(ticketId);
    return {
      ticketId,
      history
    };
  }
  static async getTicketById(ticketId: string): Promise<TicketDetailResponse | null | any> {
    return prisma.incidentTicket.findUnique({
      where: { id: ticketId },
      include: {
        assignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        business: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        Incident: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                contactEmail: true
              }
            }
          }
        }
      }
    }).then(ticket => {
      if (!ticket) return null;
      
      return {
        id: ticket.id,
        title: ticket.Incident[0]?.title || 'Untitled Incident',
        description: ticket.Incident[0]?.description || '',
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        assignee: ticket.assignedTo ? {
          id: ticket.assignedTo.id,
          name: `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`,
          email: ticket.assignedTo.email
        } : undefined,
        customer: ticket.Incident[0]?.customer ? {
          id: ticket.Incident[0].customer.id,
          name: ticket.Incident[0].customer.name,
          contactEmail: ticket.Incident[0].customer.contactEmail
        } : undefined,
        business: ticket.business ? {
          id: ticket.business.id,
          name: ticket.business.name
        } : undefined,
        conversationId: ticket.comments.length > 0 ? ticket.comments[0].id : undefined,
        comments: ticket.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          author: {
            id: comment.author.id,
            name: `${comment.author.firstName} ${comment.author.lastName}`,
            email: comment.author.email
          }
        }))
      };
    });
  }
}