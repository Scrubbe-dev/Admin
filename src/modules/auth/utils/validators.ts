import { NextFunction, Request } from 'express';
import { ValidationError } from '../error';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Validates the request body against a Zod schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate (typically req.body)
 * @returns The validated data
 * @throws ValidationError if validation fails
 */
export async function validateRequest<T>(schema: AnyZodObject, data: unknown): Promise<T> {
  try {
    const validatedData = await schema.parseAsync(data);
    return validatedData as T;
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      throw new ValidationError('Validation failed', details);
    }
    throw error;
  }
}

/**
 * Middleware factory that validates request data against a Zod schema
 * @param schema The Zod schema to validate against
 * @returns Express middleware function
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validatedData = await validateRequest(schema, req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
}