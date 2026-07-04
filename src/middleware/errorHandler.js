// src/middleware/errorHandler.js
// Centralized Express error handler — must be registered LAST in app.js.
// Translates ApiErrors and unexpected errors into consistent HTTP responses.
// Never leaks stack traces to clients in production.

import { ApiError } from '../utils/ApiError.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Known application error — safe to expose message and code
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(err.field && { field: err.field }),
      },
    });
  }

  // Unexpected error — log details server-side, return generic message to client
  console.error('[errorHandler]', err);

  return res.status(500).json({
    error: {
      message: 'An unexpected error occurred.',
      code: 'INTERNAL_ERROR',
    },
  });
}
