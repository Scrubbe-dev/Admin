import dotenv from "dotenv";

dotenv.config();

export const gitlabConfig = {
  clientId: process.env.GITLAB_CLIENT_ID!,
  clientSecret: process.env.GITLAB_CLIENT_SECRET!,
  redirectUrl: process.env.GITLAB_REDIRECT_URL!,
  webhookUrl: process.env.GITLAB_WEBHOOK_URL!,
  webhookSecret: process.env.GITLAB_WEBHOOK_SECRET!,
  secretEncKey: process.env.GITLAB_SECRETS_ENC_KEY!,
  scopes: ["api", "read_repository"].join(" "),

  oauthAuthorizeUrl: "https://gitlab.com/oauth/authorize",
  oauthTokenUrl: "https://gitlab.com/oauth/token",
  apiBase: "https://gitlab.com/api/v4",
};
