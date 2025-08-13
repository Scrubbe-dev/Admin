import prisma from "../../../prisma-clients/client";
import dotenv from "dotenv";
import { BusinessNotificationChannels } from "@prisma/client";
import { ConfigureSMSRequest } from "./sms.type";
dotenv.config();

export class SMSService {
  constructor() {}

  async connectSMS(request: ConfigureSMSRequest, userId: string) {
    try {
      await prisma.userThirdpartyIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider: BusinessNotificationChannels.SMS,
          },
        },
        update: {
          metadata: {
            recipients: request.recipients,
          },
        },
        create: {
          userId,
          provider: BusinessNotificationChannels.SMS,
          metadata: {
            recipients: request.recipients,
          },
        },
      });

      return { status: "success", message: "SMS connected" };
    } catch (error) {
      console.error("Error occured while connecting SMS", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }
}
