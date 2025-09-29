"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const token_service_1 = require("../auth/services/token.service");
// import { mustBeAMember } from "../business-profile/business.middleware";
const auth_middleware_1 = require("../auth/middleware/auth.middleware");
const ticketRouter = (0, express_1.Router)();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
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
ticketRouter.get("/tickets/:ticketId", authMiddleware.authenticate, 
// mustBeAMember,
(req, res, next) => {
    controller_1.TicketController.getTicketDetail(req, res).catch(next);
});
ticketRouter.get("/tickets/history/:ticketId", authMiddleware.authenticate, 
// mustBeAMember,
(req, res, next) => {
    controller_1.TicketController.getTicketHistory(req, res).catch(next);
});
exports.default = ticketRouter;
