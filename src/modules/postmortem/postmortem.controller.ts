// import { Request, Response } from 'express';
// import { PostmortemService } from './postmortem.services';
// import { IncidentStatus, Priority } from '@prisma/client';

// export class PostmortemController {
//   static async getPostmortems(req: Request, res: Response): Promise<void> {
//     try {
//       // Parse and validate query parameters
//       const filters = {
//         incidentId: req.query.incidentId as string | undefined,
//         status: req.query.status as IncidentStatus | undefined,
//         priority: req.query.priority as Priority | undefined,
//         startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
//         endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
//         page: req.query.page ? parseInt(req.query.page as string, 10) : undefined
//       };

//       // Validate enum values
//       if (filters.status && !Object.values(IncidentStatus).includes(filters.status)) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid status value'
//         });
//         return;
//       }

//       if (filters.priority && !Object.values(Priority).includes(filters.priority)) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid priority value'
//         });
//         return;
//       }

//       // Validate page number if provided
//       if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid page number'
//         });
//         return;
//       }

//       const postmortems = await PostmortemService.getPostmortems(filters);

//       res.status(200).json({
//         status: 'success',
//         message: 'Postmortems retrieved successfully',
//         data: postmortems,
//         pagination: {
//           page: filters.page || 1,
//           count: postmortems.length
//         }
//       });
//     } catch (error) {
//       console.error('Error retrieving postmortems:', error);
      
//       // Handle specific error messages
//       if (error instanceof Error) {
//         if (error.message === 'Invalid start date format' || error.message === 'Invalid end date format') {
//           res.status(400).json({
//             status: 'error',
//             message: error.message
//           });
//           return;
//         }
//       }
      
//       res.status(500).json({
//         status: 'error',
//         message: 'An error occurred while retrieving postmortems'
//       });
//     }
//   }
// }


import { Request, Response } from 'express';
import { PostmortemService } from './postmortem.services';
import { IncidentStatus, Priority } from '@prisma/client';

export class PostmortemController {
  static async getPostmortems(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate query parameters
      const filters = {
        incidentId: req.query.incidentId as string | undefined,
        status: req.query.status as IncidentStatus | undefined,
        priority: req.query.priority as Priority | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        sortBy: req.query.sortBy as 'createdAt' | 'priority' | 'status' | 'ticketId' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined
      };

      // Validate enum values
      if (filters.status && !Object.values(IncidentStatus).includes(filters.status)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid status value'
        });
        return;
      }

      if (filters.priority && !Object.values(Priority).includes(filters.priority)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid priority value'
        });
        return;
      }

      // Validate page number if provided
      if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid page number'
        });
        return;
      }

      const postmortems = await PostmortemService.getPostmortems(filters);

      res.status(200).json({
        status: 'success',
        message: 'Postmortems retrieved successfully',
        data: postmortems,
        pagination: {
          page: filters.page || 1,
          count: postmortems.length
        }
      });
    } catch (error) {
      console.error('Error retrieving postmortems:', error);
      
      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message === 'Invalid start date format' || error.message === 'Invalid end date format') {
          res.status(400).json({
            status: 'error',
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while retrieving postmortems'
      });
    }
  }
}