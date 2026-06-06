import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

function now(): string {
  return new Date().toISOString();
}

/** Send a standardized success envelope. */
export function sendSuccess<T>(res: Response, data: T, status = 200): Response {
  const body: ApiEnvelope<T> = {
    success: true,
    data,
    error: null,
    timestamp: now(),
  };
  return res.status(status).json(body);
}

/** Send a standardized error envelope. */
export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  const body: ApiEnvelope<never> = {
    success: false,
    data: null,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    timestamp: now(),
  };
  return res.status(status).json(body);
}
