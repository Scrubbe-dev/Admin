"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.resendConfig = {
    apiKey: process.env.RESEND_API_KEY || "re_VTGkqs9c_4hkcbYZQ1DhaH285FdqvHUfS",
    from: {
        email: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        name: process.env.RESEND_FROM_NAME || "Scrubbe",
    },
    replyTo: process.env.RESEND_REPLY_TO || process.env.RESEND_FROM_EMAIL,
};
// Validate configuration
if (!exports.resendConfig.apiKey) {
    throw new Error("Resend API key is missing. Please set RESEND_API_KEY environment variable.");
}
if (!exports.resendConfig.from.email) {
    throw new Error("Sender email is missing. Please set RESEND_FROM_EMAIL environment variable.");
}
