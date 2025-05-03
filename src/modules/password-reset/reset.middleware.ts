import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { 
  RequestWithResetPayload, 
  TokenStatus 
} from './reset.types';
import { PasswordResetService } from './reset.services';
import { Logger } from './utils/logger';
import { RateLimiterService } from './utils/rate-limiter';

export class PasswordResetMiddleware {
  private resetService: PasswordResetService;
  private logger: Logger;
  private rateLimiter: RateLimiterService;
  
  // Rate limiting configuration
  private readonly MAX_RESET_REQUESTS = 5;     // Maximum number of reset requests per hour
  private readonly MAX_CODE_ATTEMPTS = 10;     // Maximum number of code verification attempts per hour
  private readonly MAX_PASSWORD_RESETS = 3;    // Maximum number of password resets per day
  
  constructor(
    resetService: PasswordResetService, 
    logger: Logger,
    rateLimiter: RateLimiterService
  ) {
    this.resetService = resetService;
    this.logger = logger;
    this.rateLimiter = rateLimiter;
  }
  
  /**
   * Validates request body against the provided schema
   * @param schema Zod schema to validate against
   */
  validateSchema(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await schema.parseAsync(req.body);
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }));
          
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: formattedErrors
          });
        }
        
        this.logger.error('Unexpected validation error', error);
        return res.status(500).json({
          success: false,
          message: 'An unexpected error occurred during validation'
        });
      }
    };
  }
  
  /**
   * Rate limits password reset requests
   */
  rateLimit(limitType: 'request' | 'verify' | 'reset') {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const email = req.body.email || 'unknown';
        
        let key: string;
        let limit: number;
        let windowHours: number;
        
        switch (limitType) {
          case 'request':
            key = `reset:request:${ip}:${email}`;
            limit = this.MAX_RESET_REQUESTS;
            windowHours = 1;
            break;
          case 'verify':
            key = `reset:verify:${ip}:${email}`;
            limit = this.MAX_CODE_ATTEMPTS;
            windowHours = 1;
            break;
          case 'reset':
            key = `reset:password:${ip}:${email}`;
            limit = this.MAX_PASSWORD_RESETS;
            windowHours = 24;
            break;
          default:
            key = `reset:${limitType}:${ip}:${email}`;
            limit = 10;  // Default limit
            windowHours = 1;
        }
        
        const { canProceed, remaining, resetTime } = 
          await this.rateLimiter.checkRateLimit(key, limit, windowHours);
        
        if (!canProceed) {
          return res.status(429).json({
            success: false,
            message: `Too many ${limitType} attempts. Please try again later.`,
            retryAfter: resetTime
          });
        }
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', resetTime.toISOString());
        
        next();
      } catch (error) {
        this.logger.error(`Error in rate limiting ${limitType}`, error);
        // Proceed anyway to avoid blocking legitimate requests due to rate limiter issues
        next();
      }
    };
  }
  
  /**
   * Validates reset token from request body
   */
  validateResetToken() {
    return async (req: RequestWithResetPayload, res: Response, next: NextFunction) => {
      try {
        const { token } = req.body;
        
        if (!token) {
          return res.status(400).json({
            success: false,
            message: 'Reset token is required'
          });
        }
        
        const verificationResult = await this.resetService.verifyResetLinkToken(token);
        
        if (!verificationResult.valid) {
          // Return appropriate error message based on token status
          switch (verificationResult.tokenStatus) {
            case TokenStatus.EXPIRED:
              return res.status(400).json({
                success: false,
                message: 'Reset link has expired. Please request a new password reset.'
              });
            case TokenStatus.USED:
              return res.status(400).json({
                success: false,
                message: 'Reset link has already been used. Please request a new password reset.'
              });
            default:
              return res.status(400).json({
                success: false,
                message: 'Invalid reset link. Please request a new password reset.'
              });
          }
        }
        
        // Add token payload to request object for use in next middleware/controller
        req.resetPayload = {
          userId: verificationResult.userId!,
          email: verificationResult.email!,
          tokenType: 'reset_link' as any 
        };
        
        next();
      } catch (error) {
        this.logger.error('Error validating reset token', error);
        return res.status(500).json({
          success: false,
          message: 'An error occurred while validating the reset token'
        });
      }
    };
  }
  
  /**
   * Validates verification code from request body
   */
  validateVerificationCode() {
    return async (req: RequestWithResetPayload, res: Response, next: NextFunction) => {
      try {
        const { email, code } = req.body;
        
        if (!email || !code) {
          return res.status(400).json({
            success: false,
            message: 'Email and verification code are required'
          });
        }
        
        const verificationResult = await this.resetService.verifyResetCode(email, code);
        
        if (!verificationResult.valid) {
          // Return appropriate error message based on token status
          switch (verificationResult.tokenStatus) {
            case TokenStatus.EXPIRED:
              return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new code.'
              });
            case TokenStatus.USED:
              return res.status(400).json({
                success: false,
                message: 'Verification code has already been used. Please request a new code.'
              });
            default:
              return res.status(400).json({
                success: false,
                message: 'Invalid verification code. Please try again.'
              });
          }
        }
        
        // Add token payload to request object for use in next middleware/controller
        req.resetPayload = {
          userId: verificationResult.userId!,
          email: verificationResult.email!,
          tokenType: 'verification_code' as any
        };
        
        next();
      } catch (error) {
        this.logger.error('Error validating verification code', error);
        return res.status(500).json({
          success: false,
          message: 'An error occurred while validating the verification code'
        });
      }
    };
  }
  
  /**
   * Checks if passwords match in request body
   */
  validatePasswordMatch() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }
      
      next();
    };
  }
}