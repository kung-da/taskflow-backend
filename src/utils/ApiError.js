// src/utils/ApiError.js
// Custom error class for all application-level errors.
// Allows services and middleware to throw structured errors
// that the centralized error handler can map to HTTP responses.

export class ApiError extends Error {
  /**
   * @param {number} statusCode  HTTP status code (e.g. 400, 404, 500)
   * @param {string} message     Human-readable error message
   * @param {string} [code]      Machine-readable error code (e.g. 'VALIDATION_ERROR')
   * @param {string} [field]     Field name if the error is field-specific
   */
  constructor(statusCode, message, code = 'INTERNAL_ERROR', field = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.field = field;
  }
}
