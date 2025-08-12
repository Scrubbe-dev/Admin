import { BusinessNotificationChannels, IncidentTicket } from "@prisma/client";
import prisma from "../../../../prisma-clients/client";
import { oauth2Client } from "../../../../config/google.config";
import { google } from "googleapis";
import { EmailService } from "../../../auth/services/email.service";

export class MeetUtil {
  private emailService: EmailService = new EmailService();
  constructor() {}

  async triggerWarRoom(incidentTicket: IncidentTicket) {
    console.log("============== TRIGGER WAR ROOM CALLED ==============");

    try {
      if (!incidentTicket.businessId) {
        console.log("Incident has no associated business");
        return {
          status: "error",
          message: "Incident has no associated business",
        };
      }

      const integration = await prisma.userThirdpartyIntegration.findFirst({
        where: {
          provider: "GOOGLE_MEET",
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

      if (!integration) {
        console.log("Google meet integration not found");

        return {
          status: "error",
          message: "Google meet integration not found",
        };
      }

      oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
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

      const meetingLink = event.data.hangoutLink as string;
      const from = integration.defaultTarget || integration.user.email;

      const members = await prisma.invites.findMany({
        where: {
          accepted: true,
          stillAMember: true,
          business: {
            id: incidentTicket.businessId,
          },
        },
      });

      // including the user who triggered the incident
      const toMembers = [from, ...members.map((member) => member.email)];

      for (const to of toMembers) {
        await this.sendMeetingDetails(from, to, incidentTicket, meetingLink);
      }

      return { status: "success", meetingLink };
    } catch (error) {
      console.error("Failed to trigger War Room", error);
    }
  }

  private async sendMeetingDetails(
    from: string,
    to: string,
    incident: IncidentTicket,
    meetingLink: string
  ) {
    try {
      await this.emailService.sendWarRoomEmail(from, to, incident, meetingLink);
    } catch (error) {
      console.error("Failed to send invite details", error);
    }
  }
}
