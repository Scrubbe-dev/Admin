import { z } from 'zod';

export const emailRequestSchema = z.object({
  senderEmail: z.string().email(),
  displayName: z.string().min(1),
  subject: z.string().min(1),
  content: z.string().min(1),
  legitimateDomains: z.array(z.string().url()).optional(),
});

export type EmailRequestSchema = z.infer<typeof emailRequestSchema>;