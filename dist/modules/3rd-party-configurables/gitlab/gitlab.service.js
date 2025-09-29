"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitlabService = void 0;
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
const error_1 = require("../../auth/error");
const gitlab_config_1 = require("../../../config/gitlab.config");
const gitlab_util_1 = require("./gitlab.util");
const gitlab_webhook_1 = require("./gitlab.webhook");
const node_1 = require("@gitbeaker/node");
class GitlabService {
    webhook = new gitlab_webhook_1.GitlabWebhookService();
    gitlabUtil = new gitlab_util_1.GitlabUtil();
    getAuthUrl(userId) {
        const { clientId, redirectUrl, oauthAuthorizeUrl, scopes } = gitlab_config_1.gitlabConfig;
        return `${oauthAuthorizeUrl}?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUrl)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${userId}`;
    }
    async exchangeCodeForTokens(code, userId) {
        const { clientId, clientSecret, redirectUrl, oauthTokenUrl } = gitlab_config_1.gitlabConfig;
        const tokenResp = await axios_1.default.post(oauthTokenUrl, {
            client_id: clientId,
            client_secret: clientSecret,
            code,
            grant_type: "authorization_code",
            redirect_uri: redirectUrl,
        }, { headers: { "Content-Type": "application/json" } });
        console.log("=========== TOKEN RESP ===========", tokenResp.data);
        const { access_token, refresh_token, expires_in } = tokenResp.data;
        const encAccess = this.gitlabUtil.encryptSecret(access_token);
        const encRefresh = refresh_token
            ? this.gitlabUtil.encryptSecret(refresh_token)
            : null;
        let metadata = {
            webhookSecret: gitlab_config_1.gitlabConfig.webhookSecret,
        };
        const savedIntegration = await client_2.default.userThirdpartyIntegration.upsert({
            where: {
                userId_provider: {
                    userId,
                    provider: client_1.BusinessNotificationChannels.GITLAB,
                },
            },
            update: {
                accessToken: encAccess,
                refreshToken: encRefresh ?? undefined,
                metadata: metadata,
            },
            create: {
                userId,
                provider: client_1.BusinessNotificationChannels.GITLAB,
                accessToken: encAccess,
                refreshToken: encRefresh ?? undefined,
                metadata: metadata,
            },
        });
        console.log("========= SAVED INTEGRATION =========", savedIntegration);
        return {
            status: "success",
            message: "GitLab connected successfully",
        };
    }
    async getClient(userId) {
        let token = await this.gitlabUtil.getFreshToken(userId);
        let api = new node_1.Gitlab({ oauthToken: token });
        try {
            // test with a lightweight call to verify token validity
            await api.Users.current();
        }
        catch (e) {
            if (e.response && e.response.status === 401) {
                // if token is invalid refresh and recall
                token = await this.refreshAndPersist(userId);
                api = new node_1.Gitlab({ oauthToken: token });
            }
            else {
                throw e;
            }
        }
        return api;
    }
    async refreshAndPersist(userId) {
        const integ = await client_2.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_1.BusinessNotificationChannels.GITLAB },
        });
        if (!integ?.refreshToken)
            throw new error_1.NotFoundError("No refresh token");
        let refresh;
        try {
            refresh = this.gitlabUtil.decryptSecret(integ.refreshToken);
        }
        catch {
            refresh = integ.refreshToken;
        }
        const resp = await axios_1.default.post(gitlab_config_1.gitlabConfig.oauthTokenUrl, {
            client_id: gitlab_config_1.gitlabConfig.clientId,
            client_secret: gitlab_config_1.gitlabConfig.clientSecret,
            grant_type: "refresh_token",
            refresh_token: refresh,
        }, { headers: { "Content-Type": "application/json" } });
        const newAccess = resp.data.access_token;
        const encAccess = this.gitlabUtil.encryptSecret(newAccess);
        await client_2.default.userThirdpartyIntegration.update({
            where: { id: integ.id },
            data: { accessToken: encAccess },
        });
        return newAccess;
    }
    async listProjects(userId) {
        const api = await this.getClient(userId);
        const projects = await api.Projects.all({
            membership: true,
            simple: true,
            per_page: 100,
        });
        const mappedProjects = projects.map((p) => ({
            id: p.id,
            name: p.name,
            path_with_namespace: p.path_with_namespace,
            visibility: p.visibility,
        }));
        return mappedProjects;
    }
    async saveMonitoredProjects(userId, request) {
        const integ = await client_2.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_1.BusinessNotificationChannels.GITLAB },
        });
        if (!integ)
            throw new error_1.NotFoundError("GitLab not connected");
        let meta = null;
        try {
            meta = integ.metadata || null;
        }
        catch {
            meta = null;
        }
        if (!meta?.webhookSecret) {
            meta = {
                ...(meta || {}),
                webhookSecret: gitlab_config_1.gitlabConfig.webhookSecret,
            };
        }
        const api = await this.getClient(userId);
        for (const p of request.repos) {
            const hookUrl = `${gitlab_config_1.gitlabConfig.webhookUrl}?userId=${userId}`;
            await api.ProjectHooks.add(p.id, hookUrl, {
                token: meta.webhookSecret,
                push_events: true,
                merge_requests_events: true,
                pipeline_events: true,
                enable_ssl_verification: true,
            });
        }
        const updated = await client_2.default.userThirdpartyIntegration.update({
            where: { id: integ.id },
            data: {
                assignedToEmail: request.assignTo,
                metadata: {
                    ...meta,
                    projects: request.repos.map((p) => ({
                        id: p.id,
                        path_with_namespace: p.path_with_namespace,
                    })),
                },
            },
        });
        console.log("========= UPDATED =========", updated.metadata);
        return { status: "success", message: "Projects connected" };
    }
    async handleWebhook(xGitlabToken, userId, payload) {
        const integ = await client_2.default.userThirdpartyIntegration.findFirst({
            where: { userId, provider: client_1.BusinessNotificationChannels.GITLAB },
        });
        if (!integ)
            throw new error_1.NotFoundError("GitLab not connected");
        const metadata = integ.metadata;
        console.log("========= SAVED METADATA =========", metadata);
        if (!metadata?.webhookSecret || xGitlabToken !== metadata.webhookSecret) {
            throw new error_1.UnauthorizedError("Invalid webhook token");
        }
        await this.webhook.handleEvent(payload, userId);
    }
}
exports.GitlabService = GitlabService;
