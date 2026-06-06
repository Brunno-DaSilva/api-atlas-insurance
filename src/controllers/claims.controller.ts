import { Response } from 'express';
import { AuthedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { getPagination, buildPaginated } from '../utils/pagination';
import * as claimsService from '../services/claims.service';
import * as audit from '../services/audit.service';
import { CreateClaimInput, UpdateClaimInput } from '../schemas/claims.schema';

export async function getClaim(req: AuthedRequest, res: Response): Promise<void> {
  const { claimId } = req.params;
  const claim = await claimsService.getClaimById(claimId);

  await audit.logEvent({
    eventType: 'tool_execution',
    action: 'claim.get',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    resourceType: 'claim',
    resourceId: claimId,
    ipAddress: req.ip,
  });

  sendSuccess(res, claim);
}

export async function getMemberClaims(req: AuthedRequest, res: Response): Promise<void> {
  const { memberId } = req.params;
  const status = req.query.status as string | undefined;
  const pagination = getPagination(req);

  const { items, total } = await claimsService.getMemberClaims(memberId, status, pagination);

  await audit.logEvent({
    eventType: 'tool_execution',
    action: 'claim.list_by_member',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    memberId,
    resourceType: 'claim',
    resourceId: memberId,
    ipAddress: req.ip,
  });

  sendSuccess(res, buildPaginated(items, total, pagination));
}

export async function createClaim(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as CreateClaimInput;
  const claim = await claimsService.createClaim(input);

  await audit.logEvent({
    eventType: 'claim_action',
    action: 'claim.created',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    memberId: input.memberId,
    resourceType: 'claim',
    resourceId: claim.id,
    ipAddress: req.ip,
    payload: { claim_number: claim.claim_number, claim_type: claim.claim_type },
  });

  sendSuccess(res, claim, 201);
}

export async function updateClaim(req: AuthedRequest, res: Response): Promise<void> {
  const { claimId } = req.params;
  const input = req.body as UpdateClaimInput;
  const claim = await claimsService.updateClaim(claimId, input);

  await audit.logEvent({
    eventType: 'claim_action',
    action: 'claim.updated',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    memberId: claim.member_id,
    resourceType: 'claim',
    resourceId: claimId,
    ipAddress: req.ip,
    payload: input,
  });

  sendSuccess(res, claim);
}
