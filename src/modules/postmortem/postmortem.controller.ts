import { Request, Response } from 'express';
import { PostmortemService } from './postmortem.services';
import { IncidentStatus, Priority } from '@prisma/client';

export class PostmortemController {
  static async getPostmortems(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        incidentId: req.query.incidentId as string | undefined,
        status: req.query.status as IncidentStatus | undefined,
        priority: req.query.priority as Priority | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
      };

      const postmortems = await PostmortemService.getPostmortems(filters);

      res.status(200).json({
        status: 'success',
        message: 'Postmortems retrieved successfully',
        data: postmortems
      });
    } catch (error) {
      console.error('Error retrieving postmortems:', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while retrieving postmortems'
      });
    }
  }
}