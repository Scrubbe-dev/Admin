"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetMiddleware = void 0;
const zod_1 = require("zod");
const reset_types_1 = require("./reset.types");
class PasswordResetMiddleware {
    resetService;
    logger;
    rateLimiter;
    // Rate limiting configuration
    MAX_RESET_REQUESTS = 5; // Maximum number of reset requests per hour
    MAX_CODE_ATTEMPTS = 10; // Maximum number of code verification attempts per hour
    MAX_PASSWORD_RESETS = 3; // Maximum number of password resets per day
    constructor(resetService, logger, rateLimiter) {
        this.resetService = resetService;
        this.logger = logger;
        this.rateLimiter = rateLimiter;
    }
    /**
     * Validates request body against the provided schema
     * @param schema Zod schema to validate against
     */
    validateSchema(schema) {
        return async (req, res, next) => {
            try {
                await schema.parseAsync(req.body);
                next();
            }
            catch (error) {
                if (error instanceof zod_1.ZodError) {
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
    rateLimit(limitType) {
        return async (req, res, next) => {
            try {
                const ip = req.ip || req.socket.remoteAddress || 'unknown';
                const email = req.body.email || 'unknown';
                let key;
                let limit;
                let windowHours;
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
                        limit = 10; // Default limit
                        windowHours = 1;
                }
                const { canProceed, remaining, resetTime } = await this.rateLimiter.checkRateLimit(key, limit, windowHours);
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
            }
            catch (error) {
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
        return async (req, res, next) => {
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
                        case reset_types_1.TokenStatus.EXPIRED:
                            return res.status(400).json({
                                success: false,
                                message: 'Reset link has expired. Please request a new password reset.'
                            });
                        case reset_types_1.TokenStatus.USED:
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
                    userId: verificationResult.userId,
                    email: verificationResult.email,
                    tokenType: 'reset_link'
                };
                next();
            }
            catch (error) {
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
        return async (req, res, next) => {
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
                        case reset_types_1.TokenStatus.EXPIRED:
                            return res.status(400).json({
                                success: false,
                                message: 'Verification code has expired. Please request a new code.'
                            });
                        case reset_types_1.TokenStatus.USED:
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
                    userId: verificationResult.userId,
                    email: verificationResult.email,
                    tokenType: 'verification_code'
                };
                next();
            }
            catch (error) {
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
        return (req, res, next) => {
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
exports.PasswordResetMiddleware = PasswordResetMiddleware;
