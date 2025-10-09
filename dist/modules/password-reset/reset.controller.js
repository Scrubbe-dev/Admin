"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetController = void 0;
const reset_services_1 = require("./reset.services");
const logger_1 = require("./utils/logger");
const prisma_1 = __importDefault(require("../../lib/prisma"));
const resend_no_nodemailer_factory_1 = require("../auth/services/resend-no-nodemailer.factory");
// Create service instances
const emailService = (0, resend_no_nodemailer_factory_1.createEmailServiceWithResend)();
const logger = new logger_1.Logger();
const passwordResetService = new reset_services_1.PasswordResetService(prisma_1.default, emailService, logger);
class PasswordResetController {
    /**
     * Step 1: Request a password reset by providing email
     * Sends a 6-digit verification code to the user's email
     */
    static async requestReset(req, res) {
        try {
            const { email } = req.body;
            // Validate request
            if (!email) {
                res.status(400).json({
                    success: false,
                    message: 'Email is required'
                });
                return;
            }
            // Initiate password reset process
            const result = await passwordResetService.initiatePasswordReset(email);
            if (result) {
                res.status(200).json({
                    success: true,
                    message: 'A verification code has been sent to your email'
                });
            }
            else {
                // We don't want to reveal if an email exists or not for security reasons
                res.status(200).json({
                    success: true,
                    message: 'If your email is registered, you will receive a verification code shortly'
                });
            }
        }
        catch (error) {
            logger.error('Error in requestReset', error);
            res.status(500).json({
                success: false,
                message: 'Failed to initiate password reset process'
            });
        }
    }
    /**
     * Step 2: Verify the 6-digit code sent to user's email
     * Sends a reset link to the user's email upon successful verification
     */
    static async verifyCode(req, res) {
        try {
            const { email, code } = req.body;
            // Validate request
            if (!email || !code) {
                res.status(400).json({
                    success: false,
                    message: 'Email and verification code are required'
                });
                return;
            }
            const verificationResult = await passwordResetService.verifyResetCode(email, code);
            if (verificationResult.valid) {
                res.status(200).json({
                    success: true,
                    message: 'Verification successful. A password reset link has been sent to your email.',
                    resetLinkSent: true
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: verificationResult.message,
                    resetLinkSent: false
                });
            }
        }
        catch (error) {
            logger.error('Error in verifyCode', error);
            res.status(500).json({
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
    static async verifyToken(req, res) {
        try {
            const { token } = req.body;
            // Validate request
            if (!token) {
                res.status(400).json({
                    success: false,
                    message: 'Reset token is required'
                });
                return;
            }
            const verificationResult = await passwordResetService.verifyResetLinkToken(token);
            if (verificationResult.valid) {
                res.status(200).json({
                    success: true,
                    message: 'Reset link is valid. You can now reset your password.',
                    canResetPassword: true
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: verificationResult.message,
                    canResetPassword: false
                });
            }
        }
        catch (error) {
            logger.error('Error in verifyToken', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify reset token',
                canResetPassword: false
            });
        }
    }
    /**
     * Final Step: Reset the user's password
     */
    static async resetPassword(req, res) {
        try {
            const { token, password } = req.body;
            // Validate request
            if (!token || !password) {
                res.status(400).json({
                    success: false,
                    message: 'Token and password are required'
                });
                return;
            }
            const resetResult = await passwordResetService.resetPassword(token, password);
            if (resetResult.success) {
                res.status(200).json({
                    success: true,
                    message: 'Your password has been reset successfully. You can now log in with your new password.'
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    message: resetResult.message
                });
            }
        }
        catch (error) {
            logger.error('Error in resetPassword', error);
            res.status(500).json({
                success: false,
                message: 'Failed to reset password'
            });
        }
    }
    /**
     * Health check endpoint
     */
    static async healthCheck(req, res) {
        try {
            // Simple health check - could be expanded to check database connectivity, etc.
            res.status(200).json({
                success: true,
                message: 'Password reset endpoint is healthy',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger.error('Health check failed', error);
            res.status(500).json({
                success: false,
                message: 'Health check failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.PasswordResetController = PasswordResetController;
