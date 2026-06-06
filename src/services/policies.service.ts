import { supabase } from '../config/supabase';
import { AppError } from '../utils/AppError';
import { Eligibility, Policy } from '../types';
import { Pagination } from '../utils/pagination';

export async function getPolicyById(policyId: string): Promise<Policy & { eligibility: Eligibility | null }> {
  const { data: policy, error } = await supabase
    .from('policies')
    .select('*')
    .eq('id', policyId)
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to fetch policy: ${error.message}`);
  if (!policy) throw AppError.notFound('Policy not found');

  const eligibility = await getEligibilityByPolicy(policyId, false);
  return { ...(policy as Policy), eligibility };
}

export async function getEligibilityByPolicy(
  policyId: string,
  throwIfMissing = true
): Promise<Eligibility | null> {
  const { data, error } = await supabase
    .from('eligibility')
    .select('*')
    .eq('policy_id', policyId)
    .order('evaluated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw AppError.internal(`Failed to fetch eligibility: ${error.message}`);
  if (!data && throwIfMissing) throw AppError.notFound('Eligibility record not found for policy');
  return (data as Eligibility) ?? null;
}

export async function getMemberPolicies(
  memberId: string,
  status: string | undefined,
  pagination: Pagination
): Promise<{ items: Policy[]; total: number }> {
  let query = supabase
    .from('policies')
    .select('*', { count: 'exact' })
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query.range(pagination.from, pagination.to);
  if (error) throw AppError.internal(`Failed to fetch member policies: ${error.message}`);

  return { items: (data as Policy[]) ?? [], total: count ?? 0 };
}
