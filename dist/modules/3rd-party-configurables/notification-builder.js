"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
const slack_util_1 = require("./slack/slack.util");
const sms_util_1 = require("./sms/sms.util");
async function sendNotification(provider, userId, message) {
    switch (provider) {
        case "SLACK":
            return await slack_util_1.SlackUtil.sendSlackNotification(userId, message);
        case "SMS":
            return await sms_util_1.SMSUtil.sendSms(userId, message);
        default:
            throw new Error(`Unknown provider/not yet configured: ${provider}`);
    }
}
