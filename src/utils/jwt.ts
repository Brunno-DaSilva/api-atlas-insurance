import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

/** Issue a short-lived pre-MFA token (mfaRequired = true). */
export function signMfaPendingToken(payload: Omit<JwtPayload, 'mfaVerified'>): string {
  return jwt.sign({ ...payload, mfaRequired: true, mfaVerified: false }, env.jwtSecret, {
    expiresIn: env.mfaTokenExpiry,
  } as SignOptions);
}

/** Issue the full session token after MFA verification. */
export function signSessionToken(payload: Omit<JwtPayload, 'mfaRequired'>): string {
  return jwt.sign({ ...payload, mfaRequired: false, mfaVerified: true }, env.jwtSecret, {
    expiresIn: env.jwtExpiry,
  } as SignOptions);
}

/** Verify and decode a JWT; throws if invalid or expired. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
