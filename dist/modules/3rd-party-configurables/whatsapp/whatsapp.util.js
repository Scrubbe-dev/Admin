"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappUtil = void 0;
const client_1 = require("@prisma/client");
const meetUtil_1 = require("../google/google-meet/meetUtil");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
const twilio_config_1 = require("../../../config/twilio.config");
class WhatsappUtil {
    meetUtil;
    constructor(meetUtil = new meetUtil_1.MeetUtil()) {
        this.meetUtil = meetUtil;
    }
    async triggerWarRoom(incidentTicket) {
        try {
            if (!incidentTicket.businessId) {
                console.warn("Incident has no associated business");
                return null;
            }
            const integration = await client_2.default.userThirdpartyIntegration.findFirst({
                where: {
                    provider: client_1.BusinessNotificationChannels.WHATSAPP,
                    user: {
                        business: {
                            id: incidentTicket.businessId,
                        },
                    },
                },
            });
            if (!integration || !integration.metadata) {
                console.warn("WhatsApp integration not found or no recipients set");
                return null;
            }
            const metadata = integration.metadata;
            console.log("=========== WhatsApp metadata ===========", metadata);
            const recipients = metadata.recipients || [];
            if (recipients.length === 0) {
                return {
                    status: "error",
                    message: "No WhatsApp recipients configured for this business",
                };
            }
            const response = await this.meetUtil.generateMeetingLink(incidentTicket);
            if (!response)
                return;
            const message = this.buildMessage(incidentTicket, response.meetingLink);
            for (const to of recipients) {
                await this.sendWhatsAppMessage(to, message);
            }
            return { status: "success", sent: recipients };
        }
        catch (error) {
            console.error("Failed to trigger WhatsApp War Room", error);
            return {
                status: "error",
                message: "Failed to trigger WhatsApp War Room",
            };
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
    async sendWhatsAppMessage(to, body) {
        try {
            await twilio_config_1.twilioClient.messages.create({
                from: `whatsapp:${twilio_config_1.twilioConfig.twilioWhatsapp}`,
                to: `whatsapp:${to}`,
                body,
            });
            console.log(`WhatsApp message sent to ${to}`);
        }
        catch (error) {
            console.error(`Failed to send WhatsApp message to ${to}`, error);
        }
    }
}
exports.WhatsappUtil = WhatsappUtil;
