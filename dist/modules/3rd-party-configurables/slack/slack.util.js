"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackUtil = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../prisma-clients/client"));
const web_api_1 = require("@slack/web-api");
const error_1 = require("../../auth/error");
class SlackUtil {
    constructor() { }
    static sendSlackNotification = async (userId, message) => {
        try {
            const integration = await client_2.default.userThirdpartyIntegration.findFirst({
                where: { userId, provider: client_1.BusinessNotificationChannels.SLACK },
            });
            if (!integration || !integration.accessToken) {
                throw new error_1.ConflictError("Slack not connected for this user");
            }
            if (!integration.defaultTarget) {
                throw new error_1.ConflictError("No default Slack channel set for this user");
            }
            const slack = new web_api_1.WebClient(integration.accessToken);
            try {
                await slack.conversations.join({
                    channel: integration.defaultTarget,
                });
            }
            catch (joinError) {
                if (joinError.data?.error !== "already_in_channel") {
                    throw joinError;
                }
            }
            await slack.chat.postMessage({
                channel: integration.defaultTarget,
                text: message,
            });
            return { status: "success", message: "Notification sent" };
        }
        catch (error) {
            console.error("Error occured while sending slack notification", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    };
}
exports.SlackUtil = SlackUtil;
