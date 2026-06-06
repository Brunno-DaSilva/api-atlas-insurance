import { z } from 'zod';

export const createAuditEventSchema = z.object({
  eventType: z.string().min(1),
  sessionId: z.string().optional(),
  actorId: z.string().uuid().optional(),
  actorType: z.enum(['member', 'broker', 'agent', 'system']).optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  action: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
});

export type CreateAuditEventInput = z.infer<typeof createAuditEventSchema>;
