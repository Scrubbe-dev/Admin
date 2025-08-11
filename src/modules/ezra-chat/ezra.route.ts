import express from "express";
import { EzraController } from "./ezra.controller";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { TokenService } from "../auth/services/token.service";
import { EzraService } from "./ezra.service";

const ezraRouter = express.Router();

const prismaClient = new PrismaClient();
const tokenService = new TokenService(
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
 *     summary: Stream summarized incidents with optional CTA actions
 *     description: >
 *       This endpoint uses Ezra AI to interpret a natural language prompt, extract filters (priority and timeframe),
 *       fetch matching incidents assigned to the authenticated user, and stream back a **markdown-formatted summary**.
 *
 *       Ezra may also suggest next steps, such as raising an incident or creating an alert.
 *       If escalation or alerting is appropriate, Ezra will include a plain-text `ACTION:` indicator at the end
 *       (e.g., `ACTION: raise_incident` or `ACTION: alert`).
 *
 *       Ezra can also provide relevant URLs for user actions when requested or contextually appropriate.
 *
 *       Summaries may include **"raise as an incident" links** that, when clicked, pre-fill the incident’s ID, title,
 *       priority, and description into the frontend modal. For High or Critical priority incidents, Ezra may remind
 *       users that these links can be used to escalate directly.
 *
 *       No JSON metadata is returned; responses are strictly plain-text markdown with optional ACTION lines.
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
 *                 description: Natural language query for Ezra to summarize incidents or provide guidance.
 *                 example: "Ezra summarize today's high priority incidents"
 *     responses:
 *       200:
 *         description: Streamed markdown summaries of incidents, optionally including CTA actions
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               example: |
 *                 **Title:** Network outage affecting payment systems
 *                 **Priority:** HIGH
 *                 **Description:** Outage detected at 3 AM impacting payment processing servers.
 *
 *                 [raise as an incident](?modal=true&id=123&title=Network%20outage&priority=HIGH&description=Outage%20detected)
 *
 *                 ---
 *
 *                 **Title:** Firewall misconfiguration
 *                 **Priority:** LOW
 *                 **Description:** Privilege escalation vulnerability in admin portal, under investigation.
 *
 *                 ACTION: raise_incident
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

/**
 * @swagger
 * /api/v1/ezra/incidents/visual_graph:
 *   post:
 *     summary: Generate a visual chart of incidents based on a natural language request
 *     description: >
 *       This endpoint uses Ezra AI to interpret a natural language prompt, extract filters (priority, timeframe, and search terms),
 *       and determine the appropriate visualization type (bar, line, donut, or timeline).
 *       
 *       Ezra responds with a **structured JSON object** containing:
 *       - A `chart` object with metadata (title, labels, timeframe, priority, filters) and chart-ready `data` points.
 *       - A `followUps` field containing a natural-language question for clarification or deeper exploration.
 *       
 *       If the user's prompt is ambiguous (e.g., missing timeframe, unclear metric), `chart` will be `null` but
 *       `followUps` will still be provided to prompt for more details.
 *       
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
 *                 description: Natural language query describing the desired chart and incident criteria.
 *                 example: "Show me a bar chart of all high-severity login fraud incidents in the last 30 days"
 *     responses:
 *       200:
 *         description: JSON containing chart configuration and follow-up question
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - chart
 *                 - followUps
 *               properties:
 *                 chart:
 *                   type: object
 *                   nullable: true
 *                   description: Chart metadata and data points for visualization. Null if prompt was ambiguous.
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [bar, line, donut, timeline]
 *                     title:
 *                       type: string
 *                       description: Human-readable chart title.
 *                     xLabel:
 *                       type: string
 *                     yLabel:
 *                       type: string
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           label:
 *                             type: string
 *                           value:
 *                             type: number
 *                     timeframe:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                         end:
 *                           type: string
 *                           format: date-time
 *                     filters:
 *                       type: array
 *                       items:
 *                         type: string
 *                     priority:
 *                       type: string
 *                       enum: [Low, Medium, High, Critical, null]
 *                 followUps:
 *                   type: string
 *                   description: Clarifying or next-step question for the user.
 *             example:
 *               chart:
 *                 type: bar
 *                 title: "High Severity Login Fraud - Last 30 Days"
 *                 xLabel: "Date"
 *                 yLabel: "Number of Incidents"
 *                 data:
 *                   - label: "2025-07-10"
 *                     value: 4
 *                   - label: "2025-07-11"
 *                     value: 6
 *                 timeframe:
 *                   start: "2025-07-08T00:00:00Z"
 *                   end: "2025-08-08T00:00:00Z"
 *                 filters: ["login", "fraud"]
 *                 priority: "High"
 *               followUps: "Would you like to break this down by region or device type?"
 *       400:
 *         description: Bad request (e.g., missing prompt)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to generate chart visualization
 */
ezraRouter.post(
  "/incidents/visual_graph",
  authMiddleware.authenticate,
  (req, res, next) => ezraController.visualGraph(req, res, next)
);

ezraRouter.post("/rule", authMiddleware.authenticate, (req, res, next) =>
  ezraController.createRuleFromPrompt(req, res, next)
);


export default ezraRouter;
