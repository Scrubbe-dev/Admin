import nodemailer from "nodemailer";
import { NodemailerConfig, validateEmailConfig } from "../../../config/nodemailers.config";
import {
  EmailService,
  CustomEmailOptions,
  EmailAttachment,
  TicketStatusChangeData,
} from "../types/nodemailer.types";

export class NodemailerEmailService implements EmailService {
  private config: NodemailerConfig;
  private transporter!: nodemailer.Transporter;
  private isInitialized: boolean = false;
  private lastEmailSent: number = 0;
  private pendingEmails: Array<() => Promise<void>> = [];
  private connectionRetries: number = 0;
  private maxRetries: number = 3;

  constructor(config: NodemailerConfig) {
    this.config = config;
    validateEmailConfig(config);
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      const transporterConfig: any = {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        connectionTimeout: this.config.connectionTimeout || 30000,
        socketTimeout: this.config.socketTimeout || 30000,
        logger: process.env.NODE_ENV === 'development',
        debug: process.env.NODE_ENV === 'development',
      };

      // Additional Gmail-specific settings
      if (this.config.host.includes('gmail.com')) {
        transporterConfig.service = 'gmail';
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
      
      // Verify connection on initialization
      this.verifyConnection();
      
    } catch (error) {
      console.error("❌ Failed to initialize Nodemailer transporter:", error);
      throw new Error(`Nodemailer initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.isInitialized = true;
      this.connectionRetries = 0; // Reset retry counter on successful connection
      console.log("✅ Nodemailer email service initialized and connection verified");
    } catch (error) {
      console.error("❌ Failed to verify Nodemailer connection:", error);
      this.isInitialized = false;
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isInitialized && this.connectionRetries < this.maxRetries) {
      try {
        await this.verifyConnection();
      } catch (error) {
        this.connectionRetries++;
        console.warn(`⚠️ Connection attempt ${this.connectionRetries}/${this.maxRetries} failed`);
        
        if (this.connectionRetries >= this.maxRetries) {
          throw new Error(`Failed to establish email connection after ${this.maxRetries} attempts`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, this.connectionRetries) * 1000));
        await this.ensureConnection();
      }
    }
  }

  private async sendEmail(options: CustomEmailOptions): Promise<void> {
    await this.ensureConnection();

    // Check cooldown
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSent;
    
    if (timeSinceLastEmail < this.config.cooldownPeriod) {
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

      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments.map((att) => ({
          filename: att.filename,
          content: att.content,
          encoding: 'base64',
        }));
      }

      const info = await this.transporter.sendMail(mailOptions);
      this.lastEmailSent = Date.now();
      console.log(`✅ Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      console.log(`📫 Message ID: ${info.messageId}`);
      
      if (this.pendingEmails.length > 0) {
        setTimeout(() => this.processQueue(), this.config.cooldownPeriod);
      }
    } catch (error) {
      console.error(`❌ Failed to send email to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}:`, error);
      
      // Reset connection on certain errors
      if (error instanceof Error && this.shouldResetConnection(error)) {
        this.isInitialized = false;
        console.log("🔄 Resetting email connection due to error...");
      }
      
      throw this.formatErrorMessage(error);
    }
  }

  private shouldResetConnection(error: Error): boolean {
    const resetErrors = [
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ECONNRESET',
      'EPIPE',
      'ESOCKET',
      'EAUTH'
    ];
    
    return resetErrors.some(errorCode => error.message.includes(errorCode));
  }

  private formatErrorMessage(error: unknown): Error {
    if (error instanceof Error) {
      if (error.message.includes('ETIMEDOUT') || error.message.includes('CONN')) {
        return new Error(`Email connection timeout. Please check your network connection and SMTP settings. Original error: ${error.message}`);
      } else if (error.message.includes("Invalid login") || error.message.includes("User is locked out") || error.message.includes("EAUTH")) {
        return new Error("Email authentication failed. Please check your credentials or API key.");
      } else if (error.message.includes("Message size exceeded")) {
        return new Error("Email size exceeded. Please reduce attachments or content.");
      } else if (error.message.includes("No recipients defined")) {
        return new Error("No valid recipients specified.");
      } else if (error.message.includes("ECONNREFUSED")) {
        return new Error("Email connection refused. Please check your SMTP host and port settings.");
      }
    }
    
    return new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
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

async testConnection(): Promise<boolean> {
    try {
      await this.ensureConnection();
      return true;
    } catch (error) {
      console.error("❌ Email connection test failed:", error);
      return false;
    }
  }

  // Add cleanup method
  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.isInitialized = false;
      console.log("📧 Email transporter closed");
    }
  }
}