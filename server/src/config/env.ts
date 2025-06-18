import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.string(),
  CLIENT_URL: z.string(),
});

const res = envSchema.safeParse(process.env);
if (res.error || !res.success) {
  throw new Error(
    `Error Loading Environment variables :: ${JSON.stringify(res.error.errors, null, 2)}`
  );
}

export const env = res.data;
