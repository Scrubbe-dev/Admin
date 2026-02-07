import { EmailService } from "../auth/types/nodemailer.types";
import { createEmailServiceWithSes } from "../auth/services/ses-email.factory";
import { ContactUsRequest } from "./contactus.types";

export class ContactUsService {
  private emailService: EmailService;

  constructor() {
    this.emailService = createEmailServiceWithSes();
  }

  async sendContactUsEmail(contactData: ContactUsRequest): Promise<void> {
    const supportEmail = "support@scrubbe.com";
    const subject = `New Contact Form Submission from ${contactData.first_name} ${contactData.last_name}`;

    const html = this.generateContactUsEmailHTML(contactData);
    const text = this.generateContactUsEmailText(contactData);

    try {
      await this.emailService.sendCustomEmail({
        to: supportEmail,
        subject,
        html,
        text,
        replyTo: contactData.email,
      });

      // Optional: Send confirmation email to the user
      await this.sendConfirmationEmail(contactData);
    } catch (error) {
      console.error("Error sending contact us email:", error);
      throw new Error("Failed to send contact form submission");
    }
  }

  private generateContactUsEmailHTML(contactData: ContactUsRequest): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background-color: #4A90E2;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
              }
              .content {
                  background-color: #f9f9f9;
                  padding: 20px;
                  border-radius: 0 0 5px 5px;
              }
              .field {
                  margin-bottom: 15px;
                  padding: 10px;
                  background-color: white;
                  border-radius: 4px;
                  border-left: 4px solid #4A90E2;
              }
              .field-label {
                  font-weight: bold;
                  color: #555;
                  display: block;
                  margin-bottom: 5px;
              }
              .field-value {
                  color: #333;
              }
              .message-content {
                  background-color: white;
                  padding: 15px;
                  border-radius: 4px;
                  border: 1px solid #ddd;
                  margin-top: 10px;
                  white-space: pre-wrap;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>New Contact Form Submission</h1>
              <p>You have received a new message through the Scrubbe contact form</p>
          </div>
          
          <div class="content">
              <div class="field">
                  <span class="field-label">Name:</span>
                  <span class="field-value">${contactData.first_name} ${
      contactData.last_name
    }</span>
              </div>
              
              <div class="field">
                  <span class="field-label">Email:</span>
                  <span class="field-value">
                      <a href="mailto:${contactData.email}">${
      contactData.email
    }</a>
                  </span>
              </div>
              
              ${
                contactData.phone_number
                  ? `
              <div class="field">
                  <span class="field-label">Phone Number:</span>
                  <span class="field-value">
                      <a href="tel:${contactData.phone_number}">${contactData.phone_number}</a>
                  </span>
              </div>
              `
                  : ""
              }
              
              ${
                contactData.company_name
                  ? `
              <div class="field">
                  <span class="field-label">Company:</span>
                  <span class="field-value">${contactData.company_name}</span>
              </div>
              `
                  : ""
              }
              
              ${
                contactData.job_title
                  ? `
              <div class="field">
                  <span class="field-label">Job Title:</span>
                  <span class="field-value">${contactData.job_title}</span>
              </div>
              `
                  : ""
              }
              
              <div class="field">
                  <span class="field-label">Message:</span>
                  <div class="message-content">${contactData.message}</div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 4px;">
                  <p><strong>Submission Details:</strong></p>
                  <p>Submitted on: ${new Date().toLocaleString()}</p>
                  <p>You can reply directly to this email to respond to ${
                    contactData.first_name
                  }.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private generateContactUsEmailText(contactData: ContactUsRequest): string {
    return `
NEW CONTACT FORM SUBMISSION

Name: ${contactData.first_name} ${contactData.last_name}
Email: ${contactData.email}
${contactData.phone_number ? `Phone: ${contactData.phone_number}` : ""}
${contactData.company_name ? `Company: ${contactData.company_name}` : ""}
${contactData.job_title ? `Job Title: ${contactData.job_title}` : ""}

Message:
${contactData.message}

---
Submitted on: ${new Date().toLocaleString()}
You can reply directly to this email to respond to ${contactData.first_name}.
    `.trim();
  }

  private async sendConfirmationEmail(
    contactData: ContactUsRequest
  ): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank You for Contacting Scrubbe</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  background-color: #4A90E2;
                  color: white;
                  padding: 20px;
                  text-align: center;
                  border-radius: 5px 5px 0 0;
              }
              .content {
                  background-color: #f9f9f9;
                  padding: 20px;
                  border-radius: 0 0 5px 5px;
              }
              .thank-you {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 15px;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>Thank You for Contacting Scrubbe</h1>
          </div>
          
          <div class="content">
              <div class="thank-you">Hello ${contactData.first_name},</div>
              
              <p>Thank you for reaching out to us! We have received your message and our team will get back to you as soon as possible.</p>
              
              <p><strong>Here's a summary of your submission:</strong></p>
              <ul>
                  <li><strong>Name:</strong> ${contactData.first_name} ${
      contactData.last_name
    }</li>
                  <li><strong>Email:</strong> ${contactData.email}</li>
                  ${
                    contactData.phone_number
                      ? `<li><strong>Phone:</strong> ${contactData.phone_number}</li>`
                      : ""
                  }
                  ${
                    contactData.company_name
                      ? `<li><strong>Company:</strong> ${contactData.company_name}</li>`
                      : ""
                  }
                  ${
                    contactData.job_title
                      ? `<li><strong>Job Title:</strong> ${contactData.job_title}</li>`
                      : ""
                  }
              </ul>
              
              <p><strong>Your Message:</strong></p>
              <div style="background-color: white; padding: 15px; border-radius: 4px; border: 1px solid #ddd; margin: 10px 0;">
                  ${contactData.message}
              </div>
              
              <p>We typically respond within 24-48 hours during business days.</p>
              
              <p>If you have any urgent inquiries, please feel free to call us at [Your Phone Number] or reply to this email.</p>
              
              <p>Best regards,<br>
              The Scrubbe Team</p>
          </div>
      </body>
      </html>
    `;

    const text = `
Thank You for Contacting Scrubbe

Hello ${contactData.first_name},

Thank you for reaching out to us! We have received your message and our team will get back to you as soon as possible.

Here's a summary of your submission:
- Name: ${contactData.first_name} ${contactData.last_name}
- Email: ${contactData.email}
${contactData.phone_number ? `- Phone: ${contactData.phone_number}` : ""}
${contactData.company_name ? `- Company: ${contactData.company_name}` : ""}
${contactData.job_title ? `- Job Title: ${contactData.job_title}` : ""}

Your Message:
${contactData.message}

We typically respond within 24-48 hours during business days.

If you have any urgent inquiries, please feel free to call us at [Your Phone Number] or reply to this email.

Best regards,
The Scrubbe Team
    `.trim();

    try {
      await this.emailService.sendCustomEmail({
        to: contactData.email,
        subject: "Thank You for Contacting Scrubbe",
        html,
        text,
      });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      // Don't throw error here - the main email to support is more important
    }
  }
}
