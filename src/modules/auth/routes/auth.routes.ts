import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';

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
   * /api/v1/register:
   *   post:
   *     summary: Register a new user
   *     description: Creates a new user account with the provided credentials
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
   *     responses:
   *       201:
   *         description: User registered successfully
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
  router.post('/register', authController.register);

  /**
   * @swagger
   * /api/v1/login:
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
  router.post('/login', authController.login);

  /**
   * @swagger
   * /api/v1/refresh-token:
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
  router.post('/refresh-token', authController.refreshTokens);

  /**
   * @swagger
   * /api/v1/logout:
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
  router.post('/logout', authController.logout);

  /**
   * @swagger
   * /api/v1/me:
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
  router.get('/me', authMiddleware.authenticate, authController.me);

  return router;
}