import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireMfa } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { memberIdParams } from '../schemas/common.schema';
import * as policiesController from '../controllers/policies.controller';
import * as claimsController from '../controllers/claims.controller';

const router = Router();

router.use(authenticate, requireMfa);

/**
 * @openapi
 * /members/{memberId}/policies:
 *   get:
 *     tags: [Policies]
 *     summary: List all policies for a member
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated policies }
 */
router.get(
  '/:memberId/policies',
  validate(memberIdParams, 'params'),
  asyncHandler(policiesController.getMemberPolicies)
);

/**
 * @openapi
 * /members/{memberId}/claims:
 *   get:
 *     tags: [Claims]
 *     summary: List all claims for a member
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated claims }
 */
router.get(
  '/:memberId/claims',
  validate(memberIdParams, 'params'),
  asyncHandler(claimsController.getMemberClaims)
);

export default router;
