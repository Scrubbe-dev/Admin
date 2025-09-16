// services.ts
import { PrismaClient } from '@prisma/client';
import { PostmortemFilters, PostmortemResponse } from './postmortem.types';
import prisma from '../../lib/prisma';

export class PostmortemService {
  static async getPostmortems(
    filters: PostmortemFilters
  ): Promise<PostmortemResponse[]> {
    try {
      // Validate date formats
      if (filters.startDate && isNaN(filters.startDate.getTime())) {
        throw new Error('Invalid start date format');
      }

      if (filters.endDate && isNaN(filters.endDate.getTime())) {
        throw new Error('Invalid end date format');
      }

      // Build the where clause
      const whereClause: any = {};

      // Filter by incident ID
      if (filters.incidentId) {
        whereClause.incidentTicketId = filters.incidentId;
      }

      // Filter by date range
      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) {
          whereClause.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          // Set the end date to the end of the day
          const endOfDay = new Date(filters.endDate);
          endOfDay.setHours(23, 59, 59, 999);
          whereClause.createdAt.lte = endOfDay;
        }
      }

      // Prepare the incident filters - Fixed nested relation
      if (filters.status || filters.priority) {
        // Create a nested filter for the incident relation
        whereClause.incidentTicket = {
          Incident: { // Use the exact relation name from your schema
            ...(filters.status && { status: filters.status }),
            ...(filters.priority && { priority: filters.priority })
          }
        };
      }

      // Execute the query with pagination
      const postmortems = await prisma.resolveIncident.findMany({
        where: whereClause,
        include: {
          incidentTicket: {
            include: {
              Incident: true // Use the exact relation name from your schema
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100, // Limit results per page
        skip: filters.page ? (filters.page - 1) * 100 : 0
      });

      return postmortems;
    } catch (error) {
      console.error('Error in PostmortemService.getPostmortems:', error);
      throw error; // Re-throw to handle at the controller level
    }
  }
}