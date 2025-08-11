import { SlackUtil } from "./slack/slack.util";
import { SMSUtil } from "./sms/sms.util";
import { NotificationProvider } from "./types";

export async function sendNotification(
  provider: NotificationProvider,
  userId: string,
  message: string
) {
  switch (provider) {
    case "SLACK":
      return await SlackUtil.sendSlackNotification(userId, message);
    case "SMS":
      return await SMSUtil.sendSms(userId, message);
    default:
      throw new Error(`Unknown provider/not yet configured: ${provider}`);
  }
}
