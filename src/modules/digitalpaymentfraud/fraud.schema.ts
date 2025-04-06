import express from 'express';
import { z } from 'zod';
// Zod schema for request validation
export const fraudDetectionSchema = z.object({
  transaction: z.object({
    id: z.string().min(1),
    timestamp: z.string().datetime(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    payment_method: z.object({
      type: z.enum(['credit_card', 'bank_transfer', 'digital_wallet', 'cryptocurrency']),
      card_type: z.string().optional(),
      last_four: z.string().length(4),
      tokenized_id: z.string().min(1)
    })
  }),
  customer: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    ip_address: z.string().ip(),
    device_fingerprint: z.string().min(1),
    account_age_days: z.number().int().min(0),
    previous_transactions_count: z.number().int().min(0)
  }),
  shipping_address: z.object({
    name: z.string().min(1),
    address_line1: z.string().min(1),
    address_line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().length(2)
  }),
  billing_address: z.object({
    name: z.string().min(1),
    address_line1: z.string().min(1),
    address_line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().length(2)
  }),
  metadata: z.object({
    user_agent: z.string().min(1),
    referrer: z.string().url(),
    session_id: z.string().min(1),
    custom_fields: z.record(z.unknown()).optional()
  })
});
