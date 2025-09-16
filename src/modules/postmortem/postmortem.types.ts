// // postmortem.types.ts
// import { Prisma } from '@prisma/client';

// // Define the exact include structure based on your Prisma schema
// export type PostmortemInclude = {
//   incidentTicket: {
//     include: {
//       Incident: true; // Use the actual field name from your schema
//     };
//   };
// };

// export type PostmortemResponse = Prisma.ResolveIncidentGetPayload<{
//   include: PostmortemInclude;
// }>;

// export interface PostmortemFilters {
//   incidentId?: string;
//   status?: string;
//   priority?: string;
//   startDate?: Date;
//   endDate?: Date;
//   page?: number;
// }



// postmortem.types.ts
import { Prisma } from '@prisma/client';

export type IncidentTicketWithPostmortem = Prisma.IncidentTicketGetPayload<{
  include: {
    ResolveIncident: true;
    Incident: true;
  };
}>;

export interface PostmortemFilters {
  incidentId?: string;
  status?: string;
  priority?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  sortBy?: 'createdAt' | 'priority' | 'status' | 'ticketId';
  sortOrder?: 'asc' | 'desc';
}

export type PostmortemResponse = IncidentTicketWithPostmortem[];