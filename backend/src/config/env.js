import dotenv from 'dotenv';
import crypto from 'crypto';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const isTest = process.env.NODE_ENV === 'test';
const ephemeralSecret = () => crypto.randomBytes(32).toString('hex');

const emailOrEmpty = z.string().email().or(z.literal('')).default('');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required in .env'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: isTest
    ? z.string().min(16).default(ephemeralSecret())
    : z.string().min(16, 'JWT_ACCESS_SECRET (>=16 chars) must be set in .env'),
  JWT_REFRESH_SECRET: isTest
    ? z.string().min(16).default(ephemeralSecret())
    : z.string().min(16, 'JWT_REFRESH_SECRET (>=16 chars) must be set in .env'),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL: z.string().default('7d'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  SUPER_ADMIN_EMAIL: emailOrEmpty,
  SUPER_ADMIN_PASSWORD: z.string().optional().default(''),
  ADMIN_EMAIL: emailOrEmpty,
  ADMIN_PASSWORD: z.string().optional().default(''),
  DEFAULT_STUDENT_PASSWORD: z.string().optional().default(''),
  BREVO_API_KEY: z.string().optional().default(''),
  BREVO_SENDER_EMAIL: z.string().optional().default(''),
  STUDENT_PORTAL_URL: z.string().url().default('http://localhost:3000'),
  ADMIN_PORTAL_URL: z.string().url().default('http://localhost:3001'),
  PYTHON_BIN: z.string().optional().default(''),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().min(10).default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(5).default(30),
  EXECUTION_CONCURRENCY: z.coerce.number().int().min(1).max(64).optional(),
  EXECUTION_MAX_QUEUE: z.coerce.number().int().min(10).default(500),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
