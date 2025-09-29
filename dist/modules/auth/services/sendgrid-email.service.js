"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridEmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
class SendGridEmailService {
    config;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        this.initialize();
    }
    initialize() {
        if (this.isInitialized)
            return;
        try {
            mail_1.default.setApiKey(this.config.apiKey);
            this.isInitialized = true;
            console.log("✅ SendGrid email service initialized successfully");
        }
        catch (error) {
            console.error("❌ Failed to initialize SendGrid email service:", error);
            throw new Error(`SendGrid initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async sendEmail(options) {
        if (!this.isInitialized) {
            this.initialize();
        }
        try {
            const message = {
                to: Array.isArray(options.to) ? options.to : [options.to],
                from: {
                    email: this.config.from.email,
                    name: this.config.from.name,
                },
                subject: options.subject,
                text: options.text,
                html: options.html,
                categories: options.categories || this.config.defaultCategories,
                replyTo: options.replyTo || this.config.replyTo,
            };
            // Add template support
            if (options.templateId) {
                message.templateId = options.templateId;
                if (options.dynamicTemplateData) {
                    message.dynamicTemplateData = options.dynamicTemplateData;
                }
            }
            // Add attachments if provided
            if (options.attachments && options.attachments.length > 0) {
                message.attachments = options.attachments.map(att => ({
                    content: att.content,
                    filename: att.filename,
                    type: att.type,
                    disposition: att.disposition,
                }));
            }
            await mail_1.default.send(message);
            console.log(`✅ Email sent successfully to: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
        }
        catch (error) {
            console.error(`❌ Failed to send email to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}:`, error);
            // Provide more helpful error messages
            if (error instanceof Error) {
                if (error.message.includes("unauthorized")) {
                    throw new Error("SendGrid authentication failed. Please check your API key.");
                }
                else if (error.message.includes("The from address does not match a verified sender")) {
                    throw new Error("Sender email not verified in SendGrid. Please verify your sender identity.");
                }
                else if (error.message.includes("Invalid template ID")) {
                    throw new Error("Invalid SendGrid template ID. Please check your template configuration.");
                }
            }
            throw new Error(`Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
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
            categories: ["email-verification"],
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
            categories: ["invitation"],
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
            categories: ["war-room", "incident"],
        });
    }
    async sendPasswordResetEmail(email, resetToken) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>We received a request to reset your password for ${process.env.APP_NAME || "Scrubbe"}.</p>
        <p>If you didn't make this request, you can safely ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Alternatively, you can copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you,<br>The ${process.env.APP_NAME || "Scrubbe"} Team</p>
      </div>
    `;
        await this.sendEmail({
            to: email,
            subject: "Password Reset Request",
            html,
            categories: ["password-reset"],
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
            categories: ["password-changed"],
        });
    }
    async sendCustomEmail(options) {
        await this.sendEmail(options);
    }
}
exports.SendGridEmailService = SendGridEmailService;
