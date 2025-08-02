import prisma from "../../prisma-clients/client";
import { Incident, IncidentTicket } from "@prisma/client";
import { paginate } from "../auth/utils/pageable/pagination";
import { IncidentRequest } from "./incident.types";

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
      const incidentTicket = prisma.incidentTicket.create({
        data: {
          reason: request.reason,
          assignedTo: request.assignedTo,
          userName: request.username,
          assignedById: userId,
        },
      });

      return incidentTicket;
    } catch (error) {
      const err = `Failed to submit incident: ${
        error instanceof Error && error.message
      }`;
      console.error(err);
      throw new Error(err);
    }
  }
}
