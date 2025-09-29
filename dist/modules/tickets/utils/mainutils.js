"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketHistoryUtils = void 0;
const prisma_1 = __importDefault(require("../../../lib/prisma"));
class TicketHistoryUtils {
    static async getTicketHistory(ticketId) {
        const comments = await prisma_1.default?.incidentComment.findMany({
            where: { incidentTicketId: ticketId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        const statusChanges = await prisma_1.default.incidentTicket.findUnique({
            where: { id: ticketId },
            select: {
                status: true,
                createdAt: true,
                updatedAt: true,
                firstAcknowledgedAt: true,
                resolvedAt: true,
                closedAt: true
            }
        });
        // Combine and format history events
        const historyEvents = [];
        // Add status change events
        if (statusChanges) {
            if (statusChanges.firstAcknowledgedAt) {
                historyEvents.push({
                    timestamp: statusChanges.firstAcknowledgedAt,
                    action: 'status_changed',
                    oldValue: 'OPEN',
                    newValue: 'IN_PROGRESS',
                    actor: 'system' // Would need to track who acknowledged
                });
            }
            if (statusChanges.resolvedAt) {
                historyEvents.push({
                    timestamp: statusChanges.resolvedAt,
                    action: 'status_changed',
                    oldValue: 'IN_PROGRESS',
                    newValue: 'RESOLVED',
                    actor: 'system' // Would need to track who resolved
                });
            }
            if (statusChanges.closedAt) {
                historyEvents.push({
                    timestamp: statusChanges.closedAt,
                    action: 'status_changed',
                    oldValue: 'RESOLVED',
                    newValue: 'CLOSED',
                    actor: 'system' // Would need to track who closed
                });
            }
        }
        // Add comment events
        comments.forEach((comment) => {
            historyEvents.push({
                timestamp: comment.createdAt,
                action: 'comment_added',
                comment: comment.content,
                actor: `${comment.author.firstName} ${comment.author.lastName}`
            });
        });
        // Sort events by timestamp
        return historyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
}
exports.TicketHistoryUtils = TicketHistoryUtils;
