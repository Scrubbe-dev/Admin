import prisma from "../../prisma-clients/client";
import {
  CommentRequest,
  IncidentRequest,
  UpdateTicket,
} from "./incident.types";
import { IncidentUtils } from "./incident.util";
import { IncidentMapper } from "./incident.mapper";
import { ForbiddenError, NotFoundError } from "../auth/error";
import { IncidentStatus } from "@prisma/client";

// TODO: HAVE A MUST BE A BUSINESS MIDDLEWARE BEFORE SUBMITTING TICKET

export class IncidentService {
  constructor() {}

  async getIncidentTicketByUser(userId: string, page: number, limit: number) {
    try {
      // const pageable = await paginate<IncidentTicket>(
      //   "incidentTicket",
      //   {
      //     where: { assignedById: userId },
      //     orderBy: { createdAt: "desc" },
      //   },
      //   page,
      //   limit
      // );

      // return pageable;

      const inicidentTickets = prisma.incidentTicket.findMany({
        where: {
          assignedById: userId,
        },
      });

      return inicidentTickets;
    } catch (error) {
      const err = `Failed to fetch incidents: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }

  async submitIncident(request: IncidentRequest, userId: string) {
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
          assignedToEmail: request.assignedTo,
          userName: request.username,
          assignedById: userId,
          priority: request.priority,
          conversation: {
            create: {
              participants: {
                create: [
                  { user: { connect: { id: userId } } }, // assignedBy as participant
                ],
              },
            },
          },
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

      const slaStatus = IncidentUtils.calculateSLADueDate(
        incidentTicket.createdAt,
        incidentTicket.priority
      );

      const updatedTicket = await prisma.incidentTicket.update({
        where: {
          id: incidentTicket.id,
        },
        data: {
          riskScore: riskScore?.score,
          slaStatus,
          recommendedActions: mappedActions,
        },
      });

      return updatedTicket;
    } catch (error) {
      const err = `Failed to submit incident: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }

  async updateTicket(request: UpdateTicket, userId: string) {
    try {
      const incidentTicket = await prisma.incidentTicket.findUnique({
        where: {
          assignedById: userId,
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
          template: request.template,
          reason: request.reason,
          userName: request.username,
          assignedToEmail: request.assignedTo,
        },
      });

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
    incidentTicketId: string
  ) {
    try {
      const business = await prisma.business.findUnique({
        where: { id: request.businessId },
        include: { invites: true, user: true },
      });

      if (!business) {
        throw new NotFoundError(
          `Business not found with id: ${request.businessId}`
        );
      }

      // Check membership either owner or active member
      const inviteMember = business.invites.find(
        (invite) =>
          invite.email === email &&
          // invite.accepted && //
          invite.stillAMember
      );

      const isMember = inviteMember || business.userId === userId;

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
          isBusinessOwner: business.userId === userId,
        },
      });

      return IncidentMapper.mapToCommentResponse({
        id: newComment.id,
        content: newComment.content,
        createdAt: newComment.createdAt,
        firstname: inviteMember?.firstName ?? business.user.firstName,
        lastname: inviteMember?.lastName ?? business.user.lastName,
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
}
