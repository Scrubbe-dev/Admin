import { ContactUsRequest, ContactUsValidationResult } from './contactus.types';

export class ContactUsValidator {
  static validateContactUsData(data: any): ContactUsValidationResult {
    const errors: string[] = [];

    // Validate first_name
    if (!data.first_name || typeof data.first_name !== 'string' || data.first_name.trim().length === 0) {
      errors.push('first_name is required and must be a non-empty string');
    } else if (data.first_name.length > 50) {
      errors.push('first_name must be less than 50 characters');
    }

    // Validate last_name
    if (!data.last_name || typeof data.last_name !== 'string' || data.last_name.trim().length === 0) {
      errors.push('last_name is required and must be a non-empty string');
    } else if (data.last_name.length > 50) {
      errors.push('last_name must be less than 50 characters');
    }

    // Validate email
    if (!data.email || typeof data.email !== 'string') {
      errors.push('email is required and must be a string');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('email must be a valid email address');
    }

    // Validate phone_number (optional)
    if (data.phone_number && typeof data.phone_number !== 'string') {
      errors.push('phone_number must be a string if provided');
    }

    // Validate company_name (optional)
    if (data.company_name && typeof data.company_name !== 'string') {
      errors.push('company_name must be a string if provided');
    } else if (data.company_name && data.company_name.length > 100) {
      errors.push('company_name must be less than 100 characters');
    }

    // Validate job_title (optional)
    if (data.job_title && typeof data.job_title !== 'string') {
      errors.push('job_title must be a string if provided');
    } else if (data.job_title && data.job_title.length > 100) {
      errors.push('job_title must be less than 100 characters');
    }

    // Validate message
    if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
      errors.push('message is required and must be a non-empty string');
    } else if (data.message.length > 2000) {
      errors.push('message must be less than 2000 characters');
    } else if (data.message.length < 10) {
      errors.push('message must be at least 10 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}