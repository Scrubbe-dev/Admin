import { IncidentTicket, PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/nodemailer.config";
import { InviteMembers } from "../../business-profile/business.types";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    // const token = await this.generateVerificationToken(email);
    // const code = this.generateVerificationOTP();
    // const verificationUrl = `${process.env.BASE_EMAIL_VERIFICATION}?token=${token}`;
    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: email,
        subject: "Verify Your Email",
        html: `
          <h1>Welcome!</h1>
          <p>Please verify your email with this code:</p>
          <p>${code}</p>
        `,
      });

      console.log("sent verification otp");
    } catch (error) {
      throw new Error(
        `Failed to send verification email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implementation for generating and storing verification token
    // This would typically create a record in a VerificationToken table
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
    console.log(`Sending email to: ${invite.inviteEmail}`);

    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to: invite.inviteEmail,
        subject: `You're Invited to Join ${process.env.APP_NAME || "Scrubbe"}`,
        html: /* html */ `
          <h1>Hi ${invite.firstName} ${invite.lastName},</h1>
          <p>
            You have been invited to join
            <strong
              >${process.env.APP_NAME || "Scrubbe"}
              <p>
                Click below to complete your registration and set up your
                account:
              </p>
              <a
                href="${inviteLink}"
                style="background:#4A90E2;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;"
                >Accept Invite</a
              >
              <br />
              <br />
              <p>
                If the button doesn't work, copy this link into your browser:
                ${inviteLink}
              </p>
            </strong>
          </p>
        `,
      });

      console.log(`Invite email sent to: ${invite.inviteEmail}`);
    } catch (error: any) {
      console.error(
        `Failed to send invite email to ${invite.inviteEmail}:`,
        error.message || error
      );
    }
  }

  async sendWarRoomEmail(
    from: string,
    to: string,
    incidentTicket: IncidentTicket,
    meetingLink: string
  ) {
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

      console.log(`Invite email sent to: ${to}`);
    } catch (error) {
      console.error("Error occured while sending war room email", error);
    }
  }

  // In EmailService class

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
    // Log error but don't fail the password reset process
    console.error(`Failed to send password change confirmation: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
}
