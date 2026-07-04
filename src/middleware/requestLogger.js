// src/middleware/requestLogger.js
// Minimal HTTP request logger for development visibility.
// In production, replace with a structured logger (e.g. pino) if needed.

export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`);
  });
  next();
}
