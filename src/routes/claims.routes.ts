import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireMfa } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { claimIdParams } from '../schemas/common.schema';
import { createClaimSchema, updateClaimSchema } from '../schemas/claims.schema';
import * as claimsController from '../controllers/claims.controller';

const router = Router();

router.use(authenticate, requireMfa);

/**
 * @openapi
 * /claims/{claimId}:
 *   get:
 *     tags: [Claims]
 *     summary: Get full claim record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Claim record }
 *       404: { description: Not found }
 */
router.get('/:claimId', validate(claimIdParams, 'params'), asyncHandler(claimsController.getClaim));

/**
 * @openapi
 * /claims:
 *   post:
 *     tags: [Claims]
 *     summary: File a First Notice of Loss (FNOL)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [memberId, policyId, claimType, incidentDate, incidentDescription]
 *             properties:
 *               memberId: { type: string, format: uuid }
 *               policyId: { type: string, format: uuid }
 *               claimType: { type: string, enum: [auto, home, health, life] }
 *               incidentDate: { type: string, example: "2024-05-01" }
 *               incidentDescription: { type: string }
 *     responses:
 *       201: { description: Claim created with claim_number }
 */
router.post('/', validate(createClaimSchema), asyncHandler(claimsController.createClaim));

/**
 * @openapi
 * /claims/{claimId}:
 *   put:
 *     tags: [Claims]
 *     summary: Partially update a claim
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: claimId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200: { description: Updated claim }
 */
router.put(
  '/:claimId',
  validate(claimIdParams, 'params'),
  validate(updateClaimSchema),
  asyncHandler(claimsController.updateClaim)
);

export default router;
