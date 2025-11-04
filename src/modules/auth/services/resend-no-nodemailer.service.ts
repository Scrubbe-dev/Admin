import { Resend } from "resend";
import {
  EmailService,
  CustomEmailOptions,
  EmailAttachment,
  TicketStatusChangeData,
} from "../types/nodemailer.types";

export * from "../types/nodemailer.types";

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private config: {
    from: {
      email: string;
      name: string;
    };
    cooldownPeriod: number;
  };
  private lastEmailSent: number = 0;
  private pendingEmails: Array<() => Promise<void>> = [];

  constructor(apiKey: string, fromEmail: string, fromName: string, cooldownPeriod: number) {
    if (!apiKey) {
      throw new Error("Resend API key is required.");
    }
    
    this.resend = new Resend(apiKey);
    this.config = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      cooldownPeriod,
    };
  }

  private async sendEmail(options: CustomEmailOptions, retryCount = 0): Promise<void> {
    // Check cooldown
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSent;
    
    if (timeSinceLastEmail < this.config.cooldownPeriod) {
      // Queue the email for later
      return new Promise<void>((resolve, reject) => {
        this.pendingEmails.push(async () => {
          try {
            await this.sendEmail(options);
            resolve();
          } catch (error) {
            reject(error);
          }
        });
        
        setTimeout(() => this.processQueue(), this.config.cooldownPeriod - timeSinceLastEmail);
      });
    }

    try {
      const fromAddress = `"${this.config.from.name}" <${this.config.from.email}>`;
      
      const emailOptions: any = {
        from: fromAddress,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
      };

      // Add text if provided
      if (options.text) {
        emailOptions.text = options.text;
      }

      // Add replyTo if provided
      if (options.replyTo) {
        emailOptions.replyTo = options.replyTo;
      }

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        emailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const { data, error } = await this.resend.emails.send(emailOptions);
      
      if (error) {
        throw new Error(`Resend API error: ${error.message}`);
      }
      
      this.lastEmailSent = Date.now();
      console.log(`✅ Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      console.log(`Message ID: ${data.id}`);
      
      // Process any pending emails
      if (this.pendingEmails.length > 0) {
        setTimeout(() => this.processQueue(), this.config.cooldownPeriod);
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}:`, error);
      
      // Retry logic
      if (retryCount < 2) {
        console.log(`Retrying email send (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1))); // Exponential backoff
        return this.sendEmail(options, retryCount + 1);
      }
      
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.pendingEmails.length === 0) return;
    
    const emailToSend = this.pendingEmails.shift();
    if (emailToSend) {
      try {
        await emailToSend();
      } catch (error) {
        console.error("Error processing queued email:", error);
      }
      
      // Process next email if any
      if (this.pendingEmails.length > 0) {
        setTimeout(() => this.processQueue(), this.config.cooldownPeriod);
      }
    }
  }

  // Implementation of all EmailService methods
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering with ${process.env.APP_NAME || "Scrubbe"}!</p>
        <p>Please use the verification code below to complete your registration:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes for security reasons.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
    });
  }

  generateVerificationOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("otp code", otp);
    return otp;
  }

  async sendInviteEmail(
    invite: {
      firstName: string;
      lastName: string;
      inviteEmail: string;
    },
    inviteLink: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">You're Invited to Join ${process.env.APP_NAME || "Scrubbe"}</h2>
        <p>Hi ${invite.firstName} ${invite.lastName},</p>
        <p>You have been invited to join <strong>${process.env.APP_NAME || "Scrubbe"}</strong>.</p>
        <p>Click the button below to complete your registration and set up your account:</p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Accept Invite
          </a>
        </div>
        <p>If the button doesn't work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${inviteLink}</p>
        <p>This invitation will expire in 7 days.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: invite.inviteEmail,
      subject: `You're Invited to Join ${process.env.APP_NAME || "Scrubbe"}`,
      html,
    });
  }

  async sendWarRoomEmail(
    to: string,
    incidentTicket: {
      ticketId: string;
      reason: string;
      status: string;
      priority: string;
    },
    meetingLink: string
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d9534f;">P1 Incident War Room</h2>
        <p>You are requested to join this War Room as there has been a P1 incident reported.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
          <p><strong>Details:</strong> ${incidentTicket.reason}</p>
          <p><strong>Status:</strong> ${incidentTicket.status}</p>
          <p><strong>Priority:</strong> ${incidentTicket.priority}</p>
        </div>
        <p><strong>Meeting link:</strong> <a href="${meetingLink}" style="color: #4A90E2;">${meetingLink}</a></p>
        <p>Please join the meeting as soon as possible.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to,
      subject: `P1 Incident War Room - ${incidentTicket.ticketId}`,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/auth/forgot-password?token=${resetToken}`;
    const resetIncidentLint  = `${process.env.INCIDENT_FRONTEND_URL}/auth/forgot-password?token=${resetToken}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>We received a request to reset your password for ${process.env.APP_NAME || "Scrubbe"}.</p>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password on Scrubbe Dev
          </a>
        </div>
        <div style="margin: 30px 0;">
               Or
        </div>

        <div style="margin: 30px 0;">
          <a href="${resetIncidentLint}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password on incident Scrubbe
          </a>
        </div>
        <p>Alternatively, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="word-break: break-all; color: #666;">${resetIncidentLint}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: email,
      subject: "Password Reset Request",
      html,
    });
  }

  async sendPasswordChangedConfirmation(email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Changed Successfully</h2>
        <p>Your password for ${process.env.APP_NAME || "Scrubbe"} has been successfully changed.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: email,
      subject: "Your Password Has Been Changed",
      html,
    });
  }

  async sendCustomEmail(options: CustomEmailOptions): Promise<void> {
    await this.sendEmail(options);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Verification Code</h2>
        <p>We received a request to reset your password for ${process.env.APP_NAME || "Scrubbe"}.</p>
        <p>Please use the verification code below to proceed:</p>
        <div style="background-color: #f0f0f0; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px;">
          ${code}
        </div>
        <p>This code will expire in 15 minutes for security reasons.</p>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: email,
      subject: "Password Reset Verification Code",
      html,
    });
  }

  async sendPasswordResetLink(email: string, resetLinkToken: string): Promise<void> {
    const resetLink = `${process.env.FRONTEND_URL}/auth/forgot-password?token=${resetLinkToken}`;
    const resetIncidentLint  = `${process.env.INCIDENT_FRONTEND_URL}/auth/forgot-password?token=${resetLinkToken}`
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Link</h2>
        <p>We received a request to reset your password for ${process.env.APP_NAME || "Scrubbe"}.</p>
        <p>Your verification code was successful. Please click the button below to reset your password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password on Scrubbe Dev
          </a>
        </div>
        <div style="margin: 30px 0;">
               Or
        </div>

        <div style="margin: 30px 0;">
          <a href="${resetIncidentLint}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password on incident Scrubbe
          </a>
        </div>
        <p>Alternatively, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="word-break: break-all; color: #666;">${resetIncidentLint}</p>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
    await this.sendEmail({
      to: email,
      subject: "Password Reset Link",
      html,
    });
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    await this.sendPasswordChangedConfirmation(email);
  }

  async sendTicketStatusChangeEmail(data: TicketStatusChangeData): Promise<void> {
    const { ticketId, previousStatus, newStatus, assigneeName, assigneeEmail, ticketTitle, ticketDescription } = data;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Status Update</h2>
        <p>Hello ${assigneeName},</p>
        <p>The state of ticket #${ticketId} — ${ticketTitle} has been updated.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0;">
          <p><strong>Previous State:</strong> ${previousStatus}</p>
          <p><strong>New State:</strong> ${newStatus}</p>
          <p><strong>Changed On:</strong> ${new Date().toISOString()}</p>
        </div>
        <p><strong>Description:</strong></p>
        <p>${ticketDescription}</p>
        <p>Next Step: Please review the updated state and take the necessary action.</p>
        <p>Thank you for keeping incidents on track.</p>
        <p>—<br>Scrubbe IMS<br>Incident Management & Fraud Monitoring Made Simple</p>
      </div>
    `;

    await this.sendEmail({
      to: assigneeEmail,
      subject: `[Scrubbe IMS] Ticket #${ticketId} has been moved to ${newStatus}`,
      html
    });
  }

async sendOnCallAssignmentEmail(
  to: string,
  assigneeName: string,
  assignmentData: {
    date: string;
    startTime: string;
    endTime: string;
    assignmentId: string;
  }
): Promise<void> {
  const formattedDate = new Date(assignmentData.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">On-Call Assignment Notification</h2>
      <p>Hello ${assigneeName},</p>
      <p>You have been assigned to on-call duty with the following schedule:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #4A90E2; margin: 20px 0;">
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time Slot:</strong> ${assignmentData.startTime} - ${assignmentData.endTime}</p>
        <p><strong>Assignment ID:</strong> ${assignmentData.assignmentId}</p>
      </div>
      
      <p><strong>Your Responsibilities:</strong></p>
      <ul style="color: #555;">
        <li>Be available during your assigned time slot</li>
        <li>Monitor incident tickets and respond promptly</li>
        <li>Coordinate with other team members as needed</li>
        <li>Escalate critical issues according to procedures</li>
      </ul>
      
      <p>Please ensure you're prepared and have access to all necessary systems during your on-call period.</p>
      
      <p>If you have any questions or need to request a swap, please contact your team lead.</p>
      
      <p>Thank you for your commitment to maintaining our service reliability.</p>
      
      <p>Best regards,<br>
      The ${process.env.APP_NAME || "Scrubbe"} Team</p>
    </div>
  `;

  await this.sendEmail({
    to,
    subject: `On-Call Assignment - ${formattedDate}`,
    html,
  });
}
}