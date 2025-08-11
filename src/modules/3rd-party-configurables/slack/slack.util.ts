import { BusinessNotificationChannels } from "@prisma/client";
import prisma from "../../../prisma-clients/client";
import { WebClient } from "@slack/web-api";
import { N } from "ethers";
import { ConflictError } from "../../auth/error";

export class SlackUtil {
  constructor() {}

  static sendSlackNotification = async (userId: string, message: string) => {
    try {
      const integration = await prisma.userThirdpartyIntegration.findFirst({
        where: { userId, provider: BusinessNotificationChannels.SLACK },
      });

      if (!integration || !integration.accessToken) {
        throw new ConflictError("Slack not connected for this user");
      }

      if (!integration.defaultTarget) {
        throw new ConflictError("No default Slack channel set for this user");
      }

      const slack = new WebClient(integration.accessToken);

      try {
        await slack.conversations.join({
          channel: integration.defaultTarget,
        });
      } catch (joinError: any) {
        if (joinError.data?.error !== "already_in_channel") {
          throw joinError;
        }
      }

      await slack.chat.postMessage({
        channel: integration.defaultTarget,
        text: message,
      });

      return { status: "success", message: "Notification sent" };
    } catch (error) {
      console.error("Error occured while sending slack notification", error);
      throw new Error(`${error instanceof Error && error.message}`);
    }
  };
}
