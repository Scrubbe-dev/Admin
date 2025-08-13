import { BusinessNotificationChannels, IncidentTicket } from "@prisma/client";
import prisma from "../../../../prisma-clients/client";
import { oauth2Client } from "../../../../config/google.config";
import { google } from "googleapis";
import { EmailService } from "../../../auth/services/email.service";
import { GenerateMeetingLinkResult } from "./meet.type";

export class MeetUtil {
  private emailService: EmailService = new EmailService();
  constructor() {}

  async triggerWarRoom(incidentTicket: IncidentTicket) {
    try {
      if (!incidentTicket.businessId) {
        console.warn("Incident ticket has no associated business");
        return;
      }

      const test = await this.generateMeetingLink(incidentTicket);

      if (!test) {
        console.warn("Failed to generate meeting link");

        return {
          status: "error",
          message: "Failed to generate meeting link",
        };
      }

      const from =
        test.integration.defaultTarget || test.integration.user.email;

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
        await this.sendMeetingDetails(
          from,
          to,
          incidentTicket,
          test.meetingLink
        );
      }

      return { status: "success", meetingLink: test.meetingLink };
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

  async generateMeetingLink(
    incidentTicket: IncidentTicket
  ): Promise<GenerateMeetingLinkResult | null> {
    if (!incidentTicket.businessId) {
      console.warn("Incident has no associated business");

      return null;
    }

    const googleMeetIntegration =
      await prisma.userThirdpartyIntegration.findFirst({
        where: {
          provider: BusinessNotificationChannels.GOOGLE_MEET,
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

    oauth2Client.setCredentials({
      access_token: googleMeetIntegration.accessToken,
      refresh_token: googleMeetIntegration.refreshToken,
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

    return { meetingLink, integration: googleMeetIntegration };
  }
}
