// src/db/client.js
// Singleton PrismaClient instance — import this everywhere DB access is needed.
// Using a singleton prevents connection pool exhaustion during hot reloads in dev.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

export default prisma;
