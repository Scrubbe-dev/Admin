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
exports.EmailServices = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const logger_1 = require("./utils/logger");
const Handlebars = __importStar(require("handlebars"));
const nodemailer_config_1 = require("../../config/nodemailer.config");
const alldata_1 = require("./newtemplates/emails/alldata");
class EmailServices {
    transporter;
    templates;
    logger;
    companyName = 'Scrubbe';
    companyLogo;
    baseUrl;
    constructor(
    // templateDir: string = path.join(__dirname,'..','..','..', 'templates','emails'),
    baseUrl = process.env.BASE_URLS || 'http://localhost:3001') {
        ;
        this.transporter = nodemailer_1.default.createTransport(nodemailer_config_1.emailConfig);
        this.templates = this.loadTemplates();
        this.logger = new logger_1.Logger;
        this.companyLogo = `${baseUrl}/assets/images/logo.png`;
        this.baseUrl = baseUrl;
        // Verify SMTP connection on startup
        this.verifyConnection();
    }
    /**
     * Verifies the SMTP connection
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            this.logger.info('SMTP connection established successfully');
        }
        catch (error) {
            this.logger.error('Failed to establish SMTP connection', error);
            // throw new Error('Failed to establish SMTP connection');
        }
    }
    /**
     * Loads all email templates from the specified directory
     * @param templateDir Directory containing email templates
     * @returns Object mapping template names to compiled Handlebars templates
     */
    loadTemplates() {
        let templates = {};
        // if (!fs.existsSync("src\modules\password-reset\templates\emails")) {
        //   this.logger.warn(`Template directory does not exist: ${templateDir}`);
        //   return templates;
        // }
        // const templateFiles = fs.readdirSync("src\modules\password-reset\templates\emails")
        //   .filter(file => file.endsWith('.html'));
        for (const file of alldata_1.templatesFiles) {
            // const templateName = file.replace('.html', '');
            // const templatePath = path.join(templateDir, file);
            // const templateContent = fs.readFileSync(templatePath, 'utf-8');
            const templateName = file.name;
            templates[templateName] = Handlebars.compile(file.data);
        }
        console.log(templates);
        return templates;
    }
    /**
     * Renders an email template with provided data
     * @param templateName Name of the template to render
     * @param data Data to pass to the template
     * @returns Rendered HTML string
     */
    renderTemplate(templateName, data) {
        const template = this.templates[templateName];
        if (!template) {
            // If template doesn't exist, use a basic fallback template
            return this.getFallbackTemplate(data);
        }
        // Add common data to all templates
        const templateData = {
            ...data,
            companyName: this.companyName,
            companyLogo: this.companyLogo,
            baseUrl: this.baseUrl,
            currentYear: new Date().getFullYear()
        };
        return template(templateData);
    }
    /**
     * Generates a basic fallback template when the requested template is not found
     * @param data Data for the email
     * @returns Basic HTML template
     */
    getFallbackTemplate(data) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>${this.companyName} - ${data.subject || 'Notification'}</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>${this.companyName}</h1>
              </div>
              <div class="content">
                  ${data.content || 'No content provided'}
              </div>
              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
    }
    /**
     * Sends an email using the specified template
     * @param to Recipient email address
     * @param subject Email subject
     * @param templateName Name of the template to use
     * @param data Data to pass to the template
     * @returns Information about the sent message
     */
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
            this.logger.info(`Email sent: ${info.messageId}`);
            return info;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }
    /**
     * Sends a verification email for account registration
     * @param email Recipient's email address
     * @returns Information about the sent message
     */
    async sendVerificationEmail(email) {
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
    /**
     * Sends a password reset verification code
     * @param email Recipient's email address
     * @param code 6-digit verification code
     * @returns Information about the sent message
     */
    async sendPasswordResetCode(email, code) {
        return this.sendEmail(email, `${this.companyName} Password Reset Verification Code`, 'resetcode', {
            code,
            greeting: 'Password Reset Requested',
            message: 'You recently requested to reset your password. Please use the following verification code to continue the password reset process:',
            expiryNote: 'This code will expire in 15 minutes.',
            securityNote: 'If you did not request a password reset, please ignore this email or contact our support team immediately if you believe your account may be compromised.'
        });
    }
    /**
     * Sends a password reset link
     * @param email Recipient's email address
     * @param token Reset token
     * @returns Information about the sent message
     */
    async sendPasswordResetLink(email, token) {
        const resetUrl = `${this.baseUrl}/pages/reset-password?token=${token}`;
        return this.sendEmail(email, `Reset Your ${this.companyName} Password`, 'resetlink', {
            resetUrl,
            buttonText: 'Reset Password',
            greeting: 'Password Reset Requested',
            message: 'You recently requested to reset your password. Click the button below to create a new password:',
            expiryNote: 'This link will expire in 24 hours.',
            securityNote: 'If you did not request a password reset, please ignore this email or contact our support team immediately if you believe your account may be compromised.'
        });
    }
    /**
     * Sends a password reset confirmation email
     * @param email Recipient's email address
     * @returns Information about the sent message
     */
    async sendPasswordResetConfirmation(email) {
        const loginUrl = `${this.baseUrl}/login`;
        return this.sendEmail(email, `${this.companyName} Password Reset Successful`, 'resetconfirmation', {
            loginUrl,
            buttonText: 'Log In Now',
            greeting: 'Password Reset Successful',
            message: 'Your password has been successfully reset. You can now log in with your new password.',
            securityNote: 'If you did not reset your password, please contact our support team immediately as your account may have been compromised.'
        });
    }
    /**
     * Generates a verification token for email verification
     * @param email User's email address
     * @returns Generated token
     */
    async generateVerificationToken(email) {
        // Implementation for generating and storing verification token
        // This would typically create a record in a VerificationToken table
        const token = 'generated-token';
        // Implement your token generation and storage logic here
        return token;
    }
}
exports.EmailServices = EmailServices;
