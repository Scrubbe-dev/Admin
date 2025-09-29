"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetUtil = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../../prisma-clients/client"));
const google_config_1 = require("../../../../config/google.config");
const googleapis_1 = require("googleapis");
const email_service_1 = require("../../../auth/services/email.service");
class MeetUtil {
    emailService = new email_service_1.EmailService();
    constructor() { }
    async triggerWarRoom(incidentTicket) {
        try {
            if (!incidentTicket.businessId) {
                console.warn("Incident ticket has no associated business");
                return;
            }
            const response = await this.generateMeetingLink(incidentTicket);
            if (!response) {
                console.warn("Failed to generate meeting link");
                return {
                    status: "error",
                    message: "Failed to generate meeting link",
                };
            }
            const from = response.integration.defaultTarget || response.integration.user.email;
            const members = await client_2.default.invites.findMany({
                where: {
                    sentById: incidentTicket.businessId,
                    accepted: true,
                    stillAMember: true,
                },
            });
            console.log("============ FETCHED MEMBERS ==============", members);
            // including the user who triggered the incident
            const toMembers = [from, ...members.map((member) => member.email)];
            console.log("============ SEND TO MEMBERS ==============", members);
            for (const to of toMembers) {
                await this.sendMeetingDetails(from, to, incidentTicket, response.meetingLink);
            }
            return { status: "success", meetingLink: response.meetingLink };
        }
        catch (error) {
            console.error("Failed to trigger War Room", error);
        }
    }
    async sendMeetingDetails(from, to, incident, meetingLink) {
        try {
            await this.emailService.sendWarRoomEmail(from, to, incident, meetingLink);
        }
        catch (error) {
            console.error("Failed to send invite details", error);
        }
    }
    async generateMeetingLink(incidentTicket) {
        if (!incidentTicket.businessId) {
            console.warn("Incident has no associated business");
            return null;
        }
        const googleMeetIntegration = await client_2.default.userThirdpartyIntegration.findFirst({
            where: {
                provider: client_1.BusinessNotificationChannels.GOOGLE_MEET,
                user: {
                    business: {
                        id: incidentTicket.businessId,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        if (!googleMeetIntegration) {
            console.warn("Google meet integration not found");
            return null;
        }
        google_config_1.oauth2Client.setCredentials({
            access_token: googleMeetIntegration.accessToken,
            refresh_token: googleMeetIntegration.refreshToken,
        });
        const calendar = googleapis_1.google.calendar({ version: "v3", auth: google_config_1.oauth2Client });
        const event = await calendar.events.insert({
            calendarId: "primary",
            requestBody: {
                summary: `War Room - Incident ${incidentTicket.ticketId}`,
                description: incidentTicket.reason,
                start: { dateTime: new Date().toISOString() },
                end: {
                    dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                },
                conferenceData: {
                    createRequest: {
                        requestId: `meet-${incidentTicket.ticketId}`,
                        conferenceSolutionKey: { type: "hangoutsMeet" },
                    },
                },
            },
            conferenceDataVersion: 1,
        });
        const meetingLink = event.data.hangoutLink;
        return { meetingLink, integration: googleMeetIntegration };
    }
}
exports.MeetUtil = MeetUtil;
