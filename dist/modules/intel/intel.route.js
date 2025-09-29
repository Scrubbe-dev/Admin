"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const intel_controller_1 = require("./intel.controller");
const intelRouter = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     IntelResponse:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           intelType:
 *             type: string
 *             description: Type of intelligence data
 *             example: "threat_indicator"
 *           details:
 *             type: string
 *             description: Details of the intelligence
 *             example: "Suspicious IP 192.168.1.2 found in logs"
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
 * /api/v1/tickets/intel/{ticketId}:
 *   get:
 *     summary: Get threat intelligence for a ticket
 *     description: Retrieves all threat intelligence data associated with a specific ticket
 *     tags:
 *       - Ticket Management
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         description: ID of the ticket to retrieve intelligence for
 *         schema:
 *           type: string
 *           example: "12345"
 *     responses:
 *       200:
 *         description: Successfully retrieved ticket intelligence
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
 *                   example: "Intel retrieved successfully"
 *                 data:
 *           $ref: '#/components/schemas/IntelResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Ticket not found
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
intelRouter.get("/tickets/intel/:ticketId", intel_controller_1.TicketController.getTicketIntel);
exports.default = intelRouter;
