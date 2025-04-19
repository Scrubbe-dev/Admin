import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
    private prisma: PrismaClient,
    private fromEmail: string,
    private smtpOptions: any
  ) {
    this.transporter = nodemailer.createTransport(smtpOptions);
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const token = await this.generateVerificationToken(email);
    const verificationUrl = `${process.env.BASE_EMAIL_VERIFICATION}?token=${token}`;

    await this.transporter.sendMail({
      from: this.fromEmail,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
      `,
    });
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implementation for generating and storing verification token
    // This would typically create a record in a VerificationToken table
    return 'generated-token';
  }
}