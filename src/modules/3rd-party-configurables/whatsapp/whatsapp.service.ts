import { WhatsappRequest } from "./whatsapp.types";
import prisma from "../../../prisma-clients/client";
import { BusinessNotificationChannels } from "@prisma/client";

export class WhatsappService {
  constructor() {}

  async connectWhatsapp(
    businessId: string | undefined,
    userId: string,
    request: WhatsappRequest
  ) {
    try {
      await prisma.userThirdpartyIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider: BusinessNotificationChannels.WHATSAPP,
          },
        },
        update: {
          businessId,
          metadata: {
            recipents: request.recipients,
          },
        },
        create: {
          userId,
          provider: BusinessNotificationChannels.WHATSAPP,
          metadata: { recipents: request.recipients },
          businessId,
        },
      });

      return { status: "success", message: "Connected to Whatsapp" };
    } catch (error) {
      console.error("Error connecting to Whatsapp:", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }
}
