// src/config/env.js
// Loads .env file, then validates all required environment variables.
// Fails fast at startup if anything critical is missing.
// Must be imported before anything that reads process.env.

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '.env') });

const required = ['DATABASE_URL'];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: parseInt(process.env.PORT ?? '4000', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
};
