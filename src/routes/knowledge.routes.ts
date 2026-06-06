import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate, requireMfa } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { knowledgeSearchSchema, knowledgeRetrieveSchema } from '../schemas/knowledge.schema';
import * as knowledgeController from '../controllers/knowledge.controller';

const router = Router();

router.use(authenticate, requireMfa);

/**
 * @openapi
 * /knowledge/search:
 *   post:
 *     tags: [Knowledge]
 *     summary: Search active knowledge articles
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query]
 *             properties:
 *               query: { type: string }
 *               category: { type: string, enum: [policy, procedure, faq, compliance] }
 *               tags: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Matching articles }
 */
router.post('/search', validate(knowledgeSearchSchema), asyncHandler(knowledgeController.search));

/**
 * @openapi
 * /knowledge/retrieve:
 *   post:
 *     tags: [Knowledge]
 *     summary: Retrieve full article content with citation
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [articleId]
 *             properties:
 *               articleId: { type: string, format: uuid }
 *     responses:
 *       200: { description: Article content + source_document citation }
 */
router.post(
  '/retrieve',
  validate(knowledgeRetrieveSchema),
  asyncHandler(knowledgeController.retrieve)
);

export default router;
