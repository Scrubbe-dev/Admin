"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fraudDetectionSchema = void 0;
const zod_1 = require("zod");
// Zod schema for request validation
exports.fraudDetectionSchema = zod_1.z.object({
    transaction: zod_1.z.object({
        id: zod_1.z.string().min(1),
        timestamp: zod_1.z.string().datetime(),
        amount: zod_1.z.number().positive(),
        currency: zod_1.z.string().length(3),
        payment_method: zod_1.z.object({
            type: zod_1.z.enum(['credit_card', 'bank_transfer', 'digital_wallet', 'cryptocurrency']),
            card_type: zod_1.z.string().optional(),
            last_four: zod_1.z.string().length(4),
            tokenized_id: zod_1.z.string().min(1)
        })
    }),
    customer: zod_1.z.object({
        id: zod_1.z.string().min(1),
        email: zod_1.z.string().email(),
        ip_address: zod_1.z.string().ip(),
        device_fingerprint: zod_1.z.string().min(1),
        account_age_days: zod_1.z.number().int().min(0),
        previous_transactions_count: zod_1.z.number().int().min(0)
    }),
    shipping_address: zod_1.z.object({
        name: zod_1.z.string().min(1),
        address_line1: zod_1.z.string().min(1),
        address_line2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        postal_code: zod_1.z.string().min(1),
        country: zod_1.z.string().length(2)
    }),
    billing_address: zod_1.z.object({
        name: zod_1.z.string().min(1),
        address_line1: zod_1.z.string().min(1),
        address_line2: zod_1.z.string().optional(),
        city: zod_1.z.string().min(1),
        state: zod_1.z.string().min(1),
        postal_code: zod_1.z.string().min(1),
        country: zod_1.z.string().length(2)
    }),
    metadata: zod_1.z.object({
        user_agent: zod_1.z.string().min(1),
        referrer: zod_1.z.string().url(),
        session_id: zod_1.z.string().min(1),
        custom_fields: zod_1.z.record(zod_1.z.unknown()).optional()
    })
});
