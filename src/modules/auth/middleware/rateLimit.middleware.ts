
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

export class RateLimiterMiddleware {
  static createForgotPasswordLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 3, // Limit each IP to 3 requests per windowMs
      message: {
        error: "Too many password reset attempts. Please try again after 15 minutes."
      },
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
  }

  static createResetPasswordLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 requests per windowMs
      message: {
        error: "Too many password reset attempts. Please try again after 15 minutes."
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}