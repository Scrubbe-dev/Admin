"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const business_controller_1 = require("./business.controller");
const business_service_1 = require("./business.service");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../auth/middleware/auth.middleware");
const token_service_1 = require("../auth/services/token.service");
const dotenv_1 = __importDefault(require("dotenv"));
const business_middleware_1 = require("./business.middleware");
dotenv_1.default.config();
const businessRouter = express_1.default.Router();
const prismaClient = new client_1.PrismaClient();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const businessService = new business_service_1.BusinessService(prismaClient);
const businessController = new business_controller_1.BusinessController(businessService);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business management operations
 */
/**
 * @swagger
 * /api/v1/business/setup:
 *   put:
 *     summary: Complete business setup and send team invites
 *     description: Sets up a new business profile by updating admin details, configuring the dashboard, and inviting team members. Existing invites are skipped and reported in the response.
 *     tags: [Business]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyName
 *               - industry
 *               - companySize
 *               - primaryRegion
 *               - adminEmail
 *               - firstName
 *               - lastName
 *             properties:
 *               companyName:
 *                 type: string
 *                 example: "Acme Cybersecurity Ltd"
 *               industry:
 *                 type: string
 *                 example: "Cybersecurity"
 *               companySize:
 *                 type: string
 *                 example: "50-100"
 *               primaryRegion:
 *                 type: string
 *                 example: "North America"
 *               companyLogo:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/logo.png"
 *               firstName:
 *                 type: string
 *                 example: "Alice"
 *               lastName:
 *                 type: string
 *                 example: "Johnson"
 *               adminEmail:
 *                 type: string
 *                 format: email
 *                 example: "e.ofoneta@scrubbe.com"
 *               adminJobTitle:
 *                 type: string
 *                 example: "CTO"
 *               inviteMembers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     firstName:
 *                       type: string
 *                       example: "Emmanuel"
 *                     lastName:
 *                       type: string
 *                       example: "Ofoneta"
 *                     inviteEmail:
 *                       type: string
 *                       example: "eofoneta@gmail.com"
 *                     role:
 *                       type: string
 *                       example: "ADMIN"
 *                     accessPermissions:
 *                       type: array
 *                       example: ["VIEW_DASHBOARD", "MANAGE_USERS", "EXECUTE_ACTIONS"]
 *               dashboardPreference:
 *                 type: object
 *                 properties:
 *                   colorScheme:
 *                     type: string
 *                     example: "#1E90FF"
 *                   defaultDashboard:
 *                     type: string
 *                     example: "SCRUBBE_DASHBOARD_SIEM"
 *                   preferredIntegration:
 *                     type: array
 *                     example: ["JIRA"]
 *                   notificationChannels:
 *                     type: array
 *                     example: ["MICROSOFT_TEAMS"]
 *                   defaultPriority:
 *                     type: string
 *                     example: "HIGH"
 *     responses:
 *       200:
 *         description: Business setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Setup successful. 1 invite sent. Skipped: test@example.com (already invited)."
 */
businessRouter.put("/setup", authMiddleware.authenticate, business_middleware_1.businessAccountOnly, (req, res, next) => {
    businessController.businessSetUp(req, res, next);
});
/**
 * @swagger
 * /api/v1/business/get_members:
 *   get:
 *     summary: Retrieve all members of a business account
 *     description: >
 *       Fetches the list of valid members associated with the authenticated business account.
 *       What determines a valid member?: The member accepted the invite and is still a member.
 *       The response returns a simplified view of each member, including only their first name, last name, and email address.
 *
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved list of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   firstname:
 *                     type: string
 *                     example: "John"
 *                   lastname:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     example: "johndoe@mail.com"
 *       401:
 *         description: Unauthorized (missing or invalid authentication token)
 *       403:
 *         description: Forbidden (user is not authorized to access this business data)
 *       500:
 *         description: Internal server error
 */
businessRouter.get("/get_members", authMiddleware.authenticate, business_middleware_1.mustBeAMember, (req, res, next) => {
    businessController.fetchAllValidMembers(req, res, next);
});
/**
 * @swagger
 * /api/v1/business/send-invite:
 *   post:
 *     summary: Send an invitation to join a business account
 *     description: >
 *       Sends an invite email to a specified user with a defined role and access permissions. Only authenticated business accounts can access this route.
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "jane.doe@example.com"
 *                   role:
 *                     type: string
 *                     enum: [ADMIN, MANAGER, ANALYST, VIEWER]
 *                     example: "ADMIN"
 *                   accessPermissions:
 *                     type: array
 *                     items:
 *                       type: string
 *                       enum: [VIEW_DASHBOARD, MODIFY_DASHBOARD, EXECUTE_ACTIONS, MANAGE_USERS]
 *                     example: ["VIEW_DASHBOARD", "MANAGE_USERS"]
 *                   level:
 *                     type: string
 *                     example: "Senior"
 *     responses:
 *       200:
 *         description: Invite sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invite sent to jane.doe@example.com"
 *       400:
 *         description: Invalid request body or validation error
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       403:
 *         description: Forbidden – only business accounts can access this route
 *       500:
 *         description: Failed to send invitation
 */
businessRouter.post("/send-invite", authMiddleware.authenticate, business_middleware_1.mustBeAMember, business_middleware_1.businessAccountOnly, (req, res, next) => {
    businessController.sendInvite(req, res, next);
});
/**
 * @swagger
 * /api/v1/business/decode-invite:
 *   post:
 *     summary: Decode and validate a business invite token
 *     description: >
 *       Validates an invite link by decoding the signed token and checks if the invitee already exists in the system,
 *       and then, returns the invite data. This endpoint ensures that only valid and non expired tokens are accepted,
 *       allowing the frontend to pre fill user details during invite acceptance flow.
 *     tags: [Business]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 description: Signed invite token from the invite email link
 *     responses:
 *       200:
 *         description: Invite token successfully decoded and validated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inviteEmail:
 *                   type: string
 *                   example: "example@gmail.com"
 *                 role:
 *                   type: string
 *                   enum: [ADMIN, MANAGER, ANALYST, VIEWER]
 *                 accessPermissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [VIEW_DASHBOARD, MODIFY_DASHBOARD, EXECUTE_ACTIONS, MANAGE_USERS]
 *                 level:
 *                   type: string
 *                   example: "Senior"
 *                 workspaceName:
 *                   type: string
 *                   example: "Flutter Wave"
 *                 businessId:
 *                   type: string
 *                   example: "b12345678-90ab-cdef-ghij-klmnopqrst"
 *       400:
 *         description: Bad request (invalid token format)
 *       409:
 *         description: Conflict (token invalid or expired)
 *       500:
 *         description: Internal server error
 */
businessRouter.post("/decode-invite", (req, res, next) => {
    businessController.decodeInvite(req, res, next);
});
/**
 * @swagger
 * /api/v1/business/accept-invite:
 *   post:
 *     summary: Accept an invitation to join a business
 *     description: >
 *       Allows a user to accept an invitation by providing their personal details and setting a password.
 *       If the user doesn't exist, a new account will be created and linked to the business.
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "securepassword123"
 *               businessId:
 *                 type: string
 *                 example: "b12345678-90ab-cdef-ghij-klmnopqrst"
 *     responses:
 *       200:
 *         description: Invite accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Existing user added to business successfully"
 *       201:
 *         description: New user created and added to business successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "New user created and added to business successfully"
 *       400:
 *         description: Invalid request body or validation error
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       403:
 *         description: Forbidden – only business accounts can access this route
 *       500:
 *         description: Failed to accept invitation
 */
businessRouter.post("/accept-invite", 
// authMiddleware.authenticate,
// mustBeAMember,
// businessAccountOnly,
(req, res, next) => {
    businessController.acceptInvite(req, res, next);
});
exports.default = businessRouter;
