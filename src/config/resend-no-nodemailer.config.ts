import dotenv from "dotenv";

dotenv.config();

export interface ResendConfig {
  apiKey: string;
  from: {
    email: string;
    name: string;
  };
  cooldownPeriod: number;
}

export const getResendConfig = (): ResendConfig => {
//   const apiKey = process.env.RESEND_API_KEY;
  const apiKey = "re_PnjnJyBk_MVE15sJpCzRjoMcvcP1ofLmF";
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set in environment variables.");
  }
//   email: process.env.RESEND_FROM_EMAIL || "scrubbe.dev@gmail.com",
//       name: process.env.RESEND_FROM_NAME || "Scrubbe",

  return {
    apiKey,
    from: {
      email: "scrubbe.dev@gmail.com",
      name: "scrubbe-dev",
    },
    cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
  };
};

export const resendConfig = getResendConfig();

export const validateResendConfig = (config: ResendConfig): void => {
  if (!config.apiKey) {
    throw new Error("Resend API key is missing. Please set the RESEND_API_KEY environment variable.");
  }
  if (!config.from.email) {
    throw new Error("From email is missing. Please set the RESEND_FROM_EMAIL environment variable.");
  }
  
  console.log(`✅ Resend email service configured`);
  console.log(`📧 From: ${config.from.name} <${config.from.email}>`);
};