import { IncidentTicket, PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/nodemailer.config";
import { InviteMembers } from "../../business-profile/business.types";

export class EmailService {
  private transporter: nodemailer.Transporter;
  
  constructor() {
    // Create transporter without logger/debug properties
    this.transporter = nodemailer.createTransport(emailConfig as any);
    
    // Enable debug logging through environment variable
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_DEBUG = 'nodemailer';
    }
    
    this.verifyTransporter();
  }
  private async verifyTransporter(): Promise<void> {
    try {
      console.log("Verifying email transporter configuration...");
      await this.transporter.verify();
      console.log("✅ Email transporter is ready to send messages");
    } catch (error) {
      console.error("❌ Email transporter verification failed:", error);
      
      // Provide more helpful error messages
      if (error instanceof Error) {
        if (error.message.includes("WRONG_VERSION_NUMBER")) {
          throw new Error("SSL/TLS version mismatch. Try changing the port or secure setting in your email configuration.");
        } else if (error.message.includes("Connection timeout")) {
          throw new Error("Email server connection timeout. Check your network connection and SMTP settings.");
        } else if (error.message.includes("Authentication failed")) {
          throw new Error("Email authentication failed. Check your username and password.");
        } else if (error.message.includes("Connection closed")) {
          throw new Error("Email connection closed unexpectedly. Check your SMTP port and security settings.");
        }
      }
      
      throw new Error(`Email transporter verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  async sendVerificationEmail(email: string, code: string): Promise<void> {
    try {
      console.log(`Sending verification email to: ${email}`);
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: "Verify Your Email",
        html: `
          <h1>Welcome!</h1>
          <p>Please verify your email with this code:</p>
          <p style="font-size: 24px; font-weight: bold; padding: 10px; background-color: #f0f0f0; display: inline-block;">${code}</p>
        `,
      });
      console.log(`✅ Verification email sent to: ${email}`);
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error);
      throw new Error(
        `Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implementation for generating and storing verification token
    return "generated-token";
  }
  
  generateVerificationOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("otp code", otp);
    return otp;
  }
  
 async sendInviteEmail(
    invite: InviteMembers,
    inviteLink: string
  ): Promise<void> {
    console.log(`Sending invite email to: ${invite.inviteEmail}`);
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: invite.inviteEmail,
        subject: `You're Invited to Join ${process.env.APP_NAME || "Scrubbe"}`,
        html: /* html */ `
          <h1>Hi ${invite.firstName} ${invite.lastName},</h1>
          <p>
            You have been invited to join
            <strong>${process.env.APP_NAME || "Scrubbe"}</strong>
          </p>
          <p>
            Click below to complete your registration and set up your
            account:
          </p>
          <a
            href="${inviteLink}"
            style="background:#4A90E2;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0;"
            >Accept Invite</a
          >
          <p style="margin-top:20px;">
            If the button doesn't work, copy this link into your browser:
            <br/>
            <span style="word-break: break-all;">${inviteLink}</span>
          </p>
        `,
      });
      console.log(`✅ Invite email sent to: ${invite.inviteEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send invite email to ${invite.inviteEmail}:`, error);
      throw new Error(
        `Failed to send invite email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  
  async sendWarRoomEmail(
    from: string,
    to: string,
    incidentTicket: IncidentTicket,
    meetingLink: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: `P1 Incident War Room - ${incidentTicket.ticketId}`,
        html: `
      <p>You are requested to join this War Room as there has been a P1 incident reported.</p>
      <p><strong>Details:</strong> ${incidentTicket.reason}</p>
      <p><strong>Status:</strong> ${incidentTicket.status}</p>
      <p><strong>Priority:</strong> ${incidentTicket.priority}</p>
      <p>Meeting link: <a href="${meetingLink}">${meetingLink}</a></p>
    `,
      });
      console.log(`War room email sent to: ${to}`);
    } catch (error) {
      console.error("Error occurred while sending war room email", error);
      throw new Error(
        `Failed to send war room email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
  
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: "Password Reset Request",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p>Alternatively, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all;">${resetLink}</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you,<br>The ${process.env.APP_NAME || "Our App"} Team</p>
        </div>
      `,
      });
      
      console.log(`Password reset email sent to: ${email}`);
    } catch (error) {
      console.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  
  async sendPasswordChangedConfirmation(email: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: "Your Password Has Been Changed",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Changed Successfully</h2>
          <p>Your password for ${process.env.APP_NAME || "Our App"} has been successfully changed.</p>
          <p>If you did not make this change, please contact our support team immediately.</p>
          <p>Thank you,<br>The ${process.env.APP_NAME || "Our App"} Team</p>
        </div>
      `,
      });
      
      console.log(`Password changed confirmation sent to: ${email}`);
    } catch (error) {
      // For password change confirmation, we might not want to throw an error
      // as the password change operation itself was successful
      console.error(`Failed to send password change confirmation to ${email}:`, error);
    }
  }
}