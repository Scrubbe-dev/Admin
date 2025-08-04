import express from "express";
import { BusinessController } from "./business.controller";
import { BusinessService } from "./business.service";
import { PrismaClient } from "@prisma/client";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";
import dotenv from "dotenv";
import { businessAccountOnly } from "./business.middleware";
dotenv.config();

const businessRouter = express.Router();

const prismaClient = new PrismaClient();
const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const businessService = new BusinessService(prismaClient);
const businessController = new BusinessController(businessService);
const authMiddleware = new AuthMiddleware(tokenService);

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
businessRouter.put(
  "/setup",
  authMiddleware.authenticate,
  businessAccountOnly,
  (req, res, next) => {
    businessController.businessSetUp(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/business/decode_invite:
 *   post:
 *     summary: Decode and validate a business invite token
 *     description: >
 *       Validates an invite link by decoding the signed token and checks if the invitee already exists in the system,
 *       and then, returns the invite data. This endpoint ensures that only valid and non expired tokens are accepted,
 *       allowing the frontend to pre fill user details during invite acceptance flow.
 *
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
 *                 existingUser:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates whether the email in the invite already exists as a registered user
 *                 inviteData:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "example@gmail.com"
 *                     firstName:
 *                       type: string
 *                       example: "Emmanuel"
 *                     lastName:
 *                       type: string
 *                       example: "Ofoneta"
 *       400:
 *         description: Bad request (invalid token format)
 *       409:
 *         description: Conflict (token invalid or expired)
 *       500:
 *         description: Internal server error
 */
businessRouter.post("/decode_invite", (req, res, next) => {
  businessController.validateInvite(req, res, next);
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
businessRouter.get(
  "/get_members",
  authMiddleware.authenticate,
  businessAccountOnly,
  (req, res, next) => {
    businessController.fetchAllValidMembers(req, res, next);
  }
);

export default businessRouter;
