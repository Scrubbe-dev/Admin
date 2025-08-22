import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message: string = 'Success', statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }
  
  static error(res: Response, message: string = 'Internal Server Error', statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }
  
  static notFound(res: Response, message: string = 'Resource not found') {
    return res.status(404).json({
      success: false,
      message
    });
  }
  
  static validationError(res: Response, errors: any[], message: string = 'Validation failed') {
    return res.status(400).json({
      success: false,
      message,
      errors
    });
  }
}