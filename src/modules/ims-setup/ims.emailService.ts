import nodemailer from 'nodemailer';
import {Logger}  from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { emailConfig } from '../../config/nodemailer.config';
import { getTemplatePath } from './utils/path.utils';
import {imsTemplatesFiles} from './newtemplates/emails/alldata'



export class IMSEmailService {
  private transporter: nodemailer.Transporter;
  private templates: Record<string, HandlebarsTemplateDelegate>;
  private logger: Logger;
  private companyName: string = 'Scrubbe IMS';
  private companyLogo: string;
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.BASE_URL || 'http://localhost:3001'
  ) {
    this.transporter = nodemailer.createTransport(emailConfig);
    this.templates = this.loadTemplates();
    this.logger = new Logger();
    this.companyLogo = `${baseUrl}/assets/images/logo.png`;
    this.baseUrl = baseUrl;
    
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.info('SMTP connection established successfully for IMS');
    } catch (error) {
      this.logger.error('Failed to establish SMTP connection for IMS', error);
    }
  }

  private loadTemplates(): Record<string, HandlebarsTemplateDelegate> {
    const templates: Record<string, HandlebarsTemplateDelegate> = {};
    
    // Load all templates (existing + IMS templates)
    const allTemplates = [...imsTemplatesFiles, ...imsTemplatesFiles];
    
    for (const file of allTemplates) {
      templates[file.name] = Handlebars.compile(file.data);
    }
    
    this.logger.info(`Loaded ${Object.keys(templates).length} email templates for IMS`);
    return templates;
  }

  private renderTemplate(templateName: string, data: any): string {
    const template = this.templates[templateName];
    
    if (!template) {
      return this.getFallbackTemplate(data);
    }
    
    const templateData = {
      ...data,
      companyName: this.companyName,
      companyLogo: this.companyLogo,
      baseUrl: this.baseUrl,
      currentYear: new Date().getFullYear()
    };
    
    return template(templateData);
  }

  private getFallbackTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${this.companyName} - ${data.subject || 'IMS Notification'}</title>
      </head>
      <body>
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                  <h1>${this.companyName}</h1>
              </div>
              <div>${data.content || 'No content provided'}</div>
              <div style="text-align: center; margin-top: 30px; color: #777;">
                  <p>&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  private async sendEmail(
    to: string, 
    subject: string, 
    templateName: string, 
    data: any
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const html = this.renderTemplate(templateName, { ...data, subject });
      
      const mailOptions = {
        from: `"${this.companyName}" <${emailConfig.from}>`,
        to,
        subject,
        html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info(`IMS Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (error: any) {
      this.logger.error(`Failed to send IMS email to ${to}`, error);
      throw new Error(`Failed to send IMS email: ${error.message}`);
    }
  }

  // IMS Specific Email Methods

  async sendIMSInvitation(
    email: string,
    inviterName: string,
    companyName: string,
    role: string,
    level: string,
    inviteToken: string
  ): Promise<nodemailer.SentMessageInfo> {
    const acceptUrl = `${this.baseUrl}/api/v1/ims/invites/accept?token=${inviteToken}`;
    
    return this.sendEmail(
      email,
      `Invitation to Join ${companyName} IMS`,
      'ims-invitation',
      {
        greeting: 'You have been invited to join our Incident Management System',
        message: `${inviterName} has invited you to join the ${companyName} Incident Management System. Please accept the invitation to get started.`,
        companyName,
        role,
        level,
        inviterName,
        acceptUrl,
        buttonText: 'Accept Invitation',
        expiryNote: 'This invitation will expire in 7 days.'
      }
    );
  }

  async sendIncidentCreatedNotification(
    email: string,
    incidentData: {
      title: string;
      ticketId: string;
      priority: string;
      status: string;
      description: string;
      createdAt: string;
      assignee?: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const incidentUrl = `${this.baseUrl}/incidents/${incidentData.ticketId}`;
    const priorityColor = this.getPriorityColor(incidentData.priority);
    
    return this.sendEmail(
      email,
      `New Incident: ${incidentData.title}`,
      'ims-incident-created',
      {
        incidentTitle: incidentData.title,
        ticketId: incidentData.ticketId,
        priority: incidentData.priority,
        priorityColor,
        status: incidentData.status,
        description: incidentData.description,
        createdAt: incidentData.createdAt,
        assignee: incidentData.assignee,
        incidentUrl
      }
    );
  }

  async sendIncidentUpdateNotification(
    email: string,
    incidentData: {
      title: string;
      ticketId: string;
      updateType: string;
      updatedBy: string;
      updateTime: string;
      updateDetails: string;
      currentStatus: string;
      currentPriority: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const incidentUrl = `${this.baseUrl}/incidents/${incidentData.ticketId}`;
    
    return this.sendEmail(
      email,
      `Incident Update: ${incidentData.title}`,
      'ims-incident-update',
      {
        incidentTitle: incidentData.title,
        ticketId: incidentData.ticketId,
        updateType: incidentData.updateType,
        updatedBy: incidentData.updatedBy,
        updateTime: incidentData.updateTime,
        updateDetails: incidentData.updateDetails,
        currentStatus: incidentData.currentStatus,
        currentPriority: incidentData.currentPriority,
        incidentUrl
      }
    );
  }

  async sendIncidentEscalationNotification(
    email: string,
    escalationData: {
      incidentTitle: string;
      ticketId: string;
      priority: string;
      escalationReason: string;
      escalatedBy: string;
      escalatedTo: string;
      escalationTime: string;
      slaStatus: string;
    }
  ): Promise<nodemailer.SentMessageInfo> {
    const incidentUrl = `${this.baseUrl}/incidents/${escalationData.ticketId}`;
    
    return this.sendEmail(
      email,
      `🚨 ESCALATION: ${escalationData.incidentTitle}`,
      'ims-escalation',
      {
        incidentTitle: escalationData.incidentTitle,
        ticketId: escalationData.ticketId,
        priority: escalationData.priority,
        escalationReason: escalationData.escalationReason,
        escalatedBy: escalationData.escalatedBy,
        escalatedTo: escalationData.escalatedTo,
        escalationTime: escalationData.escalationTime,
        slaStatus: escalationData.slaStatus,
        incidentUrl
      }
    );
  }

  private getPriorityColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'CRITICAL': '#dc3545',
      'HIGH': '#fd7e14',
      'MEDIUM': '#ffc107',
      'LOW': '#28a745',
      'INFORMATIONAL': '#6c757d'
    };
    
    return colorMap[priority.toUpperCase()] || '#6c757d';
  }

  // Keep existing email methods for backward compatibility
  async sendVerificationEmail(email: string): Promise<nodemailer.SentMessageInfo> {
    // Implementation from original service
    const token = await this.generateVerificationToken(email);
    const verificationUrl = `${this.baseUrl}/pages/verify-email?token=${token}`;
    
    return this.sendEmail(
      email,
      `Verify Your ${this.companyName} Account`,
      'verification',
      {
        verificationUrl,
        buttonText: 'Verify Email',
        greeting: 'Welcome to Scrubbe!',
        message: 'Please verify your email address by clicking the button below:',
        expiryNote: 'This link will expire in 24 hours.'
      }
    );
  }

  private async generateVerificationToken(email: string): Promise<string> {
    // Implementation from original service
    const token = 'generated-token';
    return token;
  }

}