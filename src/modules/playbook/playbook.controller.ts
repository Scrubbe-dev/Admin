// src/controllers/playbookController.ts
import { Request, Response } from 'express';
import { PlaybookService } from './playbook.service';
import { catchAsync, sendResponse } from './playbook.util';
import { RecommendedPlaybooksResponse } from './playbook.type';

export class PlaybookController {
  /**
   * Get recommended playbooks for a ticket
   * @route POST /api/tickets/playbooks/{ticketId}
   * @param {string} ticketId.path.required - ID of the ticket
   * @returns {RecommendedPlaybooksResponse} 200 - Recommended playbooks
   * @returns {object} 404 - Ticket not found
   * @returns {object} 500 - Internal server error
   */
  static getRecommendedPlaybooks = catchAsync(async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { generate } = req.query; // Optional query parameter to generate new recommendations
    
    let result;
    
    if (generate === 'true') {
      result = await PlaybookService.generatePlaybookRecommendations(ticketId);
    } else {
      result = await PlaybookService.getRecommendedPlaybooks(ticketId);
    }
    
    sendResponse(res, 200, 'Recommended playbooks retrieved successfully', result);
  });
}