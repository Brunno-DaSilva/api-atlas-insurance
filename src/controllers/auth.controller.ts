import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { AuthedRequest } from '../types';
import * as authService from '../services/auth.service';
import * as audit from '../services/audit.service';
import { LoginInput, VerifyMfaInput } from '../schemas/auth.schema';

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, role } = req.body as LoginInput;
  const result = await authService.login(email, password, role);

  await audit.logEvent({
    eventType: 'auth',
    action: 'auth.login_attempt',
    sessionId: result.sessionId,
    actorId: result.actorId,
    actorType: role,
    memberId: role === 'member' ? result.actorId : null,
    resourceType: 'session',
    resourceId: result.sessionId,
    ipAddress: req.ip,
    payload: { email, role },
  });

  sendSuccess(res, {
    token: result.token,
    sessionId: result.sessionId,
    mfaRequired: true,
  });
}

export async function verifyMfa(req: Request, res: Response): Promise<void> {
  const { sessionId } = req.body as VerifyMfaInput;
  const result = await authService.verifyMfa(sessionId);

  await audit.logEvent({
    eventType: 'auth',
    action: 'auth.mfa_verified',
    sessionId: result.sessionId,
    actorId: result.actorId,
    actorType: result.role,
    memberId: result.role === 'member' ? result.actorId : null,
    resourceType: 'session',
    resourceId: result.sessionId,
    ipAddress: req.ip,
  });

  sendSuccess(res, {
    token: result.token,
    sessionId: result.sessionId,
    role: result.role,
    mfaVerified: true,
  });
}

export async function getSession(req: AuthedRequest, res: Response): Promise<void> {
  const sessionId = req.user!.sessionId;
  const session = await authService.getSession(sessionId);

  await audit.logEvent({
    eventType: 'auth',
    action: 'auth.session_check',
    sessionId,
    actorId: req.user!.sub,
    actorType: req.user!.role,
    resourceType: 'session',
    resourceId: sessionId,
    ipAddress: req.ip,
  });

  sendSuccess(res, {
    sessionId: session.id,
    actorId: session.actor_id,
    actorType: session.actor_type,
    authenticated: session.authenticated,
    mfaVerified: session.mfa_verified,
    expiresAt: session.expires_at,
  });
}
