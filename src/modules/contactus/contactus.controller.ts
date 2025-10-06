import { Request, Response } from 'express';
import { ContactUsService } from './contactus.services';
import { ContactUsValidator } from './contactus.utils';
import { ContactUsValidationResult } from './contactus.types';

const contactUsService = new ContactUsService();

export class ContactUsController {
  async contactUs(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult: ContactUsValidationResult = ContactUsValidator.validateContactUsData(req.body);
      
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      const contactData = {
        first_name: req.body.first_name.trim(),
        last_name: req.body.last_name.trim(),
        email: req.body.email.trim(),
        phone_number: req.body.phone_number?.trim(),
        company_name: req.body.company_name?.trim(),
        job_title: req.body.job_title?.trim(),
        message: req.body.message.trim()
      };

      // Send email to support
      await contactUsService.sendContactUsEmail(contactData);

      return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We have received your inquiry and will get back to you soon.'
      });

    } catch (error: any) {
      console.error('Error processing contact form:', error);

      return res.status(500).json({
        success: false,
        message: 'Sorry, we encountered an error while processing your request. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}