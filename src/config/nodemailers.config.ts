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
  const useResend = process.env.USE_RESEND === 'true';
  
  if (useResend) {
    return {
      service: 'Resend',
      host: "smtp.resend.com",
      // port: 465,
      port:587,
      secure: false,
      auth: {
        user: "resend",
        pass: "re_jnPgXfz2_KKCMtDPwdytWiY686JEpfkZk",
      },
      from: {
        email:  "scrubbe.dev@gmail.com",
        name: "Scrubbe",
      },
      replyTo: "scrubbe.dev@gmail.com",
      cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
      connectionTimeout: 60000, // Increased timeout
      socketTimeout: 60000,     // Increased timeout
      greetingTimeout: 30000,   // Add greeting timeout
    };
  } else {
    // Try alternative Gmail configuration
    return {
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 465, // Try port 587 with STARTTLS
      secure: true, // STARTTLS will upgrade the connection
      auth: {
        user: "scrubbe.dev@gmail.com",
        pass: "vwce dzct nzip vxtp", // Use App Password or OAuth2 token
      },
      from: {
        email: "scrubbe.dev@gmail.com",
        name: "Scrubbe",
      },
      replyTo: "scrubbe.dev@gmail.com",
      cooldownPeriod: parseInt(process.env.EMAIL_COOLDOWN || "5000"),
      connectionTimeout: 60000000,
      socketTimeout: 60000000,
      greetingTimeout: 30000000,
      tls: {
        rejectUnauthorized: false
      }
    };
  }
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