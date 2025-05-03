import { Request } from 'express';
import { z } from 'zod';

/**
 * Extended Express Request with reset token payload
 */
export interface RequestWithResetPayload extends Request {
  resetPayload?: {
    userId: string;
    email: string;
    tokenType: ResetTokenType;
  };
}

// ResetToken types that match the Prisma schema
export enum ResetTokenType {
    VERIFICATION_CODE = 'VERIFICATION_CODE',
    RESET_LINK = 'RESET_LINK'
  }
  
  // Token status for verification results
  export enum TokenStatus {
    VALID = 'VALID',
    INVALID = 'INVALID',
    EXPIRED = 'EXPIRED',
    USED = 'USED'
  }

 // Interface for reset tokens
  export interface ResetToken {
    id: string;
    userId: string;
    email: string;
    token: string;
    type: ResetTokenType;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
  }
  

/**
 * Service responses
 */
export interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
  email?: string;
  tokenStatus: TokenStatus;
  message: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

/**
 * Response types for API endpoints
 */
export interface RequestResetResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  resetLinkSent?: boolean;
}

export interface VerifyTokenResponse {
  success: boolean;
  message: string;
  canResetPassword?: boolean;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Interface for token verification results
 */
export interface TokenVerificationResult {
  valid: boolean;
  tokenStatus: TokenStatus;
  userId?: string;
  email?: string;
}

/**
 * Type for reset payload attached to request
 */
export interface ResetPayload {
  userId: string;
  email: string;
  tokenType: 'reset_link' | 'verification_code';
}

  // Result of token verification
  export interface TokenVerificationResult {
    valid: boolean;
    userId?: string;
    email?: string;
    tokenStatus: TokenStatus;
    message: string;
  }
  
  // Result of password reset
  export interface PasswordResetResult {
    success: boolean;
    message: string;
  }