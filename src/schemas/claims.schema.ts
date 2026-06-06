import { z } from 'zod';

const claimType = z.enum(['auto', 'home', 'health', 'life']);
const claimStatus = z.enum(['submitted', 'under_review', 'approved', 'denied', 'closed']);

const supportingDoc = z.object({
  filename: z.string(),
  url: z.string().url(),
  uploaded_at: z.string(),
});

export const createClaimSchema = z.object({
  memberId: z.string().uuid(),
  policyId: z.string().uuid(),
  claimType,
  incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'incidentDate must be YYYY-MM-DD'),
  incidentDescription: z.string().min(1),
});

export const updateClaimSchema = z
  .object({
    status: claimStatus.optional(),
    adjusterName: z.string().optional(),
    adjusterEmail: z.string().email().optional(),
    nextAction: z.string().optional(),
    amountApproved: z.number().nonnegative().optional(),
    supportingDocs: z.array(supportingDoc).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateClaimInput = z.infer<typeof createClaimSchema>;
export type UpdateClaimInput = z.infer<typeof updateClaimSchema>;
