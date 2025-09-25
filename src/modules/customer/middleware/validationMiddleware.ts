import { Request, Response, NextFunction } from 'express';
import { AnySchema } from 'joi';
import { ApiResponse } from '../types';

export const validateRequest = (schema: AnySchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { abortEarly: false, allowUnknown: true, stripUnknown: true }
    );

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');

      const response: ApiResponse = {
        success: false,
        message: 'Validation failed',
        error: errorMessage,
      };

      return res.status(400).json(response);
    }

    next();
  };
};