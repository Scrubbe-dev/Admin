import dotenv from "dotenv";
import axios from "axios";
import { BusinessNotificationChannels } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import { WebClient } from "@slack/web-api";
import slackConfig from "../../../config/slack.config";
import { ConflictError } from "../../auth/error";
import { DefaultChannelRequest } from "../types";
import { mapStatusResponse } from "./response-block";
dotenv.config();

export class SlackService {
  constructor() {}
  async connectSlack(redirectUri: string, clientId: string, userId: string) {
    const url = `${slackConfig.oauthBaseUrl}?client_id=${clientId}&scope=channels:join,groups:read,chat:write,channels:read&redirect_uri=${redirectUri}&state=${userId}`;

    return url;
  }

  async exchangeCodeForToken(code: string, userId: string) {
    try {
      const response = await axios.post(
        "https://slack.com/api/oauth.v2.access",
        null,
        {
          params: {
            client_id: slackConfig.clientId,
            client_secret: slackConfig.clientSecret,
            code,
            redirect_uri: slackConfig.redirectUri,
          },
        }
      );

      const data = response.data;
      if (!data.ok) throw new Error(data.error);

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

      if (!integration || !integration.accessToken) {
        throw new ConflictError("Slack not connected for this user");
      }

      const slack = new WebClient(integration.accessToken);

      const result = await slack.conversations.list({
        types: "public_channel,private_channel",
        limit: 100,
      });

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

  async getIncidentStatus(incidentId: string) {
    const resp = await axios.get(`${slackConfig.incidentAPIUrl}/${incidentId}`);

    if (resp.data.status === 404) {
      return {
        response_type: "in_channel",
        text: `Incident ticket not found with id: ${incidentId}`,
      };
    }

    const blocks = mapStatusResponse(resp.data);

    return {
      response_type: "in_channel",
      blocks,
    };
  }

  async closeIncident(incidentId: string) {
    const resp = await axios.patch(
      `${slackConfig.incidentAPIUrl}/${incidentId}/close`
    );

    if (resp.data.status === 404) {
      return {
        response_type: "in_channel",
        text: `Incident ticket not found with id: ${incidentId}`,
      };
    }

    if (resp.data.status === 429) {
      return {
        response_type: "in_channel",
        text: `Incident ticket: ${incidentId} is already closed`,
      };
    }

    return {
      response_type: "in_channel",
      text: `Incident ${incidentId} has been closed ✅`,
    };
  }
}
