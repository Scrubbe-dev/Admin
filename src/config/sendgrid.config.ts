import dotenv from "dotenv";

dotenv.config();

export interface SendGridConfig {
  apiKey: string;
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  defaultCategories: string[];
}

export const sendGridConfig: SendGridConfig = {
  apiKey: process.env.SENDGRID_API_KEY || "",
  from: {
    email: process.env.SENDGRID_FROM_EMAIL || "noreply@example.com",
    name: process.env.SENDGRID_FROM_NAME || "Scrubbe",
  },
  replyTo: process.env.SENDGRID_REPLY_TO || process.env.SENDGRID_FROM_EMAIL,
  defaultCategories: ["transactional"],
};

// Validate configuration
if (!sendGridConfig.apiKey) {
  throw new Error("SendGrid API key is missing. Please set SENDGRID_API_KEY environment variable.");
}

if (!sendGridConfig.from.email) {
  throw new Error("Sender email is missing. Please set SENDGRID_FROM_EMAIL environment variable.");
}