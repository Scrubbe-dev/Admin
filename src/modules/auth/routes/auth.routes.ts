import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthMiddleware } from "../middleware/auth.middleware";

export function createAuthRouter(
  authController: AuthController,
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  /**
   * @swagger
   * tags:
   *   name: Authentication
   *   description: User authentication and authorization
   */

  /**
   * @swagger
   * /api/v1/auth/dev/register:
   *   post:
   *     summary: Register a new developer user
   *     description: Creates a new developer user account and sends a verification email with an OTP code to the provided email address. This endpoint automatically sets the account type to "DEVELOPER".
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *                 description: User's email address
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "SecurePassword123!"
   *                 description: User's password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
   *               firstName:
   *                 type: string
   *                 example: "John"
   *                 description: User's first name
   *               lastName:
   *                 type: string
   *                 example: "Doe"
   *                 description: User's last name
   *               experienceLevel:
   *                 type: string
   *                 example: "Intermediate"
   *                 description: Developer's experience level
   *               githubUserame:
   *                 type: string
   *                 example: "johndoe-dev"
   *                 description: GitHub username (used for developer profiling)
   *     responses:
   *       201:
   *         description: User registered successfully and verification email sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *                     email:
   *                       type: string
   *                       example: "user@example.com"
   *                     firstName:
   *                       type: string
   *                       example: "John"
   *                     lastName:
   *                       type: string
   *                       example: "Doe"
   *                     isVerified:
   *                       type: boolean
   *                       example: false
   *                     accountType:
   *                       type: string
   *                       example: "DEVELOPER"
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-04-20T12:00:00Z"
   *                 tokens:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     refreshToken:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *       400:
   *         description: Bad request (invalid input)
   *       409:
   *         description: Conflict (email already exists)
   *       500:
   *         description: Internal server error
   */
  router.post("/dev/register", authController.registerDev);

  /**
   * @swagger
   * /api/v1/auth/business/register:
   *   post:
   *     summary: Register a new business user
   *     description: Creates a new business user account and sends a verification email with an OTP code to the provided email address. This endpoint automatically sets the account type to "BUSINESS".
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - businessAddress
   *               - companySize
   *               - purpose
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "owner@company.com"
   *                 description: Business email address
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "SecurePassword123!"
   *                 description: User's password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
   *               firstName:
   *                 type: string
   *                 example: "Jane"
   *                 description: User's first name
   *               lastName:
   *                 type: string
   *                 example: "Smith"
   *                 description: User's last name
   *               businessAddress:
   *                 type: string
   *                 example: "123 Main St, Springfield"
   *                 description: Physical address of the business
   *               companySize:
   *                 type: string
   *                 example: "11-50"
   *                 description: Size range of the company
   *               purpose:
   *                 type: string
   *                 example: "Monitoring cloud infrastructure"
   *                 description: Purpose of using the platform
   *     responses:
   *       201:
   *         description: Business user registered successfully and verification email sent
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *                     email:
   *                       type: string
   *                       example: "owner@company.com"
   *                     firstName:
   *                       type: string
   *                       example: "Jane"
   *                     lastName:
   *                       type: string
   *                       example: "Smith"
   *                     accountType:
   *                       type: string
   *                       example: "BUSINESS"
   *                     isVerified:
   *                       type: boolean
   *                       example: false
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-04-20T12:00:00Z"
   *                 tokens:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     refreshToken:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *       400:
   *         description: Bad request (invalid input)
   *       409:
   *         description: Conflict (email already exists)
   *       500:
   *         description: Internal server error
   */
  router.post("/business/register", authController.registerBusiness);
  /**
   * @swagger
   * /api/v1/auth/verify_email:
   *   post:
   *     summary: Verify email using otp sent to your email when you register
   *     description: |
   *       This endpoint verifies a user's email address by validating the One-Time Password (OTP) sent to the user's email upon registration.
   *       The OTP must be a valid, unused, and unexpired 6-digit code associated with the given `userId`.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - userId
   *             properties:
   *               code:
   *                 type: string
   *                 description: 6-digit OTP code sent to the user's email
   *                 example: "382938"
   *               userId:
   *                 type: string
   *                 format: uuid
   *                 description: Unique identifier of the user
   *                 example: "143c3d28-4b95-4807-9827-13r6ff96c6b4"
   *     responses:
   *       200:
   *         description: OTP verified successfully!
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: OTP verified successfully!
   *
   *       400:
   *         description: Bad request (invalid input)
   *       409:
   *         description: Conflict (email already exists)
   *       500:
   *         description: Internal server error
   */
  router.post("/verify_email", authController.verifyEmail);
  /**
   * @swagger
   * /api/v1/auth/resend_otp:
   *   post:
   *     summary: Resend OTP to user email
   *     description: |
   *       This endpoint resends the email verification OTP to the user, using the `userId` provided.
   *       To prevent abuse, resending is restricted by a cooldown period (e.g., 60 seconds) between requests.
   *       If a resend is attempted too soon, the request will return a conflict response with the remaining wait time.
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: string
   *                 format: uuid
   *                 description: Unique identifier of the user
   *                 example: "143c3d28-4b95-4807-9827-13r6ff96c6b4"
   *     responses:
   *       200:
   *         description: OTP resent successfully!
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: OTP resent successfully!
   *       400:
   *         description: Bad request (invalid input)
   *       401:
   *         description: Unauthorized (no existing OTP or invalid user)
   *       409:
   *         description: Conflict (cooldown in effect, must wait before resending)
   *       500:
   *         description: Internal server error
   */
  router.post("/resend_otp", authController.resendOTP);

  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     summary: Authenticate a user
   *     description: Logs in a user and returns access and refresh tokens
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "user@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "SecurePassword123!"
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *                     email:
   *                       type: string
   *                       example: "user@example.com"
   *                     firstName:
   *                       type: string
   *                       example: "John"
   *                     lastName:
   *                       type: string
   *                       example: "Doe"
   *                     isVerified:
   *                       type: boolean
   *                       example: true
   *                     lastLogin:
   *                       type: string
   *                       format: date-time
   *                       example: "2025-04-20T12:00:00Z"
   *                 tokens:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     refreshToken:
   *                       type: string
   *                       example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *       401:
   *         description: Unauthorized (invalid credentials)
   *       403:
   *         description: Forbidden (account not active)
   *       500:
   *         description: Internal server error
   */
  router.post("/login", authController.login);

  /**
   * @swagger
   * /api/v1/auth/refresh-token:
   *   post:
   *     summary: Refresh access token
   *     description: Generates a new access token using a valid refresh token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *     responses:
   *       200:
   *         description: Tokens refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 accessToken:
   *                   type: string
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                 refreshToken:
   *                   type: string
   *                   example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *       401:
   *         description: Unauthorized (invalid or expired refresh token)
   *       500:
   *         description: Internal server error
   */
  router.post("/refresh-token", authController.refreshTokens);

  /**
   * @swagger
   * /api/v1/auth/logout:
   *   post:
   *     summary: Log out a user
   *     description: Invalidates the provided refresh token
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *     responses:
   *       204:
   *         description: Logout successful
   *       401:
   *         description: Unauthorized (invalid token)
   *       500:
   *         description: Internal server error
   */
  router.post("/logout", authController.logout);

  /**
   * @swagger
   * /api/v1/auth/me:
   *   get:
   *     summary: Get current user profile
   *     description: Returns the profile of the currently authenticated user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
   *                 email:
   *                   type: string
   *                   example: "user@example.com"
   *                 firstName:
   *                   type: string
   *                   example: "John"
   *                 lastName:
   *                   type: string
   *                   example: "Doe"
   *                 isVerified:
   *                   type: boolean
   *                   example: true
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                   example: "2025-04-20T12:00:00Z"
   *       401:
   *         description: Unauthorized (invalid or missing token)
   *       500:
   *         description: Internal server error
   */
  router.get("/me", authMiddleware.authenticate, authController.me);

  return router;
}
