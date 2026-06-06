import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireMfa } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { policyIdParams } from '../schemas/common.schema';
import * as policiesController from '../controllers/policies.controller';

const router = Router();

router.use(authenticate, requireMfa);

/**
 * @openapi
 * /policies/{policyId}:
 *   get:
 *     tags: [Policies]
 *     summary: Get a policy with its eligibility sub-object
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Policy record }
 *       404: { description: Policy not found }
 */
router.get(
  '/:policyId',
  validate(policyIdParams, 'params'),
  asyncHandler(policiesController.getPolicy)
);

/**
 * @openapi
 * /policies/{policyId}/eligibility:
 *   get:
 *     tags: [Policies]
 *     summary: Get eligibility for a policy (includes source_document)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Eligibility record }
 *       404: { description: Not found }
 */
router.get(
  '/:policyId/eligibility',
  validate(policyIdParams, 'params'),
  asyncHandler(policiesController.getPolicyEligibility)
);

export default router;
