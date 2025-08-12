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
          accessToken: request.authToken,
          metadata: {
            accountSid: request.accountSid,
            from: request.fromNumber,
          },
          defaultTarget: request.fromNumber,
        },
        create: {
          userId,
          provider: BusinessNotificationChannels.SMS,
          accessToken: request.authToken,
          metadata: {
            accountSid: request.accountSid,
            from: request.fromNumber,
          },
          defaultTarget: request.fromNumber,
        },
      });

      return { status: "success", message: "SMS connected" };
    } catch (error) {
      console.error("Error occured while connecting SMS", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }
}
