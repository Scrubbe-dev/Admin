import nodemailer from "nodemailer";
import { NodemailerConfig } from "../../../config/nodemailers.config";
import {
  EmailService,
  CustomEmailOptions,
  EmailAttachment,
  TicketStatusChangeData,
} from "../types/nodemailer.types";

export * from "../types/nodemailer.types";

interface QueuedEmail {
  options: CustomEmailOptions;
  resolve: (value: void) => void;
  reject: (reason: any) => void;
  retryCount: number;
}

export class NodemailerEmailService implements EmailService {
  private config: NodemailerConfig;
  private transporter: nodemailer.Transporter | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private lastEmailSent: number = 0;
  private emailQueue: QueuedEmail[] = [];
  private isProcessingQueue: boolean = false;
  private maxRetries: number = 3;

  constructor(config: NodemailerConfig) {
    this.config = config;
    // Don't initialize immediately, wait for first email
  }

  private async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeTransporter();
    return this.initializationPromise;
  }

  private async _initializeTransporter(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log(`📧 Initializing SMTP connection to ${this.config.host}:${this.config.port}`);
      
      const transportOptions: nodemailer.TransportOptions | any = {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        // Connection settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        // Timeout settings
        connectionTimeout: this.config.connectionTimeout || 30000, // 30 seconds
        socketTimeout: this.config.socketTimeout || 60000, // 60 seconds
        greetingTimeout: this.config.greetingTimeout || 30000, // 30 seconds
        // TLS settings
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates
        },
        // Debugging
        logger: this.config.logger || false,
        debug: this.config.debug || false,
      };

      this.transporter = nodemailer.createTransport(transportOptions);

      // Verify connection with timeout
      await Promise.race([
        this.transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('SMTP verification timeout')), 15000)
        )
      ]);

      this.isInitialized = true;
      console.log("✅ Nodemailer email service initialized successfully");
      
      // Start processing any queued emails
      this.processQueue();

    } catch (error) {
      console.error("❌ Failed to initialize Nodemailer:", error);
      this.transporter = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      throw this.handleSmtpError(error);
    }
  }

  private handleSmtpError(error: any): Error {
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED')) {
        return new Error(`SMTP connection refused to ${this.config.host}:${this.config.port}. Check if server is running.`);
      } else if (error.message.includes('ETIMEDOUT')) {
        return new Error(`SMTP connection timed out. Check network/firewall settings.`);
      } else if (error.message.includes('Invalid login') || error.message.includes('535')) {
        return new Error('SMTP authentication failed. Check credentials.');
      } else if (error.message.includes('ENOTFOUND')) {
        return new Error(`SMTP host ${this.config.host} not found. Check DNS.`);
      }
    }
    return new Error(`SMTP error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  private async sendEmailInternal(options: CustomEmailOptions, retryCount = 0): Promise<void> {
    if (!this.isInitialized || !this.transporter) {
      await this.initialize();
    }

    if (!this.transporter) {
      throw new Error('SMTP transporter not available');
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
        attachments: options.attachments?.map((att: EmailAttachment) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.lastEmailSent = Date.now();
      
      console.log(`✅ Email sent to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
      console.log(`📨 Message ID: ${info.messageId}`);
      
    } catch (error) {
      console.error(`❌ Failed to send email (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < this.maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.log(`🔄 Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.sendEmailInternal(options, retryCount + 1);
      }
      
      throw this.handleSmtpError(error);
    }
  }

  async sendEmail(options: CustomEmailOptions): Promise<void> {
    const now = Date.now();
    const timeSinceLastEmail = now - this.lastEmailSent;
    
    // Enforce cooldown period
    if (timeSinceLastEmail < this.config.cooldownPeriod) {
      return new Promise<void>((resolve, reject) => {
        this.emailQueue.push({
          options,
          resolve,
          reject,
          retryCount: 0
        });
        
        // Schedule queue processing after cooldown
        const delay = this.config.cooldownPeriod - timeSinceLastEmail;
        setTimeout(() => this.processQueue(), delay);
      });
    }

    return this.sendEmailInternal(options);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.emailQueue.length > 0) {
      const queuedEmail = this.emailQueue.shift();
      if (!queuedEmail) continue;

      try {
        await this.sendEmailInternal(queuedEmail.options, queuedEmail.retryCount);
        queuedEmail.resolve();
      } catch (error) {
        queuedEmail.reject(error);
      }

      // Respect cooldown between emails
      if (this.emailQueue.length > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, this.config.cooldownPeriod)
        );
      }
    }

    this.isProcessingQueue = false;
  }

  async close(): Promise<void> {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      console.log("📧 Email service closed");
    }
  }

  // Email template methods remain the same but use the new sendEmail method
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    const html = this.getVerificationEmailTemplate(code);
    await this.sendEmail({
      to: email,
      subject: "Verify Your Email Address",
      html,
    });
  }

  generateVerificationOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP:", otp);
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
    const html = this.getInviteEmailTemplate(invite, inviteLink);
    await this.sendEmail({
      to: invite.inviteEmail,
      subject: `You're Invited to Join ${process.env.APP_NAME || "Scrubbe"}`,
      html,
    });
  }

  // ... other email methods with their templates

  private getVerificationEmailTemplate(code: string): string {
    return `
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
  }

  private getInviteEmailTemplate(
    invite: { firstName: string; lastName: string; inviteEmail: string },
    inviteLink: string
  ): string {
    return `
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
  }

  // Implement other template methods similarly...
  async sendTicketStatusChangeEmail(data: TicketStatusChangeData): Promise<void> {
    const html = this.getTicketStatusChangeTemplate(data);
    await this.sendEmail({
      to: data.assigneeEmail,
      subject: `[Scrubbe IMS] Ticket #${data.ticketId} has been moved to ${data.newStatus}`,
      html
    });
  }

  private getTicketStatusChangeTemplate(data: TicketStatusChangeData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Ticket Status Update</h2>
        <p>Hello ${data.assigneeName},</p>
        <p>The state of ticket <strong>#${data.ticketId}</strong> has been updated.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Title:</strong> ${data.ticketTitle}</p>
          <p><strong>Previous State:</strong> ${data.previousStatus}</p>
          <p><strong>New State:</strong> ${data.newStatus}</p>
          <p><strong>Changed On:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p><strong>Description:</strong></p>
        <p style="color: #666;">${data.ticketDescription}</p>
        <p>Please review the updated state and take the necessary action.</p>
        <p>Thank you for keeping incidents on track.</p>
        <p>—<br>Scrubbe IMS<br>Incident Management & Fraud Monitoring Made Simple</p>
      </div>
    `;
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

}