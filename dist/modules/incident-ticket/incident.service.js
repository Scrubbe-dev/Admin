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
    async getIncidentTicketByBusiness(businessId, page, limit) {
        try {
            const inicidentTickets = client_1.default.incidentTicket.findMany({
                where: {
                    businessId,
                },
            });
            return inicidentTickets;
        }
        catch (error) {
            const err = `Failed to fetch incidents: ${error instanceof Error && error.message}`;
            console.error(err);
            throw new Error(err);
        }
    }
    async submitIncident(request, userId, businessId) {
        try {
            let ticketId;
            let exists;
            do {
                ticketId = incident_util_1.IncidentUtils.generateTicketId();
                exists = await client_1.default.incidentTicket.findUnique({
                    where: { ticketId },
                });
            } while (exists);
            const incidentTicket = await client_1.default.incidentTicket.create({
                data: {
                    ticketId,
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
                },
            });
            const riskScore = await incident_util_1.IncidentUtils.ezraDetermineRiskScore(incidentTicket);
            const recommendedActions = await incident_util_1.IncidentUtils.ezraRecommendedActions(incidentTicket);
            const mappedActions = incident_mapper_1.IncidentMapper.mapRecommendedAction(recommendedActions?.action);
            const slaTargets = incident_util_1.IncidentUtils.calculateSLATargets(incidentTicket.createdAt, incidentTicket.priority);
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
            await incident_util_1.IncidentUtils.sendIncidentTicketNotification(updatedTicket, "New Ticket submitted");
            if (updatedTicket.priority === "HIGH" ||
                updatedTicket.priority === "CRITICAL") {
                console.log("============== HIGH PRIORITY INCIDENT DETECTED ==============");
                const meetUtil = new meetUtil_1.MeetUtil();
                await meetUtil.triggerWarRoom(updatedTicket);
            }
            return updatedTicket;
        }
        catch (error) {
            const err = `Failed to submit incident: ${error instanceof Error && error.message}`;
            console.error(err);
            throw new Error(err);
        }
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
                    User: {
                        where: { id: userId },
                        select: { id: true, firstName: true, lastName: true }
                    }
                },
            });
            if (!business) {
                throw new error_1.NotFoundError(`Business not found with id: ${businessId}`);
            }
            // Get business owner from User array
            const businessOwner = business.User.find(u => u.id === business.userId);
            if (!businessOwner) {
                throw new error_1.NotFoundError("Business owner not found");
            }
            // Check membership either owner or active member
            const inviteMember = business.invites.find((invite) => invite.email === email &&
                invite.stillAMember);
            const isMember = inviteMember || business.userId === userId;
            if (!isMember) {
                throw new error_1.ForbiddenError(`You must be an active member of ${business.name} to comment`);
            }
            const newComment = await client_1.default.incidentComment.create({
                data: {
                    incidentTicketId,
                    authorId: userId,
                    content: request.content,
                    isBusinessOwner: business.userId === userId,
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
