"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerIncidentRoutes = void 0;
// customerIncidentRoutes.ts
const express_1 = require("express");
const customerIncidentController_1 = require("../controllers/customerIncidentController");
const customerMiddleware_1 = require("../middleware/customerMiddleware");
const router = (0, express_1.Router)();
exports.customerIncidentRoutes = router;
/**
 * @swagger
 * components:
 *   schemas:
 *     Incident:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "inc_12345"
 *         ticketNumber:
 *           type: string
 *           example: "CUST-1649044800-ABC123"
 *         shortDescription:
 *           type: string
 *           example: "Suspicious Email Report"
 *         description:
 *           type: string
 *           example: "Received a phishing email attempting to get credentials"
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High, Critical]
 *           example: "High"
 *         category:
 *           type: string
 *           example: "Phishing"
 *         status:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *           example: "OPEN"
 *         customerId:
 *           type: string
 *           example: "cust_12345"
 *         companyUserId:
 *           type: string
 *           example: "user_67890"
 *         businessId:
 *           type: string
 *           example: "biz_54321"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T15:30:45Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T16:45:30Z"
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-05T10:15:22Z"
 *         closedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-05T11:30:45Z"
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         comments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 *         attachments:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Attachment'
 *         _count:
 *           type: object
 *           properties:
 *             comments:
 *               type: integer
 *               example: 3
 *             attachments:
 *               type: integer
 *               example: 2
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "comm_12345"
 *         content:
 *           type: string
 *           example: "We have investigated and confirmed this is a phishing attempt"
 *         authorType:
 *           type: string
 *           enum: [CUSTOMER, USER]
 *           example: "USER"
 *         authorId:
 *           type: string
 *           example: "user_67890"
 *         isInternal:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T16:45:30Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T16:45:30Z"
 *     Attachment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "att_12345"
 *         filename:
 *           type: string
 *           example: "email.eml"
 *         originalName:
 *           type: string
 *           example: "suspicious_email.eml"
 *         mimeType:
 *           type: string
 *           example: "message/rfc822"
 *         size:
 *           type: integer
 *           example: 25600
 *         path:
 *           type: string
 *           example: "/uploads/att_12345.eml"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-04-04T15:30:45Z"
 *     IncidentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Incident created successfully"
 *         data:
 *           $ref: '#/components/schemas/Incident'
 *     IncidentsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Incidents retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             incidents:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Incident'
 *             total:
 *               type: integer
 *               example: 5
 *             page:
 *               type: integer
 *               example: 1
 *             totalPages:
 *               type: integer
 *               example: 1
 *     CommentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Comment added successfully"
 *         data:
 *           $ref: '#/components/schemas/Comment'
 */
/**
 * @swagger
 * /api/v1/customer/create-incident:
 *   post:
 *     summary: Create a new security incident
 *     description: Report a new security incident for investigation
 *     tags:
 *       - Customer Incidents
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shortDescription
 *               - description
 *               - priority
 *               - category
 *             properties:
 *               shortDescription:
 *                 type: string
 *                 example: "Suspicious Email Report"
 *               description:
 *                 type: string
 *                 example: "Received a phishing email attempting to get credentials"
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High, Critical]
 *                 example: "High"
 *               category:
 *                 type: string
 *                 example: "Phishing"
 *     responses:
 *       201:
 *         description: Incident created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentResponse'
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
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
router.post("/create-incident", (req, res, next) => {
    (0, customerMiddleware_1.authenticateCustomer)(req, res, next);
}, customerIncidentController_1.CustomerIncidentController.createIncident);
/**
 * @swagger
 * /api/v1/customer/get-incidents:
 *   get:
 *     summary: Get customer incidents
 *     description: Retrieve all incidents reported by the authenticated customer
 *     tags:
 *       - Customer Incidents
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of incidents per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *         description: Filter incidents by status
 *     responses:
 *       200:
 *         description: Successfully retrieved incidents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentsListResponse'
 *       401:
 *         description: Unauthorized - authentication required
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
router.get("/get-incidents", (req, res, next) => {
    (0, customerMiddleware_1.authenticateCustomer)(req, res, next);
}, customerIncidentController_1.CustomerIncidentController.getIncidents);
/**
 * @swagger
 * /api/v1/customer/get-incident/{incidentId}:
 *   get:
 *     summary: Get incident details
 *     description: Retrieve detailed information about a specific incident
 *     tags:
 *       - Customer Incidents
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the incident to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved incident details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IncidentResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found - incident does not exist
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
router.get("/get-incident/:incidentId", (req, res, next) => {
    (0, customerMiddleware_1.authenticateCustomer)(req, res, next);
}, customerIncidentController_1.CustomerIncidentController.getIncident);
/**
 * @swagger
 * /api/v1/customer/{incidentId}/comments:
 *   post:
 *     summary: Add comment to incident
 *     description: Add a new comment to an existing incident
 *     tags:
 *       - Customer Incidents
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: incidentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the incident to comment on
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
 *                 example: "I've received another similar email today"
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentResponse'
 *       400:
 *         description: Bad request - invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found - incident does not exist
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
router.post("/:incidentId/comments", (req, res, next) => {
    (0, customerMiddleware_1.authenticateCustomer)(req, res, next);
}, (req, res) => {
    customerIncidentController_1.CustomerIncidentController.addComment(req, res);
});
