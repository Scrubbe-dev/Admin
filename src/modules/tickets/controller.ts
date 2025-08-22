import { Request, Response } from 'express';
import { TicketService } from './services';
import { ApiResponse } from './utils/apiResponse';
import { TicketParams } from './types';

export class TicketController {
    static async getTicketHistory(req: Request<TicketParams>, res: Response) {
    try {
      const { ticketId } = req.params;
      const history = await TicketService.getTicketHistory(ticketId);
      
      if (!history) {
        return ApiResponse.notFound(res, 'Ticket history not found');
      }
      
      return ApiResponse.success(res, history);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch ticket history');
    }
  }
  static async getTicketDetail(req: Request<TicketParams>, res: Response) {
    try {
      const { ticketId } = req.params;
      const ticket = await TicketService.getTicketById(ticketId);
      
      if (!ticket) {
        return ApiResponse.notFound(res, 'Ticket not found');
      }
      
      return ApiResponse.success(res, ticket);
    } catch (error) {
      return ApiResponse.error(res, 'Failed to fetch ticket details');
    }
  }
}