"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const slackConfig = {
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    verificationToken: process.env.SLACK_VERIFICATION_TOKEN,
    oauthBaseUrl: process.env.SLACK_OAUTH_BASE_URL,
    redirectUri: process.env.SLACK_REDIRECT_URI,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    incidentAPIUrl: process.env.INCIDENT_API_URL,
};
exports.default = slackConfig;
