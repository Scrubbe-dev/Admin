import { Router, Request, Response, NextFunction } from 'express';
import { IntegrationController } from './integration.controller';
import { AuthMiddleware } from "../auth/middleware/auth.middleware";
import { TokenService } from "../auth/services/token.service";

const integrationRouter = Router();

const tokenService = new TokenService(
  process.env.JWT_SECRET!,
  process.env.JWT_EXPIRES_IN || "1h",
  15 // in mins
);
const authMiddleware = new AuthMiddleware(tokenService);
/**

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
 * tags:
 *   name: Integrations
 *   description: Integration management operations
 */

/**
 * @swagger
 * /api/v1/integrations:
 *   get:
 *     summary: Retrieve all available integrations
 *     description: >
 *       This endpoint returns a list of all available third-party integrations that can be
 *       configured for notifications and workflows. The integrations include communication
 *       platforms, ticketing systems, and development tools.
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []  # Requires authentication
 *     responses:
 *       200:
 *         description: Integrations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The display name of the integration
 *                         example: "Slack"
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
 *                 message:
 *                   type: string
 *                   example: "Integrations retrieved successfully"
 *             examples:
 *               successful_response:
 *                 summary: Successful response with integrations
 *                 value:
 *                   success: true
 *                   data:
 *                     - name: "Github"
 *                     - name: "Gitlab"
 *                     - name: "Slack"
 *                   message: "Integrations retrieved successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnauthorizedError'
 *       500:
 *         description: Failed to fetch integrations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
integrationRouter.get('/integrations',authMiddleware.authenticate,(req: Request, res: Response, next: NextFunction) => {
  IntegrationController.getAllIntegrations(req, res).catch(next);
});

export default integrationRouter;