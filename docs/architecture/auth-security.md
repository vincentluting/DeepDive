---
title: Authentication & Security
category: architecture
sources:
  - lib/api/api-guard.ts
  - lib/auth/users.ts
  - lib/auth/passwords.ts
  - lib/auth/csrf-client.ts
  - proxy.ts
sync_mode: partial
last_verified: 2026-04-13
verified_by: claude-code
---

# Authentication & Security

## Authentication

- **Password hashing**: bcrypt with 12 salt rounds (`lib/auth/passwords.ts`)
- **Sessions**: Server-side sessions with 30-day expiry
- **Session storage**: Database-backed (Neon Postgres)

## CSRF Protection

Double-submit cookie pattern:

- Server sets a CSRF token cookie
- Client includes it in request headers
- Server validates cookie matches header

**Bearer token requests skip CSRF** (API clients).

**CSRF-exempt endpoints** (can't set custom headers, or use external signatures):

- `/api/analytics/duration` — sendBeacon
- `/api/analytics/report-engagement` — sendBeacon
- `/api/analytics/event` — sendBeacon
- `/api/session/save-beacon` — sendBeacon
- `/api/coaching-save-beacon` — sendBeacon
- `/api/auth/oauth/callback` — OAuth redirect
- `/api/stripe/webhook` — Stripe signature header

Client-side CSRF helper: `lib/auth/csrf-client.ts`.

## API Route Protection

`guardRoute(request, { tier })` in `lib/api/api-guard.ts`.

Combines authentication check + rate limiting in a single guard call.

### Guard Tiers

| Tier        | Anonymous Rate | Authenticated Rate | Notes                                                                 |
| ----------- | -------------- | ------------------ | --------------------------------------------------------------------- |
| `ai`        | 10/hour        | 20/hour            | LLM-backed endpoints                                                  |
| `auth`      | 10/min         | 10/min             | Login/register brute-force protection                                 |
| `write`     | 30/min         | 120/min            | Data mutations (raised for rapid DD answer saves)                     |
| `read`      | 60/min         | 120/min            | Data read endpoints                                                   |
| `admin`     | 60/min         | 60/min             | Admin-only, requires `isAdmin`                                        |
| `telemetry` | 120/min        | 240/min            | Fire-and-forget funnel/page-view events; silently dropped if exceeded |

### Usage Pattern

```typescript
const guard = await guardRoute(request, { tier: "write" });
if (guard.blocked) return guard.response;
// guard.user is available (null for anonymous)
// GuardUser type: { id, email, name?, isAdmin?, cohort?, researchGroup? }
```

### Two-Layer Rate Limiting

1. **Redis rate limiting** (persistent across instances): Applied first for high-cost routes via `isHighCostRoute()` and `checkHighCostRateLimit()` from `lib/api/rate-limit-redis.ts`. Uses `user:{id}` or `ip:{ip}` as identifier.
2. **In-memory rate limiting** (standard): Applied to all endpoints via `checkRateLimit()` from `lib/api/rate-limit.ts`.

## Proxy (`proxy.ts`, 原 middleware.ts — Next.js 16 convention)

Handles (in order):

1. **Bot detection** (Layer 0): `classifyRequest()` from `lib/security/bot-detection.ts`. Blocked bots get an opaque 403. Machine-authenticated requests (`/api/cron/`, `/api/health/` with Bearer token) bypass bot detection since their callers (Vercel cron, external monitors) cannot provide browser-like headers.
2. **CSRF validation** (with exemption list)
3. **Route redirects** (`/quickexplore` → `/quickdive`, `/questionnaire` → `/deepdive`, inactive locale redirects)
4. **i18n locale detection** (cookie → Accept-Language → default)
5. **Analytics tracking setup** (page visit via `after()`, visit-id/visit-session-id cookies)
6. **Anti-scraping headers**: `X-Robots-Tag: noai, noimageai` on all responses

## User Model (`lib/auth/users.ts`)

The `User` interface includes research/cohort fields:

- `researchGroup`: `'classic' | 'immersive' | null`
- `researchParticipantId`, `researchConsentAt`: Research study tracking
- `cohort`: Entitlement cohort for feature gating

`createUser()` accepts optional `registrationIp` and `careerStage` parameters. Registration IP is geo-resolved asynchronously via `resolveIpCountry()` (ipapi.co HTTPS, free tier 1k/day, 3s timeout) and stored as `registrationCountry`.

`authenticateUser()` includes timing-attack protection (dummy bcrypt comparison on unknown email) and transparent hash upgrade (legacy SHA-256 to bcrypt on successful login).

## Database Security

All database operations go through parameterized queries via `lib/db/connection.ts`. No raw SQL string interpolation.
