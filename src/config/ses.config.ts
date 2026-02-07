import dotenv from "dotenv";

dotenv.config();

export interface SesConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  cooldownPeriod: number;
}

export const getSesConfig = (): SesConfig => {
  const region = process.env.AWS_SES_REGION || process.env.AWS_REGION || "";

  return {
    region,
    accessKeyId:
      process.env.AWS_SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey:
      process.env.AWS_SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken:
      process.env.AWS_SES_SESSION_TOKEN || process.env.AWS_SESSION_TOKEN,
    from: {
      email:
        process.env.AWS_SES_FROM_EMAIL ||
        process.env.FROM_EMAIL ||
        process.env.EMAIL_FROM ||
        "",
      name:
        process.env.AWS_SES_FROM_NAME ||
        process.env.APP_NAME ||
        "Scrubbe",
    },
    replyTo:
      process.env.AWS_SES_REPLY_TO ||
      process.env.REPLY_TO_EMAIL ||
      process.env.FROM_EMAIL,
    cooldownPeriod: parseInt(
      process.env.AWS_SES_COOLDOWN || process.env.EMAIL_COOLDOWN || "5000",
      10
    ),
  };
};

export const sesConfig = getSesConfig();

export const validateSesConfig = (config: SesConfig): void => {
  if (!config.region) {
    throw new Error(
      "AWS SES region is missing. Please set AWS_SES_REGION environment variable."
    );
  }

  if (!config.from.email) {
    throw new Error(
      "AWS SES from email is missing. Please set AWS_SES_FROM_EMAIL environment variable."
    );
  }

  const hasAccessKey = Boolean(config.accessKeyId);
  const hasSecretKey = Boolean(config.secretAccessKey);

  if (hasAccessKey !== hasSecretKey) {
    throw new Error(
      "AWS SES credentials are incomplete. Please set both AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY, or use IAM role credentials."
    );
  }

  console.log("AWS SES email service configured");
  console.log(`From: ${config.from.name} <${config.from.email}>`);
  console.log(`Region: ${config.region}`);
};
