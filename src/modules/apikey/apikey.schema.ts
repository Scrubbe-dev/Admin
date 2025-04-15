import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(3).max(50),
  expiresInDays: z.number().int().min(1).max(365).optional(),
  scopes: z.array(z.string()).optional(),
});

export const verifyApiKeySchema = z.object({
  apiKey: z.string().min(32),
});

export const listApiKeysSchema = z.object({
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  isActive: z.boolean().optional(),
});

export const updateApiKeySchema = z.object({
  name: z.string().min(3).max(50).optional(),
  isActive: z.boolean().optional(),
});