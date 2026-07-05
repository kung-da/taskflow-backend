// src/middleware/errorHandler.js
// Centralized Express error handler — must be registered LAST in app.js.
// Translates ApiErrors, Zod errors, and unexpected errors into consistent HTTP responses.
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

  // Malformed JSON body — Express throws a SyntaxError with status 400
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        message: 'Invalid JSON in request body',
        code: 'PARSE_ERROR',
      },
    });
  }

  // Payload too large
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: {
        message: 'Request body too large',
        code: 'PAYLOAD_TOO_LARGE',
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
