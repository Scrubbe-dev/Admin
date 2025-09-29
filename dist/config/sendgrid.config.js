"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendGridConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.sendGridConfig = {
    apiKey: process.env.SENDGRID_API_KEY || "",
    from: {
        email: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
        name: process.env.SENDGRID_FROM_NAME || "Scrubbe",
    },
    replyTo: process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL,
    defaultCategories: ["transactional"],
};
// Validate configuration
if (!exports.sendGridConfig.apiKey) {
    throw new Error("SendGrid API key is missing. Please set SENDGRID_API_KEY environment variable.");
}
if (!exports.sendGridConfig.from.email) {
    throw new Error("Sender email is missing. Please set SENDGRID_FROM_EMAIL environment variable.");
}
