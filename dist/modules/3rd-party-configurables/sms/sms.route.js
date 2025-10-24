"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const token_service_1 = require("../../auth/services/token.service");
const sms_controller_1 = require("./sms.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const sms_service_1 = require("./sms.service");
const smsRouter = express_1.default.Router();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const smsService = new sms_service_1.SMSService();
const smsController = new sms_controller_1.SMSController(smsService);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
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
smsRouter.post("/connect", 
//  mustBeAMember,
(req, res, next) => {
    smsController.connectSMS(req, res, next);
});
exports.default = smsRouter;
