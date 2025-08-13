import { Twilio } from "twilio";
import { BusinessNotificationChannels, IncidentTicket } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import { ConflictError } from "../../auth/error";
import { twilioClient, twilioConfig } from "../../../config/twilio.config";
import { SMSMetadata } from "./sms.type";
import { MeetUtil } from "../google/google-meet/meetUtil";

export class SMSUtil {
  constructor(private meetUtil: MeetUtil) {}
  private static async getClient(userId: string) {
    const integration = await prisma.userThirdpartyIntegration.findFirst({
      where: { userId, provider: BusinessNotificationChannels.SMS },
    });

    if (!integration || !integration.accessToken) {
      throw new ConflictError("SMS not connected for this user");
    }

    if (!integration.metadata) {
      throw new ConflictError("Twilio metadata is missing");
    }

    const metadata =
      typeof integration.metadata === "string"
        ? JSON.parse(integration.metadata)
        : integration.metadata;

    return { metadata, integration };
  }

  static async sendSms(userId: string, message: string) {
    const { metadata, integration } = await this.getClient(userId);

    if (!integration.defaultTarget) {
      throw new ConflictError("No default SMS number set for this user");
    }

    await twilioClient.messages.create({
      from: metadata.fromNumber,
      to: integration.defaultTarget,
      body: message,
    });

    return { status: "success", message: "SMS sent successfully" };
  }

  async triggerWarRoom(incidentTicket: IncidentTicket) {
    try {
      if (!incidentTicket.businessId) {
        console.warn("Incident has no associated business");
        return null;
      }

      const integration = await prisma.userThirdpartyIntegration.findFirst({
        where: {
          provider: BusinessNotificationChannels.SMS,
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

      const metadata = integration.metadata as unknown as SMSMetadata;
      console.log("=========== WhatsApp metadata ===========", metadata);

      const recipients = metadata.recipients || [];
      if (recipients.length === 0) {
        return {
          status: "error",
          message: "No SMS recipients configured for this business",
        };
      }

      const response = await this.meetUtil.generateMeetingLink(incidentTicket);
      if (!response) return;

      const message = this.buildMessage(incidentTicket, response.meetingLink);

      for (const to of recipients) {
        await this.sendWarRoomSMS(to, message);
      }
    } catch (error) {
      console.error(`Error sending SMS: ${error}`);
    }
  }

  private async sendWarRoomSMS(to: string, body: string) {
    try {
      await twilioClient.messages.create({
        from: twilioConfig.twiliosms,
        to,
        body,
      });
      console.log(`SMS message sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${to}`, error);
    }
  }

  private buildMessage(incident: IncidentTicket, meetingLink: string) {
    return (
      `*P1 Incident War Room Alert*\n\n` +
      `You are requested to join this War Room as there has been a P1 incident reported.\n\n` +
      `*Incident ID:* ${incident.ticketId}\n` +
      `*Details:* ${incident.reason}\n` +
      `*Status:* ${incident.status}\n` +
      `*Priority:* ${incident.priority}\n\n` +
      `Meeting link: ${meetingLink}`
    );
  }
}
