import express from "express";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { TokenService } from "../../auth/services/token.service";
import { EmailIntegrationService } from "./email-integration.service";
import { EmailIntegrationController } from "./email-integration.controller";
import { businessAccountOnly } from "../../business-profile/business.middleware";

const emailRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15
);
const auth = new AuthMiddleware(tokenService);

const emailIntegrationService = new EmailIntegrationService();
const emailIntegrationController = new EmailIntegrationController(
  emailIntegrationService
);

/**
 * @swagger
 * /api/v1/integrations/email/connect:
 *   post:
 *     summary: Configure incident-by-email integration
 *     description: >
 *       Allows a business admin to enable or update their incident email address and authorized senders.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subdomain:
 *                 type: string
 *                 example: apple-inc
 *     responses:
 *       200:
 *         description: Email integration configured
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
emailRouter.post(
  "/connect",
  auth.authenticate,
  businessAccountOnly,
  (req, res, next) =>
    emailIntegrationController.connectEmailIntegration(req, res, next)
);

/**
 * @swagger
 * /api/v1/integrations/email:
 *   get:
 *     summary: Get email integration settings
 *     description: Fetch the configured incident email address and allowed senders.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email integration settings
 *       401:
 *         description: Unauthorized
 */
emailRouter.get("/", auth.authenticate, (req, res, next) =>
  emailIntegrationController.getEmailIntegration(req, res, next)
);

// /**
//  * @swagger
//  * /api/v1/integrations/email/webhook:
//  *   post:
//  *     summary: Inbound email webhook
//  *     description: >
//  *       Endpoint for email provider to send parsed inbound email events.
//  *       The payload should include sender, recipient, subject, body, and attachments.
//  *     tags: [Integrations]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               from:
//  *                 type: string
//  *               to:
//  *                 type: string
//  *               subject:
//  *                 type: string
//  *               body:
//  *                 type: string
//  *               attachments:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     filename:
//  *                       type: string
//  *                     content:
//  *                       type: string
//  *                       description: Base64 encoded file
//  *     responses:
//  *       200:
//  *         description: Email processed successfully
//  */
emailRouter.post("/webhook", express.json({ type: "*/*" }), (req, res, next) =>
  emailIntegrationController.handleInboundEmail(req, res, next)
);

export default emailRouter;
