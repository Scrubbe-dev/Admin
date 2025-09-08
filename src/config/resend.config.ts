import dotenv from "dotenv";
dotenv.config();

export interface ResendConfig {
  apiKey: string;
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
}

export const resendConfig: ResendConfig = {
  apiKey: process.env.RESEND_API_KEY || "re_VTGkqs9c_4hkcbYZQ1DhaH285FdqvHUfS",
  from: {
    email: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    name: process.env.RESEND_FROM_NAME || "Scrubbe",
  },
  replyTo: process.env.RESEND_REPLY_TO || process.env.RESEND_FROM_EMAIL,
};

// Validate configuration
if (!resendConfig.apiKey) {
  throw new Error("Resend API key is missing. Please set RESEND_API_KEY environment variable.");
}
if (!resendConfig.from.email) {
  throw new Error("Sender email is missing. Please set RESEND_FROM_EMAIL environment variable.");
}