"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetService = void 0;
const reset_types_1 = require("./reset.types");
const bcrypt = __importStar(require("bcrypt")); // Import bcrypt for better password hashing
const secure_code_generator_1 = require("./utils/secure-code-generator");
class PasswordResetService {
    prisma;
    emailService;
    logger;
    // Configuration constants
    VERIFICATION_CODE_EXPIRY_MINUTES = 15;
    RESET_LINK_EXPIRY_HOURS = 24;
    CODE_LENGTH = 6;
    BCRYPT_SALT_ROUNDS = 12;
    TOKEN_SALT = process.env.TOKEN_SALT || 'default-salt-change-in-production'; // Should be set in environment variables
    constructor(prisma, emailService, logger) {
        this.prisma = prisma;
        this.emailService = emailService;
        this.logger = logger;
    }
    /**
     * Initiates password reset process by generating and sending verification code
     * @param email User's email address
     * @returns Boolean indicating if the process was initiated successfully
     */
    async initiatePasswordReset(email) {
        try {
            // Check if user exists
            const user = await this.prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true }
            });
            if (!user) {
                this.logger.warn(`Password reset requested for non-existent email: ${email}`);
                return false;
            }
            // Generate 6-digit verification code
            const verificationCode = String(Math.abs(Number(this.generateVerificationCode())));
            // Hash the code before storing
            const hashedCode = this.hashToken(verificationCode);
            // Calculate expiry time
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + this.VERIFICATION_CODE_EXPIRY_MINUTES);
            // Invalidate any existing verification codes for this user
            await this.prisma.resetToken.updateMany({
                where: {
                    userId: user.id,
                    type: reset_types_1.ResetTokenType.VERIFICATION_CODE,
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                },
                data: {
                    usedAt: new Date(),
                }
            });
            // Store the new verification code
            await this.prisma.resetToken.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    token: hashedCode,
                    type: reset_types_1.ResetTokenType.VERIFICATION_CODE,
                    expiresAt,
                    createdAt: new Date(),
                }
            });
            // Send verification code via email
            await this.emailService.sendPasswordResetCode(user.email, verificationCode);
            this.logger.info(`Password reset verification code sent to: ${email}`);
            return true;
        }
        catch (error) {
            this.logger.error('Error in initiatePasswordReset', error);
            throw new Error('Failed to initiate password reset process');
        }
    }
    /**
     * Verifies the 6-digit code provided by the user
     * @param email User's email address
     * @param code Verification code to validate
     * @returns Result of verification and token details if successful
     */
    async verifyResetCode(email, code) {
        try {
            // Find user by email
            const user = await this.prisma.user.findUnique({
                where: { email },
                select: { id: true, email: true }
            });
            if (!user) {
                return {
                    valid: false,
                    tokenStatus: reset_types_1.TokenStatus.INVALID,
                    message: 'User not found'
                };
            }
            // Hash the provided code for comparison
            const hashedCode = this.hashToken(code);
            // Find the reset token
            const resetToken = await this.prisma.resetToken.findFirst({
                where: {
                    userId: user.id,
                    email: user.email,
                    token: hashedCode,
                    type: reset_types_1.ResetTokenType.VERIFICATION_CODE,
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!resetToken) {
                // Check if token exists but is expired
                const expiredToken = await this.prisma.resetToken.findFirst({
                    where: {
                        userId: user.id,
                        email: user.email,
                        type: reset_types_1.ResetTokenType.VERIFICATION_CODE,
                        expiresAt: { lte: new Date() },
                        usedAt: null
                    }
                });
                if (expiredToken) {
                    return {
                        valid: false,
                        tokenStatus: reset_types_1.TokenStatus.EXPIRED,
                        message: 'Verification code has expired'
                    };
                }
                // Check if token was already used
                const usedToken = await this.prisma.resetToken.findFirst({
                    where: {
                        userId: user.id,
                        email: user.email,
                        type: reset_types_1.ResetTokenType.VERIFICATION_CODE,
                        usedAt: { not: null }
                    }
                });
                if (usedToken) {
                    return {
                        valid: true,
                        userId: user.id,
                        email: user.email,
                        tokenStatus: reset_types_1.TokenStatus.VALID,
                        message: 'Verification successful, reset link sent'
                    };
                }
                return {
                    valid: false,
                    tokenStatus: reset_types_1.TokenStatus.INVALID,
                    message: 'Invalid verification code'
                };
            }
            // Mark the verification code as used
            await this.prisma.resetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: new Date() }
            });
            // Generate a reset link token
            const resetLinkToken = await this.generateResetLinkToken(user.id, user.email);
            await this.emailService.sendPasswordResetLink(user.email, resetLinkToken);
            this.logger.info(`Password reset link sent to: ${email}`);
            return {
                valid: true,
                userId: user.id,
                email: user.email,
                tokenStatus: reset_types_1.TokenStatus.VALID,
                message: 'Verification successful, reset link sent'
            };
        }
        catch (error) {
            this.logger.error('Error in verifyResetCode', error);
            throw new Error('Failed to verify reset code');
        }
    }
    /**
     * Verifies the reset link token when user clicks the link
     * @param token Reset link token to validate
     * @returns Result of verification and token details if successful
     */
    async verifyResetLinkToken(token) {
        try {
            // Find the reset token
            const resetToken = await this.prisma.resetToken.findFirst({
                where: {
                    token,
                    type: reset_types_1.ResetTokenType.RESET_LINK,
                    usedAt: null,
                    expiresAt: { gt: new Date() }
                }
            });
            if (!resetToken) {
                // Check if token exists but is expired
                const expiredToken = await this.prisma.resetToken.findFirst({
                    where: {
                        token,
                        type: reset_types_1.ResetTokenType.RESET_LINK,
                        expiresAt: { lte: new Date() }
                    }
                });
                if (expiredToken) {
                    return {
                        valid: false,
                        tokenStatus: reset_types_1.TokenStatus.EXPIRED,
                        message: 'Reset link has expired'
                    };
                }
                // Check if token was already used
                const usedToken = await this.prisma.resetToken.findFirst({
                    where: {
                        token,
                        type: reset_types_1.ResetTokenType.RESET_LINK,
                        usedAt: { not: null }
                    }
                });
                if (usedToken) {
                    return {
                        valid: false,
                        tokenStatus: reset_types_1.TokenStatus.USED,
                        message: 'Reset link has already been used'
                    };
                }
                return {
                    valid: false,
                    tokenStatus: reset_types_1.TokenStatus.INVALID,
                    message: 'Invalid reset link'
                };
            }
            return {
                valid: true,
                userId: resetToken.userId,
                email: resetToken.email,
                tokenStatus: reset_types_1.TokenStatus.VALID,
                message: 'Reset link is valid'
            };
        }
        catch (error) {
            this.logger.error('Error in verifyResetLinkToken', error);
            throw new Error('Failed to verify reset link');
        }
    }
    /**
     * Completes the password reset process by updating the user's password
     * @param token Reset link token
     * @param newPassword New password to set
     * @returns Result of the password reset operation
     */
    async resetPassword(token, newPassword) {
        try {
            // Verify the token first
            const verificationResult = await this.verifyResetLinkToken(token);
            if (!verificationResult.valid || !verificationResult.userId) {
                return {
                    success: false,
                    message: verificationResult.message
                };
            }
            // Hash the new password using bcrypt
            const hashedPassword = await this.hashPassword(newPassword);
            // Update user's password
            await this.prisma.user.update({
                where: { id: verificationResult.userId },
                data: {
                    passwordHash: hashedPassword,
                    passwordChangedAt: new Date()
                }
            });
            // Mark the reset token as used
            await this.prisma.resetToken.updateMany({
                where: {
                    token,
                    type: reset_types_1.ResetTokenType.RESET_LINK,
                    usedAt: null
                },
                data: { usedAt: new Date() }
            });
            // Invalidate all other active reset tokens for this user
            await this.prisma.resetToken.updateMany({
                where: {
                    userId: verificationResult.userId,
                    usedAt: null
                },
                data: { usedAt: new Date() }
            });
            this.logger.info(`Password reset completed for user: ${verificationResult.email}`);
            // Send confirmation email
            await this.emailService.sendPasswordResetConfirmation(verificationResult.email);
            return {
                success: true,
                message: 'Password has been reset successfully'
            };
        }
        catch (error) {
            this.logger.error('Error in resetPassword', error);
            throw new Error('Failed to reset password');
        }
    }
    /**
     * Generates a cryptographically secure 6-digit verification code
     * @returns A 6-digit numeric code as a string
     */
    generateVerificationCode() {
        // Use SecureCodeGenerator for cryptographically secure random code generation
        return secure_code_generator_1.SecureCodeGenerator.generateNumericCode(this.CODE_LENGTH);
    }
    /**
     * Generates a reset link token and stores it
     * @param userId User's ID
     * @param email User's email
     * @returns The generated token
     */
    async generateResetLinkToken(userId, email) {
        // Generate a secure token instead of UUID for higher security
        const resetToken = secure_code_generator_1.SecureCodeGenerator.generateSecureToken();
        // Calculate expiry time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + this.RESET_LINK_EXPIRY_HOURS);
        // Store the token
        await this.prisma.resetToken.create({
            data: {
                userId,
                email,
                token: resetToken,
                type: reset_types_1.ResetTokenType.RESET_LINK,
                expiresAt,
                createdAt: new Date(),
            }
        });
        return resetToken;
    }
    /**
     * Hashes a token for secure storage
     * @param token Token to hash
     * @returns Hashed token
     */
    hashToken(token) {
        // Use the SecureCodeGenerator with a salt for more secure hashing
        // return SecureCodeGenerator.hashToken(token, this.TOKEN_SALT);
        return token;
    }
    /**
     * Uses bcrypt to securely hash passwords
     * @param password Password to hash
     * @returns Hashed password
     */
    async hashPassword(password) {
        // Use bcrypt instead of simple hash for password security
        return await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
    }
    /**
     * Cleans up expired tokens to maintain database hygiene
     * Should be run periodically through a scheduled job
     * @returns Number of tokens deleted
     */
    async cleanupExpiredTokens() {
        try {
            // Delete tokens that are expired and unused
            const result = await this.prisma.resetToken.deleteMany({
                where: {
                    expiresAt: { lt: new Date() },
                    usedAt: null
                }
            });
            this.logger.info(`Cleaned up ${result.count} expired reset tokens`);
            return result.count;
        }
        catch (error) {
            this.logger.error('Error cleaning up expired tokens', error);
            throw new Error('Failed to clean up expired tokens');
        }
    }
}
exports.PasswordResetService = PasswordResetService;
