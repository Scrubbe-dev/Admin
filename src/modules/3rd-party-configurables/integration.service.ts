import prisma from "../../prisma-clients/client";
import dotenv from "dotenv";
import slackConfig from "../../config/slack.config";
import axios from "axios";
import { BusinessNotificationChannels } from "@prisma/client";
import { ConflictError } from "../auth/error";
import { WebClient } from "@slack/web-api";
import { DefaultChannelRequest } from "./types";
import { ConfigureSMSRequest } from "./sms/sms.type";
dotenv.config();

export class IntegrationService {
  constructor() {}
  async connectSlack(redirectUri: string, clientId: string, userId: string) {
    const url = `${slackConfig.slackOauthBaseUrl}?client_id=${clientId}&scope=channels:join,groups:read,chat:write,channels:read&redirect_uri=${redirectUri}&state=${userId}`;

    return url;
  }

  async exchangeCodeForToken(code: string, userId: string) {
    try {
      const response = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        null,
        {
          params: {
            client_id: slackConfig.slackClientId,
            client_secret: slackConfig.slackClientSecret,
            code,
            redirect_uri: slackConfig.slackRedirectUri,
          },
        }
      );

      const data = response.data;
      if (!data.ok) throw new Error(data.error);

      console.log("=========== data ===========", data);

      const savedIntegration = await prisma.userThirdpartyIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider: BusinessNotificationChannels.SLACK,
          },
        },
        update: {
          accessToken: data.access_token,
          metadata: {
            teamId: data.team.id,
            teamName: data.team.name,
            botToken: data.access_token,
          },
        },
        create: {
          userId,
          provider: BusinessNotificationChannels.SLACK,
          accessToken: data.access_token,
          metadata: {
            teamId: data.team.id,
            teamName: data.team.name,
            botToken: data.access_token,
          },
        },
      });

      console.log("=========== savedIntegration ===========", savedIntegration);

      return {
        status: "success",
        message:
          "Slack connected successfully! You can now set your default channel.",
      };
    } catch (err) {
      console.error(err);
      throw new Error(`${err instanceof Error && err.message}`);
    }
  }

  async getUserDefaultChannels(userId: string) {
    try {
      const integration = await prisma.userThirdpartyIntegration.findFirst({
        where: { userId, provider: BusinessNotificationChannels.SLACK },
      });

      console.log("=========== integration ===========", integration);

      if (!integration || !integration.accessToken) {
        throw new ConflictError("Slack not connected for this user");
      }

      const slack = new WebClient(integration.accessToken);

      const result = await slack.conversations.list({
        types: "public_channel,private_channel",
        limit: 100,
      });

      console.log("=========== result ===========", result);

      if (!result.channels) return [];

      return result.channels.map((ch: any) => ({
        id: ch.id,
        name: ch.name,
      }));
    } catch (error) {
      console.error("Error occured while fetching slack channels", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

  async submitDefaultChannels(userId: string, request: DefaultChannelRequest) {
    try {
      const result = await prisma.userThirdpartyIntegration.update({
        where: {
          userId_provider: {
            userId,
            provider: BusinessNotificationChannels.SLACK,
          },
        },
        data: { defaultTarget: request.channelId },
      });

      if (!result) {
        throw new ConflictError("Slack not connected for this user");
      }

      return { status: "success", message: "Default Slack channel set" };
    } catch (error) {
      console.error("Error occured while fetching slack channels", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  }

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
