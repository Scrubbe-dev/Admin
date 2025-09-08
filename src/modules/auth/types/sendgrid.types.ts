import { SendGridConfig } from "../../../config/sendgrid.config";

export interface EmailService {
  sendVerificationEmail(email: string, code: string): Promise<void>;
  sendInviteEmail(
    invite: {
      firstName: string;
      lastName: string;
      inviteEmail: string;
    },
    inviteLink: string
  ): Promise<void>;
  sendWarRoomEmail(
    to: string,
    incidentTicket: {
      ticketId: string;
      reason: string;
      status: string;
      priority: string;
    },
    meetingLink: string
  ): Promise<void>;
  sendPasswordResetEmail(email: string, resetToken: string): Promise<void>;
  sendPasswordChangedConfirmation(email: string): Promise<void>;
  sendCustomEmail(options: CustomEmailOptions): Promise<void>;
  generateVerificationOTP():string;
}

export interface CustomEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  categories?: string[];
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: string;
}