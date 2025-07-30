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
 *     summary: Stream summarized incidents in markdown with optional priority and timeframe
 *     description: >
 *       This endpoint uses Ezra AI to interpret a natural language prompt, extract filters (priority and timeframe),
 *       fetch matching incidents assigned to the authenticated user, and stream back a markdown-formatted summary.
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
 *         description: Streamed markdown summaries of incidents
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
 *       400:
 *         description: Bad request (e.g., missing prompt)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       404:
 *         description: No incidents found for given filters
 *       500:
 *         description: Failed to summarize incidents
 */
ezraRouter.post(
  "/incidents/summary",
  // authMiddleware.authenticate,
  (req, res, next) => ezraController.summarizeIncidents(req, res, next)
);

ezraRouter.post("/rule", authMiddleware.authenticate, (req, res, next) =>
  ezraController.createRuleFromPrompt(req, res, next)
);

export default ezraRouter;
