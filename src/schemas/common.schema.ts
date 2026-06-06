import { z } from 'zod';

/** Reusable path-param validators. */
export const uuidParam = (name: string) =>
  z.object({ [name]: z.string().uuid(`${name} must be a valid UUID`) });

export const policyIdParams = uuidParam('policyId');
export const claimIdParams = uuidParam('claimId');
export const memberIdParams = uuidParam('memberId');
