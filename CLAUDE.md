# CLAUDE.md — Atlas Insurance Group Virtual Agent API

## Project Overview

Build and deploy a RESTful CRUD API for **Atlas Insurance Group**, a fictitious multinational insurance provider. This API backs an AI virtual agent deployed on the **Cognigy.AI** platform, supporting voice and digital channels for member servicing.

The API must support three Cognigy use cases:
1. **Eligibility Verification**
2. **First Notice of Loss (FNOL)**
3. **Claim Status**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Auth Middleware | JWT (jsonwebtoken) |
| Validation | Zod |
| ORM/Query | Supabase JS Client (`@supabase/supabase-js`) |
| Dev Tools | ts-node-dev, dotenv |
| API Docs | Swagger/OpenAPI via swagger-jsdoc + swagger-ui-express |

---

## Project Structure

```
atlas-insurance-api/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client init
│   ├── middleware/
│   │   ├── auth.ts              # JWT auth middleware
│   │   ├── errorHandler.ts      # Global error handler
│   │   └── validate.ts          # Zod request validation
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── policies.routes.ts
│   │   ├── claims.routes.ts
│   │   ├── knowledge.routes.ts
│   │   └── audit.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── policies.controller.ts
│   │   ├── claims.controller.ts
│   │   ├── knowledge.controller.ts
│   │   └── audit.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── policies.service.ts
│   │   ├── claims.service.ts
│   │   ├── knowledge.service.ts
│   │   └── audit.service.ts
│   ├── schemas/
│   │   ├── auth.schema.ts
│   │   ├── claims.schema.ts
│   │   └── knowledge.schema.ts
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── seed/
│   │   └── seed.ts              # Supabase dummy data seeder
│   └── app.ts                   # Express app + route registration
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Environment Variables

Create `.env` from the template below:

```
# .env.example
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=atlas-super-secret-key
JWT_EXPIRY=1h
MFA_TOKEN_EXPIRY=5m
```

---

## Database Schema (Supabase / PostgreSQL)

Create this file at `supabase/migrations/001_initial_schema.sql` and run it in the Supabase SQL editor.

```sql
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
```

---

## Dummy Seed Data

Create `src/seed/seed.ts`. Run with `npx ts-node src/seed/seed.ts`.

The seeder must insert:

### Members (3 records)
```
- Jane Doe | jane.doe@email.com | member
- Robert Smith | robert.smith@email.com | member
- Maria Garcia | maria.garcia@email.com | member
```

### Brokers (2 records)
```
- David Lee | david.lee@brokers.com | license: BRK-001 | authorized for Jane Doe
- Susan Park | susan.park@brokers.com | license: BRK-002 | authorized for Robert Smith
```

### Policies (4 records)
```
- Jane Doe   | POL-AUTO-001 | auto   | active  | 2024-01-01 → 2025-01-01 | $1,200/yr | $100k limit
- Jane Doe   | POL-HOME-001 | home   | active  | 2024-03-01 → 2025-03-01 | $2,400/yr | $300k limit
- Robert     | POL-HLTH-001 | health | active  | 2024-06-01 → 2025-06-01 | $4,800/yr | $500k limit
- Maria      | POL-LIFE-001 | life   | inactive| 2022-01-01 → 2023-01-01 | $600/yr   | $1M limit
```

### Eligibility (4 records — one per policy)

### Claims (5 records)
```
- CLM-2024-001 | Jane Doe   | auto  | under_review | Adjuster: Tom Brady
- CLM-2024-002 | Jane Doe   | home  | approved     | Adjuster: Alice Chen
- CLM-2024-003 | Robert     | health| submitted    | Adjuster: unassigned
- CLM-2024-004 | Robert     | health| denied       | Adjuster: Mike Ross
- CLM-2024-005 | Maria      | life  | closed       | Adjuster: Sarah Kim
```

### Knowledge Articles (6 records)
```
- "Auto Policy Coverage Overview"        | category: policy
- "Home Insurance Claim Process"         | category: procedure
- "Health Deductible FAQ"                | category: faq
- "FNOL Submission Requirements"         | category: procedure
- "Broker Authorization Policy"          | category: compliance
- "Claims Appeals Process"               | category: procedure
```

### Audit Events (seed 5 sample events covering auth, tool_execution, knowledge_retrieval)

Use `bcrypt` to hash passwords. Seed password for all members/brokers: `Password123!`

---

## API Implementation Instructions

### Global Conventions

- All responses use this envelope:
```json
{
  "success": true,
  "data": { },
  "error": null,
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- All errors:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "NOT_FOUND", "message": "Policy not found" },
  "timestamp": "2024-01-01T00:00:00Z"
}
```
- HTTP status codes must be semantically correct (200, 201, 400, 401, 403, 404, 500)
- All routes except `POST /auth/login` and `POST /auth/verify-mfa` require a valid JWT in `Authorization: Bearer <token>`
- Paginate list endpoints with `?page=1&limit=20` query params

---

### Route 1 — Identity API (`/auth`)

#### `POST /auth/login`
- Body: `{ email, password, role }` — role is `"member"` or `"broker"`
- Validate credentials against `members` or `brokers` table
- On success: create a session record, return a short-lived JWT with `{ sub, role, sessionId, mfaRequired: true }`
- Do NOT return full auth token yet — MFA step is required
- Log audit event: `auth.login_attempt`

#### `POST /auth/verify-mfa`
- Body: `{ sessionId, mfaToken }`
- For dummy data: accept any 6-digit numeric token as valid (simulate MFA)
- On success: update session `mfa_verified = true`, return full JWT
- Log audit event: `auth.mfa_verified`

#### `GET /auth/session`
- Requires Bearer JWT
- Return current session state from `sessions` table
- Log audit event: `auth.session_check`

---

### Route 2 — Policy API (`/policies`, `/members`)

#### `GET /policies/:policyId`
- Requires auth
- Return full policy record
- Include eligibility sub-object

#### `GET /policies/:policyId/eligibility`
- Requires auth
- Return eligibility record for that policy
- Include `source_document` and `eligibility_reason` fields (FR-007, FR-008)

#### `GET /members/:memberId/policies`
- Requires auth
- Return all policies for a member
- Support `?status=active` filter

---

### Route 3 — Claims API (`/claims`, `/members`)

#### `GET /claims/:claimId`
- Requires auth
- Return full claim record including `adjuster_name`, `adjuster_email`, `next_action`, `supporting_docs`

#### `GET /members/:memberId/claims`
- Requires auth
- Return all claims for the member
- Support pagination and `?status=` filter

#### `POST /claims`
- Requires auth
- Body (Zod-validated):
```json
{
  "memberId": "uuid",
  "policyId": "uuid",
  "claimType": "auto|home|health|life",
  "incidentDate": "YYYY-MM-DD",
  "incidentDescription": "string"
}
```
- Generate a unique `claim_number` (format: `CLM-YYYY-NNN`)
- Set initial status to `"submitted"`
- Log audit event: `claim.created`
- Return 201 with new claim including `claim_number` (FR-016)

#### `PUT /claims/:claimId`
- Requires auth
- Partial update: allow updating `status`, `adjuster_name`, `adjuster_email`, `next_action`, `amount_approved`, `supporting_docs`
- Set `updated_at` timestamp
- Log audit event: `claim.updated`

---

### Route 4 — Knowledge Retrieval API (`/knowledge`)

#### `POST /knowledge/search`
- Requires auth
- Body: `{ query: string, category?: string, tags?: string[] }`
- Perform a case-insensitive full-text search on `title` + `content` + `tags`
- Return matching articles with `id`, `title`, `category`, `source_document`, `tags`
- Results must only come from `active = true` articles (FR-020)
- Log audit event: `knowledge.search`

#### `POST /knowledge/retrieve`
- Requires auth
- Body: `{ articleId: string }`
- Return full article content
- Include `source_document` citation in response (FR-021)
- Log audit event: `knowledge.retrieve`

---

### Route 5 — Audit API (`/audit`)

#### `POST /audit/events`
- Accepts Bearer JWT **or** internal service key header `x-service-key`
- Body (Zod-validated):
```json
{
  "eventType": "string",
  "sessionId": "string",
  "actorId": "uuid",
  "actorType": "member|broker|agent|system",
  "resourceType": "string",
  "resourceId": "string",
  "action": "string",
  "payload": {}
}
```
- Insert into `audit_events`
- Return 201 with the created event id

#### `GET /audit/interactions`
- Requires auth (supervisor role or service key)
- Supports filters: `?actorId=`, `?sessionId=`, `?from=`, `?to=`
- Returns paginated list of audit events

#### `GET /audit/tool-executions`
- Requires auth (supervisor role or service key)
- Returns audit events where `event_type = 'tool_execution'`
- Supports same filters as above

---

## Middleware Implementation

### `src/middleware/auth.ts`
```typescript
// Decode JWT from Authorization header
// Attach decoded payload to req.user
// Return 401 if missing or invalid
// Return 401 if session is expired
```

### `src/middleware/validate.ts`
```typescript
// Accept a Zod schema
// Validate req.body against it
// Return 400 with field-level errors if invalid
```

### `src/middleware/errorHandler.ts`
```typescript
// Catch all unhandled errors
// Log to console in dev
// Return standardized error envelope
// Never expose stack traces in production
```

---

## Supabase Client (`src/config/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

Use the **service role key** server-side so Row Level Security does not block operations. Never expose this key to clients.

---

## package.json Scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "seed": "ts-node src/seed/seed.ts",
    "lint": "eslint src/**/*.ts"
  }
}
```

---

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Dependencies to Install

```bash
npm install express @supabase/supabase-js jsonwebtoken bcryptjs zod dotenv cors helmet
npm install -D typescript ts-node-dev @types/express @types/node @types/jsonwebtoken @types/bcryptjs
```

---

## Cognigy Integration Notes

When consuming these endpoints from Cognigy HTTP Request nodes:

1. **Auth flow**: Call `POST /auth/login` → store JWT in context → call `POST /auth/verify-mfa` → store full token
2. **Pass JWT** as `Authorization: Bearer {{context.authToken}}` header on all subsequent calls
3. **Session ID** should be stored in `context.sessionId` and forwarded with audit events
4. **FNOL flow**: `POST /claims` → capture `claim_number` from response → surface to member (FR-016)
5. **Knowledge search**: `POST /knowledge/search` with the member's query → retrieve top result → cite `source_document` in response (FR-021)
6. **Audit logging**: After every tool execution in Cognigy, fire `POST /audit/events` with `event_type: "tool_execution"` (FR-029, FR-035)

---

## Compliance Requirements Mapping (from FRD)

| FR | Requirement | Implementation |
|---|---|---|
| FR-001/002 | MFA authentication | `/auth/login` + `/auth/verify-mfa` two-step flow |
| FR-003 | Broker authorization | Broker table with `authorized_member_ids` array |
| FR-004 | Session state | `sessions` table, JWT carries `sessionId` |
| FR-007/008 | Eligibility with source | `eligibility.source_document` + `eligibility_reason` fields |
| FR-016 | Claim reference number | Auto-generated `claim_number` on POST /claims |
| FR-020/021 | Restrict to enterprise content + cite | Knowledge API returns only active articles with `source_document` |
| FR-029/034/035/036/037 | Full audit trail | Every endpoint writes to `audit_events` |
| FR-038 | Retention | Audit events are append-only; no DELETE endpoint exposed |

---

## Security Best Practices

- Use `helmet()` middleware to set secure HTTP headers
- Use `cors()` with an explicit origin allowlist
- Never log JWT secrets or passwords
- Rate limit auth endpoints using `express-rate-limit`
- All IDs are UUIDs — never use sequential integers in URLs
- Validate all path params with Zod `.uuid()` before querying DB
- The `audit_events` table has no DELETE or UPDATE endpoint — append-only by design

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# 3. Run migrations in Supabase SQL editor (supabase/migrations/001_initial_schema.sql)

# 4. Seed dummy data
npm run seed

# 5. Start dev server
npm run dev
# API available at http://localhost:3000
```

---

## Deployment

The API can be deployed to any Node.js-compatible host (Railway, Render, Fly.io, or Azure App Service). Supabase handles the database — no self-hosted Postgres required.

Recommended: deploy to **Railway** for simplest zero-config Node.js + environment variable management.

Environment variables required in production:
- `PORT`
- `NODE_ENV=production`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
