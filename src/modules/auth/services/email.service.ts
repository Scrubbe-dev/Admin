import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import { emailConfig } from "../../../config/nodemailer.config";

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
}
