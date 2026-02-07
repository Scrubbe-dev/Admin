import { SesEmailService } from "./ses-email.service";
import { sesConfig, validateSesConfig } from "../../../config/ses.config";

export const createEmailServiceWithSes = () => {
  validateSesConfig(sesConfig);
  return new SesEmailService(sesConfig);
};
