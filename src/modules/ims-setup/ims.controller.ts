import { Request, Response } from 'express';
import { IMSService } from './ims.service';
import { IMSSetupRequest, IMSSetupResponse } from './ims.type';

export class IMSController {
  /**
   * Setup IMS endpoint
   */
  static async setupIMS(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id; // Assuming user is authenticated and user ID is available
      
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const requestData: IMSSetupRequest = req.body;

      // Validate request
      const validation = IMSService.validateIMSSetupRequest(requestData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: validation.errors
        });
        return;
      }

      // Process IMS setup
      const result = await IMSService.setupIMS(userId, requestData);

      res.status(201).json(result);

    } catch (error: any) {
      console.error('IMS Controller Error:', error);
      
      if (error.message.includes('already has a business')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
      } else if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error during IMS setup',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later'
        });
      }
    }
  }

  /**
   * Health check endpoint for IMS setup
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'IMS setup endpoint is healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }
}