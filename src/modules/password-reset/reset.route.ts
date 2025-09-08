import { Router } from 'express';
import { PasswordResetController } from './reset.controller';
import { PasswordResetMiddleware } from './reset.middleware';
import {
  RequestResetSchema,
  VerifyCodeSchema,
  VerifyTokenSchema,
  ResetPasswordSchema
} from './reset.schema';

import express from 'express';
const router = express.Router();


export class PasswordResetRoutes {
  private router: Router;
  private controller: PasswordResetController;
  private middleware: PasswordResetMiddleware;
  
  constructor(controller: PasswordResetController, middleware: PasswordResetMiddleware) {
    this.router = Router();
    this.controller = controller;
    this.middleware = middleware;
    this.initializeRoutes();
  }
  
  private initializeRoutes(): void {
    // Step 1: Request password reset (send verification code)
    this.router.post(
      '/request',
      // this.middleware.rateLimit('request') as any,
      this.middleware.validateSchema(RequestResetSchema) as any,
      this.controller.requestReset.bind(this.controller) as any
    );
    
    // Step 2: Verify the 6-digit code
    this.router.post(
      '/verify-code',
    //   this.middleware.rateLimit('verify'),
      this.middleware.validateSchema(VerifyCodeSchema) as any,
      this.middleware.validateVerificationCode() as any,
      this.controller.verifyCode.bind(this.controller) as any
    );
    
    // Step 3: Verify reset link token
    this.router.post(
      '/verify-token',
      this.middleware.validateSchema(VerifyTokenSchema) as any,
      this.controller.verifyToken.bind(this.controller) as any
    );
    
    // Final Step: Reset password
    this.router.post(
      '/reset-password',
    //   this.middleware.rateLimit('reset'),
      this.middleware.validateSchema(ResetPasswordSchema as any) as any,
      this.middleware.validateResetToken() as any,
      this.controller.resetPassword.bind(this.controller) as any
    );
  }
  
  getRouter(): Router {
    return this.router;
  }
}