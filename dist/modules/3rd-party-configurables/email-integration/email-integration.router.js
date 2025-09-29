"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const token_service_1 = require("../../auth/services/token.service");
const email_integration_service_1 = require("./email-integration.service");
const email_integration_controller_1 = require("./email-integration.controller");
const business_middleware_1 = require("../../business-profile/business.middleware");
const emailRouter = express_1.default.Router();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15);
const auth = new auth_middleware_1.AuthMiddleware(tokenService);
const emailIntegrationService = new email_integration_service_1.EmailIntegrationService();
const emailIntegrationController = new email_integration_controller_1.EmailIntegrationController(emailIntegrationService);
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
emailRouter.post("/connect", auth.authenticate, business_middleware_1.businessAccountOnly, (req, res, next) => emailIntegrationController.connectEmailIntegration(req, res, next));
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
emailRouter.get("/", auth.authenticate, business_middleware_1.mustBeAMember, (req, res, next) => emailIntegrationController.getEmailIntegration(req, res, next));
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
emailRouter.post("/webhook", express_1.default.json({ type: "*/*" }), (req, res, next) => emailIntegrationController.handleInboundEmail(req, res, next));
exports.default = emailRouter;
