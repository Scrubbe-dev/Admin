import express from "express";
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";
import { IncidentController } from "./incident.controller";

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
 *       This endpoint returns all incident tickets assigned to the authenticated user.
 *
 *       Each incident includes details such as template type, assigned user, reason, priority, and timestamps.
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
incidentRouter.get("/", authMiddleware.authenticate, (req, res, next) => {
  incidentController.getIncidentsByUser(req, res, next);
});

/**
 * @swagger
 * /api/v1/incident-ticket:
 *   post:
 *     summary: Create a new incident ticket
 *     description: >
 *       This endpoint allows creating a new incident ticket with required fields like template, reason, priority, assigned user, and username.
 *
 *       The request body must comply with the schema validation (Zod).
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
 *                   example: b1a3e383-deb7-49f0-9c42-b1f6488d2e6f
 *                 template:
 *                   type: string
 *                   enum: [MALWARE, NONE, PHISHING]
 *                   example: NONE
 *                 userName:
 *                   type: string
 *                   example: John Doe
 *                 reason:
 *                   type: string
 *                   example: "Suspicious login detected on multiple accounts"
 *                 priority:
 *                   type: string
 *                   enum: [CRITICAL, HIGH, MEDIUM, LOW, NONE]
 *                   example: HIGH
 *                 assignedTo:
 *                   type: string
 *                   format: email
 *                   example: example@gmail.com
 *                 assignedById:
 *                   type: string
 *                   format: uuid
 *                   example: 83516959-470c-4c01-bdd5-17eb73f675ec
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-02T16:28:23.146Z
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: 2025-08-02T16:28:23.146Z
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized (no valid token provided)
 *       500:
 *         description: Failed to create incident
 */
incidentRouter.post("/", authMiddleware.authenticate, (req, res, next) => {
  incidentController.submitIncident(req, res, next);
});

export default incidentRouter;
