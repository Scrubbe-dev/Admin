import { z } from 'zod';

/**
 * Schema for requesting password reset (Step 1)
 */
export const RequestResetSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email is too short')
    .max(255, 'Email is too long'),
});

/**
 * Schema for verifying 6-digit code (Step 2)
 */
export const VerifyCodeSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(5, 'Email is too short')
    .max(255, 'Email is too long'),
  code: z
    .string()
    .length(6, 'Verification code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

/**
 * Schema for verifying reset token from link (Step 3)
 */
export const VerifyTokenSchema = z.object({
  token: z
    .string().min(36, 'Token is too short')
    .max(250, 'Token is too long'),
});

/**
 * Schema for password reset (Final step)
 */
export const ResetPasswordSchema = z.object({
  token: z
    .string().min(36, 'Token is too short')
    .max(250, 'Token is too long'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: z.string().optional(),
})

/**
 * Type definitions derived from schemas
 */
export type RequestResetInput = z.infer<typeof RequestResetSchema>;
export type VerifyCodeInput = z.infer<typeof VerifyCodeSchema>;
export type VerifyTokenInput = z.infer<typeof VerifyTokenSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;