import { Response } from 'express';
import { AuthedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { getPagination, buildPaginated } from '../utils/pagination';
import * as policiesService from '../services/policies.service';
import * as audit from '../services/audit.service';

export async function getPolicy(req: AuthedRequest, res: Response): Promise<void> {
  const { policyId } = req.params;
  const policy = await policiesService.getPolicyById(policyId);

  await audit.logEvent({
    eventType: 'tool_execution',
    action: 'policy.get',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    resourceType: 'policy',
    resourceId: policyId,
    ipAddress: req.ip,
  });

  sendSuccess(res, policy);
}

export async function getPolicyEligibility(req: AuthedRequest, res: Response): Promise<void> {
  const { policyId } = req.params;
  const eligibility = await policiesService.getEligibilityByPolicy(policyId);

  await audit.logEvent({
    eventType: 'tool_execution',
    action: 'policy.eligibility',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    resourceType: 'policy',
    resourceId: policyId,
    ipAddress: req.ip,
  });

  sendSuccess(res, eligibility);
}

export async function getMemberPolicies(req: AuthedRequest, res: Response): Promise<void> {
  const { memberId } = req.params;
  const status = req.query.status as string | undefined;
  const pagination = getPagination(req);

  const { items, total } = await policiesService.getMemberPolicies(memberId, status, pagination);

  await audit.logEvent({
    eventType: 'tool_execution',
    action: 'policy.list_by_member',
    sessionId: req.user?.sessionId,
    actorId: req.user?.sub,
    actorType: req.user?.role,
    memberId,
    resourceType: 'policy',
    resourceId: memberId,
    ipAddress: req.ip,
  });

  sendSuccess(res, buildPaginated(items, total, pagination));
}
