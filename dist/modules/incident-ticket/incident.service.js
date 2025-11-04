"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentService = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const incident_util_1 = require("./incident.util");
const incident_mapper_1 = require("./incident.mapper");
const error_1 = require("../auth/error");
const client_2 = require("@prisma/client");
const meetUtil_1 = require("../3rd-party-configurables/google/google-meet/meetUtil");
const askezra_1 = require("../ezra-chat/askezra");
class IncidentService {
    constructor() { }
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
    async getIncidentTicketByBusiness(businessId, page, limit) {
        try {
            const skip = (page - 1) * limit;
            // Get incidents with pagination
            const incidents = await client_1.default.incidentTicket.findMany({
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
            const totalCount = await client_1.default.incidentTicket.count({
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
        }
        catch (error) {
            const err = `Failed to fetch incidents: ${error instanceof Error && error.message}`;
            console.error(err);
            throw new Error(err);
        }
    }
    // Add a new method to get all incidents (across all businesses) with pagination
    async getAllIncidents(page, limit, filters) {
        try {
            const skip = (page - 1) * limit;
            // Build where clause based on filters
            const where = {};
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
            const incidents = await client_1.default.incidentTicket.findMany({
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
            const totalCount = await client_1.default.incidentTicket.count({
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
        }
        catch (error) {
            const err = `Failed to fetch all incidents: ${error instanceof Error && error.message}`;
            console.error(err);
            throw new Error(err);
        }
    }
    async checkTicketIdExists(ticketId) {
        try {
            const existingTicket = await client_1.default.incidentTicket.findUnique({
                where: { ticketId },
            });
            return !!existingTicket;
        }
        catch (error) {
            console.error(`Error checking ticket ID existence: ${error}`);
            return false;
        }
    }
    async submitIncident(request, userId, businessId) {
        try {
            // Step 1: Validate and generate ticket ID
            let finalTicketId;
            if (request.ticketId) {
                // Use provided ticket ID after validation
                const ticketIdExists = await this.checkTicketIdExists(request.ticketId);
                if (ticketIdExists) {
                    throw new Error(`Ticket ID ${request.ticketId} already exists. Please use a different ID.`);
                }
                finalTicketId = request.ticketId;
            }
            else {
                // Generate a new unique ticket ID
                finalTicketId = await this.generateUniqueTicketId();
            }
            console.log(`Creating incident with ticket ID: ${finalTicketId}`);
            // Step 2: Create the incident ticket
            const incidentTicket = await client_1.default.incidentTicket.create({
                data: {
                    ticketId: finalTicketId,
                    reason: request.reason,
                    assignedToEmail: request.assignedTo ?? null,
                    userName: request.userName,
                    assignedById: userId,
                    priority: request.priority,
                    category: request.category,
                    subCategory: request.subCategory,
                    description: request.description,
                    MTTR: request.MTTR,
                    createdFrom: request.createdFrom ?? null,
                    businessId,
                    source: request.source,
                    impact: request.impact,
                    suggestionFix: request.suggestionFix,
                    affectedSystem: request.affectedSystem,
                    status: request.status,
                    template: request.template || client_2.IncidentTemplate.NONE,
                },
            });
            // Step 3: Calculate risk score and recommended actions
            const [riskScore, recommendedActions] = await Promise.all([
                incident_util_1.IncidentUtils.ezraDetermineRiskScore(incidentTicket),
                incident_util_1.IncidentUtils.ezraRecommendedActions(incidentTicket)
            ]);
            const mappedActions = incident_mapper_1.IncidentMapper.mapRecommendedAction(recommendedActions?.action);
            const slaTargets = incident_util_1.IncidentUtils.calculateSLATargets(incidentTicket.createdAt, incidentTicket.priority);
            // Step 4: Update ticket with calculated fields
            const updatedTicket = await client_1.default.incidentTicket.update({
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
            // Step 5: Send notifications
            await incident_util_1.IncidentUtils.sendIncidentTicketNotification(updatedTicket, "New Ticket submitted");
            // Step 6: Trigger war room for high priority incidents
            if (updatedTicket.priority === "HIGH" ||
                updatedTicket.priority === "CRITICAL") {
                console.log("============== HIGH PRIORITY INCIDENT DETECTED ==============");
                const meetUtil = new meetUtil_1.MeetUtil();
                await meetUtil.triggerWarRoom(updatedTicket);
            }
            return {
                success: true,
                data: updatedTicket,
                message: `Incident ${finalTicketId} created successfully`
            };
        }
        catch (error) {
            console.error('Submit incident error:', error);
            // Handle specific error cases
            if (error instanceof Error) {
                if (error.message.includes('Ticket ID already exists')) {
                    throw new Error(`Failed to create incident: ${error.message}`);
                }
                if (error.message.includes('Unique constraint failed')) {
                    throw new Error('Ticket ID already exists. Please use a different ID.');
                }
            }
            throw new Error(`Failed to submit incident: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        }
    }
    async generateUniqueTicketId() {
        let ticketId;
        let exists;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            ticketId = incident_util_1.IncidentUtils.generateTicketId();
            exists = await this.checkTicketIdExists(ticketId);
            attempts++;
            if (attempts >= maxAttempts) {
                throw new Error('Unable to generate unique ticket ID after multiple attempts');
            }
        } while (exists);
        return ticketId;
    }
    async acknowledgeIncident(ticketId) {
        try {
            const ticket = await client_1.default.incidentTicket.findUnique({
                where: { id: ticketId },
            });
            if (!ticket)
                throw new error_1.NotFoundError("Incident ticket not found with id");
            if (ticket.firstAcknowledgedAt)
                return;
            const now = new Date();
            const breach = ticket.slaTargetAck && now > ticket.slaTargetAck;
            await client_1.default.incidentTicket.update({
                where: { id: ticketId },
                data: {
                    firstAcknowledgedAt: now,
                },
            });
            if (breach && ticket.slaTargetAck) {
                const breachDurationMinutes = Math.floor((now.getTime() - ticket.slaTargetAck.getTime()) / 60000);
                await client_1.default.sLABreachAuditLog.create({
                    data: {
                        incidentId: ticketId,
                        slaType: client_2.SLABreachType.ACK,
                        breachedAt: now,
                        breachDurationMinutes,
                    },
                });
            }
            await incident_util_1.IncidentUtils.sendIncidentTicketNotification(ticket, "Incident ticket was acknowledged");
            return { success: true };
        }
        catch (error) {
            throw new Error(`${(error instanceof Error && error.message) ||
                "Error occured while acknowledging"}`);
        }
    }
    async resolveIncident(incidentTicketId, request) {
        try {
            const ticket = await client_1.default.incidentTicket.findUnique({
                where: { id: incidentTicketId },
            });
            if (!ticket)
                throw new error_1.NotFoundError("Ticket not found");
            if (ticket.resolvedAt)
                return;
            await incident_util_1.IncidentUtils.submitPostmortemForm(incidentTicketId, request);
            const now = new Date();
            const breach = ticket.slaTargetResolve && now > ticket.slaTargetResolve;
            await client_1.default.incidentTicket.update({
                where: { id: incidentTicketId },
                data: {
                    resolvedAt: now,
                    status: client_2.IncidentStatus.RESOLVED,
                },
            });
            if (breach && ticket.slaTargetResolve) {
                const breachDurationMinutes = Math.floor((now.getTime() - ticket.slaTargetResolve.getTime()) / 60000);
                await client_1.default.sLABreachAuditLog.create({
                    data: {
                        incidentId: incidentTicketId,
                        slaType: client_2.SLABreachType.RESOLVE,
                        breachedAt: now,
                        breachDurationMinutes,
                    },
                });
            }
            await incident_util_1.IncidentUtils.sendIncidentTicketNotification(ticket, "Incident ticket was resolved");
            return { success: true };
        }
        catch (error) {
            throw new Error(`${(error instanceof Error && error.message) ||
                "Error occured while resolving"}`);
        }
    }
    async publishCustomerFacingKb(incidentTicketId, request) {
        const ticket = await client_1.default.incidentTicket.findUnique({
            where: { id: incidentTicketId },
        });
        if (!ticket)
            throw new error_1.NotFoundError("Ticket not found");
        await client_1.default.resolveIncident.update({
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
    async getAiSuggestion(incidentTicketId) {
        const incidentTicket = await client_1.default.incidentTicket.findFirst({
            where: {
                id: incidentTicketId,
            },
        });
        if (!incidentTicket)
            throw new error_1.NotFoundError("Ticket not found with id: " + incidentTicketId);
        const response = await (0, askezra_1.askEzra)("rootCauseSuggestion", JSON.stringify(incidentTicket));
        return response;
    }
    async getFiveWhys(incidentTicketId) {
        const incidentTicket = await client_1.default.incidentTicket.findFirst({
            where: {
                id: incidentTicketId,
            },
        });
        if (!incidentTicket)
            throw new error_1.NotFoundError("Ticket not found with id: " + incidentTicketId);
        const response = await (0, askezra_1.askEzra)("generateFiveWhys", JSON.stringify(incidentTicket));
        return response;
    }
    async getStakeHolderMessage(incidentTicketId) {
        const incidentTicket = await client_1.default.incidentTicket.findFirst({
            where: {
                id: incidentTicketId,
            },
        });
        if (!incidentTicket)
            throw new error_1.NotFoundError("Ticket not found with id: " + incidentTicketId);
        const response = await (0, askezra_1.askEzra)("generateStakeHolderMessage", JSON.stringify(incidentTicket));
        return response;
    }
    async updateTicket(request) {
        try {
            const incidentTicket = await client_1.default.incidentTicket.findUnique({
                where: {
                    id: request.incidentId,
                },
            });
            if (!incidentTicket) {
                throw new error_1.NotFoundError(`Ticket not found with id: ${request.incidentId}`);
            }
            const updatedTicket = await client_1.default.incidentTicket.update({
                where: {
                    id: incidentTicket.id,
                },
                data: {
                    reason: request.reason,
                    userName: request.userName,
                    priority: request.priority,
                    category: request.category,
                    subCategory: request.subCategory,
                    description: request.description,
                    MTTR: request.MTTR || undefined,
                    createdFrom: request.createdFrom ?? null,
                    source: request.source,
                    impact: request.impact,
                    suggestionFix: request.suggestionFix,
                    affectedSystem: request.affectedSystem,
                    status: request.status,
                },
            });
            await incident_util_1.IncidentUtils.sendIncidentTicketNotification(updatedTicket, "Ticket updated");
            return updatedTicket;
        }
        catch (error) {
            const err = `Failed to submit incident: ${error instanceof Error && error.message}`;
            console.error(err);
            throw new Error(err);
        }
    }
    async addComment(request, userId, email, incidentTicketId, businessId) {
        try {
            const business = await client_1.default.business.findUnique({
                where: { id: businessId },
                include: {
                    invites: true,
                    users: {
                        where: { id: userId },
                        select: { id: true, firstName: true, lastName: true }
                    }
                },
            });
            if (!business) {
                throw new error_1.NotFoundError(`Business not found with id: ${businessId}`);
            }
            // Get business owner from User array
            const businessOwner = business.users.find(u => u.id === userId);
            if (!businessOwner) {
                throw new error_1.NotFoundError("Business owner not found");
            }
            // Check membership either owner or active member
            const inviteMember = business.invites.find((invite) => invite.email === email &&
                invite.stillAMember);
            const isMember = inviteMember || business.users.some(u => u.id === userId);
            if (!isMember) {
                throw new error_1.ForbiddenError(`You must be an active member of ${business.name} to comment`);
            }
            const newComment = await client_1.default.incidentComment.create({
                data: {
                    incidentTicketId,
                    authorId: userId,
                    content: request.content,
                    isBusinessOwner: business.users[0].id === userId,
                },
            });
            return incident_mapper_1.IncidentMapper.mapToCommentResponse({
                id: newComment.id,
                content: newComment.content,
                createdAt: newComment.createdAt,
                firstname: inviteMember?.firstName ?? businessOwner.firstName,
                lastname: inviteMember?.lastName ?? businessOwner.lastName,
                isBusinessOwner: newComment.isBusinessOwner,
            });
        }
        catch (error) {
            throw new Error(`Failed to submit comment: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getComments(incidentTicketId) {
        try {
            const incidentTicket = await client_1.default.incidentTicket.findFirst({
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
                throw new error_1.NotFoundError(`Incident ticket not found with id: ${incidentTicketId}`);
            }
            return incidentTicket.comments.map((comment) => ({
                id: comment.id,
                content: comment.content,
                createdAt: comment.createdAt,
                firstname: comment.author.firstName,
                lastname: comment.author.lastName,
                isBusinessOwner: comment.isBusinessOwner,
            }));
        }
        catch (error) {
            throw new Error(`Failed to fetch comments: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getTicketAnalytics(businessId) {
        try {
            const counts = await client_1.default.incidentTicket.groupBy({
                by: ["status"],
                where: {
                    businessId,
                },
                _count: {
                    status: true,
                },
            });
            if (!counts) {
                throw new error_1.NotFoundError("Business not found with id: " + businessId);
            }
            console.log("============ COUNT ============", counts);
            const allStatuses = [
                client_2.IncidentStatus.OPEN,
                client_2.IncidentStatus.ON_HOLD,
                client_2.IncidentStatus.IN_PROGRESS,
                client_2.IncidentStatus.CLOSED,
            ];
            const metrics = allStatuses.map((status) => {
                const found = counts.find((c) => c.status === status);
                return {
                    status,
                    count: found?._count.status || 0,
                };
            });
            return { metrics };
        }
        catch (error) {
            throw new Error(`Failed to get analytics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getMessages(incidentTicketId) {
        try {
            const messages = await client_1.default.message.findMany({
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
            return messages.map(incident_mapper_1.IncidentMapper.messageMapper);
        }
        catch (error) {
            throw new Error(`Failed to get message history: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getIncidentTicketById(incidentTicketId) {
        try {
            const ticket = await client_1.default.incidentTicket.findFirst({
                where: { ticketId: incidentTicketId },
            });
            if (!ticket) {
                return {
                    status: 404,
                };
            }
            return ticket;
        }
        catch (error) {
            throw new Error(`Failed to get incident ticket: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async closeTicket(incidentTicketId) {
        try {
            const ticket = await client_1.default.incidentTicket.findFirst({
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
            await client_1.default.incidentTicket.update({
                where: {
                    ticketId: incidentTicketId,
                },
                data: {
                    status: client_2.IncidentStatus.CLOSED,
                },
            });
            return {
                status: 200,
            };
        }
        catch (error) {
            throw new Error(`Failed to close incident ticket: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.IncidentService = IncidentService;
