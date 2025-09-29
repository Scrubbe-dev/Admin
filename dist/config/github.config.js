"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitAppConfig = exports.githubConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const oauth_app_1 = require("@octokit/oauth-app");
dotenv_1.default.config();
exports.githubConfig = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    appId: process.env.GITHUB_APP_ID,
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
    redirectUrl: process.env.GITHUB_REDIRECT_URL,
    webhookUrl: process.env.GITHUB_WEBHOOK_URL,
    scopes: ["repo", "admin:repo_hook", "workflow"].join(" "),
    webhookEvents: ["push", "pull_request", "deployment_status", "workflow_run"],
};
exports.gitAppConfig = new oauth_app_1.OAuthApp({
    clientType: "github-app",
    clientId: exports.githubConfig.clientId,
    clientSecret: exports.githubConfig.clientSecret,
});
