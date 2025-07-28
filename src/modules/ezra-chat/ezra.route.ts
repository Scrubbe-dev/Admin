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
 *     summary: Summarize user-assigned incidents with optional priority and timeframe
 *     description: >
 *       This endpoint uses **Ezra AI** to interpret a natural language prompt, extract filters (priority and timeframe),
 *       fetch matching incidents assigned to the authenticated user, and return an AI-generated summary of those incidents.
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
 *         description: Summarized incidents based on interpreted filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summaries:
 *                   type: array
 *                   description: AI-generated summaries of incidents
 *                   items:
 *                     type: object
 *                     properties:
 *                       incident:
 *                         type: string
 *                         example: "Network outage affecting payment systems"
 *                       priority:
 *                         type: string
 *                         example: "HIGH"
 *                       status:
 *                         type: string
 *                         example: "OPEN"
 *                       description:
 *                         type: string
 *                         example: "Outage detected at 3 AM impacting all payment processing servers."
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
  authMiddleware.authenticate,
  (req, res, next) => ezraController.summarizeIncidents(req, res, next)
);

ezraRouter.post("/rule", authMiddleware.authenticate, (req, res, next) =>
  ezraController.createRuleFromPrompt(req, res, next)
);

export default ezraRouter;
