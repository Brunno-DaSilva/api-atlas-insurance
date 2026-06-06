import { Request } from 'express';

export type ActorType = 'member' | 'broker' | 'agent' | 'system';
export type Role = 'member' | 'broker';

/** Decoded JWT payload attached to authenticated requests. */
export interface JwtPayload {
  sub: string; // actor id
  role: Role;
  sessionId: string;
  mfaRequired?: boolean;
  mfaVerified?: boolean;
}

/** Express Request augmented with the decoded JWT and request context. */
export interface AuthedRequest extends Request {
  user?: JwtPayload;
  serviceAuthenticated?: boolean;
}

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  mfa_secret: string | null;
  created_at: string;
}

export interface Broker {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  license_number: string;
  authorized_member_ids: string[] | null;
  created_at: string;
}

export interface Policy {
  id: string;
  member_id: string;
  policy_number: string;
  policy_type: string;
  status: string;
  effective_date: string;
  expiration_date: string;
  premium_amount: number | null;
  coverage_limit: number | null;
  deductible: number | null;
  created_at: string;
}

export interface Eligibility {
  id: string;
  policy_id: string;
  eligible: boolean;
  eligibility_reason: string | null;
  source_document: string | null;
  evaluated_at: string;
}

export interface Claim {
  id: string;
  member_id: string;
  policy_id: string;
  claim_number: string;
  claim_type: string;
  status: string;
  incident_date: string;
  incident_description: string | null;
  adjuster_name: string | null;
  adjuster_email: string | null;
  next_action: string | null;
  amount_claimed: number | null;
  amount_approved: number | null;
  supporting_docs: unknown;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  source_document: string | null;
  version: string;
  active: boolean;
  created_at: string;
}

export interface AuditEvent {
  id: string;
  event_type: string;
  session_id: string | null;
  member_id: string | null;
  actor_id: string | null;
  actor_type: string | null;
  resource_type: string | null;
  resource_id: string | null;
  action: string;
  payload: unknown;
  ip_address: string | null;
  timestamp: string;
}

export interface Session {
  id: string;
  session_token: string;
  actor_id: string;
  actor_type: string;
  authenticated: boolean;
  mfa_verified: boolean;
  expires_at: string;
  created_at: string;
}
