import nodemailer from 'nodemailer';
import { emailConfig } from '../../../config/nodemailer.config';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(
  ) {
    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendVerificationEmail(email: string): Promise<void> {
    const token = await this.generateVerificationToken(email);
    const verificationUrl = `${process.env.BASE_EMAIL_VERIFICATION}?token=${token}`;

    await this.transporter.sendMail({
      from: emailConfig.from,
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