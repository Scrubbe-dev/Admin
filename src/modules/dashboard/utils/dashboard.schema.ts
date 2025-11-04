import { z } from 'zod';

export const dashboardFiltersSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
  team: z.string().optional(),
  priority: z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])).optional(),
  status: z.array(z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ON_HOLD'])).optional(),
});

export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;