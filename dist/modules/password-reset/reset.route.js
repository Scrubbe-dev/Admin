"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reset_controller_1 = require("./reset.controller");
const passwordResetRouter = (0, express_1.Router)();
// const tokenService = new TokenService(
//   process.env.JWT_SECRET!,
//   process.env.JWT_EXPIRES_IN || "1h",
//   15 // in mins
// );
// const authMiddleware = new AuthMiddleware(tokenService)
/**
 * @swagger
 * components:
 *   schemas:
 *     RequestResetRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: Email address of the user requesting password reset
 *
 *     VerifyCodeRequest:
 *       type: object
 *       required:
 *         - email
 *         - code
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: Email address of the user
 *         code:
 *           type: string
 *           example: "123456"
 *           description: 6-digit verification code sent to user's email
 *
 *     VerifyTokenRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           description: Reset token from the password reset link
 *
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - token
 *         - password
 *       properties:
 *         token:
 *           type: string
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           description: Reset token from the password reset link
 *         password:
 *           type: string
 *           format: password
 *           example: "NewSecurePassword123!"
 *           description: New password to set for the user
 *
 *     RequestResetResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates if the request was successful
 *         message:
 *           type: string
 *           example: "A verification code has been sent to your email"
 *           description: Human-readable message about the operation
 *
 *     VerifyCodeResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates if the verification was successful
 *         message:
 *           type: string
 *           example: "Verification successful. A password reset link has been sent to your email."
 *           description: Human-readable message about the operation
 *         resetLinkSent:
 *           type: boolean
 *           example: true
 *           description: Indicates if a reset link was sent
 *
 *     VerifyTokenResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates if the token verification was successful
 *         message:
 *           type: string
 *           example: "Reset link is valid. You can now reset your password."
 *           description: Human-readable message about the operation
 *         canResetPassword:
 *           type: boolean
 *           example: true
 *           description: Indicates if the user can proceed with password reset
 *
 *     ResetPasswordResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates if the password reset was successful
 *         message:
 *           type: string
 *           example: "Your password has been reset successfully. You can now log in with your new password."
 *           description: Human-readable message about the operation
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Validation failed"
 *         errors:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Email is required", "Invalid email format"]
 *
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 */
/**
 * @swagger
 * tags:
 *   name: Password Reset
 *   description: Endpoints for password reset functionality
 */
/**
 * @swagger
 * /api/v1/password-reset/request:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Initiates the password reset process by sending a 6-digit verification code to the user's email.
 *       This is the first step in the password reset flow.
 *     tags:
 *       - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestResetRequest'
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequestResetResponse'
 *       400:
 *         description: Bad request - validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
passwordResetRouter.post('/password-reset/request', reset_controller_1.PasswordResetController.requestReset);
/**
 * @swagger
 * /api/v1/password-reset/verify-code:
 *   post:
 *     summary: Verify verification code
 *     description: |
 *       Verifies the 6-digit code sent to the user's email. Upon successful verification,
 *       a password reset link will be sent to the user's email.
 *     tags:
 *       - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyCodeRequest'
 *     responses:
 *       200:
 *         description: Verification successful, reset link sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyCodeResponse'
 *       400:
 *         description: Bad request - validation failed or invalid code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
passwordResetRouter.post('/password-reset/verify-code', reset_controller_1.PasswordResetController.verifyCode);
/**
 * @swagger
 * /api/v1/password-reset/verify-token:
 *   post:
 *     summary: Verify reset token
 *     description: |
 *       Verifies the reset link token when the user clicks the link in their email.
 *       This endpoint allows the user to proceed to the password reset form if the token is valid.
 *     tags:
 *       - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyTokenRequest'
 *     responses:
 *       200:
 *         description: Token verification successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyTokenResponse'
 *       400:
 *         description: Bad request - validation failed or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
passwordResetRouter.post('/password-reset/verify-token', reset_controller_1.PasswordResetController.verifyToken);
/**
 * @swagger
 * /api/v1/password-reset/reset-password:
 *   post:
 *     summary: Reset password
 *     description: |
 *       Completes the password reset process by setting a new password for the user.
 *       This is the final step in the password reset flow.
 *     tags:
 *       - Password Reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetPasswordResponse'
 *       400:
 *         description: Bad request - validation failed or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
passwordResetRouter.post('/password-reset/reset-password', reset_controller_1.PasswordResetController.resetPassword);
/**
 * @swagger
 * /api/v1/password-reset/health:
 *   get:
 *     summary: Health check for password reset endpoints
 *     description: Check if the password reset API endpoints are operational
 *     tags:
 *       - Password Reset
 *     responses:
 *       200:
 *         description: Password reset endpoint is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset endpoint is healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-04T15:30:45Z"
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Health check failed"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
passwordResetRouter.get('/password-reset/health', reset_controller_1.PasswordResetController.healthCheck);
exports.default = passwordResetRouter;
