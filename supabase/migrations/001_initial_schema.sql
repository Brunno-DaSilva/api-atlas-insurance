-- Atlas Insurance Group — Initial Schema
-- Run this in the Supabase SQL editor.

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  mfa_secret TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brokers
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  license_number TEXT NOT NULL,
  authorized_member_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policies
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  policy_number TEXT UNIQUE NOT NULL,
  policy_type TEXT NOT NULL,           -- 'auto', 'home', 'health', 'life'
  status TEXT NOT NULL,                -- 'active', 'inactive', 'pending'
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  premium_amount NUMERIC(10,2),
  coverage_limit NUMERIC(12,2),
  deductible NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Eligibility
CREATE TABLE eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(id),
  eligible BOOLEAN NOT NULL,
  eligibility_reason TEXT,
  source_document TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id),
  policy_id UUID REFERENCES policies(id),
  claim_number TEXT UNIQUE NOT NULL,
  claim_type TEXT NOT NULL,            -- 'auto', 'home', 'health', 'life'
  status TEXT NOT NULL,                -- 'submitted', 'under_review', 'approved', 'denied', 'closed'
  incident_date DATE NOT NULL,
  incident_description TEXT,
  adjuster_name TEXT,
  adjuster_email TEXT,
  next_action TEXT,
  amount_claimed NUMERIC(12,2),
  amount_approved NUMERIC(12,2),
  supporting_docs JSONB,               -- array of { filename, url, uploaded_at }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE knowledge_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,              -- 'policy', 'procedure', 'faq', 'compliance'
  tags TEXT[],
  source_document TEXT,
  version TEXT DEFAULT '1.0',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Events
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,            -- 'auth', 'tool_execution', 'knowledge_retrieval', 'claim_action'
  session_id TEXT,
  member_id UUID,
  actor_id UUID,                       -- member or broker id
  actor_type TEXT,                     -- 'member', 'broker', 'agent', 'system'
  resource_type TEXT,                  -- 'claim', 'policy', 'session', 'knowledge'
  resource_id TEXT,
  action TEXT NOT NULL,
  payload JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL,
  authenticated BOOLEAN DEFAULT FALSE,
  mfa_verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_policies_member_id ON policies(member_id);
CREATE INDEX idx_claims_member_id ON claims(member_id);
CREATE INDEX idx_eligibility_policy_id ON eligibility(policy_id);
CREATE INDEX idx_audit_events_actor_id ON audit_events(actor_id);
CREATE INDEX idx_audit_events_session_id ON audit_events(session_id);
CREATE INDEX idx_audit_events_event_type ON audit_events(event_type);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
