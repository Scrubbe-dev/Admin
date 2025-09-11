import { Router, Request, Response } from 'express';
import { TicketStatusChangeController } from "./incidentstatus.controllers"
import { createEmailService } from '../auth/services/nodemailer.factory'

const incidentStatusEmail = new TicketStatusChangeController(createEmailService())
const incidentStatusEmailrouter = Router();

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
incidentStatusEmailrouter.post('/incidents/status-email', (req:Request,res:Response)=>incidentStatusEmail.updateTicketStatus(req,res));

export default incidentStatusEmailrouter;