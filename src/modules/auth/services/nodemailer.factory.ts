import { NodemailerEmailService } from "./nodemailer-email.service";
import { nodemailerConfig, validateEmailConfig } from "../../../config/nodemailers.config";

export const createEmailService = () => {
  validateEmailConfig(nodemailerConfig);
  return new NodemailerEmailService(nodemailerConfig);
};