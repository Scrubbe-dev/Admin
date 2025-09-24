import express from "express";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { TokenService } from "../../auth/services/token.service";
import { GithubService } from "./github.service";
import { GithubController } from "./github.controller";
import { GithubWebhookService } from "./github.webhook";

import dotenv from "dotenv";

dotenv.config();

const githubRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // 15 mins
);
const authMiddleware = new AuthMiddleware(tokenService);

const githubWebhookService = new GithubWebhookService();
const githubService = new GithubService(githubWebhookService);
const githubController = new GithubController(githubService);

/**
 * @swagger
 * /api/v1/integrations/github/connect:
 *   get:
 *     summary: Connect a user's GitHub account
 *     description: >
 *       Initiates the OAuth flow to connect the authenticated user's GitHub account with Scrubbe.
 *       After authentication, GitHub will redirect to the configured callback endpoint.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirect to GitHub OAuth page
 *       401:
 *         description: Unauthorized (no valid token provided)
 */
githubRouter.get("/connect", authMiddleware.authenticate, (req, res, next) => {
  githubController.connectGithub(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: >
 *       Handles the OAuth callback from GitHub, exchanges the code for an access token, and saves the connection in Scrubbe.
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: GitHub OAuth authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: State parameter containing the user ID
 *     responses:
 *       200:
 *         description: GitHub connected successfully
 *       400:
 *         description: Missing or invalid OAuth parameters
 *       500:
 *         description: Failed to connect GitHub
 */
// FIX: Changed from "/callback" to "/callbacks/github" to match your redirect URI
githubRouter.get("/callback", (req, res, next) => {
  githubController.handleOAuthCallback(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/github/repos:
 *   get:
 *     summary: List GitHub repositories for the authenticated user
 *     description: >
 *       Retrieves a list of repositories accessible to the authenticated user from their connected GitHub account.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of repositories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: number
 *                     example: 123456
 *                   name:
 *                     type: string
 *                     example: "my-repo"
 *                   private:
 *                     type: boolean
 *                     example: false
 *                   owner:
 *                     type: string
 *                     example: "username"
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to list repositories
 */
githubRouter.get("/repos", authMiddleware.authenticate, (req, res, next) => {
  githubController.listRepos(req, res, next);
});

/**
 * @swagger
 * /api/v1/integrations/github/repos:
 *   post:
 *     summary: Save monitored GitHub repositories
 *     description: >
 *       Allows an authenticated user to select which repositories Scrubbe should monitor for events that may trigger incidents.
 *       Also registers webhooks on the selected repositories.
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
 *               - assignTo
 *               - repos
 *             properties:
 *               assignTo:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               repos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - name
 *                     - private
 *                     - owner
 *                   properties:
 *                     id:
 *                       type: number
 *                       example: 123456
 *                     name:
 *                       type: string
 *                       example: "my-repo"
 *                     private:
 *                       type: boolean
 *                       example: false
 *                     owner:
 *                       type: string
 *                       example: "username"
 *     responses:
 *       200:
 *         description: Repositories connected successfully
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
 *                   example: "Repositories connected"
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to save monitored repositories
 */
githubRouter.post("/repos", authMiddleware.authenticate, (req, res, next) => {
  githubController.saveMonitoredRepos(req, res, next);
});

// /**
//  * @swagger
//  * /api/v1/integrations/github/webhook:
//  *   post:
//  *     summary: Receive GitHub webhook events
//  *     description: >
//  *       Endpoint for GitHub to send webhook events (deployment_status, workflow_run, push, etc.).
//  *       This is used internally by Scrubbe to trigger incidents automatically from GitHub events.
//  *     tags: [Integrations]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             description: GitHub webhook payload
//  *     responses:
//  *       200:
//  *         description: Webhook received successfully
//  *       401:
//  *         description: Invalid signature
//  *       500:
//  *         description: Failed to process webhook
//  */

githubRouter.post("/webhook", express.json(), (req, res, next) => {
  githubController.handleWebhook(req, res, next);
});
export default githubRouter;
