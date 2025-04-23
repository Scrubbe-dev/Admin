import { z } from 'zod';
import { config } from 'dotenv';
config()

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; 
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().regex(/postgresql:\/\//, {
    message: 'Must be a valid PostgreSQL connection URL',
  }),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  MAXMIND_ACCOUNT_ID: z.string().min(6),
  MAXMIND_LICENSE_KEY: z.string().min(8),
  ALLOWED_ORIGINS: z
    .string()
    .transform((s) => s.split(','))
    .default('*'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SEARCH_IP_LOCATION_API_KEY:  z.string().min(32),
  BASE_SEARCH_URL: z.string().url().default('https://api.apilayer.com/ip_to_location'),
  BASE_EMAIL_VERIFICATION: z.string().url().default('https://yourapp.com/verify-email'),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.string().min(4),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(3),
  FROM_EMAIL: z.string()
  .min(1, "FROM_EMAIL is required")
  .regex(emailRegex, "Invalid email format"),
  SHADOW_DATABASE_URL: z.string().url(),
});

export type EnvConfig = z.infer<typeof envSchema>;
export const env = ((): EnvConfig => {
  try {
    const parsed = envSchema.parse(process.env);
    if (parsed.NODE_ENV === 'production') {
      if (
        parsed.JWT_SECRET === 'default_secret' ||
        parsed.JWT_REFRESH_SECRET === 'default_refresh_secret'
      ) {
        throw new Error(
          'You must change default JWT secrets in production environment'
        );
      }
    }

    if (!/^\d+$/.test(parsed.MAXMIND_ACCOUNT_ID)) {
      throw new Error('MAXMIND_ACCOUNT_ID must be numeric');
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.code === 'invalid_type')
        .map((e) => e.path.join('.'));

      throw new Error(
        `Environment validation failed: ${
          error.message
        }\nMissing variables: ${missingVars.join(', ')}`
      );
    }
    throw error;
  }
})();

