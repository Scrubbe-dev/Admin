import { Prisma } from '@prisma/client';

// Define the exact include structure based on your Prisma schema
export type PostmortemInclude = {
  incidentTicket: {
    include: {
      Incident: true; // Use the exact relation name from your schema
    };
  };
};

export type PostmortemResponse = Prisma.ResolveIncidentGetPayload<{
  include: PostmortemInclude;
}>;

export interface PostmortemFilters {
  incidentId?: string;
  status?: string; // Using string since we'll validate against enum values
  priority?: string; // Using string since we'll validate against enum values
  startDate?: Date;
  endDate?: Date;
  page?: number;
}