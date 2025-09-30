import { ResendEmailService } from "./resend-no-nodemailer.service";
import { resendConfig, validateResendConfig } from "../../../config/resend-no-nodemailer.config";

export const createEmailServiceWithResend = () => {
  validateResendConfig(resendConfig);
  return new ResendEmailService(
    resendConfig.apiKey,
    resendConfig.from.email,
    resendConfig.from.name,
    resendConfig.cooldownPeriod
  );
};