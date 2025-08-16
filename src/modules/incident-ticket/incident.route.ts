import express from "express";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";
import { IncidentController } from "./incident.controller";
import { mustBeAMember } from "../business-profile/business.middleware";

const incidentRouter = express.Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);

const authMiddleware = new AuthMiddleware(tokenService);
const incidentController = new IncidentController();

/**
 * @swagger
 * tags:
 *   name: Incident Tickets
 *   description: Incident Tickets operations
 */

/**
 * @swagger
 /api/v1/incident-ticket:
 *   get:
 *     summary: Retrieve incidents assigned to the authenticated user
 *     description: >
 *       This endpoint returns all incident tickets associated with the authenticated user. You must be a member of the organization be allowed on this route
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of incidents assigned to the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *                   template:
 *                     type: string
 *                     enum: [MALWARE, NONE, PHISHING]
 *                     example: NONE
 *                   userName:
 *                     type: string
 *                     example: John Doe
 *                   reason:
 *                     type: string
 *                     example: "Investigating network anomaly"
 *                   priority:
 *                     type: string
 *                     enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                     example: HIGH
 *                   assignedTo:
 *                     type: string
 *                     format: email
 *                     example: example@gmail.com
 *                   ticketId:
 *                     type: string
 *                     format: email
 *                     example: "INC6932612"
 *                   assignedById:
 *                     type: string
 *                     format: uuid
 *                     example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-08-02T16:28:23.146Z
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-08-02T16:28:23.146Z
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to fetch incidents
 */
incidentRouter.get(
  "/",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getIncidentTicketByBusiness(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket:
 *   post:
 *     summary: Create a new incident ticket
 *     description: >
 *       This endpoint allows creating a new incident ticket with required fields like template, reason, priority, assigned user, and username. You must be a member of the organization be allowed on this route
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *               - reason
 *               - priority
 *               - assignedTo
 *               - username
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [MALWARE, NONE, PHISHING]
 *                 description: Template type for the incident
 *                 example: NONE
 *               reason:
 *                 type: string
 *                 description: Reason for raising the incident (min 10 chars)
 *                 example: "Suspicious login detected on multiple accounts"
 *               priority:
 *                 type: string
 *                 enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                 description: Priority level of the incident
 *                 example: HIGH
 *               assignedTo:
 *                 type: string
 *                 format: email
 *                 description: Email of the person the incident is assigned to
 *                 example: example@gmail.com
 *               username:
 *                 type: string
 *                 description: Name of the user creating the incident
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 51c3e02b-01ca-4a2a-b427-fd6763e126f7
 *                 ticketId:
 *                   type: string
 *                   example: "INC2117208"
 *                 template:
 *                   type: string
 *                   enum: [MALWARE, NONE, PHISHING]
 *                   example: NONE
 *                 slaStatus:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-05T15:59:25.655Z
 *                 recommendedActions:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [LOCK_ACCOUNT, NOTIFY_ANALYST, QUARANTINE, TERMINATE_SESSION]
 *                   example: ["LOCK_ACCOUNT", "TERMINATE_SESSION"]
 *                 riskScore:
 *                   type: number
 *                   example: 20
 *                 userName:
 *                   type: string
 *                   example: Jane doe
 *                 reason:
 *                   type: string
 *                   example: "Different ip address logged in at same time"
 *                 priority:
 *                   type: string
 *                   enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                   example: LOW
 *                 assignedToEmail:
 *                   type: string
 *                   format: email
 *                   example: example@mail.com
 *                 assignedById:
 *                   type: string
 *                   format: uuid
 *                   example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-04T15:59:25.655Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-04T15:59:30.793Z
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to create incident
 */
incidentRouter.post(
  "/",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.submitIncident(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/comment/{incidentTicketId}:
 *   post:
 *     summary: Add a comment to an incident ticket
 *     description: >
 *       This endpoint allows an authenticated business member or owner to add a comment to an existing incident ticket. You must be a member of the organization be allowed on this route
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: The text content of the comment
 *                 example: "What a coincidence, I flagged him yesterday"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: c024a8aa-06c9-4a46-8d12-2a88489042f6
 *                 content:
 *                   type: string
 *                   example: "What a coincidence, I flagged him yesterday"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-05T10:39:59.041Z
 *                 firstname:
 *                   type: string
 *                   example: john
 *                 lastname:
 *                   type: string
 *                   example: doe
 *                 isAdmin:
 *                   type: boolean
 *                   example: false
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       403:
 *         description: Forbidden (user is not a member of the business)
 *       404:
 *         description: Incident ticket or business not found
 *       500:
 *         description: Failed to submit comment
 */
incidentRouter.post(
  "/comment/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.addComment(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/comment/{incidentTicketId}:
 *   get:
 *     summary: Get all comments for an incident ticket
 *     description: >
 *       Fetch all comments associated with a given incident ticket ID.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket
 *     responses:
 *       200:
 *         description: List of comments for the incident ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: c024a8aa-06c9-4a46-8d12-2a88489042f6
 *                   content:
 *                     type: string
 *                     example: "What a coincidence, I flagged him yesterday"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: 2025-08-05T10:39:59.041Z
 *                   firstname:
 *                     type: string
 *                     example: John
 *                   lastname:
 *                     type: string
 *                     example: Doe
 *                   isBusinessOwner:
 *                     type: boolean
 *                     example: false
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       403:
 *         description: Forbidden (user not part of the business)
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to fetch comments
 */
incidentRouter.get(
  "/comment/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getComments(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket:
 *   put:
 *     summary: Update an incident ticket
 *     description: >
 *       This endpoint allows updating an incident ticket. You must be a member of the organization be allowed on this route
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *               - reason
 *               - priority
 *               - assignedTo
 *               - username
 *               - incidentId
 *             properties:
 *               template:
 *                 type: string
 *                 enum: [MALWARE, NONE, PHISHING]
 *                 description: Template type for the incident
 *                 example: NONE
 *               reason:
 *                 type: string
 *                 description: Reason for raising the incident (min 10 chars)
 *                 example: "Suspicious login detected on multiple accounts"
 *               priority:
 *                 type: string
 *                 enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                 description: Priority level of the incident
 *                 example: HIGH
 *               assignedTo:
 *                 type: string
 *                 format: email
 *                 description: Email of the person the incident is assigned to
 *                 example: example@gmail.com
 *               username:
 *                 type: string
 *                 description: Name of the user creating the incident
 *                 example: John Doe
 *               incidentId:
 *                 type: string
 *                 description: Id of the ticket you wish to update
 *                 example: a249f82w-5834-4216-b661-4eda01c4adc8
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   example: 51c3e02b-01ca-4a2a-b427-fd6763e126f7
 *                 ticketId:
 *                   type: string
 *                   example: "INC2117208"
 *                 template:
 *                   type: string
 *                   enum: [MALWARE, NONE, PHISHING]
 *                   example: NONE
 *                 slaStatus:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-05T15:59:25.655Z
 *                 recommendedActions:
 *                   type: array
 *                   items:
 *                     type: string
 *                     enum: [LOCK_ACCOUNT, NOTIFY_ANALYST, QUARANTINE, TERMINATE_SESSION]
 *                   example: ["LOCK_ACCOUNT", "TERMINATE_SESSION"]
 *                 riskScore:
 *                   type: number
 *                   example: 20
 *                 userName:
 *                   type: string
 *                   example: Jane doe
 *                 reason:
 *                   type: string
 *                   example: "Different ip address logged in at same time"
 *                 priority:
 *                   type: string
 *                   enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                   example: LOW
 *                 assignedToEmail:
 *                   type: string
 *                   format: email
 *                   example: example@mail.com
 *                 assignedById:
 *                   type: string
 *                   format: uuid
 *                   example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-04T15:59:25.655Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-04T15:59:30.793Z
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to create incident
 */
incidentRouter.put(
  "/",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.updateTicket(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/analytics:
 *   get:
 *     summary: Get analytics for incident tickets
 *     description: >
 *       Returns the number of incident tickets grouped by their status (Open, On-hold, In-progress, Closed). You must be a member of the organization be allowed on this route
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the business to filter tickets
 *     responses:
 *       200:
 *         description: Analytics data grouped by status
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [OPEN, ON_HOLD, IN_PROGRESS, CLOSED]
 *                     example: OPEN
 *                   count:
 *                     type: integer
 *                     example: 292
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to get analytics
 */
incidentRouter.get(
  "/analytics",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getAnalytics(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/message/{incidentTicketId}:
 *   get:
 *     summary: Get messages for an incident ticket
 *     description: >
 *       Retrieves all messages associated with a conversation tied to the specified incident ticket. You must be a member of the organization to access this route.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket whose messages you want to retrieve
 *     responses:
 *       200:
 *         description: List of messages for the specified incident ticket
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     example: "b72c54e0-6dcb-4cfc-871d-8a2d458234fa"
 *                   conversationId:
 *                     type: string
 *                     format: uuid
 *                     example: "f39a4b10-b012-4b49-a7c5-872abe409721"
 *                   content:
 *                     type: string
 *                     example: "Hey, any update on the issue?"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-08-07T12:34:56.789Z"
 *                   sender:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "a1eec940-98c5-4236-a35d-13ef82ef0f15"
 *                       firstname:
 *                         type: string
 *                         example: "John"
 *                       lastname:
 *                         type: string
 *                         example: "Doe"
 *                       email:
 *                         type: string
 *                         example: "john.doe@example.com"
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       403:
 *         description: Forbidden – user must be a member of the organization
 *       500:
 *         description: Failed to retrieve messages
 */
incidentRouter.get(
  "/message/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getMessages(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/acknowledge/{incidentTicketId}:
 *   post:
 *     summary: Acknowledge an incident ticket
 *     description: >
 *       description: >
 *       Marks the specified incident ticket as acknowledged by setting the `firstAcknowledgedAt` timestamp.
 *       If the SLA target for acknowledgment is breached, a breach log is recorded.
 *       Sends a notification after successful acknowledgment.
 
 *       **WebSocket Notification:** Emits `incidentNotification` event with message: `"Incident ticket was acknowledged"`.
 *       Clients should listen to the `incidentNotification` event in the relevant business room.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to acknowledge
 *     responses:
 *       200:
 *         description: Incident ticket acknowledged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to acknowledge the incident ticket
 */
incidentRouter.post(
  "/acknowledge/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.acknowledgeIncident(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/resolve/{incidentTicketId}:
 *   post:
 *     summary: Resolve an incident ticket
 *     description: >
 *       Marks the specified incident ticket as resolved by setting the `resolvedAt` timestamp and updating its status.
 *       If the SLA target for resolution is breached, a breach log is recorded.
 *       Sends a notification after successful resolution.
 *
 *       **WebSocket Notification:** Emits `incidentNotification` event with message: `"Incident ticket was resolved"`.
 *       Clients should listen to the `incidentNotification` event in the relevant business room.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to resolve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rootCauseAnalysis:
 *                 type: object
 *                 properties:
 *                   causeCategory:
 *                     type: string
 *                   rootCause:
 *                     type: string
 *                   fiveWhys:
 *                     type: object
 *                     properties:
 *                       why1: { type: string }
 *                       why2: { type: string }
 *                       why3: { type: string }
 *                       why4: { type: string }
 *                       why5: { type: string }
 *               resolutionDetails:
 *                 type: object
 *                 properties:
 *                   temporaryFix: { type: string }
 *                   permanentFix: { type: string }
 *               knowledgeDraft:
 *                 type: object
 *                 properties:
 *                   internalKb:
 *                     type: object
 *                     properties:
 *                       title: { type: string }
 *                       summary: { type: string }
 *                       identificationSteps: { type: string }
 *                       resolutionSteps: { type: string }
 *                       preventiveMeasures: { type: string }
 *                       tags:
 *                         type: array
 *                         items: { type: string }
 *               followUpActions:
 *                 type: object
 *                 properties:
 *                   task: { type: string }
 *                   owner: { type: string }
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                   status: { type: string }
 *                   ticketingSystems:
 *                     type: array
 *                     items: { type: string }
 *               stakeHolder:
 *                 type: object
 *                 properties:
 *                   communicationChannel: { type: string }
 *                   targetStakeholders:
 *                     type: array
 *                     items: { type: string }
 *                   messageContent: { type: string }
 *     responses:
 *       200:
 *         description: Incident ticket resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to resolve the incident ticket
 */
incidentRouter.post(
  "/resolve/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.resolveIncident(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/resolve/customer-kb/{incidentTicketId}:
 *   post:
 *     summary: Publish customer facing kb
 *     description: >
 *       Submit Customer facing kb inside post-mortem form
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to resolve
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the customer-facing KB
 *                 example: "Service Outage on 2025-08-16"
 *               summary:
 *                 type: string
 *                 description: Summary of the incident and resolution
 *                 example: "We experienced a temporary outage due to network issues, which has now been resolved."
 *     responses:
 *       200:
 *         description: Incident ticket resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       403:
 *         description: Only business members allowed
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to publish kb
 */
incidentRouter.post(
  "/resolve/customer-kb/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.publishCustomerFacingKb(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/resolve/ai/suggestion/{incidentTicketId}:
 *   get:
 *     summary: Get AI suggestion for an incident ticket
 *     description: >
 *       Generates an AI-powered suggestion for the specified incident ticket.
 *       The suggestion provides a short, actionable recommendation based on the ticket's details.
 *       If no meaningful suggestion can be generated, `suggestion` will be `null`.
 *
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicket
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to analyze
 *     responses:
 *       200:
 *         description: AI suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suggestion:
 *                   type: string
 *                   nullable: true
 *                   example: "Implement stricter input validation and add automated null checks in the transaction processor."
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to generate AI suggestion
 */
incidentRouter.get(
  "/resolve/ai/suggestion/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getAiSuggestion(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/resolve/ai/five-whys/{incidentTicketId}:
 *   get:
 *     summary: Generate 5 Whys analysis for an incident ticket
 *     description: >
 *       Performs an AI-driven "5 Whys" root cause analysis on the specified incident ticket.
 *       Returns exactly 5 progressively deeper why-questions based on the incident details.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicket
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to analyze
 *     responses:
 *       200:
 *         description: 5 Whys analysis generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 why1:
 *                   type: string
 *                   example: "Why did the payment gateway API fail?"
 *                 why2:
 *                   type: string
 *                   example: "Why did the transaction processor throw a null pointer exception?"
 *                 why3:
 *                   type: string
 *                   example: "Why was input validation missing?"
 *                 why4:
 *                   type: string
 *                   example: "Why was the validation layer not implemented?"
 *                 why5:
 *                   type: string
 *                   example: "Why did developers assume client-side validation was sufficient?"
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to generate 5 Whys analysis
 */
incidentRouter.get(
  "/resolve/ai/five-whys/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getFiveWhys(req, res, next);
  }
);

/**
 * @swagger
 * /api/v1/incident-ticket/resolve/ai/stakeholder/{incidentTicketId}:
 *   get:
 *     summary: Generate stakeholder message for an incident ticket
 *     description: >
 *       Produces an AI-generated communication message for stakeholders based on the specified incident ticket.
 *       The message is concise, professional, and non-technical, providing either a resolution update or a current status update.
 *     tags: [Incident Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: incidentTicketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the incident ticket to generate a stakeholder message for
 *     responses:
 *       200:
 *         description: Stakeholder message generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment gateway issue resolved as of August 8, 2025. All services are fully operational."
 *       401:
 *         description: Unauthorized – user must be authenticated
 *       404:
 *         description: Incident ticket not found
 *       500:
 *         description: Failed to generate stakeholder message
 */
incidentRouter.get(
  "/resolve/ai/stakeholder/:incidentTicketId",
  authMiddleware.authenticate,
  mustBeAMember,
  (req, res, next) => {
    incidentController.getStakeHolderMessage(req, res, next);
  }
);

//3rd party interactions (see slack module)
incidentRouter.get("/:ticketId", (req, res, next) => {
  incidentController.getIncidentTicketById(req, res, next);
});

incidentRouter.patch("/:ticketId/close", (req, res, next) => {
  incidentController.closeTicket(req, res, next);
});

export default incidentRouter;
