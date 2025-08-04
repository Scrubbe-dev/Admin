import prisma from "../../prisma-clients/client";
import { IncidentRequest, UpdateTicket } from "./incident.types";
import { IncidentUtils } from "./incident.util";
import { IncidentMapper } from "./incident.mapper";
import { NotFoundError } from "../auth/error";

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
}
