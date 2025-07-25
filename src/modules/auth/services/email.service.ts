import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/nodemailer.config";
import { InviteMembers } from "../../business-profile/business.types";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendVerificationEmail(email: string, code: string): Promise<void> {
    console.log("Send verification email function called");
    // const token = await this.generateVerificationToken(email);
    // const code = this.generateVerificationOTP();
    // const verificationUrl = `${process.env.BASE_EMAIL_VERIFICATION}?token=${token}`;

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
        html:
         /* html */ `
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
}
