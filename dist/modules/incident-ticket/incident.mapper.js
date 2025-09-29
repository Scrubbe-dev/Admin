"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentMapper = void 0;
const client_1 = require("@prisma/client");
class IncidentMapper {
    static mapIncidents(incident) {
        return {
            createdAt: incident.createdAt,
            id: incident.id,
            description: incident.description,
            title: incident.title,
            priority: incident.priority,
        };
    }
    static mapRecommendedAction(actions) {
        const mappedAction = {
            lock_account: client_1.DetermineAction.LOCK_ACCOUNT,
            notify_analyst: client_1.DetermineAction.NOTIFY_ANALYST,
            quarantine: client_1.DetermineAction.QUARANTINE,
            terminate_session: client_1.DetermineAction.TERMINATE_SESSION,
        };
        return actions?.map((action) => mappedAction[action]) || [];
    }
    static mapToCommentResponse(comment) {
        return {
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            firstname: comment.firstname,
            lastname: comment.lastname,
            isBusinessOwner: comment.isBusinessOwner,
        };
    }
    static messageMapper(message) {
        return {
            id: message.id,
            conversationId: message.conversationId,
            content: message.content,
            createdAt: message.createdAt,
            sender: {
                id: message.sender.id,
                firstname: message.sender.firstName,
                lastname: message.sender.lastName,
                email: message.sender.email,
            },
        };
    }
}
exports.IncidentMapper = IncidentMapper;
