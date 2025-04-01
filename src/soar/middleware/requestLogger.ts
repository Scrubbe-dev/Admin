
// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
// import { CustomError } from '../../utils/customError';
 
// Generic validation middleware
export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body against schema
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(
          // new CustomError(
          //   'Validation failed',
          //   400,
          //   'VALIDATION_ERROR',
          //   { errors: error.errors }
          // )
        );
      } else {
        next(error);
      }
    }
  };
};
