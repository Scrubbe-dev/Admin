"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/playbookRoutes.ts
const express_1 = require("express");
const playbook_controller_1 = require("./playbook.controller");
const playbookRouter = (0, express_1.Router)();
/**
 * @swagger
 * components:
 *   schemas:
 *     PlaybookResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID of the playbook
 *           example: "pb_001"
 *         title:
 *           type: string
 *           description: Title of the playbook
 *           example: "Investigate Malware"
 *         steps:
 *           type: array
 *           description: Steps of the playbook
 *           items:
 *             type: string
 *           example: ["Collect logs", "Scan system", "Quarantine files"]
 *         recommended:
 *           type: boolean
 *           description: Whether the playbook is recommended for this ticket
 *           example: true
 *     RecommendedPlaybooksResponse:
 *       type: object
 *       properties:
 *         ticketId:
 *           type: string
 *           description: ID of the ticket
 *           example: "12345"
 *         playbooks:
 *           type: array
 *           description: List of recommended playbooks
 *           items:
 *             $ref: '#/components/schemas/PlaybookResponse'
 */
/**
 * @swagger
 * /api/v1/tickets/playbooks/{ticketId}:
 *   post:
 *     summary: Get recommended playbooks for a ticket
 *     description: Retrieves all recommended playbooks for a specific ticket. Optionally generates new recommendations based on ticket attributes.
 *     tags:
 *       - Ticket Management
 *     parameters:
 *       - name: ticketId
 *         in: path
 *         required: true
 *         description: ID of the ticket to get playbooks for
 *         schema:
 *           type: string
 *           example: "12345"
 *       - name: generate
 *         in: query
 *         required: false
 *         description: Set to 'true' to generate new recommendations based on ticket attributes
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           example: "false"
 *     responses:
 *       200:
 *         description: Successfully retrieved recommended playbooks
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
 *                   example: "Recommended playbooks retrieved successfully"
 *                 data:
 *           $ref: '#/components/schemas/RecommendedPlaybooksResponse'
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
playbookRouter.post('/tickets/playbooks/:ticketId', playbook_controller_1.PlaybookController.getRecommendedPlaybooks);
exports.default = playbookRouter;
