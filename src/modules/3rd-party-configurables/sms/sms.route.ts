import express from "express";
import { TokenService } from "../../auth/services/token.service";
import { SMSController } from "./sms.controller";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { SMSService } from "./sms.service";
import { mustBeAMember } from "../../business-profile/business.middleware";

const smsRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const smsService = new SMSService();
const smsController = new SMSController(smsService);
const authMiddleware = new AuthMiddleware(tokenService);

smsRouter.use(authMiddleware.authenticate);

/**
 * @swagger
 * /api/v1/integrations/sms/connect:
 *   post:
 *     summary: Connect and configure SMS alerts for a business
 *     description: >
 *       This endpoint allows an authenticated business member or owner to configure SMS alerts using Scrubbe's shared Twilio account.
 *       The user can specify recipient phone numbers who will receive automated SMS notifications for incidents.
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
 *                 description: List of SMS phone numbers (in E.164 format) to receive alerts
 *                 example: ["+15551234567", "+447911123456"]
 *               enabled:
 *                 type: boolean
 *                 description: Whether SMS notifications are enabled for this business
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
 *                   example: Connected to SMS
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       403:
 *         description: Forbidden (user is not a member of the business)
 *       500:
 *         description: Failed to connect SMS integration
 */
smsRouter.post("/connect", mustBeAMember, (req, res, next) => {
  smsController.connectSMS(req, res, next);
});

export default smsRouter;
