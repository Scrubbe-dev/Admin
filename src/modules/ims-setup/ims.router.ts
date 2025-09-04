import { Router } from 'express';
import { IMSController } from './ims.controller';
// import { authenticateToken } from '../middleware/authMiddleware';
// import { validateIMSSetup } from '../middleware/validationMiddleware';
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";

const imsRouter = Router();
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
 *     InviteMember:
 *       type: object
 *       required:
 *         - inviteEmail
 *         - role
 *         - accessPermissions
 *         - Level
 *       properties:
 *         inviteEmail:
 *           type: string
 *           format: email
 *           example: "security.manager@example.com"
 *           description: Email address of the member to invite
 *         role:
 *           type: string
 *           enum: [USER, ADMIN, MANAGER, ANALYST, VIEWER]
 *           example: "MANAGER"
 *           description: Role assigned to the invited member
 *         accessPermissions:
 *           type: array
 *           items:
 *             type: string
 *             enum: [VIEW_DASHBOARD, MODIFY_DASHBOARD, EXECUTE_ACTIONS, MANAGE_USERS]
 *           example: ["VIEW_DASHBOARD", "MODIFY_DASHBOARD", "EXECUTE_ACTIONS"]
 *           description: Access permissions granted to the member
 *         Level:
 *           type: string
 *           example: "3.5"
 *           description: User level/tier for escalation purposes
 * 
 *     IMSSetupRequest:
 *       type: object
 *       required:
 *         - companyName
 *         - companySize
 *         - inviteMembers
 *       properties:
 *         companyName:
 *           type: string
 *           example: "Acme Corporation"
 *           description: Name of the company setting up IMS
 *         companySize:
 *           type: string
 *           example: "50-100 employees"
 *           description: Size category of the company
 *         inviteMembers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InviteMember'
 *           description: List of members to invite to the IMS
 * 
 *     IMSSetupResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *           description: Indicates if the setup was successful
 *         message:
 *           type: string
 *           example: "IMS setup completed successfully"
 *           description: Human-readable message about the operation
 *         businessId:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           description: Unique identifier of the created business
 *         dashboardId:
 *           type: string
 *           format: uuid
 *           example: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *           description: Unique identifier of the created dashboard
 *         invitesSent:
 *           type: integer
 *           example: 3
 *           description: Number of invitations successfully sent
 *         totalInvites:
 *           type: integer
 *           example: 5
 *           description: Total number of invitations attempted
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
 *           example: ["Company name is required", "Invalid email format for member 2"]
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
 *   name: Incident Management System (IMS)
 *   description: Endpoints for setting up and managing the Incident Management System
 */

/**
 * @swagger
 * /api/v1/ims/setup:
 *   post:
 *     summary: Setup Incident Management System for a company
 *     description: |
 *       Initializes the Incident Management System for a new company. This endpoint:
 *       - Creates a business entity in the system
 *       - Sets up a default dashboard with configurations
 *       - Sends invitation emails to specified team members
 *       - Configures default settings and permissions
 *       
 *       The setup process is atomic - either all operations succeed or none are applied.
 *     tags:
 *       - Incident Management System (IMS)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IMSSetupRequest'
 *           examples:
 *             basicSetup:
 *               summary: Basic IMS setup with team members
 *               value:
 *                 companyName: "Tech Innovations Inc."
 *                 companySize: "100-500 employees"
 *                 inviteMembers:
 *                   - inviteEmail: "security@techinnovations.com"
 *                     role: "MANAGER"
 *                     accessPermissions: ["VIEW_DASHBOARD", "MODIFY_DASHBOARD", "EXECUTE_ACTIONS", "MANAGE_USERS"]
 *                     Level: "4.0"
 *                   - inviteEmail: "analyst@techinnovations.com"
 *                     role: "ANALYST"
 *                     accessPermissions: ["VIEW_DASHBOARD", "EXECUTE_ACTIONS"]
 *                     Level: "2.5"
 *             minimalSetup:
 *               summary: Minimal setup with just company info
 *               value:
 *                 companyName: "Startup Co."
 *                 companySize: "1-10 employees"
 *                 inviteMembers: []
 *     responses:
 *       201:
 *         description: IMS setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IMSSetupResponse'
 *             examples:
 *               successResponse:
 *                 value:
 *                   success: true
 *                   message: "IMS setup completed successfully"
 *                   businessId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                   dashboardId: "b2c3d4e5-f6g7-8901-bcde-f23456789012"
 *                   invitesSent: 3
 *                   totalInvites: 3
 *       400:
 *         description: Bad request - validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors:
 *                     - "Company name is required"
 *                     - "Invalid email format for member 2"
 *       401:
 *         description: Unauthorized - authentication required
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
 *                   example: "Authentication required"
 *       409:
 *         description: Conflict - user already has a business setup
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
 *                   example: "User already has a business setup"
 *       429:
 *         description: Too many requests - rate limit exceeded
 *       500:
 *         description: Internal server error
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
 *                   example: "Internal server error during IMS setup"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
imsRouter.post(
  '/ims/setup',
   (req, res) =>IMSController.setupIMS(req, res)
);

/**
 * @swagger
 * /api/v1/ims/health:
 *   get:
 *     summary: Health check for IMS endpoints
 *     description: Check if the IMS API endpoints are operational
 *     tags:
 *       - Incident Management System (IMS)
 *     responses:
 *       200:
 *         description: IMS endpoint is healthy
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
 *                   example: "IMS setup endpoint is healthy"
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
imsRouter.get('/ims/health', IMSController.healthCheck);

export default imsRouter;