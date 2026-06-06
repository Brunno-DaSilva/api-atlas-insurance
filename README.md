# Atlas Insurance Group — Virtual Agent API

A RESTful CRUD API backing the **Atlas Insurance Group** AI virtual agent on the
**Cognigy.AI** platform. It supports three use cases:

1. **Eligibility Verification**
2. **First Notice of Loss (FNOL)**
3. **Claim Status**

Built with **Node.js + TypeScript + Express + Supabase (PostgreSQL)**, JWT auth
with a simulated MFA step, Zod validation, and a full audit trail.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (`jsonwebtoken`) + simulated MFA |
| Validation | Zod |
| DB Client | `@supabase/supabase-js` |
| Docs | Swagger/OpenAPI (`swagger-jsdoc` + `swagger-ui-express`) |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in at minimum:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side service role key — never expose to clients)
- `JWT_SECRET`
- `INTERNAL_SERVICE_KEY` (used by Cognigy for audit logging)

### 3. Run the database migration

Open the Supabase SQL editor and run:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Seed dummy data

```bash
npm run seed
```

Seeds 3 members, 2 brokers, 4 policies, 4 eligibility records, 5 claims,
6 knowledge articles, and 5 audit events.

**Seed password for all members/brokers:** `Password123!`

| Email | Role |
|---|---|
| `jane.doe@email.com` | member |
| `robert.smith@email.com` | member |
| `maria.garcia@email.com` | member |
| `david.lee@brokers.com` | broker (authorized for Jane Doe) |
| `susan.park@brokers.com` | broker (authorized for Robert Smith) |

### 5. Start the dev server

```bash
npm run dev
```

- API: `http://localhost:3000`
- Interactive docs (Swagger UI): `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- Health check: `http://localhost:3000/health`

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run seed` | Seed dummy data into Supabase |

---

## API Overview

All responses use a standard envelope:

```json
{ "success": true, "data": { }, "error": null, "timestamp": "..." }
```

```json
{ "success": false, "data": null, "error": { "code": "NOT_FOUND", "message": "..." }, "timestamp": "..." }
```

All routes except `POST /auth/login` and `POST /auth/verify-mfa` require
`Authorization: Bearer <token>`. List endpoints support `?page=1&limit=20`.

### Auth (`/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Validate credentials → short-lived pre-MFA token |
| POST | `/auth/verify-mfa` | Verify 6-digit token → full session JWT |
| GET | `/auth/session` | Current session state |

### Policies (`/policies`, `/members`)
| Method | Path | Description |
|---|---|---|
| GET | `/policies/:policyId` | Policy + eligibility sub-object |
| GET | `/policies/:policyId/eligibility` | Eligibility (with `source_document`) |
| GET | `/members/:memberId/policies` | Member policies (`?status=`) |

### Claims (`/claims`, `/members`)
| Method | Path | Description |
|---|---|---|
| GET | `/claims/:claimId` | Full claim record |
| GET | `/members/:memberId/claims` | Member claims (`?status=`, paginated) |
| POST | `/claims` | File FNOL → auto `CLM-YYYY-NNN` number |
| PUT | `/claims/:claimId` | Partial update |

### Knowledge (`/knowledge`)
| Method | Path | Description |
|---|---|---|
| POST | `/knowledge/search` | Case-insensitive search (active articles only) |
| POST | `/knowledge/retrieve` | Full article + `source_document` citation |

### Audit (`/audit`)
| Method | Path | Description |
|---|---|---|
| POST | `/audit/events` | Record event (Bearer JWT **or** `x-service-key`) |
| GET | `/audit/interactions` | List events (supervisor/service key) |
| GET | `/audit/tool-executions` | List `tool_execution` events |

---

## Auth Flow (two-step MFA)

```
POST /auth/login        { email, password, role }      → { token (pre-MFA), sessionId }
POST /auth/verify-mfa   { sessionId, mfaToken: "123456" } → { token (full session JWT) }
```

For dummy data, any 6-digit numeric token is accepted at the MFA step.

Example:

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane.doe@email.com","password":"Password123!","role":"member"}'

# 2. Verify MFA (use sessionId from step 1)
curl -X POST http://localhost:3000/auth/verify-mfa \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<sessionId>","mfaToken":"123456"}'

# 3. Use the returned token
curl http://localhost:3000/members/<memberId>/policies \
  -H "Authorization: Bearer <token>"
```

---

## Cognigy Integration

1. **Auth:** `POST /auth/login` → store JWT in context → `POST /auth/verify-mfa` → store full token.
2. **Pass JWT** as `Authorization: Bearer {{context.authToken}}` on all calls.
3. **FNOL:** `POST /claims` → capture `claim_number` → surface to member.
4. **Knowledge:** `POST /knowledge/search` → cite `source_document` in the response.
5. **Audit:** After each tool execution, fire `POST /audit/events` with `eventType: "tool_execution"`
   (using the `x-service-key` header for service-to-service auth).

---

## Project Structure

```
src/
├── config/        # env, supabase client, swagger spec
├── middleware/    # auth, validate, errorHandler
├── routes/        # express routers (+ OpenAPI annotations)
├── controllers/   # request/response handling + audit logging
├── services/      # business logic + Supabase queries
├── schemas/       # Zod request schemas
├── utils/         # response envelope, AppError, pagination, jwt, asyncHandler
├── types/         # shared TypeScript interfaces
├── seed/          # dummy data seeder
└── app.ts         # app assembly + route registration
supabase/migrations/001_initial_schema.sql
```

---

## Security Notes

- `helmet()` secure headers; `cors()` with an explicit origin allowlist (`CORS_ORIGINS`).
- Auth endpoints are rate-limited (`express-rate-limit`).
- All path params validated as UUIDs via Zod before any DB query.
- Passwords hashed with `bcryptjs`; secrets and tokens are never logged.
- `audit_events` is append-only — no DELETE/UPDATE endpoint is exposed (FR-038).
- The Supabase **service role key** is server-side only.

---

## Deployment

Deployable to any Node host (Railway, Render, Fly.io, Azure App Service). Required
production env vars: `PORT`, `NODE_ENV=production`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`.

```bash
npm run build && npm start
```
