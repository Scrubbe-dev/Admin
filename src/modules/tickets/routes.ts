import { Router, Request, Response, NextFunction } from 'express';
import { TicketController } from './controller';

const ticketRouter = Router();

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
 *       This endpoint returns detailed information about a specific ticket including its status, priority,
 *       assignee, customer information, business details, and associated comments.
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the ticket to retrieve
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
 *                 title:
 *                   type: string
 *                   example: "Payment Gateway API Failure"
 *                 description:
 *                   type: string
 *                   example: "Payment gateway API returned 500 errors due to unhandled null pointer"
 *                 status:
 *                   type: string
 *                   enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD]
 *                   example: IN_PROGRESS
 *                 priority:
 *                   type: string
 *                   enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                   example: HIGH
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-21T14:20:00Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-21T15:00:00Z
 *                 assignee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: john.doe@example.com
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: a249f82w-5834-4216-b661-4eda01c4adc8
 *                     name:
 *                       type: string
 *                       example: Acme Corporation
 *                     contactEmail:
 *                       type: string
 *                       format: email
 *                       example: contact@acme.com
 *                 business:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: c35e02b-01ca-4a2a-b427-fd6763e126f7
 *                     name:
 *                       type: string
 *                       example: Tech Solutions Inc.
 *                 conversationId:
 *                   type: string
 *                   format: uuid
 *                   example: f39a4b10-b012-4b49-a7c5-872abe409721
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: c024a8aa-06c9-4a46-8d12-2a88489042f6
 *                       content:
 *                         type: string
 *                         example: "Investigating root cause"
 *                       isInternal:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2025-08-21T15:00:00Z
 *                       author:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                           name:
 *                             type: string
 *                             example: Jane Smith
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: jane.smith@example.com
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
ticketRouter.get('/tickets/:ticketId', (req, res, next) => {
  TicketController.getTicketDetail(req, res).catch(next);
});

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
ticketRouter.get('/tickets/history/:ticketId', (req, res, next) => {
  TicketController.getTicketHistory(req, res).catch(next);
});

export default ticketRouter;