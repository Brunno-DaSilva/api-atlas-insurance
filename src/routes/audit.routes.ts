import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateOrServiceKey, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAuditEventSchema } from '../schemas/audit.schema';
import * as auditController from '../controllers/audit.controller';

const router = Router();

/**
 * @openapi
 * /audit/events:
 *   post:
 *     tags: [Audit]
 *     summary: Record an audit event (Bearer JWT or x-service-key)
 *     security: [{ bearerAuth: [] }, { serviceKey: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventType, action]
 *             properties:
 *               eventType: { type: string }
 *               sessionId: { type: string }
 *               actorId: { type: string, format: uuid }
 *               actorType: { type: string, enum: [member, broker, agent, system] }
 *               resourceType: { type: string }
 *               resourceId: { type: string }
 *               action: { type: string }
 *               payload: { type: object }
 *     responses:
 *       201: { description: Event recorded }
 */
router.post(
  '/events',
  authenticateOrServiceKey,
  validate(createAuditEventSchema),
  asyncHandler(auditController.createEvent)
);

/**
 * @openapi
 * /audit/interactions:
 *   get:
 *     tags: [Audit]
 *     summary: List audit events (supervisor role or service key)
 *     security: [{ bearerAuth: [] }, { serviceKey: [] }]
 *     parameters:
 *       - { in: query, name: actorId, schema: { type: string } }
 *       - { in: query, name: sessionId, schema: { type: string } }
 *       - { in: query, name: from, schema: { type: string, format: date-time } }
 *       - { in: query, name: to, schema: { type: string, format: date-time } }
 *     responses:
 *       200: { description: Paginated audit events }
 */
router.get(
  '/interactions',
  authenticateOrServiceKey,
  requireRole('supervisor'),
  asyncHandler(auditController.listInteractions)
);

/**
 * @openapi
 * /audit/tool-executions:
 *   get:
 *     tags: [Audit]
 *     summary: List tool_execution audit events (supervisor role or service key)
 *     security: [{ bearerAuth: [] }, { serviceKey: [] }]
 *     responses:
 *       200: { description: Paginated tool execution events }
 */
router.get(
  '/tool-executions',
  authenticateOrServiceKey,
  requireRole('supervisor'),
  asyncHandler(auditController.listToolExecutions)
);

export default router;
