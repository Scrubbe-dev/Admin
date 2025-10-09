"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailConfig = exports.nodemailerConfig = exports.getNodemailerConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Choose between Gmail or Resend based on environment
const getNodemailerConfig = () => {
    return {
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        requireTLS: true,
        tls: { rejectUnauthorized: false },
        auth: {
            user: "scrubbe.dev@gmail.com",
            pass: "vwce dzct nzip vxtp", // App password
        },
        from: {
            email: "scrubbe.dev@gmail.com",
            name: "Scrubbe",
        },
        replyTo: "scrubbe.dev@gmail.com",
        cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
        // Reasonable timeout values (in milliseconds)
        connectionTimeout: 30000, // 30 seconds
        socketTimeout: 30000, // 30 seconds
        greetingTimeout: 15000, // 15 seconds
    };
};
exports.getNodemailerConfig = getNodemailerConfig;
exports.nodemailerConfig = (0, exports.getNodemailerConfig)();
const validateEmailConfig = (config) => {
    if (!config.auth.user) {
        throw new Error("Email user is missing. Please set the appropriate environment variables.");
    }
    if (!config.auth.pass) {
        throw new Error("Email password/API key is missing. Please set the appropriate environment variables.");
    }
    console.log(`✅ Email service configured: ${config.service || 'Custom SMTP'}`);
    console.log(`📧 From: ${config.from.name} <${config.from.email}>`);
    console.log(`🔌 Host: ${config.host}:${config.port}`);
    console.log(`🔒 Secure: ${config.secure}`);
};
exports.validateEmailConfig = validateEmailConfig;
