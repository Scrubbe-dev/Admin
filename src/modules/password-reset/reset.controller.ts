import { Request, Response } from 'express';
import { 
  RequestWithResetPayload,
  RequestResetResponse,
  VerifyCodeResponse,
  VerifyTokenResponse,
  ResetPasswordResponse
} from './reset.types';
import { PasswordResetService } from './reset.services';
import { Logger } from './utils/logger';

export class PasswordResetController {
  private resetService: PasswordResetService;
  private logger: Logger;
  
  constructor(resetService: PasswordResetService, logger: Logger) {
    this.resetService = resetService;
    this.logger =  logger;
  }
  
  /**
   * Step 1: Request a password reset by providing email
   * Sends a 6-digit verification code to the user's email
   */
  async requestReset(req: Request, res: Response<RequestResetResponse>) {
    try {
      const { email } = req.body;
      
      // Initiate password reset process
      const result = await this.resetService.initiatePasswordReset(email);
      
      if (result) {
        return res.status(200).json({
          success: true,
          message: 'A verification code has been sent to your email'
        });
      } else {
        // We don't want to reveal if an email exists or not for security reasons
        // So we still return a success message even when the email is not found
        return res.status(200).json({
          success: true,
          message: 'If your email is registered, you will receive a verification code shortly'
        });
      }
    } catch (error) {
      this.logger.error('Error in requestReset', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to initiate password reset process'
      });
    }
  }
  
  /**
   * Step 2: Verify the 6-digit code sent to user's email
   * Sends a reset link to the user's email upon successful verification
   */
  async verifyCode(req: Request, res: Response<VerifyCodeResponse>) {
    try {
      const { email, code } = req.body;
      
      const verificationResult = await this.resetService.verifyResetCode(email, code);
      
      if (verificationResult.valid) {
        return res.status(200).json({
          success: true,
          message: 'Verification successful. A password reset link has been sent to your email.',
          resetLinkSent: true
        });
      } else {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          resetLinkSent: false
        });
      }
    } catch (error) {
      this.logger.error('Error in verifyCode', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify code',
        resetLinkSent: false
      });
    }
  }
  
  /**
   * Step 3: Verify the reset link token when user clicks the link
   * Allows user to proceed to password reset form if token is valid
   */
  async verifyToken(req: Request, res: Response<VerifyTokenResponse>) {
    try {
      const { token } = req.body;
      
      const verificationResult = await this.resetService.verifyResetLinkToken(token);
      
      if (verificationResult.valid) {
        return res.status(200).json({
          success: true,
          message: 'Reset link is valid. You can now reset your password.',
          canResetPassword: true
        });
      } else {
        return res.status(400).json({
          success: false,
          message: verificationResult.message,
          canResetPassword: false
        });
      }
    } catch (error) {
      this.logger.error('Error in verifyToken', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify reset token',
        canResetPassword: false
      });
    }
  }
  
  /**
   * Final Step: Reset the user's password
   */
  async resetPassword(req: RequestWithResetPayload, res: Response<ResetPasswordResponse>) {
    try {
      const { token, password } = req.body;
      
      const resetResult = await this.resetService.resetPassword(token, password);
      
      if (resetResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Your password has been reset successfully. You can now log in with your new password.'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: resetResult.message
        });
      }
    } catch (error) {
      this.logger.error('Error in resetPassword', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reset password'
      });
    }
  }
}