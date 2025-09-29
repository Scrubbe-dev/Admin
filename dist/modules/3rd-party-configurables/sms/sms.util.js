"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMSUtil = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
const error_1 = require("../../auth/error");
const twilio_config_1 = require("../../../config/twilio.config");
class SMSUtil {
    meetUtil;
    constructor(meetUtil) {
        this.meetUtil = meetUtil;
    }
    static async getClient(userId) {
        const integration = await client_2.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_1.BusinessNotificationChannels.SMS },
        });
        if (!integration || !integration.accessToken) {
            throw new error_1.ConflictError("SMS not connected for this user");
        }
        if (!integration.metadata) {
            throw new error_1.ConflictError("Twilio metadata is missing");
        }
        const metadata = typeof integration.metadata === "string"
            ? JSON.parse(integration.metadata)
            : integration.metadata;
        return { metadata, integration };
    }
    static async sendSms(userId, message) {
        const { metadata, integration } = await this.getClient(userId);
        if (!integration.defaultTarget) {
            throw new error_1.ConflictError("No default SMS number set for this user");
        }
        await twilio_config_1.twilioClient.messages.create({
            from: metadata.fromNumber,
            to: integration.defaultTarget,
            body: message,
        });
        return { status: "success", message: "SMS sent successfully" };
    }
    async triggerWarRoom(incidentTicket) {
        try {
            if (!incidentTicket.businessId) {
                console.warn("Incident has no associated business");
                return null;
            }
            const integration = await client_2.default.userThirdpartyIntegration.findFirst({
                where: {
                    provider: client_1.BusinessNotificationChannels.SMS,
                    user: {
                        business: {
                            id: incidentTicket.businessId,
                        },
                    },
                },
            });
            if (!integration || !integration.metadata) {
                console.warn("SMS integration not found or no recipients set");
                return null;
            }
            const metadata = integration.metadata;
            console.log("=========== WhatsApp metadata ===========", metadata);
            const recipients = metadata.recipients || [];
            if (recipients.length === 0) {
                return {
                    status: "error",
                    message: "No SMS recipients configured for this business",
                };
            }
            const response = await this.meetUtil.generateMeetingLink(incidentTicket);
            if (!response)
                return;
            const message = this.buildMessage(incidentTicket, response.meetingLink);
            for (const to of recipients) {
                await this.sendWarRoomSMS(to, message);
            }
        }
        catch (error) {
            console.error(`Error sending SMS: ${error}`);
        }
    }
    async sendWarRoomSMS(to, body) {
        try {
            await twilio_config_1.twilioClient.messages.create({
                from: twilio_config_1.twilioConfig.twiliosms,
                to,
                body,
            });
            console.log(`SMS message sent to ${to}`);
        }
        catch (error) {
            console.error(`Failed to send WhatsApp message to ${to}`, error);
        }
    }
    buildMessage(incident, meetingLink) {
        return (`*P1 Incident War Room Alert*\n\n` +
            `You are requested to join this War Room as there has been a P1 incident reported.\n\n` +
            `*Incident ID:* ${incident.ticketId}\n` +
            `*Details:* ${incident.reason}\n` +
            `*Status:* ${incident.status}\n` +
            `*Priority:* ${incident.priority}\n\n` +
            `Meeting link: ${meetingLink}`);
    }
}
exports.SMSUtil = SMSUtil;
