import { IncidentStatus, Priority, Prisma as NewPrisma } from '@prisma/client';
import  Prisma  from '../../lib/prisma';

export interface PostmortemFilters {
  incidentId?: string;
  status?: IncidentStatus;
  priority?: Priority;
  startDate?: Date;
  endDate?: Date;
}

export type PostmortemResponse = NewPrisma.ResolveIncidentGetPayload<{
  include: {
    incidentTicket: {
      include: {
        Incident: true;
      };
    };
  };
}>;