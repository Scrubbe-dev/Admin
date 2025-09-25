import { ZodSchema } from 'zod';
import { ApiResponse } from '../types';

export class ValidationUtils {
  static validate<T>(schema: ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
    try {
      const validatedData = schema.parse(data);
      return { success: true, data: validatedData };
    } catch (error: any) {
      const errorMessage = error.errors?.[0]?.message || 'Validation failed';
      return { success: false, error: errorMessage };
    }
  }

  static handleValidationError(error: any): ApiResponse {
    if (error.errors) {
      return {
        success: false,
        message: 'Validation failed',
        error: error.errors[0]?.message
      };
    }
    return {
      success: false,
      message: 'Validation failed',
      error: 'Unknown validation error'
    };
  }
}