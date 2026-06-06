import { Response } from 'express';
import { AuthedRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { getPagination, buildPaginated } from '../utils/pagination';
import * as auditService from '../services/audit.service';
import { CreateAuditEventInput } from '../schemas/audit.schema';

export async function createEvent(req: AuthedRequest, res: Response): Promise<void> {
  const input = req.body as CreateAuditEventInput;

  const event = await auditService.createEvent({
    eventType: input.eventType,
    sessionId: input.sessionId ?? null,
    actorId: input.actorId ?? null,
    actorType: input.actorType ?? null,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    action: input.action,
    payload: input.payload ?? null,
    memberId: input.actorType === 'member' ? (input.actorId ?? null) : null,
    ipAddress: req.ip,
  });

  sendSuccess(res, { id: event.id }, 201);
}

function buildFilters(req: AuthedRequest) {
  return {
    actorId: req.query.actorId as string | undefined,
    sessionId: req.query.sessionId as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  };
}

export async function listInteractions(req: AuthedRequest, res: Response): Promise<void> {
  const pagination = getPagination(req);
  const { items, total } = await auditService.listEvents(buildFilters(req), pagination);
  sendSuccess(res, buildPaginated(items, total, pagination));
}

export async function listToolExecutions(req: AuthedRequest, res: Response): Promise<void> {
  const pagination = getPagination(req);
  const { items, total } = await auditService.listEvents(
    { ...buildFilters(req), eventType: 'tool_execution' },
    pagination
  );
  sendSuccess(res, buildPaginated(items, total, pagination));
}
