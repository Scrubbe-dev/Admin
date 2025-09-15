import { PrismaClient } from '@prisma/client';
import { PostmortemFilters, PostmortemResponse } from './postmortem.types';
import prisma from '../../lib/prisma'

export class PostmortemService {
  static async getPostmortems(
    filters: PostmortemFilters
  ): Promise<PostmortemResponse[] | any> {
    const whereClause: any = {};

        // Add validation before processing filters
    if (filters.startDate && isNaN(Date.parse(filters.startDate.toString()))) {
      throw new Error('Invalid start date format');
    }

    if (filters.endDate && isNaN(Date.parse(filters.endDate.toString()))) {
      throw new Error('Invalid end date format');
    }

    // Direct field filters
    if (filters.incidentId) {
      whereClause.incidentTicketId = filters.incidentId;
    }

    // Nested relation filters
    if (filters.status || filters.priority) {
      whereClause.incidentTicket = {
        incident: {
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority })
        }
      };
    }

    // Date range filter
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
      },
      take: 5000, // Limit results
      skip: 0  
    });
  }
}