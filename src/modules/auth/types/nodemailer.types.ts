import { IncidentStatus } from "@prisma/client";

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
  generateVerificationOTP(): string;
  
  // Password reset specific methods
  sendPasswordResetCode(email: string, code: string): Promise<void>;
  sendPasswordResetLink(email: string, resetLinkToken: string): Promise<void>;
  sendPasswordResetConfirmation(email: string): Promise<void>;
  sendTicketStatusChangeEmail(data: TicketStatusChangeData): Promise<void> 
}

export interface CustomEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
}

export interface EmailAttachment {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
  contentType?:string;
}


// Add to existing types file
export interface TicketStatusChangeData {
  ticketId: string;
  previousStatus: IncidentStatus;
  newStatus: IncidentStatus;
  assigneeName: string;
  assigneeEmail: string;
  ticketTitle: string;
  ticketDescription: string;
}