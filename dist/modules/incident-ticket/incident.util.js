"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentUtils = void 0;
const client_1 = __importDefault(require("../../prisma-clients/client"));
const client_2 = require("@prisma/client");
const askezra_1 = require("../ezra-chat/askezra");
const socket_1 = require("../socket/socket");
class IncidentUtils {
    constructor() { }
    static generateTicketId() {
        const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
        return `INC${randomNumber}`;
    }
    static calculateSLATargets(ticketCreatedTime, priority) {
        const slaThresholds = {
            [client_2.Priority.CRITICAL]: { ack: 15, resolve: 240 }, //P1
            [client_2.Priority.HIGH]: { ack: 30, resolve: 480 }, //P2
            [client_2.Priority.MEDIUM]: { ack: 60, resolve: 1440 }, //P3
            [client_2.Priority.LOW]: { ack: 120, resolve: 2880 }, //P4,
            [client_2.Priority.INFORMATIONAL]: { ack: 240, resolve: 5760 }, //P5
        };
        const { ack, resolve } = slaThresholds[priority];
        return {
            ack: new Date(ticketCreatedTime.getTime() + ack * 60 * 1000),
            resolve: new Date(ticketCreatedTime.getTime() + resolve * 60 * 1000),
        };
    }
    static async ezraDetermineRiskScore(incidentTicket) {
        try {
            return await (0, askezra_1.askEzra)("determineRiskScore", JSON.stringify(incidentTicket), incidentTicket);
        }
        catch (error) {
            console.error(`Ezra failed to determine risk score: ${error instanceof Error && error.message}`);
        }
    }
    static async ezraRecommendedActions(incidentTicket) {
        try {
            return await (0, askezra_1.askEzra)("recommendedAction", JSON.stringify(incidentTicket), incidentTicket);
        }
        catch (error) {
            console.error(`Ezra failed to determine risk score: ${error instanceof Error && error.message}`);
        }
    }
    static async sendIncidentTicketNotification(ticket, message) {
        try {
            await client_1.default.incidentTicketNotification.create({
                data: {
                    businessId: ticket.businessId,
                    ticketId: ticket.id,
                    message,
                },
            });
            const io = (0, socket_1.getSocketIO)();
            io.to(ticket.businessId).emit("incidentNotification", {
                businessId: ticket.businessId,
                ticket,
                message,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error("Failed to trigger notification: " + error);
        }
    }
    static async submitPostmortemForm(incidentTicketId, request) {
        console.log("============ SUBMIT FORM TRIGGERED ============");
        console.log("============ KNOWLEDGE DRAFT ============", request.knowledgeDraft);
        await client_1.default.resolveIncident.create({
            data: {
                incidentTicketId,
                causeCategory: request.rootCauseAnalysis.causeCategory,
                rootCause: request.rootCauseAnalysis.rootCause,
                why1: request.rootCauseAnalysis.fiveWhys.why1,
                why2: request.rootCauseAnalysis.fiveWhys.why2,
                why3: request.rootCauseAnalysis.fiveWhys.why3,
                why4: request.rootCauseAnalysis.fiveWhys.why4,
                why5: request.rootCauseAnalysis.fiveWhys.why5,
                temporaryFix: request.resolutionDetails.temporaryFix,
                permanentFix: request.resolutionDetails.permanentFix,
                knowledgeTitleInternal: request.knowledgeDraft.internalKb.title,
                knowledgeSummaryInternal: request.knowledgeDraft.internalKb.summary,
                identificationStepsInternal: request.knowledgeDraft.internalKb.identificationSteps,
                resolutionStepsInternal: request.knowledgeDraft.internalKb.resolutionSteps,
                preventiveMeasuresInternal: request.knowledgeDraft.internalKb.preventiveMeasures,
                knowledgeTagsInternal: request.knowledgeDraft.internalKb.tags,
                followUpTask: request.followUpActions.task,
                followUpOwner: request.followUpActions.owner,
                followUpDueDate: request.followUpActions.dueDate,
                followUpStatus: request.followUpActions.status,
                followUpTicketingSystems: request.followUpActions.ticketingSystems,
                communicationChannel: request.stakeHolder.communicationChannel,
                targetStakeholders: request.stakeHolder.targetStakeholders,
                messageContent: request.stakeHolder.messageContent,
            },
        });
    }
}
exports.IncidentUtils = IncidentUtils;
