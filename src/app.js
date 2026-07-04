// src/app.js
// Express app configuration.
// Sets up middleware, mounts routes, and attaches error handlers.
// Imported by server.js — keeps app setup separate from the HTTP listener
// so this file can be imported by integration tests without starting a server.

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import todoRoutes from './modules/todos/todo.routes.js';

const app = express();

// — Middleware —
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

// Rate limit write endpoints (protection against accidental hammering)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
});
app.use('/api/todos', writeLimiter);

// — Routes —
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/todos', todoRoutes);

// — Error handling (must be last) —
app.use(notFound);
app.use(errorHandler);

export default app;
