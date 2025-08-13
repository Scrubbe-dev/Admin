import dotenv from "dotenv";

dotenv.config();

export const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  appId: process.env.GITHUB_APP_ID!,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
  redirectUrl: process.env.GITHUB_REDIRECT_URL!,
  webhookUrl: process.env.GITHUB_WEBHOOK_URL!,
  scopes: ["repo", "admin:repo_hook", "workflow"].join(" "),
  webhookEvents: ["push", "pull_request", "deployment_status", "workflow_run"],
};
