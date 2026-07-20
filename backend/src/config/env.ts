import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_APP_URL: z.string().url().default("http://localhost:5173"),
  API_URL: z.string().url().default("http://localhost:4000"),

  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_ADMIN_SECRET: z.string().optional(),

  ADMIN_SEED_EMAIL: z.string().email().optional(),
  ADMIN_SEED_PASSWORD: z.string().min(8).optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("onboarding@resend.dev"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  CRON_SECRET: z.string().optional(),
  BOOKING_EXPIRY_MINUTES: z.coerce.number().int().positive().default(20),

  // Required, unlike the secrets above: an unset value would silently 401 every
  // internal call in production.
  INTERNAL_SERVICE_SECRET: z.string().min(1),
  INTERNAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  INTERNAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  MAPBOX_ACCESS_TOKEN: z.string().optional(),
  GEOCODING_PROVIDER: z.string().default("mapbox"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[config/env] invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
