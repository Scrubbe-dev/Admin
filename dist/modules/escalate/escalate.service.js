"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketService = void 0;
// src/services/ticketService.ts
const client_1 = require("@prisma/client");
const escalate_utils_1 = require("./escalate.utils");
const client_2 = __importDefault(require("../../prisma-clients/client"));
class TicketService {
    static async escalateTicket(ticketId, escalatedToEmail, escalatedById, // the user who is performing the escalation
    reason) {
        // Find the ticket with business info
        const ticket = await client_2.default.incidentTicket.findUnique({
            where: { id: ticketId },
            include: { business: true },
        });
        if (!ticket) {
            throw new escalate_utils_1.AppError('Ticket not found', 404);
        }
        // Find the user to escalate to by email
        const escalatedToUser = await client_2.default.user.findUnique({
            where: { email: escalatedToEmail },
        });
        if (!escalatedToUser) {
            throw new escalate_utils_1.AppError('User to escalate to not found', 404);
        }
        // Check if the user to escalate to is in the same business as the ticket
        if (ticket.businessId !== escalatedToUser?.id) {
            throw new escalate_utils_1.AppError('User does not belong to the same organization', 403);
        }
        // Check if the user performing the escalation is in the same business as the ticket
        const escalatingUser = await client_2.default.user.findUnique({
            where: { id: escalatedById },
        });
        if (!escalatingUser || escalatingUser.id !== ticket.businessId) {
            throw new escalate_utils_1.AppError('You do not have permission to escalate this ticket', 403);
        }
        // Create the escalation record
        const escalation = await client_2.default.escalatedIncident.create({
            data: {
                incidentTicketId: ticketId,
                escalatedToUserId: escalatedToUser.id,
                escalatedById: escalatedById,
                escalationReason: reason || '',
                status: client_1.EscalationStatus.PENDING,
            },
        });
        // Return the response
        return {
            ticketId: ticket.id,
            escalatedTo: escalatedToUser.role, // Using the user's role as per requirement
            timestamp: escalation.escalatedAt.toISOString(),
        };
    }
}
exports.TicketService = TicketService;
