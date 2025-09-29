"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
const web_api_1 = require("@slack/web-api");
const slack_config_1 = __importDefault(require("../../../config/slack.config"));
const error_1 = require("../../auth/error");
const response_block_1 = require("./response-block");
dotenv_1.default.config();
class SlackService {
    constructor() { }
    async connectSlack(redirectUri, clientId, userId) {
        const url = `${slack_config_1.default.oauthBaseUrl}?client_id=${clientId}&scope=channels:join,groups:read,chat:write,channels:read&redirect_uri=${redirectUri}&state=${userId}`;
        return url;
    }
    async exchangeCodeForToken(code, userId) {
        try {
            const response = await axios_1.default.post("https://slack.com/api/oauth.v2.access", null, {
                params: {
                    client_id: slack_config_1.default.clientId,
                    client_secret: slack_config_1.default.clientSecret,
                    code,
                    redirect_uri: slack_config_1.default.redirectUri,
                },
            });
            const data = response.data;
            if (!data.ok)
                throw new Error(data.error);
            const savedIntegration = await client_2.default.userThirdpartyIntegration.upsert({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_1.BusinessNotificationChannels.SLACK,
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
                    provider: client_1.BusinessNotificationChannels.SLACK,
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
                message: "Slack connected successfully! You can now set your default channel.",
            };
        }
        catch (err) {
            console.error(err);
            throw new Error(`${err instanceof Error && err.message}`);
        }
    }
    async getUserDefaultChannels(userId) {
        try {
            const integration = await client_2.default.userThirdpartyIntegration.findFirst({
                where: { userId, provider: client_1.BusinessNotificationChannels.SLACK },
            });
            if (!integration || !integration.accessToken) {
                throw new error_1.ConflictError("Slack not connected for this user");
            }
            const slack = new web_api_1.WebClient(integration.accessToken);
            const result = await slack.conversations.list({
                types: "public_channel,private_channel",
                limit: 100,
            });
            if (!result.channels)
                return [];
            return result.channels.map((ch) => ({
                id: ch.id,
                name: ch.name,
            }));
        }
        catch (error) {
            console.error("Error occured while fetching slack channels", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async submitDefaultChannels(userId, request) {
        try {
            const result = await client_2.default.userThirdpartyIntegration.update({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_1.BusinessNotificationChannels.SLACK,
                    },
                },
                data: { defaultTarget: request.channelId },
            });
            if (!result) {
                throw new error_1.ConflictError("Slack not connected for this user");
            }
            return { status: "success", message: "Default Slack channel set" };
        }
        catch (error) {
            console.error("Error occured while fetching slack channels", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async getIncidentStatus(incidentId) {
        const resp = await axios_1.default.get(`${slack_config_1.default.incidentAPIUrl}/${incidentId}`);
        if (resp.data.status === 404) {
            return {
                response_type: "in_channel",
                text: `Incident ticket not found with id: ${incidentId}`,
            };
        }
        const blocks = (0, response_block_1.mapStatusResponse)(resp.data);
        return {
            response_type: "in_channel",
            blocks,
        };
    }
    async closeIncident(incidentId) {
        const resp = await axios_1.default.patch(`${slack_config_1.default.incidentAPIUrl}/${incidentId}/close`);
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
exports.SlackService = SlackService;
