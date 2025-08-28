
import { Request, Response } from 'express';
import { TicketService } from './escalate.service';
import { catchAsync, sendResponse } from './escalate.utils';
import {EscalateRequest } from './escalate.type';

export class TicketController {

  static escalateTicket = catchAsync(async (req: Request, res: Response) => {
    const { ticketId } = req.params;
    const { escalatedTo, reason } = req.body as EscalateRequest;
    
    // We need the user who is performing the escalation. 
    // This would typically come from authentication middleware
    const userId = (req as any).user?.id; 
    
    if (!userId) {
      return sendResponse(res, 401, 'Authentication required');
    }
    
    const result = await TicketService.escalateTicket(ticketId, escalatedTo, userId, reason);
    
    sendResponse(res, 200, 'Ticket escalated successfully', result);
  });
}