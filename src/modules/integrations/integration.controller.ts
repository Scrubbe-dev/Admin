import { Request, Response } from 'express';
import { IntegrationService } from './integration.service';
import { IntegrationResponse, ErrorResponse, Integration } from './integration.type';

export class IntegrationController {
  /**
   * Get all available integrations
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns Promise<void>
   */
  static async getAllIntegrations(req: Request, res: Response): Promise<void> {
    const {userId} =  req.params;
    try {
      const integrations = await IntegrationService.getSingleIntegrations(userId) as Integration[];

      const response: IntegrationResponse = {
        success: true,
        data: integrations,
        message: 'Integrations retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Controller: Error fetching integrations:', error);
      
      const errorResponse: ErrorResponse = {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error'
      };

      res.status(500).json(errorResponse);
    }
  }
}