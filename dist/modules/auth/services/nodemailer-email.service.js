"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// NOTE: The 'smtpTransport' package is deprecated and not needed. Nodemailer has it built-in.
__exportStar(require("../types/nodemailer.types"), exports);
class NodemailerEmailService {
    config;
    transporter;
    isInitialized = false;
    lastEmailSent = 0;
    pendingEmails = [];
    constructor(config) {
        this.config = config;
        this.initialize();
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            console.log(`Connecting to SMTP server: ${this.config.host}:${this.config.port}`);
            console.log(`Auth user: ${this.config.auth.user}`);
            // Use reasonable timeout values (30 seconds is plenty)
            const connectionTimeout = this.config.connectionTimeout || 30000;
            const socketTimeout = this.config.socketTimeout || 30000;
            this.transporter = nodemailer_1.default.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // true for 465, false for 587
                requireTLS: true, // Enforce TLS
                auth: {
                    user: 'scrubbe.dev@gmail.com',
                    pass: 'vwce dzct nzip vxtp', // App password
                },
                // Pooling is good for high volume
                pool: true,
                maxConnections: 3,
                maxMessages: 100,
                // Rate limiting to avoid being blocked by Gmail
                rateDelta: 100000,
                rateLimit: 5, // max 5 messages per second
                // Timeouts
                connectionTimeout,
                socketTimeout,
                // TLS options for better compatibility
                tls: {
                    // Do not fail on invalid certs (for development)
                    rejectUnauthorized: false,
                    // Specify ciphers if needed, though usually not required
                    // ciphers: 'SSLv3'
                },
                logger: true,
                debug: true, // Show SMTP traffic in the console
            });
            // This is CRITICAL. It verifies the connection configuration.
            await this.transporter.verify();
            this.isInitialized = true;
            console.log("✅ Nodemailer email service initialized and verified successfully");
        }
        catch (error) {
            console.error("❌ CRITICAL: Failed to initialize Nodemailer email service:", error);
            // Throw a clear, actionable error
            if (error.code === 'ETIMEDOUT') {
                throw new Error(`Connection timed out to ${this.config.host}:${this.config.port}. This is a network/firewall issue. See troubleshooting steps.`);
            }
            if (error.code === 'ECONNREFUSED') {
                throw new Error(`Connection refused to ${this.config.host}:${this.config.port}. Check if the port is open and the SMTP service is running.`);
            }
            throw new Error(`Nodemailer initialization failed: ${error.message}`);
        }
    }
    async sendEmail(options, retryCount = 0) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        // Check cooldown
        const now = Date.now();
        const timeSinceLastEmail = now - this.lastEmailSent;
        if (timeSinceLastEmail < this.config.cooldownPeriod) {
            // Queue the email for later
            return new Promise((resolve, reject) => {
                this.pendingEmails.push(async () => {
                    try {
                        await this.sendEmail(options);
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                setTimeout(() => this.processQueue(), this.config.cooldownPeriod - timeSinceLastEmail);
            });
        }
        try {
            const fromAddress = `"${this.config.from.name}" <${this.config.from.email}>`;
            const mailOptions = {
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
        }
        catch (error) {
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
                }
                else if (error.message.includes("Message size exceeded")) {
                    throw new Error("Email size exceeded. Please reduce attachments or content.");
                }
                else if (error.message.includes("No recipients defined")) {
                    throw new Error("No valid recipients specified.");
                }
                else if (error.message.includes("ECONNREFUSED") || error.message.includes("ETIMEDOUT")) {
                    throw new Error("Network connection error. Please check your internet connection and firewall settings.");
                }
            }
            throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async processQueue() {
        if (this.pendingEmails.length === 0)
            return;
        const emailToSend = this.pendingEmails.shift();
        if (emailToSend) {
            try {
                await emailToSend();
            }
            catch (error) {
                console.error("Error processing queued email:", error);
            }
            // Process next email if any
            if (this.pendingEmails.length > 0) {
                setTimeout(() => this.processQueue(), this.config.cooldownPeriod);
            }
        }
    }
    // Implementation of all EmailService methods
    async sendVerificationEmail(email, code) {
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
    generateVerificationOTP() {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log("otp code", otp);
        return otp;
    }
    async sendInviteEmail(invite, inviteLink) {
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
    async sendWarRoomEmail(to, incidentTicket, meetingLink) {
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
    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/auth/forgot-password?token=${resetToken}`;
        const resetIncidentLint = `${process.env.INCIDENT_FRONTEND_URL}/auth/forgot-password?token=${resetToken}`;
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
    async sendPasswordChangedConfirmation(email) {
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
    async sendCustomEmail(options) {
        await this.sendEmail(options);
    }
    async sendPasswordResetCode(email, code) {
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
    async sendPasswordResetLink(email, resetLinkToken) {
        const resetLink = `${process.env.FRONTEND_URL}/auth/forgot-password?token=${resetLinkToken}`;
        const resetIncidentLint = `${process.env.INCIDENT_FRONTEND_URL}/auth/forgot-password?token=${resetLinkToken}`;
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
    async sendPasswordResetConfirmation(email) {
        await this.sendPasswordChangedConfirmation(email);
    }
    async sendTicketStatusChangeEmail(data) {
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
exports.NodemailerEmailService = NodemailerEmailService;
