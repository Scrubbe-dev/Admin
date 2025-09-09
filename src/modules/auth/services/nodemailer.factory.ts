import { NodemailerEmailService } from "./nodemailer-email.service";
import { nodemailerConfig } from "../../../config/nodemailers.config";

export const createEmailService = () => {
  return new NodemailerEmailService(nodemailerConfig);
};