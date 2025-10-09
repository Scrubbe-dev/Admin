"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incidentstatus_controllers_1 = require("./incidentstatus.controllers");
const resend_no_nodemailer_factory_1 = require("../auth/services/resend-no-nodemailer.factory");
const incidentStatusEmail = new incidentstatus_controllers_1.TicketStatusChangeController((0, resend_no_nodemailer_factory_1.createEmailServiceWithResend)());
const incidentStatusEmailrouter = (0, express_1.Router)();
/**
 * @swagger
 * /api/v1/incidents/status-email:
 *   post:
 *     summary: Update incident ticket status and notify assignee
 *     description: Updates the status of an incident ticket and sends a notification email to the assignee
 *     tags: [Incidents]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the incident ticket to update
 *               newStatus:
 *                 type: string
 *                 enum: [OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD, INVESTIGATION, MITIGATED]
 *                 description: The new status to set for the ticket
 *     responses:
 *       200:
 *         description: Ticket status updated successfully and notification sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ticket status updated and notification sent"
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Internal server error
 */
incidentStatusEmailrouter.post('/incidents/status-email', (req, res) => incidentStatusEmail.updateTicketStatus(req, res));
exports.default = incidentStatusEmailrouter;
