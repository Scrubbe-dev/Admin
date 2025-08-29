import { Router, Request, Response, NextFunction } from "express";
import { TicketController } from "./controller";
import { TokenService } from "../auth/services/token.service";
import { mustBeAMember } from "../business-profile/business.middleware";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";

const ticketRouter = Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const authMiddleware = new AuthMiddleware(tokenService);

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Ticket management operations
 */

/**
 * @swagger
 * /api/v1/tickets/{ticketId}:
 *   get:
 *     summary: Retrieve ticket details by ID
 *     description: >
 *       This endpoint returns structured ticket information including reason, user details, priority, status,
 *       assignment information, scoring metrics, timestamps, recommended actions, and business identifiers.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the ticket
 *         example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *                 ticketId:
 *                   type: string
 *                   format: uuid
 *                   example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *                 reason:
 *                   type: string
 *                   example: "Payment gateway API failure causing transaction timeouts"
 *                 userName:
 *                   type: string
 *                   example: "security-alerts"
 *                 priority:
 *                   type: string
 *                   enum: ["HIGH", "MEDIUM", "LOW"]
 *                   example: "HIGH"
 *                 status:
 *                   type: string
 *                   enum: ["OPEN", "CLOSED", "in-progress", "on-hold"]
 *                   example: "in-progress"
 *                 assignedToEmail:
 *                   type: string
 *                   format: email
 *                   example: "analyst@company.com"
 *                 score:
 *                   type: number
 *                   example: 85
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-08-21T14:20:00Z"
 *                 recommendedActions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Review system logs", "Check network connectivity", "Verify API endpoints"]
 *                 riskScore:
 *                   type: number
 *                   example: 92
 *                 businessId:
 *                   type: string
 *                   format: uuid
 *                   example: "c35e02b-01ca-4a2a-b427-fd6763e126f7"
 *                 slaStatus:
 *                   type: string
 *                   example: "BREACHED"
 *                 template:
 *                   type: string
 *                   example: "PHISHING"
 *       404:
 *         description: Ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Ticket not found"
 *       500:
 *         description: Failed to fetch ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
ticketRouter.get(
  "/tickets/:ticketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req: Request<{ ticketId: string }>, res: Response, next: NextFunction) => {
    TicketController.getTicketDetail(req, res).catch(next);
  }
);

/**
 * @swagger
 * /api/v1/tickets/history/{ticketId}:
 *   get:
 *     summary: Retrieve ticket history
 *     description: >
 *       This endpoint returns the complete history of a specific ticket including status changes,
 *       comments added, and other relevant timeline events.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the ticket to retrieve history for
 *         example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *     responses:
 *       200:
 *         description: Ticket history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketId:
 *                   type: string
 *                   format: uuid
 *                   example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-21T14:20:00Z
 *                       action:
 *                         type: string
 *                         enum: [status_changed, comment_added, assigned, escalated, resolved]
 *                         example: status_changed
 *                       oldValue:
 *                         type: string
 *                         example: Open
 *                       newValue:
 *                         type: string
 *                         example: In Progress
 *                       actor:
 *                         type: string
 *                         example: agent_1
 *                       comment:
 *                         type: string
 *                         example: "Investigating root cause"
 *       404:
 *         description: Ticket history not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Ticket history not found"
 *       500:
 *         description: Failed to fetch ticket history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */
import { TicketParams } from "./types";

ticketRouter.get("/tickets/history/:ticketId",
  authMiddleware.authenticate,
  mustBeAMember,
   (req: Request<{ ticketId: string }>, res: Response, next: NextFunction) => {
  TicketController.getTicketHistory(req, res).catch(next);
});

export default ticketRouter;
