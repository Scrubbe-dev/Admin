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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IMSEmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./utils/logger");
const Handlebars = __importStar(require("handlebars"));
const nodemailer_config_1 = require("../../config/nodemailer.config");
const alldata_1 = require("./newtemplates/emails/alldata");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class IMSEmailService {
    transporter;
    templates;
    logger;
    companyName = 'Scrubbe IMS';
    companyLogo;
    baseUrl;
    constructor(baseUrl = process.env.BASE_URL || 'http://localhost:3001') {
        this.transporter = nodemailer_1.default.createTransport(nodemailer_config_1.emailConfig);
        this.templates = this.loadTemplates();
        this.logger = new logger_1.Logger();
        this.companyLogo = `${baseUrl}/assets/images/logo.png`;
        this.baseUrl = baseUrl;
        this.verifyConnection();
    }
    async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.info('SMTP connection established successfully for IMS');
        }
        catch (error) {
            this.logger.error('Failed to establish SMTP connection for IMS', error);
        }
    }
    loadTemplates() {
        const templates = {};
        // Load all templates (existing + IMS templates)
        const allTemplates = [...alldata_1.imsTemplatesFiles, ...alldata_1.imsTemplatesFiles];
        for (const file of allTemplates) {
            templates[file.name] = Handlebars.compile(file.data);
        }
        this.logger.info(`Loaded ${Object.keys(templates).length} email templates for IMS`);
        return templates;
    }
    renderTemplate(templateName, data) {
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
    getFallbackTemplate(data) {
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
    async sendEmail(to, subject, templateName, data) {
        try {
            const html = this.renderTemplate(templateName, { ...data, subject });
            const mailOptions = {
                from: `"${this.companyName}" <${nodemailer_config_1.emailConfig.from}>`,
                to,
                subject,
                html
            };
            const info = await this.transporter.sendMail(mailOptions);
            this.logger.info(`IMS Email sent to ${to}: ${info.messageId}`);
            return info;
        }
        catch (error) {
            this.logger.error(`Failed to send IMS email to ${to}`, error);
            throw new Error(`Failed to send IMS email: ${error.message}`);
        }
    }
    // IMS Specific Email Methods
    async sendIMSInvitation(email, inviterName, companyName, role, level, inviteToken) {
        const acceptUrl = `${this.baseUrl}/api/v1/ims/invites/accept?token=${inviteToken}`;
        return this.sendEmail(email, `Invitation to Join ${companyName} IMS`, 'ims-invitation', {
            greeting: 'You have been invited to join our Incident Management System',
            message: `${inviterName} has invited you to join the ${companyName} Incident Management System. Please accept the invitation to get started.`,
            companyName,
            role,
            level,
            inviterName,
            acceptUrl,
            buttonText: 'Accept Invitation',
            expiryNote: 'This invitation will expire in 7 days.'
        });
    }
    async sendIncidentCreatedNotification(email, incidentData) {
        const incidentUrl = `${this.baseUrl}/incidents/${incidentData.ticketId}`;
        const priorityColor = this.getPriorityColor(incidentData.priority);
        return this.sendEmail(email, `New Incident: ${incidentData.title}`, 'ims-incident-created', {
            incidentTitle: incidentData.title,
            ticketId: incidentData.ticketId,
            priority: incidentData.priority,
            priorityColor,
            status: incidentData.status,
            description: incidentData.description,
            createdAt: incidentData.createdAt,
            assignee: incidentData.assignee,
            incidentUrl
        });
    }
    async sendIncidentUpdateNotification(email, incidentData) {
        const incidentUrl = `${this.baseUrl}/incidents/${incidentData.ticketId}`;
        return this.sendEmail(email, `Incident Update: ${incidentData.title}`, 'ims-incident-update', {
            incidentTitle: incidentData.title,
            ticketId: incidentData.ticketId,
            updateType: incidentData.updateType,
            updatedBy: incidentData.updatedBy,
            updateTime: incidentData.updateTime,
            updateDetails: incidentData.updateDetails,
            currentStatus: incidentData.currentStatus,
            currentPriority: incidentData.currentPriority,
            incidentUrl
        });
    }
    async sendIncidentEscalationNotification(email, escalationData) {
        const incidentUrl = `${this.baseUrl}/incidents/${escalationData.ticketId}`;
        return this.sendEmail(email, `🚨 ESCALATION: ${escalationData.incidentTitle}`, 'ims-escalation', {
            incidentTitle: escalationData.incidentTitle,
            ticketId: escalationData.ticketId,
            priority: escalationData.priority,
            escalationReason: escalationData.escalationReason,
            escalatedBy: escalationData.escalatedBy,
            escalatedTo: escalationData.escalatedTo,
            escalationTime: escalationData.escalationTime,
            slaStatus: escalationData.slaStatus,
            incidentUrl
        });
    }
    getPriorityColor(priority) {
        const colorMap = {
            'CRITICAL': '#dc3545',
            'HIGH': '#fd7e14',
            'MEDIUM': '#ffc107',
            'LOW': '#28a745',
            'INFORMATIONAL': '#6c757d'
        };
        return colorMap[priority.toUpperCase()] || '#6c757d';
    }
    // Keep existing email methods for backward compatibility
    async sendVerificationEmail(email) {
        // Implementation from original service
        const token = await this.generateVerificationToken(email);
        const verificationUrl = `${this.baseUrl}/pages/verify-email?token=${token}`;
        return this.sendEmail(email, `Verify Your ${this.companyName} Account`, 'verification', {
            verificationUrl,
            buttonText: 'Verify Email',
            greeting: 'Welcome to Scrubbe!',
            message: 'Please verify your email address by clicking the button below:',
            expiryNote: 'This link will expire in 24 hours.'
        });
    }
    async generateVerificationToken(email) {
        // Implementation from original service
        const token = 'generated-token';
        return token;
    }
}
exports.IMSEmailService = IMSEmailService;
