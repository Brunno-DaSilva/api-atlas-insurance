import { Response, NextFunction } from 'express';
import { AuthedRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { supabase } from '../config/supabase';

/**
 * Verifies the Bearer JWT, confirms the backing session exists and is not
 * expired, and attaches the decoded payload to req.user.
 */
export async function authenticate(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = header.slice('Bearer '.length).trim();
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired token');
    }

    // Confirm the session still exists and has not expired.
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', payload.sessionId)
      .maybeSingle();

    if (error) throw AppError.internal('Failed to validate session');
    if (!session) throw AppError.unauthorized('Session not found');
    if (new Date(session.expires_at).getTime() < Date.now()) {
      throw AppError.unauthorized('Session expired');
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Allows the request if it carries a valid internal service key header
 * (x-service-key). Otherwise falls through to JWT authentication.
 */
export async function authenticateOrServiceKey(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const serviceKey = req.headers['x-service-key'];
  const { env } = await import('../config/env');
  if (typeof serviceKey === 'string' && serviceKey === env.internalServiceKey) {
    req.serviceAuthenticated = true;
    return next();
  }
  return authenticate(req, res, next);
}

/**
 * Requires that the request was made by an MFA-verified session. Service-key
 * callers bypass this check.
 */
export function requireMfa(req: AuthedRequest, _res: Response, next: NextFunction): void {
  if (req.serviceAuthenticated) return next();
  if (!req.user?.mfaVerified) {
    return next(AppError.forbidden('MFA verification required'));
  }
  next();
}

/**
 * Restricts a route to one of the supplied roles. Service-key callers bypass.
 * Used for supervisor/audit endpoints.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction): void => {
    if (req.serviceAuthenticated) return next();
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role for this resource'));
    }
    next();
  };
}
