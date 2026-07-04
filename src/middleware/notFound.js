// src/middleware/notFound.js
// Fallback 404 handler — catches any request that didn't match a registered route.

import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}
