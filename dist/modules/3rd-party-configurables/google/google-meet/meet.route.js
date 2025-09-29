"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../../../auth/middleware/auth.middleware");
const token_service_1 = require("../../../auth/services/token.service");
const meet_controller_1 = require("./meet.controller");
const meet_service_1 = require("./meet.service");
const meetRouter = express_1.default.Router();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const meetService = new meet_service_1.MeetService();
const meetcontroller = new meet_controller_1.MeetController(meetService);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
/**
 * @swagger
 * /api/v1/integrations/google/meet/connect:
 *   get:
 *     summary: Connect a user's Google Meet account
 *     description: >
 *       Initiates the OAuth2 flow to connect a user's Google account for Google Meet integration.
 *       This allows Scrubbe to create and share Google Meet links for incidents and war rooms.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects the user to Google's OAuth2 consent screen
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to start Google Meet connection process
 */
meetRouter.get("/connect/", authMiddleware.authenticate, (req, res, next) => {
    meetcontroller.connectMeet(req, res, next);
});
/**
 * @swagger
 * /api/v1/integrations/google/meet/oauth/callback:
 *   get:
 *     summary: Google Meet OAuth callback
 *     description: >
 *       Handles the OAuth2 callback from Google, exchanges the authorization code for tokens,
 *       and stores them for the authenticated user. This enables Scrubbe to create meetings
 *       on behalf of the user.
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google OAuth
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID passed during connect initiation
 *     responses:
 *       200:
 *         description: Google Meet account connected successfully
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
 *                   example: Google Meet connected successfully
 *       400:
 *         description: Bad request (missing or invalid code/state)
 *       500:
 *         description: Failed to complete Google Meet OAuth process
 */
meetRouter.get("/oauth/callback", (req, res, next) => {
    meetcontroller.handleOAuthCallback(req, res, next);
});
exports.default = meetRouter;
