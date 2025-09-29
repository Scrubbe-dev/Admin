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
    const useResend = process.env.USE_RESEND === 'true';
    if (useResend) {
        return {
            service: 'Resend',
            host: "smtp.resend.com",
            port: 465,
            secure: true,
            auth: {
                user: "resend",
                pass: "re_jnPgXfz2_KKCMtDPwdytWiY686JEpfkZk",
            },
            from: {
                email: "scrubbe.dev@gmail.com",
                name: "Scrubbe",
            },
            replyTo: "scrubbe.dev@gmail.com",
            cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
            connectionTimeout: 60000, // Increased timeout
            socketTimeout: 60000, // Increased timeout
            greetingTimeout: 30000, // Add greeting timeout
        };
    }
    else {
        // Try alternative Gmail configuration
        return {
            service: 'Gmail',
            host: "smtp.gmail.com",
            port: 587, // Try port 587 with STARTTLS
            secure: false, // STARTTLS will upgrade the connection
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
            from: {
                email: process.env.FROM_EMAIL || "scrubbe.dev@gmail.com",
                name: process.env.FROM_NAME || "Scrubbe",
            },
            replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
            cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
            connectionTimeout: 60000,
            socketTimeout: 60000,
            greetingTimeout: 30000,
            tls: {
                rejectUnauthorized: false
            }
        };
    }
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
