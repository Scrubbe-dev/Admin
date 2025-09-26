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
  cooldownPeriod: number;
  connectionTimeout?: number;
  socketTimeout?: number;
}

// Choose between Gmail or Resend based on environment
export const getNodemailerConfig = (): NodemailerConfig => {
  const useResend = process.env.USE_RESEND === 'true';
  
  if (useResend) {
    return {
      service: 'Resend',
      host: "smtp.resend.com",
      port: 465, // Use 465 for Resend
      secure: true, // Resend uses SSL on port 465
      auth: {
        user: "resend", // Fixed username for Resend
        pass: process.env.RESEND_API_KEY!, // Use Resend API key
      },
      from: {
        email: process.env.FROM_EMAIL || "onboarding@resend.dev",
        name: process.env.FROM_NAME || "Scrubbe",
      },
      replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
      cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
      connectionTimeout: 30000, // 30 seconds
      socketTimeout: 30000, // 30 seconds
    };
  } else {
    return {
      service: 'Gmail',
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
      from: {
        email: process.env.FROM_EMAIL || "scrubbe.dev@gmail.com",
        name: process.env.FROM_NAME || "Scrubbe",
      },
      replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL,
      cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
      connectionTimeout: 30000,
      socketTimeout: 30000,
    };
  }
};

export const nodemailerConfig = getNodemailerConfig();

// Validate configuration
export const validateEmailConfig = (config: NodemailerConfig): void => {
  if (!config.auth.user) {
    throw new Error("Email user is missing. Please set the appropriate environment variables.");
  }
  if (!config.auth.pass) {
    throw new Error("Email password/API key is missing. Please set the appropriate environment variables.");
  }
  
  console.log(`✅ Email service configured: ${config.service || 'Custom SMTP'}`);
  console.log(`📧 From: ${config.from.name} <${config.from.email}>`);
};