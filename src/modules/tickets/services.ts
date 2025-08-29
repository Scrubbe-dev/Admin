import { IncidentStatus, PrismaClient } from '@prisma/client';
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
static async getTicketById(ticketId: string): Promise<TicketDetailResponse[] | null | any[]> {
    return prisma.incidentTicket.findMany({
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
        
        // Map status to required format
        const mapStatus = (status: IncidentStatus): string => {
            switch (status) {
                case 'OPEN': return 'OPEN';
                case 'IN_PROGRESS': return 'in-progress';
                case 'RESOLVED': return 'CLOSED'; // Treat resolved as closed
                case 'CLOSED': return 'CLOSED';
                case 'ON_HOLD': return 'on-hold';
                default: return 'OPEN';
            }
        };

        // Determine SLA status
        const determineSLAStatus = (ticket: any): string => {
            if (ticket.status === 'CLOSED') {
                return ticket.sLABreachAuditLog && ticket.sLABreachAuditLog.length > 0 ? 'BREACHED' : 'MET';
            } else {
                return ticket.sLABreachAuditLog && ticket.sLABreachAuditLog.length > 0 ? 'BREACHED' : 'PENDING';
            }
        };


    //   const allData = ticket.map((data)=>{
    //      return {
    //         id: data.id,
    //         ticketId: data.ticketId,
    //         reason: data.reason,
    //         userName: data.userName,
    //         priority: data.priority as "HIGH" | "MEDIUM" | "LOW", // Ensure correct priority type
    //         status: mapStatus(data.status),
    //         assignedToEmail: data.assignedToEmail,
    //         score: data.riskScore, // Use riskScore for score
    //         createdAt: data.createdAt.toISOString(),
    //         recommendedActions: data.recommendedActions.map(action => action.toString()),
    //         riskScore: data.riskScore,
    //         businessId: data.businessId,
    //         slaStatus: determineSLAStatus(data),
    //         template: data.template
    //      };
    //   })

        return ticket;
    });
}
}