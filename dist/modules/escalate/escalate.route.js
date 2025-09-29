"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const escalet_controller_1 = require("./escalet.controller");
const escalateRouter = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     EscalateRequest:
 *       type: object
 *       required:
 *         - escalatedTo
 *       properties:
 *         escalatedTo:
 *           type: string
 *           format: email
 *           description: Email of the user to escalate the ticket to
 *           example: "user@gmail.com"
 *         reason:
 *           type: string
 *           description: Optional reason for escalation
 *           example: "Requires senior analyst review"
 *     EscalateResponse:
 *       type: object
 *       properties:
 *         ticketId:
 *           type: string
 *           description: ID of the escalated ticket
 *           example: "12345"
 *         escalatedTo:
 *           type: string
 *           description: Role of the user the ticket was escalated to
 *           example: "Level 2 Support"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the escalation was performed
 *           example: "2025-08-21T15:10:00Z"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Status of the response
 *           example: "error"
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Ticket not found"
 */
/**
 * @swagger
 * /api/v1/tickets/escalate/{ticketId}:
 *   post:
 *     summary: Escalate a ticket to a higher authority
 *     description: Escalates a ticket to a specified user within the same organization
 *     tags:
 *       - Ticket Management
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         description: ID of the ticket to escalate
 *         schema:
 *           type: string
 *           example: "12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EscalateRequest'
 *     responses:
 *       200:
 *         description: Ticket escalated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Ticket escalated successfully"
 *                 data:
 *           $ref: '#/components/schemas/EscalateResponse'
 *       400:
 *         description: Bad request - Invalid email format or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - User does not have permission to escalate this ticket
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ticket or user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
escalateRouter.post("/tickets/escalate/:ticketId", escalet_controller_1.TicketController.escalateTicket);
exports.default = escalateRouter;
