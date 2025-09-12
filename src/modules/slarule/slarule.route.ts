import { Router } from 'express';
import { SLAController } from './slarule.controller';
// import { authenticate, authorize } from '../middleware/auth'; // Add auth middleware as needed

const slaRouter = Router();
const slaController = new SLAController();

// SLA Management API Documentation
/**
 * @swagger
 * components:
 *   schemas:
 *     SLARule:
 *       type: object
 *       required:
 *         - severity
 *         - responseTimeMinutes
 *         - resolveTimeMinutes
 *       properties:
 *         severity:
 *           type: string
 *           enum: [critical, high, medium, low]
 *           description: Severity level of the incident
 *         responseTimeMinutes:
 *           type: integer
 *           description: Maximum allowed response time in minutes
 *         resolveTimeMinutes:
 *           type: integer
 *           description: Maximum allowed resolution time in minutes
 *     SLADeadlines:
 *       type: object
 *       properties:
 *         respondBy:
 *           type: string
 *           format: date-time
 *           description: Deadline for responding to the incident
 *         resolveBy:
 *           type: string
 *           format: date-time
 *           description: Deadline for resolving the incident
 *     SLAStatusResponse:
 *       type: object
 *       properties:
 *         incidentId:
 *           type: string
 *           description: Unique identifier of the incident
 *         response:
 *           type: object
 *           properties:
 *             deadline:
 *               type: string
 *               format: date-time
 *               description: Response deadline
 *             status:
 *               type: string
 *               enum: [pending, met, breached]
 *               description: Current response status
 *             timeLeft:
 *               type: string
 *               description: Formatted time remaining until deadline
 *         resolution:
 *           type: object
 *           properties:
 *             deadline:
 *               type: string
 *               format: date-time
 *               description: Resolution deadline
 *             status:
 *               type: string
 *               enum: [pending, met, breached]
 *               description: Current resolution status
 *             timeLeft:
 *               type: string
 *               description: Formatted time remaining until deadline
 *     SLABreach:
 *       type: object
 *       properties:
 *         incidentId:
 *           type: string
 *           description: Unique identifier of the incident
 *         slaType:
 *           type: string
 *           enum: [ack, resolve]
 *           description: Type of SLA breach (response or resolution)
 *         breachedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the breach occurred
 *         durationMinutes:
 *           type: integer
 *           description: Duration of the breach in minutes
 */

/**
 * @swagger
 * /incidents/{id}/sla/init:
 *   post:
 *     summary: Initialize SLA for incident
 *     description: Sets response and resolution deadlines for an incident based on its severity level.
 *     operationId: initializeSLA
 *     tags:
 *       - SLA Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - severity
 *             properties:
 *               severity:
 *                 type: string
 *                 enum: [critical, high, medium, low]
 *                 description: Severity level of the incident
 *     responses:
 *       200:
 *         description: SLA initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SLA initialized successfully"
 *                 success:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Incident not found"
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to initialize SLA"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /sla/check-breaches:
 *   get:
 *     summary: Check for SLA breaches
 *     description: Checks all incidents for response and resolution SLA breaches and marks them accordingly.
 *     operationId: checkSLABreaches
 *     tags:
 *       - SLA Management
 *     responses:
 *       200:
 *         description: SLA breaches checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SLA breaches checked"
 *                 breaches:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SLABreach'
 *                 count:
 *                   type: integer
 *                   example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to check SLA breaches"
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /incidents/{id}/sla/status:
 *   get:
 *     summary: Get SLA status for incident
 *     description: Retrieves the current SLA status including response and resolution deadlines and statuses.
 *     operationId: getSLAStatus
 *     tags:
 *       - SLA Management
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the incident
 *     responses:
 *       200:
 *         description: SLA status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SLAStatusResponse'
 *       404:
 *         description: Incident not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Incident not found"
 *                 success:
 *                   type: boolean
 *                   example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get SLA status"
 *                 error:
 *                   type: string
 */
slaRouter.post('/incidents/:id/sla/init',
    //  authenticate, authorize(['admin', 'analyst']), 
  slaController.initializeSLA.bind(slaController));

slaRouter.get('/sla/check-breaches',
    //  authenticate, authorize(['admin']), 
  slaController.checkSLABreaches.bind(slaController));

slaRouter.get('/incidents/:id/sla/status',
    //  authenticate, 
  slaController.getSLAStatus.bind(slaController));

export default slaRouter;