"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackController = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const slack_config_1 = __importDefault(require("../../../config/slack.config"));
const integration_schema_1 = require("../integration.schema");
const validators_1 = require("../../auth/utils/validators");
dotenv_1.default.config();
class SlackController {
    slackService;
    constructor(slackService) {
        this.slackService = slackService;
    }
    async connectSlack(req, res, next) {
        try {
            const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
            const userId = req.user?.sub;
            const clientId = slack_config_1.default.clientId;
            const response = await this.slackService.connectSlack(redirectUri, clientId, userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async exchangeCodeForToken(req, res, next) {
        try {
            const { code, state: userId } = req.query;
            const response = await this.slackService.exchangeCodeForToken(code, userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async getUserDefaultChannels(req, res, next) {
        try {
            const userId = req.user?.sub;
            const response = await this.slackService.getUserDefaultChannels(userId);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async submitDefaultChannel(req, res, next) {
        try {
            const userId = req.user?.sub;
            const request = await (0, validators_1.validateRequest)(integration_schema_1.defaultChannelSchema, req.body);
            const response = await this.slackService.submitDefaultChannels(userId, request);
            res.json(response);
        }
        catch (error) {
            next(error);
        }
    }
    async handleSlashCommand(req, res, next) {
        try {
            const request = req.body;
            switch (request.command) {
                case "/incident-status": {
                    const incidentId = request.text.trim();
                    const statusResp = await this.slackService.getIncidentStatus(incidentId);
                    res.json(statusResp);
                    return;
                }
                case "/incident-close": {
                    const incidentId = request.text.trim();
                    const statusResp = await this.slackService.closeIncident(incidentId);
                    res.json(statusResp);
                    return;
                }
                default:
                    res.json({ text: "Unknown command." });
            }
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SlackController = SlackController;
