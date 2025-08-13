import express from "express";
import { TokenService } from "../../auth/services/token.service";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { verifySlackSignature } from "./slack.middleware";
import { SlackService } from "./slack.service";
import { SlackController } from "./slack.controller";

const slackRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const slackService = new SlackService();
const slackController = new SlackController(slackService);
const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * /api/v1/integrations/slack/connect:
 *   get:
 *     summary: Connect a user's Slack account
 *     description: >
 *       Initiates the OAuth2 flow to connect a user's Slack workspace.
 *       Once connected, Scrubbe can send incident updates to configured channels
 *       and respond to slash commands.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirects the user to Slack's OAuth2 consent screen
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to start Slack connection process
 */
slackRouter.get("/connect", authMiddleware.authenticate, (req, res, next) => {
  slackController.connectSlack(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/slack/oauth/callback:
 *   get:
 *     summary: Slack OAuth callback
 *     description: >
 *       Handles the OAuth2 callback from Slack, exchanges the authorization code for tokens,
 *       and stores them for the authenticated user. This enables Scrubbe to send messages
 *       and perform Slack actions on behalf of the user.
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Slack OAuth
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID passed during connect initiation
 *     responses:
 *       200:
 *         description: Slack workspace connected successfully
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
 *                   example: Slack connected successfully! You can now set your default channel.
 *       400:
 *         description: Bad request (missing or invalid code/state)
 *       500:
 *         description: Failed to complete Slack OAuth process
 */
slackRouter.get(
  "/oauth/callback",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.exchangeCodeForToken(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/integrations/slack/channels:
 *   get:
 *     summary: Get user's available Slack channels
 *     description: >
 *       Retrieves a list of Slack channels from the connected workspace so the user
 *       can choose a default channel for incident notifications.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of Slack channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: C0123456789
 *                   name:
 *                     type: string
 *                     example: general
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch channels
 */
slackRouter.get("/channels", authMiddleware.authenticate, (req, res, next) => {
  slackController.getUserDefaultChannels(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/slack/default-channel:
 *   post:
 *     summary: Set the default Slack channel for notifications
 *     description: >
 *       Sets a specific Slack channel as the default target for incident notifications
 *       sent by Scrubbe.
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
 *               - channelId
 *             properties:
 *               channelId:
 *                 type: string
 *                 example: C0123456789
 *     responses:
 *       200:
 *         description: Default channel set successfully
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
 *                   example: Default Slack channel set
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to set default channel
 */
slackRouter.post(
  "/default-channel",
  authMiddleware.authenticate,
  (req, res, next) => {
    slackController.submitDefaultChannel(req, res, next);
  }
);

slackRouter.post(
  "/commands",
  express.urlencoded({ extended: true }),
  (req, res, next) => slackController.handleSlashCommand(req, res, next)
);

export default slackRouter;
