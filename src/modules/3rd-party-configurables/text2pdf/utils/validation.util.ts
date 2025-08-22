
// utils/validation.util.ts
import { PdfGenerationRequest, ValidationResult } from '../text2pdf.types';

export class ValidationUtil {
  /**
   * Validate PDF generation request
   */
  static validatePdfRequest(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data) {
      return { isValid: false, errors: ['Request body is required'] };
    }

    // Validate ID
    if (!data.id || typeof data.id !== 'string' || data.id.trim().length === 0) {
      errors.push('ID is required and must be a non-empty string');
    } else if (data.id.length > 50) {
      errors.push('ID must not exceed 50 characters');
    }

    // Validate Description
    if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
      errors.push('Description is required and must be a non-empty string');
    } else if (data.description.length > 5000) {
      errors.push('Description must not exceed 5000 characters');
    }

    // Validate optional template
    if (data.template && typeof data.template !== 'string') {
      errors.push('Template must be a string');
    }

    // Validate optional metadata
    if (data.metadata) {
      if (typeof data.metadata !== 'object') {
        errors.push('Metadata must be an object');
      } else {
        const { title, author, subject, department } = data.metadata;
        
        if (title && (typeof title !== 'string' || title.length > 100)) {
          errors.push('Title must be a string with maximum 100 characters');
        }
        
        if (author && (typeof author !== 'string' || author.length > 100)) {
          errors.push('Author must be a string with maximum 100 characters');
        }
        
        if (subject && (typeof subject !== 'string' || subject.length > 100)) {
          errors.push('Subject must be a string with maximum 100 characters');
        }
        
        if (department && (typeof department !== 'string' || department.length > 100)) {
          errors.push('Department must be a string with maximum 100 characters');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}