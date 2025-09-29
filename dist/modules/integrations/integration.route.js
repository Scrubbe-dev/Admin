"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("./integration.controller");
const auth_middleware_1 = require("../auth/middleware/auth.middleware");
const token_service_1 = require("../auth/services/token.service");
const integrationRouter = (0, express_1.Router)();
const tokenService = new token_service_1.TokenService(process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN || "1h", 15 // in mins
);
const authMiddleware = new auth_middleware_1.AuthMiddleware(tokenService);
/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Integration management operations
 */
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: |
 *         JWT Authorization header using the Bearer scheme.
 *         Example: "Authorization: Bearer {token}"
 */
/**
 * @swagger
 * paths:
 *   /api/v1/integrations/{userId}:
 *     get:
 *       summary: Retrieve all available integrations for a specific user
 *       description: >
 *         This endpoint returns a list of all available third-party integrations configured for a specific user.
 *         The integrations include communication platforms, ticketing systems, and development tools.
 *       tags: [Integrations]
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: path
 *           name: userId
 *           required: true
 *           schema:
 *             type: string
 *           description: Unique identifier of the user
 *       responses:
 *         200:
 *           description: Integrations retrieved successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                     example: true
 *                   data:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: The display name of the integration
 *                           example: "Slack"
 *                   example:
 *                     - name: "Email"
 *                     - name: "Github"
 *                     - name: "Gitlab"
 *                     - name: "Google Meet"
 *                     - name: "Microsoft Teams"
 *                     - name: "PagerDuty"
 *                     - name: "SMS"
 *                     - name: "Slack"
 *                     - name: "WhatsApp"
 *                     - name: "Zoom"
 *                   message:
 *                     type: string
 *                     example: "Integrations retrieved successfully"
 *               examples:
 *                 successful_response:
 *                   summary: Successful response with integrations
 *                   value:
 *                     success: true
 *                     data:
 *                       - name: "Github"
 *                       - name: "Gitlab"
 *                       - name: "Slack"
 *                     message: "Integrations retrieved successfully"
 *         401:
 *           description: Unauthorized - Invalid or missing authentication token
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/UnauthorizedError'
 *         500:
 *           description: Failed to fetch integrations
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/ErrorResponse'
 */
integrationRouter.get('/integrations/:userId', authMiddleware.authenticate, (req, res, next) => {
    integration_controller_1.IntegrationController.getAllIntegrations(req, res).catch(next);
});
exports.default = integrationRouter;
