import { EmailService } from "../types/sendgrid.types";
import { SendGridEmailService } from "./sendgrid-email.service";
import { sendGridConfig } from "../../../config/sendgrid.config";

export class EmailServiceFactory {
  static create(): EmailService {
    return new SendGridEmailService(sendGridConfig);
  }
}