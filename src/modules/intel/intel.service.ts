import { EscalationStatus } from '@prisma/client';
import { AppError } from './intel.utils';
import { IntelResponse} from './intel.type';
import prisma from '../../prisma-clients/client';


export class TicketService {
  static async getTicketIntel(ticketId: string): Promise<IntelResponse[]> {
    // Check if ticket exists
    const ticket = await prisma.incidentTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Get all intel for this ticket
    const intelList = await prisma.intel.findMany({
      where: { incidentTicketId: ticketId },
    });

    // Transform to response format
    return intelList.map((intel: { intelType: any; details: any; }) => ({
      intelType: intel.intelType,
      details: intel.details,
    }));
  }

}