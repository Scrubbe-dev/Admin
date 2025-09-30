import nodemailer from "nodemailer";
import { NodemailerConfig } from "../../../config/nodemailers.config";
import {
  EmailService,
  CustomEmailOptions,
  EmailAttachment,
  TicketStatusChangeData,
} from "../types/nodemailer.types";
import smtpTransport from 'nodemailer-smtp-transport';

export class NodemailerEmailService implements EmailService {
  private config: NodemailerConfig;
  private transporter!: nodemailer.Transporter;
  private isInitialized: boolean = false;
  private lastEmailSent: number = 0; // Timestamp of last sent email
  private pendingEmails: Array<() => Promise<void>> = [];

  constructor(config: NodemailerConfig) {
    this.config = config;
    this.initialize();
  }

private async initialize(): Promise<void> {
  if (this.isInitialized) return;
  
  try {
    console.log(`Connecting to SMTP server: ${this.config.host}:${this.config.port}`);
    console.log(`Secure: ${this.config.secure}`);
    console.log(`Auth user: ${this.config.auth.user}`);

    this.transporter = nodemailer.createTransport(smtpTransport({
      // service: this.config.service,
      // host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.auth.user,
        pass: this.config.auth.pass,
      },
    }));

    // Verify connection
    // await this.transporter.verify();
    this.isInitialized = true;
    console.log("✅ Nodemailer email service initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Nodemailer email service:", error);
    
    // Provide more specific error messages
    // if (error instanceof Error) {
    //   if (error.message.includes("ECONNREFUSED")) {
    //     throw new Error(`Connection refused to ${this.config.host}:${this.config.port}. Check firewall settings or if the SMTP server is running.`);
    //   } else if (error.message.includes("ETIMEDOUT")) {
    //     throw new Error(`Connection timed out to ${this.config.host}:${this.config.port}. This could be due to network issues, firewall restrictions, or the SMTP server being slow to respond.`);
    //   } else if (error.message.includes("Invalid login")) {
    //     throw new Error("Authentication failed. Check your credentials or app password.");
    //   } else if (error.message.includes("ENOTFOUND")) {
    //     throw new Error(`DNS resolution failed for ${this.config.host}. Check your network connection and DNS settings.`);
    //   }
    // }
    
    // throw new Error(`Nodemailer initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

  private async sendEmail(options: CustomEmailOptions, retryCount = 0): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

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
      
      const mailOptions: nodemailer.SendMailOptions = {
        from: fromAddress,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo || this.config.replyTo,
      };

      // Add attachments if provided
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
        }));
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.lastEmailSent = Date.now();
      console.log(`✅ Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      console.log(`Message ID: ${info.messageId}`);
      
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
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("Invalid login") || error.message.includes("User is locked out")) {
          throw new Error("Gmail authentication failed. Please check your credentials or app password.");
        } else if (error.message.includes("Message size exceeded")) {
          throw new Error("Email size exceeded. Please reduce attachments or content.");
        } else if (error.message.includes("No recipients defined")) {
          throw new Error("No valid recipients specified.");
        } else if (error.message.includes("ECONNREFUSED") || error.message.includes("ETIMEDOUT")) {
          throw new Error("Network connection error. Please check your internet connection and firewall settings.");
        }
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
    [Scrubbe IMS] Ticket #${ticketId} has been moved to ${newStatus}

    Hello ${assigneeName},

    The state of ticket #${ticketId} — ${ticketTitle} has been updated.
      • Previous State: ${previousStatus}
      • New State: ${newStatus}
      • Changed On: ${new Date().toISOString()}

    Description:
    ${ticketDescription}

    Next Step: Please review the updated state and take the necessary action.

    You can view the full ticket here: View Ticket in Scrubbe IMS

    Thank you for keeping incidents on track.
    —
    Scrubbe IMS
    Incident Management & Fraud Monitoring Made Simple .
  `;

  await this.sendEmail({
    to: assigneeEmail,
    subject: `[Scrubbe IMS] Ticket #${ticketId} has been moved to ${newStatus}`,
    html
  });
}
}