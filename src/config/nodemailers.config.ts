import dotenv from "dotenv";

dotenv.config();

export interface NodemailerConfig {
  service?: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  cooldownPeriod: number; // in milliseconds
}


export const nodemailerConfig: NodemailerConfig = {
  // host: "smtp.gmail.com",
  host:"smtp.resend.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
  from: {
    email: process.env.GMAIL_USER!,
    name: process.env.GMAIL_FROM_NAME || "Scrubbe",
  },
  replyTo: process.env.GMAIL_REPLY_TO || process.env.GMAIL_USER!,
  cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"), // Default 5 seconds
};

// Validate configuration
if (!nodemailerConfig.auth.user) {
  throw new Error("Gmail user is missing. Please set GMAIL_USER environment variable.");
}
if (!nodemailerConfig.auth.pass) {
  throw new Error("Gmail app password is missing. Please set GMAIL_APP_PASSWORD environment variable.");
}