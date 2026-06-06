import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { loginSchema, verifyMfaSchema } from '../schemas/auth.schema';
import * as authController from '../controllers/auth.controller';

const router = Router();

// Rate limit auth endpoints to mitigate brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate credentials (step 1 of MFA flow)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *               role: { type: string, enum: [member, broker] }
 *     responses:
 *       200: { description: Pre-MFA token issued }
 *       401: { description: Invalid credentials }
 */
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));

/**
 * @openapi
 * /auth/verify-mfa:
 *   post:
 *     tags: [Auth]
 *     summary: Verify MFA token (step 2) and issue the full session JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, mfaToken]
 *             properties:
 *               sessionId: { type: string, format: uuid }
 *               mfaToken: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Full session token issued }
 */
router.post(
  '/verify-mfa',
  authLimiter,
  validate(verifyMfaSchema),
  asyncHandler(authController.verifyMfa)
);

/**
 * @openapi
 * /auth/session:
 *   get:
 *     tags: [Auth]
 *     summary: Return current session state
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Session state }
 *       401: { description: Unauthorized }
 */
router.get('/session', authenticate, asyncHandler(authController.getSession));

export default router;
