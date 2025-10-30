
import { Priority, IncidentStatus } from '@prisma/client';
import { CreateCustomerIncidentInput, GetCustomerIncidentsInput, ApiResponse, CustomerIncident } from '../types';
import prisma from '../../../lib/prisma';
import { generateTimestampId } from '../utils/generateId';

export class CustomerIncidentService {
  static async createIncident(
    data: CreateCustomerIncidentInput,
    customerId: string,
    companyUserId: string
  ): Promise<ApiResponse<CustomerIncident>> {
    try {
      // Verify customer exists and belongs to the company
      const customer = await prisma.endCustomer.findFirst({
        where: { 
          id: customerId,
          companyUserId: companyUserId,
          // isActive: true 
        }
      });

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found or access denied'
        };
      }

      // Get company user business info
      const companyUser = await prisma.user.findUnique({
        where: { id: companyUserId },
        include: { business: true }
      });

      if (!companyUser) {
        return {
          success: false,
          message: 'Company not found'
        };
      }

      // Generate unique ticket number
      // const ticketNumber = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
       const ticketNumber = generateTimestampId();
      // Create the customer incident
      const incident = await prisma.endCustomerIncident.create({
        data: {
          ticketNumber,
          shortDescription: data.shortDescription,
          description: data.description,
          priority: data.priority.toUpperCase() as Priority,
          category: data.category,
          status: 'OPEN' as IncidentStatus,
          customerId: customerId,
          companyUserId: companyUserId,
          businessId: companyUser.business?.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          // Set SLA targets
          slaTargetResponse: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          slaTargetResolve: new Date(Date.now() + 72 * 60 * 60 * 1000)   // 72 hours
        },
        include: {
          customer: true,
          companyUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          business: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              comments: true,
              attachments: true
            }
          }
        }
      });


      //  ticketId,
      //           reason: request.reason,
      //           assignedToEmail: request.assignedTo ?? null,
      //           userName: request.userName,
      //           assignedById: userId as string,
      //           priority: request.priority as Priority,
      //           category: request.category as string,
      //           subCategory: request.subCategory as string,
      //           description: request.description as string,
      //           MTTR: request.MTTR as string,
      //           createdFrom: request.createdFrom ?? null,
      //           businessId,
      //           source: request.source as Source,
      //           impact: request.impact as Impact,
      //           suggestionFix: request.suggestionFix,
      //           affectedSystem: request.affectedSystem,
      //           status: request.status as IncidentStatus,
      //         },

    const incidentTicket = await prisma.incidentTicket.create({
        data: {
          ticketId: ticketNumber,
          description: data.description,
          priority: data.priority.toUpperCase() as Priority,
          category: data.category,
          status: 'OPEN' as IncidentStatus,
          assignedById:customerId,
          businessId: companyUser.business?.id as string,
          userName: companyUser.firstName + ' ' + companyUser.lastName,
          reason: data.shortDescription,
          assignedToEmail: companyUser.email, 
          subCategory: companyUser.business?.industry || "General",
          MTTR: "N/A",
        },
      });



      return {
        success: true,
        message: 'Incident created successfully',
        incidentTicket,
        data: {
          id: incident.id,
          ticketNumber: incident.ticketNumber,
          shortDescription: incident.shortDescription,
          description: incident.description,
          priority: incident.priority as "Low" | "Medium" | "High" | "Critical",
          category: incident.category,
          status: incident.status as IncidentStatus,
          customerId: incident.customerId,
          companyUserId: incident.companyUserId,
          businessId: incident.businessId || undefined,
          createdAt: incident.createdAt,
          updatedAt: incident.updatedAt,
          resolvedAt: incident.resolvedAt || undefined,
          closedAt: incident.closedAt || undefined,
          customer: {
            id: incident.customer.id,
            name: incident.customer.name!,
            contactEmail: incident.customer.contactEmail,
            companyUserId: incident.customer.companyUserId,
            isActive: incident.customer.isActive,
            isVerified: incident.customer.isVerified,
            createdAt: incident.customer.createdAt,
            updatedAt: incident.customer.updatedAt
          },
          _count: incident._count
        }
      };

    } catch (error: any) {
      console.error('Create customer incident error:', error);
      return {
        success: false,
        message: 'Failed to create incident',
        error: error.message
      };
    }
  }
  static async getCustomerIncidents(
    data: GetCustomerIncidentsInput,
    customerId: string,
    companyUserId: string
  ): Promise<ApiResponse<{ incidents: CustomerIncident[]; total: number; page: number; totalPages: number }>> {
    try {
      const { page, limit, status } = data;
      const skip = (page - 1) * limit;

      // Verify customer has access
      const customer = await prisma.endCustomer.findFirst({
        where: { 
          id: customerId,
          companyUserId: companyUserId,
        }
      });

      if (!customer) {
        return {
          success: false,
          message: 'Customer not found or access denied'
        };
      }

      // Build where clause
      const whereClause: any = {
        customerId: customerId,
        companyUserId: companyUserId
      };

      if (status) {
        whereClause.status = status;
      }

      // Get incidents with pagination
      const [incidents, total] = await Promise.all([
        prisma.endCustomerIncident.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          // skip,
          take: limit,
          include: {
            customer: true,
            companyUser: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            comments: {
              where: { isInternal: false },
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            _count: {
              select: {
                comments: true,
                attachments: true
              }
            }
          }
        }),
        prisma.endCustomerIncident.count({
          where: whereClause
        })
      ]);

      const formattedIncidents: CustomerIncident[] = incidents.map(incident => ({
        id: incident.id,
        ticketNumber: incident.ticketNumber,
        shortDescription: incident.shortDescription,
        description: incident.description,
        priority: incident.priority as "Low" | "Medium" | "High" | "Critical",
        category: incident.category,
        status: incident.status as IncidentStatus,
        customerId: incident.customerId,
        companyUserId: incident.companyUserId,
        businessId: incident.businessId || undefined,
        createdAt: incident.createdAt,
        updatedAt: incident.updatedAt,
        resolvedAt: incident.resolvedAt || undefined,
        closedAt: incident.closedAt || undefined,
        customer: {
          id: incident.customer.id,
          name: incident.customer.name!,
          contactEmail: incident.customer.contactEmail,
          companyUserId: incident.customer.companyUserId,
          isActive: incident.customer.isActive,
          isVerified: incident.customer.isVerified,
          createdAt: incident.customer.createdAt,
          updatedAt: incident.customer.updatedAt
        },
        comments: incident.comments.map(comment => ({
          id: comment.id,
          content: comment.content,
          authorType: comment.authorType as "CUSTOMER" | "USER",
          authorId: comment.authorId,
          isInternal: comment.isInternal,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        })),
        _count: incident._count
      }));

      return {
        success: true,
        message: 'Incidents retrieved successfully',
        data: {
          incidents: formattedIncidents,
          total,
          page,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error: any) {
      console.error('Get customer incidents error:', error);
      return {
        success: false,
        message: 'Failed to retrieve incidents',
        error: error.message
      };
    }
  }

  static async getIncidentById(incidentId: string, customerId: string, companyUserId: string): Promise<ApiResponse<CustomerIncident>> {
    try {
      const incident = await prisma.endCustomerIncident.findFirst({
        where: {
          id: incidentId,
          customerId: customerId,
          companyUserId: companyUserId
        },
        include: {
          customer: true,
          companyUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          },
          business: {
            select: {
              id: true,
              name: true,
              logo: true
            }
          },
          comments: {
            where: { isInternal: false },
            orderBy: { createdAt: 'asc' }
          },
          attachments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!incident) {
        return {
          success: false,
          message: 'Incident not found'
        };
      }

      return {
        success: true,
        message: 'Incident retrieved successfully',
        data: {
          id: incident.id,
          ticketNumber: incident.ticketNumber,
          shortDescription: incident.shortDescription,
          description: incident.description,
          priority: incident.priority as "Low" | "Medium" | "High" | "Critical",
          category: incident.category,
          status: incident.status as IncidentStatus,
          customerId: incident.customerId,
          companyUserId: incident.companyUserId,
          businessId: incident.businessId || undefined,
          createdAt: incident.createdAt,
          updatedAt: incident.updatedAt,
          resolvedAt: incident.resolvedAt || undefined,
          closedAt: incident.closedAt || undefined,
          customer: {
            id: incident.customer.id,
            name: incident.customer.name!,
            contactEmail: incident.customer.contactEmail,
            companyUserId: incident.customer.companyUserId,
            isActive: incident.customer.isActive,
            isVerified: incident.customer.isVerified,
            createdAt: incident.customer.createdAt,
            updatedAt: incident.customer.updatedAt
          },
          comments: incident.comments.map(comment => ({
            id: comment.id,
            content: comment.content,
            authorType: comment.authorType as "CUSTOMER" | "USER",
            authorId: comment.authorId,
            isInternal: comment.isInternal,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt
          })),
          attachments: incident.attachments.map(attachment => ({
            id: attachment.id,
            filename: attachment.filename,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            size: attachment.size,
            path: attachment.path,
            createdAt: attachment.createdAt
          })),
          _count: {
            comments: incident.comments.length,
            attachments: incident.attachments.length
          }
        }
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to retrieve incident',
        error: error.message
      };
    }
  }

  static async addComment(
    incidentId: string,
    customerId: string,
    companyUserId: string,
    content: string
  ): Promise<ApiResponse<any>> {
    try {
      // Verify incident exists and belongs to customer
      const incident = await prisma.endCustomerIncident.findFirst({
        where: {
          id: incidentId,
          customerId: customerId,
          companyUserId: companyUserId
        }
      });

      if (!incident) {
        return {
          success: false,
          message: 'Incident not found'
        };
      }

      const comment = await prisma.endCustomerIncidentComment.create({
        data: {
          content,
          isInternal: false,
          authorType: 'CUSTOMER',
          authorId: customerId,
          incidentId: incidentId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Update incident's updatedAt
      await prisma.endCustomerIncident.update({
        where: { id: incidentId },
        data: { updatedAt: new Date() }
      });

      return {
        success: true,
        message: 'Comment added successfully',
        data: comment
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to add comment',
        error: error.message
      };
    }
  }
}