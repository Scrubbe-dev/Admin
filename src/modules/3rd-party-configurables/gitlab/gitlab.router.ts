import express from "express";
import { AuthMiddleware } from "../../auth/middleware/auth.middleware";
import { TokenService } from "../../auth/services/token.service";
import { GitlabService } from "./gitlab.service";
import { GitlabController } from "./gitlab.controller";
import dotenv from "dotenv";

dotenv.config();

const gitlabRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15
);
const auth = new AuthMiddleware(tokenService);

const gitlabService = new GitlabService();
const gitlabController = new GitlabController(gitlabService);

/**
 * @swagger
 * /api/v1/integrations/gitlab/connect:
 *   get:
 *     summary: Connect a user's Gitlab account
 *     description: >
 *       Initiates the OAuth flow to connect the authenticated user's Gitlab account with Scrubbe.
 *       After authentication, Gitlab will redirect to the configured callback endpoint.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       302:
 *         description: Redirect to Gitlab OAuth page
 *       401:
 *         description: Unauthorized (no valid token provided)
 */
gitlabRouter.get("/connect", auth.authenticate, (req, res, next) =>
  gitlabController.connectGitlab(req, res, next)
);

/**
 * @swagger
 * /api/v1/integrations/gitlab/callback:
 *   get:
 *     summary: GitLab OAuth callback
 *     description: >
 *       Handles the OAuth callback from GitLab and exchanges the authorization code for access/refresh tokens.
 *     tags: [Integrations]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned by GitLab OAuth
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID passed as the `state` parameter during connect
 *     responses:
 *       200:
 *         description: GitLab account connected successfully
 *       400:
 *         description: Missing or invalid parameters
 */
gitlabRouter.get("/callback", (req, res, next) =>
  gitlabController.handleOAuthCallback(req, res, next)
);

/**
 * @swagger
 * /api/v1/integrations/gitlab/projects:
 *   get:
 *     summary: List GitLab projects for the authenticated user
 *     description: >
 *       Retrieves all GitLab projects that the authenticated user has access to via the connected GitLab account.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of GitLab projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   path_with_namespace:
 *                     type: string
 *                   visibility:
 *                     type: string
 *       401:
 *         description: Unauthorized (no valid token provided)
 */
gitlabRouter.get("/projects", auth.authenticate, (req, res, next) =>
  gitlabController.listProjects(req, res, next)
);

/**
 * @swagger
 * /api/v1/integrations/gitlab/projects:
 *   post:
 *     summary: Save monitored GitLab projects
 *     description: >
 *       Saves a list of GitLab projects to monitor for events (push, merge requests, pipeline failures, etc.).
 *       Also registers webhooks on those projects to receive events.
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
 *               assignTo:
 *                 type: string
 *                 description: Email address to assign incidents to
 *               repos:
 *                 type: array
 *                 description: List of repositories to monitor
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     path_with_namespace:
 *                       type: string
 *     responses:
 *       200:
 *         description: Projects connected successfully
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized (no valid token provided)
 */
gitlabRouter.post("/projects", auth.authenticate, (req, res, next) =>
  gitlabController.saveMonitoredProjects(req, res, next)
);

// /**
//  * @swagger
//  * /api/v1/integrations/gitlab/webhook:
//  *   post:
//  *     summary: GitLab webhook receiver
//  *     description: >
//  *       Receives webhook events from GitLab for the monitored projects (e.g., pipeline failures, merge requests).
//  *     tags: [Integrations]
//  *     parameters:
//  *       - in: query
//  *         name: userId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: User ID that owns the GitLab integration
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             description: The GitLab event payload
//  *     responses:
//  *       200:
//  *         description: Webhook processed successfully
//  *       401:
//  *         description: Invalid webhook token
//  */
gitlabRouter.post("/webhook", express.json({ type: "*/*" }), (req, res, next) =>
  gitlabController.handleWebhook(req, res, next)
);

export default gitlabRouter;
