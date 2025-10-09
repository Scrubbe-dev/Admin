import { Router, Request, Response, NextFunction } from 'express';
import { ContactUsController } from './contactus.controller';

const contactusRouter = Router();
const contactUsController = new ContactUsController();

// Utility to wrap async route handlers and forward errors to Express
function asyncHandler(fn: Function) {
  return function (this: unknown, req: Request, res: Response, next: NextFunction) {
    Promise.resolve(fn.call(this, req, res, next)).catch(next);
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactUsRequest:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - message
 *       properties:
 *         first_name:
 *           type: string
 *           description: User's first name
 *           example: "John"
 *           minLength: 1
 *           maxLength: 50
 *         last_name:
 *           type: string
 *           description: User's last name
 *           example: "Doe"
 *           minLength: 1
 *           maxLength: 50
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *           example: "john.doe@example.com"
 *         phone_number:
 *           type: string
 *           description: User's phone number (optional)
 *           example: "+1234567890"
 *         company_name:
 *           type: string
 *           description: User's company name (optional)
 *           example: "Acme Inc"
 *           maxLength: 100
 *         job_title:
 *           type: string
 *           description: User's job title (optional)
 *           example: "Security Engineer"
 *           maxLength: 100
 *         message:
 *           type: string
 *           description: The message content
 *           example: "I'm interested in learning more about your security monitoring services."
 *           minLength: 10
 *           maxLength: 2000
 *     ContactUsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Thank you for your message! We have received your inquiry and will get back to you soon."
 *     ContactUsErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["first_name is required and must be a non-empty string"]
 *         error:
 *           type: string
 *           description: Detailed error message (only in development)
 */

/**
 * @swagger
 * /mocktest/contact-us:
 *   post:
 *     summary: Submit a contact form
 *     description: Send a contact form submission to Scrubbe support team and receive a confirmation email
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContactUsRequest'
 *           examples:
 *             basicInquiry:
 *               summary: Basic contact inquiry
 *               value:
 *                 first_name: "John"
 *                 last_name: "Doe"
 *                 email: "john.doe@example.com"
 *                 message: "I'm interested in learning more about your security monitoring services and would like to schedule a demo."
 *             detailedInquiry:
 *               summary: Detailed contact inquiry with company information
 *               value:
 *                 first_name: "Jane"
 *                 last_name: "Smith"
 *                 email: "jane.smith@company.com"
 *                 phone_number: "+1-555-0123"
 *                 company_name: "Tech Corp Inc"
 *                 job_title: "Chief Security Officer"
 *                 message: "Our organization is looking for a comprehensive security monitoring solution. We currently handle over 5000 security events daily and need a more efficient way to manage incidents. Could you provide information about your enterprise pricing and integration capabilities with our existing SIEM system?"
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactUsResponse'
 *             examples:
 *               success:
 *                 value:
 *                   success: true
 *                   message: "Thank you for your message! We have received your inquiry and will get back to you soon."
 *       400:
 *         description: Bad request - Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactUsErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - "email must be a valid email address"
 *                     - "message must be at least 10 characters long"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContactUsErrorResponse'
 */
contactusRouter.post('/contact-us', asyncHandler(contactUsController.contactUs.bind(contactUsController)));

export default contactusRouter;