"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetService = void 0;
const client_1 = require("@prisma/client");
const client_2 = __importDefault(require("../../../../prisma-clients/client"));
const google_config_1 = require("../../../../config/google.config");
const googleapis_1 = require("googleapis");
class MeetService {
    constructor() { }
    async connectMeet(userId) {
        try {
            const url = google_config_1.oauth2Client.generateAuthUrl({
                access_type: "offline",
                scope: google_config_1.googleConfig.scopes,
                state: userId,
            });
            return url;
        }
        catch (error) {
            console.error("Error occured while connecting: ", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
    async handleOAuthCallback(code, userId) {
        try {
            const { tokens } = await google_config_1.oauth2Client.getToken(code);
            google_config_1.oauth2Client.setCredentials(tokens);
            const oauth2 = googleapis_1.google.oauth2({ version: "v2", auth: google_config_1.oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            const email = userInfo.data.email || null;
            const savedIntegration = await client_2.default.userThirdpartyIntegration.upsert({
                where: {
                    userId_provider: {
                        userId,
                        provider: client_1.BusinessNotificationChannels.GOOGLE_MEET,
                    },
                },
                update: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    defaultTarget: email ?? undefined,
                },
                create: {
                    userId: userId,
                    provider: client_1.BusinessNotificationChannels.GOOGLE_MEET,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    defaultTarget: email ?? undefined,
                },
            });
            console.log("============= savedIntegration =============", savedIntegration);
            return {
                status: "success",
                message: "Google Meet connected successfully",
            };
        }
        catch (error) {
            console.error("Error occured while handling callback: ", error);
            throw new Error(`${error instanceof Error && error.message}`);
        }
    }
}
exports.MeetService = MeetService;
