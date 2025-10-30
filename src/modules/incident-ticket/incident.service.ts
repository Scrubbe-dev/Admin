import prisma from "../../prisma-clients/client";
import {
  CommentRequest,
  CustomerFacingKbRequest,
  IncidentRequest,
  ResolveIncidentRequest,
  UpdateTicket,
} from "./incident.types";
import { IncidentUtils } from "./incident.util";
import { IncidentMapper } from "./incident.mapper";
import { ForbiddenError, NotFoundError } from "../auth/error";
import {
  Impact,
  IncidentStatus,
  Priority,
  Prisma,
  SLABreachType,
  Source,
} from "@prisma/client";
import { MeetUtil } from "../3rd-party-configurables/google/google-meet/meetUtil";
import { askEzra } from "../ezra-chat/askezra";
import {
  RootCauseSuggestionResponse,
  StakeHolderMessageResponse,
} from "../ezra-chat/ezra.types";

export class IncidentService {
  constructor() {}




  

  // async getIncidentTicketByBusiness(
  //   businessId: string,
  //   page: number,
  //   limit: number
  // ) {
  //   try {
  //     const inicidentTickets = prisma.incidentTicket.findMany({
  //       where: {
  //         businessId,
  //       },
  //     });

  //     return inicidentTickets;
  //   } catch (error) {
  //     const err = `Failed to fetch incidents: ${
  //       error instanceof Error && error.message
  //     }`;
  //     console.error(err);
  //     throw new Error(err);
  //   }
  // }


  async getIncidentTicketByBusiness(
    businessId: string,
    page: number,
    limit: number
  ) {
    try {
      const skip = (page - 1) * limit;
      
      // Get incidents with pagination
      const incidents = await prisma.incidentTicket.findMany({
        where: {
          businessId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          comments: {
            take: 5, // Get latest 5 comments
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          ResolveIncident: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc' // Latest first
        },
      });

      // Get total count for pagination info
      const totalCount = await prisma.incidentTicket.count({
        where: {
          businessId,
        },
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        incidents,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      };
    } catch (error) {
      const err = `Failed to fetch incidents: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }








// Add a new method to get all incidents (across all businesses) with pagination
  async getAllIncidents(page: number, limit: number, filters?: any) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause based on filters
      const where: Prisma.IncidentTicketWhereInput = {};
      
      if (filters?.status) {
        where.status = filters.status;
      }
      
      if (filters?.priority) {
        where.priority = filters.priority;
      }
      
      if (filters?.search) {
        where.OR = [
          { ticketId: { contains: filters.search, mode: 'insensitive' } },
          { userName: { contains: filters.search, mode: 'insensitive' } },
          { reason: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Get incidents with pagination
      const incidents = await prisma.incidentTicket.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          assignedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          },
          business: {
            select: {
              id: true,
              name: true,
            }
          },
          comments: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              author: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          },
          ResolveIncident: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
      });

      // Get total count for pagination info
      const totalCount = await prisma.incidentTicket.count({
        where,
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        incidents,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit,
        },
      };
    } catch (error) {
      const err = `Failed to fetch all incidents: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }











async submitIncident(
  request: IncidentRequest,
  userId: string,
  businessId: string
) {
  try {
    let ticketId: string;
    let exists;
    do {
      ticketId = IncidentUtils.generateTicketId();
      exists = await prisma.incidentTicket.findUnique({
        where: { ticketId },
      });
    } while (exists);

    const incidentTicket = await prisma.incidentTicket.create({
      data: {
        ticketId,
        reason: request.reason,
        assignedToEmail: request.assignedTo ?? null, // Handle optional field
        userName: request.userName,
        assignedById: userId as string,
        priority: request.priority as Priority,
        category: request.category as string,
        subCategory: request.subCategory as string,
        description: request.description as string,
        MTTR: request.MTTR as string,
        createdFrom: request.createdFrom ?? null,
        businessId,
        source: request.source as Source,
        impact: request.impact as Impact,
        suggestionFix: request.suggestionFix,
        affectedSystem: request.affectedSystem,
        status: request.status as IncidentStatus,
      },
    });

      const riskScore = await IncidentUtils.ezraDetermineRiskScore(
        incidentTicket
      );

      const recommendedActions = await IncidentUtils.ezraRecommendedActions(
        incidentTicket
      );

      const mappedActions = IncidentMapper.mapRecommendedAction(
        recommendedActions?.action
      );

      const slaTargets = IncidentUtils.calculateSLATargets(
        incidentTicket.createdAt,
        incidentTicket.priority
      );

      const updatedTicket = await prisma.incidentTicket.update({
        where: {
          id: incidentTicket.id,
        },
        data: {
          riskScore: riskScore?.score,
          recommendedActions: mappedActions,
          slaTargetAck: slaTargets.ack,
          slaTargetResolve: slaTargets.resolve,
        },
      });

      await IncidentUtils.sendIncidentTicketNotification(
        updatedTicket,
        "New Ticket submitted"
      );

      if (
        updatedTicket.priority === "HIGH" ||
        updatedTicket.priority === "CRITICAL"
      ) {
        console.log(
          "============== HIGH PRIORITY INCIDENT DETECTED =============="
        );
        const meetUtil = new MeetUtil();

        await meetUtil.triggerWarRoom(updatedTicket);
      }

      return updatedTicket;
    } catch (error) {
      const err = `Failed to submit incident: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }

  async acknowledgeIncident(ticketId: string) {
    try {
      const ticket = await prisma.incidentTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) throw new NotFoundError("Incident ticket not found with id");

      if (ticket.firstAcknowledgedAt) return;

      const now = new Date();
      const breach = ticket.slaTargetAck && now > ticket.slaTargetAck;

      await prisma.incidentTicket.update({
        where: { id: ticketId },
        data: {
          firstAcknowledgedAt: now,
        },
      });

      if (breach && ticket.slaTargetAck) {
        const breachDurationMinutes = Math.floor(
          (now.getTime() - ticket.slaTargetAck.getTime()) / 60000
        );

        await prisma.sLABreachAuditLog.create({
          data: {
            incidentId: ticketId,
            slaType: SLABreachType.ACK,
            breachedAt: now,
            breachDurationMinutes,
          },
        });
      }

      await IncidentUtils.sendIncidentTicketNotification(
        ticket,
        "Incident ticket was acknowledged"
      );

      return { success: true };
    } catch (error) {
      throw new Error(
        `${
          (error instanceof Error && error.message) ||
          "Error occured while acknowledging"
        }`
      );
    }
  }

  async resolveIncident(
    incidentTicketId: string,
    request: ResolveIncidentRequest
  ) {
    try {
      const ticket = await prisma.incidentTicket.findUnique({
        where: { id: incidentTicketId },
      });

      if (!ticket) throw new NotFoundError("Ticket not found");

      if (ticket.resolvedAt) return;

      await IncidentUtils.submitPostmortemForm(incidentTicketId, request);

      const now = new Date();
      const breach = ticket.slaTargetResolve && now > ticket.slaTargetResolve;

      await prisma.incidentTicket.update({
        where: { id: incidentTicketId },
        data: {
          resolvedAt: now,
          status: IncidentStatus.RESOLVED,
        },
      });

      if (breach && ticket.slaTargetResolve) {
        const breachDurationMinutes = Math.floor(
          (now.getTime() - ticket.slaTargetResolve.getTime()) / 60000
        );

        await prisma.sLABreachAuditLog.create({
          data: {
            incidentId: incidentTicketId,
            slaType: SLABreachType.RESOLVE,
            breachedAt: now,
            breachDurationMinutes,
          },
        });
      }

      await IncidentUtils.sendIncidentTicketNotification(
        ticket,
        "Incident ticket was resolved"
      );

      return { success: true };
    } catch (error) {
      throw new Error(
        `${
          (error instanceof Error && error.message) ||
          "Error occured while resolving"
        }`
      );
    }
  }

  async publishCustomerFacingKb(
    incidentTicketId: string,
    request: CustomerFacingKbRequest
  ) {
    const ticket = await prisma.incidentTicket.findUnique({
      where: { id: incidentTicketId },
    });

    if (!ticket) throw new NotFoundError("Ticket not found");

    await prisma.resolveIncident.update({
      where: {
        incidentTicketId: ticket.id,
      },
      data: {
        knowledgeTitleCustomer: request.title,
        knowledgeSummaryCustomer: request.summary,
      },
    });

    return { status: "success" };
  }

  async getAiSuggestion(incidentTicketId: string) {
    const incidentTicket = await prisma.incidentTicket.findFirst({
      where: {
        id: incidentTicketId,
      },
    });

    if (!incidentTicket)
      throw new NotFoundError("Ticket not found with id: " + incidentTicketId);

    const response = await askEzra<RootCauseSuggestionResponse>(
      "rootCauseSuggestion",
      JSON.stringify(incidentTicket)
    );

    return response;
  }

  async getFiveWhys(incidentTicketId: string) {
    const incidentTicket = await prisma.incidentTicket.findFirst({
      where: {
        id: incidentTicketId,
      },
    });

    if (!incidentTicket)
      throw new NotFoundError("Ticket not found with id: " + incidentTicketId);

    const response = await askEzra<RootCauseSuggestionResponse>(
      "generateFiveWhys",
      JSON.stringify(incidentTicket)
    );

    return response;
  }

  async getStakeHolderMessage(incidentTicketId: string) {
    const incidentTicket = await prisma.incidentTicket.findFirst({
      where: {
        id: incidentTicketId,
      },
    });

    if (!incidentTicket)
      throw new NotFoundError("Ticket not found with id: " + incidentTicketId);

    const response = await askEzra<StakeHolderMessageResponse>(
      "generateStakeHolderMessage",
      JSON.stringify(incidentTicket)
    );

    return response;
  }

  async updateTicket(request: UpdateTicket) {
    try {
      const incidentTicket = await prisma.incidentTicket.findUnique({
        where: {
          id: request.incidentId,
        },
      });

      if (!incidentTicket) {
        throw new NotFoundError(
          `Ticket not found with id: ${request.incidentId}`
        );
      }

      const updatedTicket = await prisma.incidentTicket.update({
        where: {
          id: incidentTicket.id,
        },
        data: {
          reason: request.reason,
          userName: request.userName,
          priority: request.priority as Priority,
          category: request.category as string,
          subCategory: request.subCategory as string,
          description: request.description as string,
          MTTR: (request.MTTR as string) || undefined,
          createdFrom: request.createdFrom ?? null,
          source: request.source as Source,
          impact: request.impact as Impact,
          suggestionFix: request.suggestionFix,
          affectedSystem: request.affectedSystem,
          status: request.status as IncidentStatus,
        },
      });

      await IncidentUtils.sendIncidentTicketNotification(
        updatedTicket,
        "Ticket updated"
      );

      return updatedTicket;
    } catch (error) {
      const err = `Failed to submit incident: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }

  async addComment(
    request: CommentRequest,
    userId: string,
    email: string,
    incidentTicketId: string,
    businessId: string
  ) {
    try {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        include: { 
          invites: true, 
          users: { // Changed from 'user' to 'User'
            where: { id: userId },
            select: { id: true, firstName: true, lastName: true }
          } 
        },
      });

      if (!business) {
        throw new NotFoundError(`Business not found with id: ${businessId}`);
      }

      // Get business owner from User array
      const businessOwner = business.users.find(u => u.id === userId);
      if (!businessOwner) {
        throw new NotFoundError("Business owner not found");
      }

      // Check membership either owner or active member
      const inviteMember = business.invites.find(
        (invite) =>
          invite.email === email &&
          invite.stillAMember
      );

      const isMember = inviteMember || business.users.some(u => u.id === userId);

      if (!isMember) {
        throw new ForbiddenError(
          `You must be an active member of ${business.name} to comment`
        );
      }

      const newComment = await prisma.incidentComment.create({
        data: {
          incidentTicketId,
          authorId: userId,
          content: request.content,
          isBusinessOwner: business.users[0].id === userId,
        },
      });

      return IncidentMapper.mapToCommentResponse({
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        firstname: inviteMember?.firstName ?? businessOwner.firstName,
        lastname: inviteMember?.lastName ?? businessOwner.lastName,
        isBusinessOwner: newComment.isBusinessOwner,
      });
    } catch (error) {
      throw new Error(
        `Failed to submit comment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getComments(incidentTicketId: string) {
    try {
      const incidentTicket = await prisma.incidentTicket.findFirst({
        where: {
          id: incidentTicketId,
        },
        include: {
          comments: {
            include: {
              author: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!incidentTicket) {
        throw new NotFoundError(
          `Incident ticket not found with id: ${incidentTicketId}`
        );
      }

      return incidentTicket.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        firstname: comment.author.firstName,
        lastname: comment.author.lastName,
        isBusinessOwner: comment.isBusinessOwner,
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch comments: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getTicketAnalytics(businessId: string) {
    try {
      const counts = await prisma.incidentTicket.groupBy({
        by: ["status"],
        where: {
          businessId,
        },
        _count: {
          status: true,
        },
      });

      if (!counts) {
        throw new NotFoundError("Business not found with id: " + businessId);
      }

      console.log("============ COUNT ============", counts);

      const allStatuses = [
        IncidentStatus.OPEN,
        IncidentStatus.ON_HOLD,
        IncidentStatus.IN_PROGRESS,
        IncidentStatus.CLOSED,
      ];
      const metrics = allStatuses.map((status) => {
        const found = counts.find((c) => c.status === status);
        return {
          status,
          count: found?._count.status || 0,
        };
      });

      return { metrics };
    } catch (error) {
      throw new Error(
        `Failed to get analytics: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getMessages(incidentTicketId: string) {
    try {
      const messages = await prisma.message.findMany({
        where: {
          conversation: {
            incidentTicketId,
          },
        },
        include: { sender: true },
        orderBy: {
          createdAt: "asc",
        },
      });

      return messages.map(IncidentMapper.messageMapper);
    } catch (error) {
      throw new Error(
        `Failed to get message history: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async getIncidentTicketById(incidentTicketId: string) {
    try {
      const ticket = await prisma.incidentTicket.findFirst({
        where: { ticketId: incidentTicketId },
      });

      if (!ticket) {
        return {
          status: 404,
        };
      }

      return ticket;
    } catch (error) {
      throw new Error(
        `Failed to get incident ticket: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async closeTicket(incidentTicketId: string) {
    try {
      const ticket = await prisma.incidentTicket.findFirst({
        where: { ticketId: incidentTicketId },
      });

      if (!ticket) {
        return {
          status: 404,
        };
      }

      if (ticket.status === "CLOSED") {
        return {
          status: 429,
        };
      }

      await prisma.incidentTicket.update({
        where: {
          ticketId: incidentTicketId,
        },
        data: {
          status: IncidentStatus.CLOSED,
        },
      });

      return {
        status: 200,
      };
    } catch (error) {
      throw new Error(
        `Failed to close incident ticket: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}