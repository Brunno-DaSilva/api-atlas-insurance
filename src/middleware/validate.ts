import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type Target = 'body' | 'query' | 'params';

/**
 * Validates the chosen request segment against a Zod schema. On success the
 * parsed (and coerced) value replaces the original. On failure responds 400
 * with field-level error details.
 */
export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = formatZodError(result.error);
      return next(AppError.badRequest('Request validation failed', details));
    }
    // Reassign parsed value (coercion, defaults, stripping).
    (req as Record<Target, unknown>)[target] = result.data;
    next();
  };
}

function formatZodError(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((e) => ({
    field: e.path.join('.') || '(root)',
    message: e.message,
  }));
}
