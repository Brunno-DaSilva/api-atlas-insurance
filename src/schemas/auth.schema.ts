import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['member', 'broker']),
});

export const verifyMfaSchema = z.object({
  sessionId: z.string().uuid(),
  mfaToken: z
    .string()
    .regex(/^\d{6}$/, 'MFA token must be a 6-digit numeric code'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>;
