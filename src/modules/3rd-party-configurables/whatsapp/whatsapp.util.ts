import { BusinessNotificationChannels, IncidentTicket } from "@prisma/client";
import { MeetUtil } from "../google/google-meet/meetUtil";
import prisma from "../../../prisma-clients/client";
import { twilioClient, twilioConfig } from "../../../config/twilio.config";
import { WhatsAppMetadata } from "./whatsapp.types";

export class WhatsappUtil {
  constructor(private meetUtil: MeetUtil = new MeetUtil()) {}

  async triggerWarRoom(incidentTicket: IncidentTicket) {
    try {
      if (!incidentTicket.businessId) {
        console.warn("Incident has no associated business");
        return null;
      }

      const integration = await prisma.userThirdpartyIntegration.findFirst({
        where: {
          provider: BusinessNotificationChannels.WHATSAPP,
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

      const metadata = integration.metadata as unknown as WhatsAppMetadata;
      console.log("=========== WhatsApp metadata ===========", metadata);
      const recipients = metadata.recipients || [];
      if (recipients.length === 0) {
        return {
          status: "error",
          message: "No WhatsApp recipients configured for this business",
        };
      }

      const response = await this.meetUtil.generateMeetingLink(incidentTicket);
      if (!response) return;

      const message = this.buildMessage(incidentTicket, response.meetingLink);

      for (const to of recipients) {
        await this.sendWhatsAppMessage(to, message);
      }

      return { status: "success", sent: recipients };
    } catch (error) {
      console.error("Failed to trigger WhatsApp War Room", error);
      return {
        status: "error",
        message: "Failed to trigger WhatsApp War Room",
      };
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

  private async sendWhatsAppMessage(to: string, body: string) {
    try {
      await twilioClient.messages.create({
        from: `whatsapp:${twilioConfig.twilioWhatsapp}`,
        to: `whatsapp:${to}`,
        body,
      });
      console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send WhatsApp message to ${to}`, error);
    }
  }
}
