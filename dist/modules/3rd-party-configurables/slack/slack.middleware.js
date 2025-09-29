"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySlackSignature = verifySlackSignature;
const crypto_1 = __importDefault(require("crypto"));
const qs_1 = __importDefault(require("qs"));
const slack_config_1 = __importDefault(require("../../../config/slack.config"));
const error_1 = require("../../auth/error");
function verifySlackSignature(req, res, next) {
    try {
        const timestamp = req.headers["x-slack-request-timestamp"];
        const sigBaseString = `v0:${timestamp}:${qs_1.default.stringify(req.body, {
            format: "RFC1738",
        })}`;
        const mySignature = `v0=${crypto_1.default
            .createHmac("sha256", slack_config_1.default.signingSecret)
            .update(sigBaseString, "utf8")
            .digest("hex")}`;
        const slackSignature = req.headers["x-slack-signature"];
        if (!slackSignature ||
            !crypto_1.default.timingSafeEqual(Buffer.from(mySignature), Buffer.from(slackSignature))) {
            throw new error_1.UnauthorizedError("Invalid Slack signature");
        }
        next();
    }
    catch (error) {
        next(error);
    }
}
