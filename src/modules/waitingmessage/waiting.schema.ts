import { z } from 'zod';
import { Roles } from '@prisma/client';

const roleEnum = z.nativeEnum(Roles);

export const createWaitingUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    company: z.string().min(2, 'Company name must be at least 2 characters'),
    role: roleEnum,
    message: z.string().max(500, 'Message cannot exceed 500 characters').optional()
  })
});

export const getWaitingUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
    limit: z.string().regex(/^\d+$/).optional().default('10').transform(Number),
    role: roleEnum.optional(),
    search: z.string().optional()
  })
});

export type CreateWaitingUserInput = z.TypeOf<typeof createWaitingUserSchema>;
export type GetWaitingUsersInput = z.TypeOf<typeof getWaitingUsersSchema>;