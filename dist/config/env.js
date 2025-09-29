"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(8000),
    DATABASE_URL: zod_1.z.string().url().regex(/postgresql:\/\//, {
        message: 'Must be a valid PostgreSQL connection URL',
    }),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    REDIS_URL: zod_1.z.string().url().default('redis://localhost:6379'),
    MAXMIND_ACCOUNT_ID: zod_1.z.string().min(6),
    MAXMIND_LICENSE_KEY: zod_1.z.string().min(8),
    ALLOWED_ORIGINS: zod_1.z
        .string()
        .transform((s) => s.split(','))
        .default('*'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    SEARCH_IP_LOCATION_API_KEY: zod_1.z.string().min(32),
    BASE_SEARCH_URL: zod_1.z.string().url().default('https://api.apilayer.com/ip_to_location'),
    BASE_EMAIL_VERIFICATION: zod_1.z.string().url().default('https://yourapp.com/verify-email'),
    SMTP_HOST: zod_1.z.string().min(1),
    SMTP_PORT: zod_1.z.string().min(3),
    SMTP_USER: zod_1.z.string().min(1),
    SMTP_PASS: zod_1.z.string().min(3),
    FROM_EMAIL: zod_1.z.string()
        .min(1, "FROM_EMAIL is required")
        .regex(emailRegex, "Invalid email format"),
    // SHADOW_DATABASE_URL: z.string().url(),
});
exports.env = (() => {
    try {
        const parsed = envSchema.parse(process.env);
        if (parsed.NODE_ENV === 'production') {
            if (parsed.JWT_SECRET === 'default_secret' ||
                parsed.JWT_REFRESH_SECRET === 'default_refresh_secret') {
                throw new Error('You must change default JWT secrets in production environment');
            }
        }
        if (!/^\d+$/.test(parsed.MAXMIND_ACCOUNT_ID)) {
            throw new Error('MAXMIND_ACCOUNT_ID must be numeric');
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors
                .filter((e) => e.code === 'invalid_type')
                .map((e) => e.path.join('.'));
            throw new Error(`Environment validation failed: ${error.message}\nMissing variables: ${missingVars.join(', ')}`);
        }
        throw error;
    }
})();
