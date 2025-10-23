import express from "express";
import { TokenService } from "../../auth/services/token.service";
import { WhatsappService } from "./whatsapp.service";
import { WhatsappController } from "./whatsapp.controller";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { mustBeAMember } from "../../business-profile/business.middleware";

const whatsappRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const whatsappService = new WhatsappService();
const whatsappController = new WhatsappController(whatsappService);
const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: 3rd Party Integrations
 */

/**
 * @swagger
 * /api/v1/integrations/whatsapp/connect:
 *   post:
 *     summary: Connect and configure WhatsApp alerts for a business
 *     description: >
 *       This endpoint allows an authenticated business member or owner to configure WhatsApp alerts using Scrubbe's shared Twilio account.
 *       The user can specify recipient phone numbers who will receive automated WhatsApp notifications for incidents.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *               - enabled
 *             properties:
 *               recipients:
 *                 type: array
 *                 description: List of WhatsApp phone numbers (in E.164 format) to receive alerts
 *                 example: ["+15551234567", "+447911123456"]
 *               enabled:
 *                 type: boolean
 *                 description: Whether WhatsApp notifications are enabled for this business
 *                 example: true
 *     responses:
 *       200:
 *         description: WhatsApp integration configured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Connected to WhatsApp
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       403:
 *         description: Forbidden (user is not a member of the business)
 *       500:
 *         description: Failed to connect WhatsApp integration
 */
whatsappRouter.post(
  "/connect",
  authMiddleware.authenticate,
  // mustBeAMember,
  (req, res, next) => {
    whatsappController.connectWhatsapp(req, res, next);
  }
);

export default whatsappRouter;
