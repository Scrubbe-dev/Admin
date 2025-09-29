"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordSchema = exports.VerifyTokenSchema = exports.VerifyCodeSchema = exports.RequestResetSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema for requesting password reset (Step 1)
 */
exports.RequestResetSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .min(5, 'Email is too short')
        .max(255, 'Email is too long'),
});
/**
 * Schema for verifying 6-digit code (Step 2)
 */
exports.VerifyCodeSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email('Invalid email format')
        .min(5, 'Email is too short')
        .max(255, 'Email is too long'),
    code: zod_1.z
        .string()
        .length(6, 'Verification code must be exactly 6 digits')
        .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});
/**
 * Schema for verifying reset token from link (Step 3)
 */
exports.VerifyTokenSchema = zod_1.z.object({
    token: zod_1.z
        .string().min(36, 'Token is too short')
        .max(250, 'Token is too long'),
});
/**
 * Schema for password reset (Final step)
 */
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z
        .string().min(36, 'Token is too short')
        .max(250, 'Token is too long'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password is too long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    confirmPassword: zod_1.z.string().optional(),
});
