import { Business, BusinessNotificationChannels } from "@prisma/client";
import prisma from "../../../../prisma-clients/client";
import { googleConfig, oauth2Client } from "../../../../config/google.config";
import { google } from "googleapis";

export class MeetService {
  constructor() {}

  async connectMeet(userId: string) {
    try {
      const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: googleConfig.scopes,
        state: userId,
      });

      return url;
    } catch (error) {
      console.error("Error occured while connecting: ", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  async handleOAuthCallback(code: string, userId: string) {
    try {
      const { tokens } = await oauth2Client.getToken(code);

      oauth2Client.setCredentials(tokens);

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      const email = userInfo.data.email || null;

      const savedIntegration = await prisma.userThirdpartyIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider: BusinessNotificationChannels.GOOGLE_MEET,
          },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          defaultTarget: email ?? undefined,
        },
        create: {
          userId: userId as string,
          provider: BusinessNotificationChannels.GOOGLE_MEET,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          defaultTarget: email ?? undefined,
        },
      });

      console.log(
        "============= savedIntegration =============",
        savedIntegration
      );

      return {
        status: "success",
        message: "Google Meet connected successfully",
      };
    } catch (error) {
      console.error("Error occured while handling callback: ", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }
}
