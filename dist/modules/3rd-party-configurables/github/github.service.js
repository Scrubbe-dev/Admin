"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GithubService = void 0;
const rest_1 = require("@octokit/rest");
const axios_1 = __importDefault(require("axios"));
const client_1 = __importDefault(require("../../../prisma-clients/client"));
const client_2 = require("@prisma/client");
const github_config_1 = require("../../../config/github.config");
const error_1 = require("../../auth/error");
class GithubService {
    githubWebhookService;
    constructor(githubWebhookService) {
        this.githubWebhookService = githubWebhookService;
    }
    async getAuthUrl(userId) {
        const clientId = github_config_1.githubConfig.clientId;
        const redirectUrl = encodeURIComponent(github_config_1.githubConfig.redirectUrl); // FIX: Proper encoding
        const scopes = github_config_1.githubConfig.scopes;
        const { url } = github_config_1.gitAppConfig.getWebFlowAuthorizationUrl({
            state: "stated0c4e434-078c-45f6-998d-7376d2158bd6", // FIX: Use a proper state parameter for CSRF protection
        });
        console.log("Generating GitHub OAuth URL with:", {
            url,
            clientId,
            redirectUrl,
            scopes,
            userId,
            data: `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUrl}&scope=${scopes}&state=${userId}`
        });
        return url;
    }
    async handleOAuthCallback(code, userId) {
        try {
            const tokenResp = await axios_1.default.post(`https://github.com/login/oauth/access_token`, {
                client_id: github_config_1.githubConfig.clientId,
                client_secret: github_config_1.githubConfig.clientSecret,
                code,
            }, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                }
            });
            if (tokenResp.data.error) {
                throw new Error(`GitHub OAuth error: ${tokenResp.data.error_description}`);
            }
            const accessToken = tokenResp.data.access_token;
            const refreshToken = tokenResp.data.refresh_token; // FIX: Use refresh_token if available
            console.log("=========== TOKEN RESPONSE ===========", tokenResp.data);
            const savedIntegration = await client_1.default.userThirdpartyIntegration.upsert({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_2.BusinessNotificationChannels.GITHUB,
                    },
                },
                update: { accessToken, refreshToken },
                create: {
                    userId,
                    provider: client_2.BusinessNotificationChannels.GITHUB,
                    accessToken,
                    refreshToken,
                },
            });
            console.log("=========== SAVED INTEGRATION ===========", savedIntegration);
            return { status: "success", message: "GitHub connected successfully", savedIntegration };
        }
        catch (error) {
            console.error("OAuth callback error:", error);
            throw error;
        }
    }
    // ... rest of your service methods remain the same
    async listUserRepos(userId) {
        const integration = await client_1.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_2.BusinessNotificationChannels.GITHUB },
        });
        if (!integration?.accessToken) {
            throw new error_1.NotFoundError("GitHub not connected to this user");
        }
        const octokit = new rest_1.Octokit({ auth: integration.accessToken });
        const repos = await octokit.repos.listForAuthenticatedUser({
            visibility: "all",
            per_page: 100,
        });
        const mappedRepos = repos.data.map((repo) => ({
            id: repo.id,
            name: repo.name,
            private: repo.private,
            owner: repo.owner.login,
        }));
        console.log("====== MAPPED REPOS =====", mappedRepos);
        return mappedRepos;
    }
    async saveMonitoredRepos(userId, request) {
        const integration = await client_1.default.userThirdpartyIntegration.findFirst({
            where: {
                userId,
                provider: client_2.BusinessNotificationChannels.GITHUB,
                assignedToEmail: request.assignTo,
            },
        });
        if (!integration?.accessToken) {
            throw new error_1.NotFoundError("GitHub connection not found for this user");
        }
        const octokit = new rest_1.Octokit({ auth: integration.accessToken });
        for (const repo of request.repos) {
            await octokit.repos.createWebhook({
                owner: repo.owner,
                repo: repo.name,
                config: {
                    url: `${github_config_1.githubConfig.webhookUrl}?userId=${userId}`,
                    content_type: "json",
                    secret: github_config_1.githubConfig.webhookSecret,
                },
                events: github_config_1.githubConfig.webhookEvents,
            });
        }
        await client_1.default.userThirdpartyIntegration.update({
            where: { id: integration.id },
            data: { metadata: { repos: request.repos } },
        });
        return { status: "success", message: "Repositories connected" };
    }
    async handleWebhook(payload, event, userId, req) {
        const isSignValid = this.githubWebhookService.verifySignature(req);
        if (!isSignValid) {
            throw new error_1.UnauthorizedError("Invalid signature");
        }
        if (!event) {
            throw new error_1.UnauthorizedError("Missing X-GitHub-Event header");
        }
        await this.githubWebhookService.handleEvent(event, payload, userId);
    }
}
exports.GithubService = GithubService;
