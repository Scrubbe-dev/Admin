// services.ts
// import { PrismaClient } from '@prisma/client';
// import { PostmortemFilters, PostmortemResponse } from './postmortem.types';
// import prisma from '../../lib/prisma';

// // services.ts - Alternative implementation for filtering by related Incident
// export class PostmortemService {
//   static async getPostmortems(
//     filters: PostmortemFilters
//   ): Promise<PostmortemResponse[]> {
//     try {
//       // Validate date formats
//       if (filters.startDate && isNaN(filters.startDate.getTime())) {
//         throw new Error('Invalid start date format');
//       }

//       if (filters.endDate && isNaN(filters.endDate.getTime())) {
//         throw new Error('Invalid end date format');
//       }

//       // Build the where clause
//       const whereClause: any = {};

//       // Filter by incident ID
//       if (filters.incidentId) {
//         whereClause.incidentTicketId = filters.incidentId;
//       }

//       // Filter by date range
//       if (filters.startDate || filters.endDate) {
//         whereClause.createdAt = {};
//         if (filters.startDate) {
//           whereClause.createdAt.gte = filters.startDate;
//         }
//         if (filters.endDate) {
//           // Set the end date to the end of the day
//           const endOfDay = new Date(filters.endDate);
//           endOfDay.setHours(23, 59, 59, 999);
//           whereClause.createdAt.lte = endOfDay;
//         }
//       }

//       // Filter by related Incident's status and priority
//       if (filters.status || filters.priority) {
//         whereClause.incidentTicket = {
//           Incident: {
//             some: {
//               ...(filters.status && { status: filters.status }),
//               ...(filters.priority && { priority: filters.priority })
//             }
//           }
//         };
//       }

//       // Execute the query with pagination
//       const postmortems = await prisma.resolveIncident.findMany({
//         where: whereClause,
//         include: {
//           incidentTicket: {
//             include: {
//               Incident: true
//             }
//           }
//         },
//         orderBy: {
//           createdAt: 'desc'
//         },
//         take: 100,
//         skip: filters.page ? (filters.page - 1) * 100 : 0
//       });

//       return postmortems;
//     } catch (error) {
//       console.error('Error in PostmortemService.getPostmortems:', error);
//       throw error;
//     }
//   }
// }

// import { PostmortemFilters, PostmortemResponse } from './postmortem.types';
// import prisma from '../../lib/prisma';

// export class PostmortemService {
//   static async getPostmortems(
//     filters: PostmortemFilters
//   ): Promise<PostmortemResponse[]> {
//     try {
//       // Validate date formats
//       if (filters.startDate && isNaN(filters.startDate.getTime())) {
//         throw new Error('Invalid start date format');
//       }

//       if (filters.endDate && isNaN(filters.endDate.getTime())) {
//         throw new Error('Invalid end date format');
//       }

//       // Build the where clause
//       const whereClause: any = {};

//       // Filter by incident ID
//       if (filters.incidentId) {
//         whereClause.incidentTicketId = filters.incidentId;
//       }

//       // Filter by date range
//       if (filters.startDate || filters.endDate) {
//         whereClause.createdAt = {};
//         if (filters.startDate) {
//           whereClause.createdAt.gte = filters.startDate;
//         }
//         if (filters.endDate) {
//           // Set the end date to the end of the day
//           const endOfDay = new Date(filters.endDate);
//           endOfDay.setHours(23, 59, 59, 999);
//           whereClause.createdAt.lte = endOfDay;
//         }
//       }

//       // Filter by IncidentTicket's own status and priority (not the related Incident)
//       if (filters.status || filters.priority) {
//         // Create OR conditions for status and priority
//         const orConditions: any[] = [];
        
//         if (filters.status) {
//           orConditions.push({ status: filters.status });
//         }
        
//         if (filters.priority) {
//           orConditions.push({ priority: filters.priority });
//         }
        
//         // If we have conditions, add them with OR logic
//         if (orConditions.length > 0) {
//           whereClause.incidentTicket = {
//             OR: orConditions
//           };
//         }
//       }

//       // Execute the query with pagination
//       const postmortems = await prisma.resolveIncident.findMany({
//         where: whereClause,
//         include: {
//           incidentTicket: {
//             include: {
//               Incident: true 
//             }
//           }
//         },
//         orderBy: {
//           createdAt: 'desc'
//         },
//         take: 100,
//         skip: filters.page ? (filters.page - 1) * 100 : 0
//       });

//       return postmortems;
//     } catch (error) {
//       console.error('Error in PostmortemService.getPostmortems:', error);
//       throw error;
//     }
//   }
// }


import { PostmortemFilters, PostmortemResponse } from './postmortem.types';
import prisma from '../../lib/prisma';

export class PostmortemService {
  static async getPostmortems(
    filters: PostmortemFilters
  ): Promise<PostmortemResponse> {
    try {
      // Validate date formats
      if (filters.startDate && isNaN(filters.startDate.getTime())) {
        throw new Error('Invalid start date format');
      }

      if (filters.endDate && isNaN(filters.endDate.getTime())) {
        throw new Error('Invalid end date format');
      }

      // Build the where clause
      const whereClause: any = {
        // Only include incident tickets that have a postmortem (ResolveIncident)
        ResolveIncident: {
          isNot: null
        }
      };

      // Filter by incident ID (ticketId)
      if (filters.incidentId) {
        whereClause.id = filters.incidentId;
      }

      // Filter by date range (on IncidentTicket's createdAt)
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

      // Filter by IncidentTicket's status and priority with OR logic
      if (filters.status || filters.priority) {
        const orConditions: any[] = [];
        
        if (filters.status) {
          orConditions.push({ status: filters.status });
        }
        
        if (filters.priority) {
          orConditions.push({ priority: filters.priority });
        }
        
        // If we have conditions, add them with OR logic
        if (orConditions.length > 0) {
          whereClause.OR = orConditions;
        }
      }

      // Build orderBy clause
      const orderBy: any = {};
      const sortField = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      switch (sortField) {
        case 'createdAt':
          orderBy.createdAt = sortOrder;
          break;
        case 'priority':
          orderBy.priority = sortOrder;
          break;
        case 'status':
          orderBy.status = sortOrder;
          break;
        case 'ticketId':
          orderBy.id = sortOrder;
          break;
        default:
          orderBy.createdAt = sortOrder;
      }

      // Execute the query with pagination
      const incidentTickets = await prisma.incidentTicket.findMany({
        where: whereClause,
        include: {
          ResolveIncident: true,
          Incident: true
        },
        orderBy,
        take: 100,
        skip: filters.page ? (filters.page - 1) * 100 : 0
      });

      return incidentTickets;
    } catch (error) {
      console.error('Error in PostmortemService.getPostmortems:', error);
      throw error;
    }
  }
}