// src/middleware/index.ts
import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { EmailRequest, ErrorResponse } from './bec.types';
import { emailRequestSchema } from '../../modules/bec/bec.schema';
import { logger } from '../../common/logger/logger';
import { env } from '../../config/env';

const rateLimiter = new RateLimiterMemory({
  points: 10, // 10 requests
  duration: 60, // per 60 seconds
});

export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.requestId = req.headers['x-request-id']?.toString() || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await rateLimiter.consume(String(req.ip));
    next();
  } catch (rejRes) {
    res.status(429).json({
      request_id: req.requestId,
      timestamp: new Date().toISOString(),
      status: 'error',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
    });
  }
};

export const validationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    emailRequestSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const response: ErrorResponse = {
        request_id: req.requestId,
        timestamp: new Date().toISOString(),
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: error.errors,
      };
      return res.status(400).json(response);
    }
    next(error);
  }
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Request failed', {
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  });

  const statusCode = 500;
  const response: ErrorResponse = {
    request_id: req.requestId,
    timestamp: new Date().toISOString(),
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  };

  res.status(statusCode).json(response);
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'];
//   if (!apiKey || apiKey !== env.API_KEY) {
  if (!apiKey || apiKey) {
    const response: ErrorResponse = {
      request_id: req.requestId,
      timestamp: new Date().toISOString(),
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Invalid or missing API key',
    };
    return res.status(401).json(response);
  } 
  next();
};