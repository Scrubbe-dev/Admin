import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';
import { ApiError } from '../modules/admin-auth/admin.utils';

export const validate = (schema: AnyZodObject | ZodEffects<AnyZodObject>) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error:any) {
      const errorMessage = error.errors?.map((err: any) => err.message).join(', ') || 'Validation failed';
      next(new ApiError(400, errorMessage));
    }
  };