import dotenv from "dotenv";

dotenv.config();

export interface NodemailerConfig {
  service?: string;
  host: string;
  port: number;
  secure: boolean;
  requireTLS?: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    email: string;
    name: string;
  };
  tls?: {
        rejectUnauthorized: boolean;
  };
  replyTo?: string;
  cooldownPeriod: number;
  connectionTimeout?: number;
  socketTimeout?: number;
  greetingTimeout?: number;
}

// Choose between Gmail or Resend based on environment
export const getNodemailerConfig = (): NodemailerConfig => {
  return {
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    requireTLS: true,
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
    socketTimeout: 30000,     // 30 seconds
    greetingTimeout: 15000,   // 15 seconds
  };
};
export const nodemailerConfig = getNodemailerConfig();

export const validateEmailConfig = (config: NodemailerConfig): void => {
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