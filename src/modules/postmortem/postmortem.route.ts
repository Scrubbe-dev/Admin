import { Router, Response ,Request } from 'express';
import { PostmortemController } from './postmortem.controller';
const postmortemRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     IncidentTicketWithPostmortem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the incident ticket
 *         ticketId:
 *           type: string
 *           description: Human-readable ticket ID
 *         status:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD, ACKNOWLEDGED, INVESTIGATION, MITIGATED]
 *           description: Status of the incident ticket
 *         priority:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL, INFORMATIONAL]
 *           description: Priority of the incident ticket
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the incident ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the incident ticket was last updated
 *         ResolveIncident:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Unique identifier for the postmortem record
 *             causeCategory:
 *               type: string
 *               enum: [SOFTWARE_BUG, NETWORK_ISSUE, HUMAN_ERROR, DATA_BREACH]
 *               description: Root cause category
 *             rootCause:
 *               type: string
 *               description: Detailed root cause analysis
 *             why1:
 *               type: string
 *               description: First level of why analysis
 *             why2:
 *               type: string
 *               description: Second level of why analysis
 *             why3:
 *               type: string
 *               description: Third level of why analysis
 *             why4:
 *               type: string
 *               description: Fourth level of why analysis
 *             why5:
 *               type: string
 *               description: Fifth level of why analysis
 *             temporaryFix:
 *               type: string
 *               description: Temporary solution implemented
 *             permanentFix:
 *               type: string
 *               description: Permanent solution planned
 *             followUpTask:
 *               type: string
 *               description: Task assigned for follow-up
 *             followUpOwner:
 *               type: string
 *               description: Owner of the follow-up task
 *             followUpDueDate:
 *               type: string
 *               format: date-time
 *               description: Due date for the follow-up task
 *             followUpStatus:
 *               type: string
 *               enum: [NOT_STARTED, IN_PROGRESS, COMPLETED, DEALT_WITH]
 *               description: Status of the follow-up task
 *             communicationChannel:
 *               type: string
 *               enum: [EMAIL, SLACK, PUBLIC_ANNOUNCEMENT, CUSTOMER_PORTAL]
 *               description: Communication channel used
 *             targetStakeholders:
 *               type: array
 *               items:
 *                 type: string
 *               description: Stakeholders who received communication
 *             messageContent:
 *               type: string
 *               description: Content of the communication message
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the postmortem was created
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the postmortem was last updated
 *         Incident:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: Unique identifier for the incident
 *             title:
 *               type: string
 *               description: Title of the incident
 *             description:
 *               type: string
 *               description: Description of the incident
 *             status:
 *               type: string
 *               enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD, ACKNOWLEDGED, INVESTIGATION, MITIGATED]
 *               description: Status of the incident
 *             priority:
 *               type: string
 *               enum: [LOW, MEDIUM, HIGH, CRITICAL, INFORMATIONAL]
 *               description: Priority of the incident
 *             createdAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the incident was created
 *             updatedAt:
 *               type: string
 *               format: date-time
 *               description: Timestamp when the incident was last updated
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
 *           example: "No postmortems found"
 */

/**
 * @swagger
 * /api/v1/postmortems:
 *   get:
 *     summary: Retrieve incident tickets with postmortems
 *     description: Fetches incident tickets that have postmortem records with optional filtering by status, priority, and date range
 *     tags:
 *       - Postmortem Management
 *     parameters:
 *       - name: incidentId
 *         in: query
 *         required: false
 *         description: Filter by incident ticket ID
 *         schema:
 *           type: string
 *           example: "it-12345"
 *       - name: status
 *         in: query
 *         required: false
 *         description: Filter by incident ticket status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED, ON_HOLD, ACKNOWLEDGED, INVESTIGATION, MITIGATED]
 *           example: "RESOLVED"
 *       - name: priority
 *         in: query
 *         required: false
 *         description: Filter by incident ticket priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL, INFORMATIONAL]
 *           example: "HIGH"
 *       - name: startDate
 *         in: query
 *         required: false
 *         description: Start date for filtering (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2023-01-01T00:00:00Z"
 *       - name: endDate
 *         in: query
 *         required: false
 *         description: End date for filtering (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2023-12-31T23:59:59Z"
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: sortBy
 *         in: query
 *         required: false
 *         description: Field to sort by
 *         schema:
 *           type: string
 *           enum: [createdAt, priority, status, ticketId]
 *           example: "createdAt"
 *       - name: sortOrder
 *         in: query
 *         required: false
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           example: "desc"
 *     responses:
 *       200:
 *         description: Successfully retrieved incident tickets with postmortems
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
 *                   example: "Postmortems retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IncidentTicketWithPostmortem'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     count:
 *                       type: integer
 *                       example: 25
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No postmortems found matching criteria
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
postmortemRouter.get('/postmortems',(req:Request, res:Response)=> PostmortemController.getPostmortems(req,res));
export default postmortemRouter;