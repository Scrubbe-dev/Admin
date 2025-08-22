import { Router, Request, Response, NextFunction } from 'express';
import { IntegrationController } from './integration.controller';

const integrationRouter = Router();

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
 *       500:
 *         description: Failed to fetch integrations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch integrations"
 */
integrationRouter.get('/integrations', (req: Request, res: Response, next: NextFunction) => {
  IntegrationController.getAllIntegrations(req, res).catch(next);
});

export default integrationRouter;