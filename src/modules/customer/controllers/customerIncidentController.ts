import { Response , Request } from 'express';
import { CustomerIncidentService } from '../services/customerIncidentService';
import { AuthRequest, ApiResponse } from '../types';

export class CustomerIncidentController {
  static async createIncident(req: Request, res: Response) {
    try {
      const result = await CustomerIncidentService.createIncident(
        req.body, 
        req.customer.id,
        req.customer.companyUserId
      );
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error creating incident',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async getIncidents(req: Request, res: Response) {
    try {
      const result = await CustomerIncidentService.getCustomerIncidents(
        req.query as any,
        req.customer.id,
        req.customer.companyUserId
      );
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error retrieving incidents',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async getIncident(req: Request, res: Response) {
    try {
      const { incidentId } = req.params;
      const result = await CustomerIncidentService.getIncidentById(
        incidentId, 
        req.customer.id,
        req.customer.companyUserId
      );
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error retrieving incident',
        error: error.message
      };
      res.status(500).json(response);
    }
  }

  static async addComment(req: Request, res: Response) {
    try {
      const { incidentId } = req.params;
      const { content } = req.body;

      if (!content) {
        const response: ApiResponse = {
          success: false,
          message: 'Comment content is required'
        };
        return res.status(400).json(response);
      }

      const result = await CustomerIncidentService.addComment(
        incidentId,
        req.customer.id,
        req.customer.companyUserId,
        content
      );
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      const response: ApiResponse = {
        success: false,
        message: 'Internal server error adding comment',
        error: error.message
      };
      res.status(500).json(response);
    }
  }
}