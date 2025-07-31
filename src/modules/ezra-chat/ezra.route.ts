import express from "express";
import { EzraController } from "./ezra.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { TokenService } from "../auth/services/token.service";
import { EzraService } from "./ezra.service";

const ezraRouter = express.Router();

const prismaClient = new PrismaClient();
const tokenService = new TokenService(
  prismaClient,
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const ezraService = new EzraService(prismaClient);
const ezraController = new EzraController(ezraService);
const authMiddleware = new AuthMiddleware(tokenService);
/**
 * @swagger
 * tags:
 *   name: Ezra
 *   description: Ezra AI operations
 */

/**
 * @swagger
 * /api/v1/ezra/incidents/summary:
 *   post:
 *     summary: Stream summarized incidents with optional CTA metadata
 *     description: >
 *       This endpoint uses Ezra AI to interpret a natural language prompt, extract filters (priority and timeframe),
 *       fetch matching incidents assigned to the authenticated user, and stream back a **markdown-formatted summary**.
 *
 *       If the user previously confirmed a suggestion (e.g., agreed to raise or report an incident),
 *       the response will include stringified JSON metadata at the end of the stream to signal a frontend
 *       call to action (e.g., rendering a "Raise Incident" button).
 *     tags: [Ezra]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: Natural language query for Ezra to summarize incidents.
 *                 example: "Ezra summarize today's high priority incidents"
 *     responses:
 *       200:
 *         description: Streamed markdown summaries of incidents followed optionally by CTA metadata
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 **Title:** Network outage affecting payment systems
 *                 **Priority:** HIGH
 *                 **Description:** Outage detected at 3 AM impacting payment processing servers.
 *
 *                 ---
 *
 *                 **Title:** Firewall misconfiguration
 *                 **Priority:** LOW
 *                 **Description:** Privilege escalation vulnerability in admin portal, under investigation.
 *
 *                 {"actions":[{"type":"button","label":"Raise Incident"}]}
 *       400:
 *         description: Bad request (e.g., missing prompt)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to summarize incidents
 */
ezraRouter.post(
  "/incidents/summary",
  authMiddleware.authenticate,
  (req, res, next) => ezraController.summarizeIncidents(req, res, next)
);

ezraRouter.post("/rule", authMiddleware.authenticate, (req, res, next) =>
  ezraController.createRuleFromPrompt(req, res, next)
);

/**
 * @swagger
 * /api/v1/ezra/reset-chat:
 *   post:
 *     summary: Clear Ezra AI conversation history for the current user
 *     description: >
 *       This endpoint clears the in-memory conversation history for the authenticated user.
 *       Use this when you want to start a fresh conversation with Ezra without previous context.
 *     tags: [Ezra]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversation history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to clear conversation history
 */
ezraRouter.post(
  "/reset-chat",
  authMiddleware.authenticate,
  (req, res, next) => {
    ezraController.clearConversation(req, res, next);
  }
);

export default ezraRouter;
