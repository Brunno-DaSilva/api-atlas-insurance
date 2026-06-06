import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { signMfaPendingToken, signSessionToken } from '../utils/jwt';
import { Role, Session } from '../types';
import { randomUUID } from 'crypto';

const TABLE_BY_ROLE: Record<Role, 'members' | 'brokers'> = {
  member: 'members',
  broker: 'brokers',
};

const SESSION_TTL_MS = 60 * 60 * 1000; // 1h

export interface LoginResult {
  token: string;
  sessionId: string;
  actorId: string;
  role: Role;
  mfaRequired: true;
}

/** Validate credentials and create a pre-MFA session. */
export async function login(email: string, password: string, role: Role): Promise<LoginResult> {
  const table = TABLE_BY_ROLE[role];

  const { data: actor, error } = await supabase
    .from(table)
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw AppError.internal('Failed to look up credentials');
  if (!actor) throw AppError.unauthorized('Invalid email or password');

  const valid = await bcrypt.compare(password, actor.password_hash);
  if (!valid) throw AppError.unauthorized('Invalid email or password');

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error: sessionError } = await supabase.from('sessions').insert({
    id: sessionId,
    session_token: randomUUID(),
    actor_id: actor.id,
    actor_type: role,
    authenticated: true,
    mfa_verified: false,
    expires_at: expiresAt,
  });
  if (sessionError) throw AppError.internal('Failed to create session');

  const token = signMfaPendingToken({ sub: actor.id, role, sessionId });

  return { token, sessionId, actorId: actor.id, role, mfaRequired: true };
}

export interface MfaResult {
  token: string;
  sessionId: string;
  actorId: string;
  role: Role;
}

/**
 * Verify the MFA token for a session. For dummy data, any 6-digit numeric
 * token is accepted (validated upstream by the Zod schema).
 */
export async function verifyMfa(sessionId: string): Promise<MfaResult> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw AppError.internal('Failed to look up session');
  if (!session) throw AppError.notFound('Session not found');
  if (new Date(session.expires_at).getTime() < Date.now()) {
    throw AppError.unauthorized('Session expired; please log in again');
  }

  const newExpiry = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ mfa_verified: true, expires_at: newExpiry })
    .eq('id', sessionId);
  if (updateError) throw AppError.internal('Failed to update session');

  const role = session.actor_type as Role;
  const token = signSessionToken({ sub: session.actor_id, role, sessionId });

  return { token, sessionId, actorId: session.actor_id, role };
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw AppError.internal('Failed to look up session');
  if (!data) throw AppError.notFound('Session not found');
  return data as Session;
}
