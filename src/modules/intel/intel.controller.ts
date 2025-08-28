// src/controllers/ticketController.ts
import { Request, Response } from 'express';
import { TicketService } from './intel.service';
import { catchAsync, sendResponse } from './intel.utils';
import { IntelResponse } from './intel.type';

export class TicketController {
  static getTicketIntel = catchAsync(async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    
    const intel = await TicketService.getTicketIntel(ticketId);
    
    sendResponse(res, 200, 'Intel retrieved successfully', intel);
  });

}