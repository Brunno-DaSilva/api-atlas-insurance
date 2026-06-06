import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/** 404 handler for unmatched routes. */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Global error handler. Converts AppError instances into the standard error
 * envelope and masks unexpected errors in production.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Unexpected error — log in non-production, never leak stack traces.
  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error('[Unhandled Error]', err);
  }

  const message = env.isProduction
    ? 'Internal server error'
    : err instanceof Error
      ? err.message
      : 'Internal server error';

  sendError(res, 500, 'INTERNAL_ERROR', message);
}
