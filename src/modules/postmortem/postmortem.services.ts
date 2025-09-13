import { PrismaClient } from '@prisma/client';
import { PostmortemFilters, PostmortemResponse } from './postmortem.types';

const prisma = new PrismaClient();

export class PostmortemService {
  static async getPostmortems(
    filters: PostmortemFilters
  ): Promise<PostmortemResponse[] | any> {
    const whereClause: any = {};

    if (filters.incidentId) {
      whereClause.incidentTicketId = filters.incidentId;
    }

    if (filters.status) {
      whereClause['incidentTicket.incident.status'] = filters.status;
    }

    if (filters.priority) {
      whereClause['incidentTicket.incident.priority'] = filters.priority;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.resolveIncident.findMany({
      where: whereClause,
      include: {
        incidentTicket: {
          include: {
            Incident: true
          }
        }
      }
    });
  }
}