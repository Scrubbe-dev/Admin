import { Twilio } from "twilio";
import { BusinessNotificationChannels } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import { ConflictError } from "../../auth/error";

export class SMSUtil {
  constructor() {}
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

    const client = new Twilio(metadata.accountSid, integration.accessToken);

    return { client, metadata, integration };
  }

  static async sendSms(userId: string, message: string) {
    const { client, metadata, integration } = await this.getClient(userId);

    if (!integration.defaultTarget) {
      throw new ConflictError("No default SMS number set for this user");
    }

    await client.messages.create({
      from: metadata.fromNumber,
      to: integration.defaultTarget,
      body: message,
    });

    return { status: "success", message: "SMS sent successfully" };
  }
}
