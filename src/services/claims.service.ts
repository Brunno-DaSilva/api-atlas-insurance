import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { Claim } from '../types';
import { Pagination } from '../utils/pagination';
import { CreateClaimInput, UpdateClaimInput } from '../schemas/claims.schema';

export async function getClaimById(claimId: string): Promise<Claim> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id', claimId)
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to fetch claim: ${error.message}`);
  if (!data) throw AppError.notFound('Claim not found');
  return data as Claim;
}

export async function getMemberClaims(
  memberId: string,
  status: string | undefined,
  pagination: Pagination
): Promise<{ items: Claim[]; total: number }> {
  let query = supabase
    .from('claims')
    .select('*', { count: 'exact' })
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query.range(pagination.from, pagination.to);
  if (error) throw AppError.internal(`Failed to fetch member claims: ${error.message}`);

  return { items: (data as Claim[]) ?? [], total: count ?? 0 };
}

/** Generate the next claim number in the format CLM-YYYY-NNN for the current year. */
async function generateClaimNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;

  const { data, error } = await supabase
    .from('claims')
    .select('claim_number')
    .like('claim_number', `${prefix}%`)
    .order('claim_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to generate claim number: ${error.message}`);

  let next = 1;
  if (data?.claim_number) {
    const seq = parseInt(data.claim_number.slice(prefix.length), 10);
    if (!Number.isNaN(seq)) next = seq + 1;
  }
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export async function createClaim(input: CreateClaimInput): Promise<Claim> {
  // Validate referenced policy exists and belongs to the member.
  const { data: policy, error: policyError } = await supabase
    .from('policies')
    .select('id, member_id')
    .eq('id', input.policyId)
    .maybeSingle();

  if (policyError) throw AppError.internal('Failed to validate policy');
  if (!policy) throw AppError.notFound('Referenced policy not found');
  if (policy.member_id !== input.memberId) {
    throw AppError.badRequest('Policy does not belong to the specified member');
  }

  const claimNumber = await generateClaimNumber();

  const { data, error } = await supabase
    .from('claims')
    .insert({
      member_id: input.memberId,
      policy_id: input.policyId,
      claim_number: claimNumber,
      claim_type: input.claimType,
      status: 'submitted',
      incident_date: input.incidentDate,
      incident_description: input.incidentDescription,
    })
    .select()
    .single();

  if (error) throw AppError.internal(`Failed to create claim: ${error.message}`);
  return data as Claim;
}

export async function updateClaim(claimId: string, input: UpdateClaimInput): Promise<Claim> {
  // Ensure the claim exists first for a clean 404.
  await getClaimById(claimId);

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status !== undefined) update.status = input.status;
  if (input.adjusterName !== undefined) update.adjuster_name = input.adjusterName;
  if (input.adjusterEmail !== undefined) update.adjuster_email = input.adjusterEmail;
  if (input.nextAction !== undefined) update.next_action = input.nextAction;
  if (input.amountApproved !== undefined) update.amount_approved = input.amountApproved;
  if (input.supportingDocs !== undefined) update.supporting_docs = input.supportingDocs;

  const { data, error } = await supabase
    .from('claims')
    .update(update)
    .eq('id', claimId)
    .select()
    .single();

  if (error) throw AppError.internal(`Failed to update claim: ${error.message}`);
  return data as Claim;
}
