import dotenv from "dotenv";

dotenv.config();

const slackConfig = {
  slackClientId: process.env.SLACK_CLIENT_ID!,
  slackClientSecret: process.env.SLACK_CLIENT_SECRET!,
  slackVerificationToken: process.env.SLACK_VERIFICATION_TOKEN!,
  slackOauthBaseUrl: process.env.SLACK_OAUTH_BASE_URL!,
  slackRedirectUri: process.env.SLACK_REDIRECT_URI!,
};

export default slackConfig;
