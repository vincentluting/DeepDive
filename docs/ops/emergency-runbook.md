# Deep Dive Emergency Runbook

> **This document is for emergencies.** When something breaks, open this page and follow the steps.
> Keep this link saved somewhere you can always find it (phone notes, bookmarks bar).

---

## Key Service Logins

Fill in your login URLs below:

| Service | URL | What it does |
|---------|-----|-------------|
| **Vercel Dashboard** | `[YOUR_VERCEL_URL]` | Where the website is hosted. Deploy, rollback, environment variables |
| **Neon Console** | `[YOUR_NEON_URL]` | The database. User data, reports, sessions |
| **Sentry Dashboard** | `[YOUR_SENTRY_URL]` | Error tracking. See what broke and when |
| **GitHub Repository** | `[YOUR_GITHUB_URL]` | Source code |
| **Domain Manager** | `[YOUR_DOMAIN_URL]` | DNS settings for deepdive.careers |
| **OpenAI Dashboard** | https://platform.openai.com | API usage and billing |
| **Anthropic Console** | https://console.anthropic.com | API usage and billing |

---

## Scenario 1: Website Completely Down

**Symptoms**: Users see a blank page, error page, or "This site can't be reached"

### Step 1: Check Vercel

1. Open your **Vercel Dashboard**
2. Go to your Deep Dive project
3. Click **"Deployments"** in the left sidebar
4. Look at the **most recent deployment** at the top:
   - **Green checkmark** = Deployment is fine, problem is elsewhere → Go to Step 2
   - **Red X** = Deployment failed → **Rollback** (see below)

**How to Rollback:**
1. In the Deployments list, find the **last deployment with a green checkmark**
2. Click the **three dots (...)** on the right side of that deployment
3. Click **"Promote to Production"**
4. Wait 30 seconds. The website should be back.

### Step 2: Check Database

1. Open **Neon Console**
2. Look at the dashboard — is there any red warning?
3. Click on your project → **"Branches"** → your main branch should show "Active"
4. If the branch says "Suspended" or shows an error:
   - Neon free tier may have hit compute limits — wait or upgrade
   - If data looks corrupted → See Scenario 3

### Step 3: Check DNS

1. Open a new browser tab and go to your domain
2. If you see "DNS_PROBE_FINISHED_NXDOMAIN":
   - Open your **Domain Manager**
   - Make sure the DNS records still point to Vercel
   - Changes take up to 48 hours to propagate

---

## Scenario 2: Report Generation Failing

**Symptoms**: Users click "Generate Report" but see an error, infinite loading, or timeout

### Step 1: Check Sentry

1. Open **Sentry Dashboard**
2. In the search bar, type `generate-report`
3. Look at recent errors:
   - **"AI_TIMEOUT"** or **"AI_SERVICE_ERROR"** → AI provider is down, go to Step 2
   - **"DB_CONSTRAINT_FAILED"** → Database issue, go to Step 3
   - Other errors → Screenshot them and share with Claude Code

### Step 2: Check AI Provider Status

1. Open https://status.openai.com — is everything green?
2. Open https://status.anthropic.com — is everything green?
3. If either shows issues:
   - **Anthropic is down**: `profile-narrative` / `integration` can fall back to Gemini, but coaching chat has no low-quality fallback and will error explicitly. Reports may still generate.
   - **OpenAI is down**: Structured tasks (`career-pathway`, `memory-extract`, `coaching-summary`) may fall back to Gemini if `GOOGLE_API_KEY` is set; otherwise they fail.
   - **Both are down**: Reports cannot be generated. Wait for at least one to recover.

### Step 3: Check Database

1. Open **Neon Console** → check if compute is active
2. If there are connection errors, the database may need to wake from sleep (Neon free tier suspends after inactivity)
3. Try loading any other page on the site — if the whole site works, it's likely an AI issue, not DB

---

## Scenario 3: Suspect Data Loss

**Symptoms**: Users report missing reports, profiles, or assessment results

### IMPORTANT: Do NOT make changes directly. Follow these steps carefully.

### Step 1: Verify the Issue

1. Open **Admin Panel** on your site (login as admin)
2. Search for the affected user
3. Check if their data actually exists — sometimes it's a display bug, not data loss

### Step 2: Point-in-Time Recovery (if data is truly missing)

Neon supports "branching from a point in time" — this creates a copy of your database as it was at a specific moment, without affecting the live database.

1. Open **Neon Console**
2. Go to your project → **"Branches"**
3. Click **"Create Branch"**
4. Select **"From a point in time"**
5. Pick a date/time **before** the data was lost
6. Give it a name like `recovery-2026-03-08`
7. This creates a new branch with old data — your live database is NOT affected
8. Connect to this branch and verify the data exists
9. If you need to restore data, copy the specific records from the recovery branch to the main branch
10. If unsure, contact Neon support for help

### DO NOT:
- Delete the main branch
- Run any "TRUNCATE" or "DROP" commands
- Reset the main branch to the recovery point (this would lose any data created after that point)

---

## Scenario 4: LLM Costs Suddenly Spiking

**Symptoms**: Unexpectedly high bills from OpenAI or Anthropic

### Step 1: Check the Admin Panel

1. Open your site's Admin Panel
2. Go to the **"AI Usage"** tab
3. Look at:
   - Which **task** has abnormally high call counts?
   - Is there a spike on a specific day?
   - Are there many **degraded** calls (which means tasks are using their approved fallback chain)?

### Step 2: Check for Abuse

- If one task has thousands of calls → someone may be abusing an API endpoint
- Common target: `/api/coaching-chat` (each message costs tokens)

### Step 3: Emergency Cost Reduction

**Option A — Disable Anthropic (cuts premium narrative cost, but coaching chat breaks):**
1. Go to **Vercel Dashboard** → Settings → Environment Variables
2. **Delete** `ANTHROPIC_API_KEY` (don't delete, just clear the value)
3. Redeploy — `profile-narrative` / `integration` can fall back to Gemini, but `coaching` / `coaching-first` will stop working

**Option B — Switch to cheaper models:**
1. Go to Vercel → Environment Variables
2. Set `OPENAI_MODEL` to `gpt-4o-mini` (already the default, cheapest option)
3. Set `ANTHROPIC_MODEL` to a cheaper Claude model if available

**Option C — Nuclear option (disable all AI):**
1. Delete both `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` from Vercel env vars
2. Redeploy — all AI features will return errors, but the cost stops immediately
3. The site still works for non-AI features (Quick Dive, viewing existing reports)

---

## Scenario 5: Need to Rollback Code

**Symptoms**: You deployed a bad code change and need to go back

### Vercel Instant Rollback (Recommended)

This is the fastest and safest option. It doesn't change your code — it just points traffic to an older version.

1. Open **Vercel Dashboard** → Deployments
2. Find the last **working** deployment (green checkmark, before the bad one)
3. Click the **three dots (...)** → **"Promote to Production"**
4. Done. Traffic is now going to the old version.
5. The bad code is still in your git repo but not running. Fix it later.

### Revert via Git (if you need to permanently undo)

Tell Claude Code:
> "Please revert the last commit and push to main"

---

## All Environment Variables

| Variable | Required? | What it does | If missing... | Cost? |
|----------|-----------|-------------|--------------|-------|
| `POSTGRES_URL` | **Yes** | Database connection | Site completely broken | Neon billing |
| `DATABASE_URL` | No | Fallback for POSTGRES_URL | Uses POSTGRES_URL instead | — |
| `POSTGRES_PRISMA_URL` | No | Fallback for POSTGRES_URL | Uses POSTGRES_URL instead | — |
| `POSTGRES_URL_NON_POOLING` | No | Fallback for POSTGRES_URL | Uses POSTGRES_URL instead | — |
| `OPENAI_API_KEY` | **Yes** | OpenAI API access | Structured AI tasks try Gemini fallback if available; otherwise fail | **OpenAI billing** |
| `ANTHROPIC_API_KEY` | No | Anthropic API access | `profile/integration` try Gemini fallback; coaching chat has no low-quality fallback | **Anthropic billing** |
| `ANTHROPIC_MODEL` | No | Which Claude model to use | Uses `claude-sonnet-4-5-20250929` | — |
| `OPENAI_MODEL` | No | Which GPT model to use | Uses `gpt-4o-mini` | — |
| `AUTH_SECRET` | **Yes** | Encrypts passwords and sessions | Login broken, existing sessions invalid | — |
| `SESSION_SECRET` | No | Admin bootstrap token | Falls back to AUTH_SECRET | — |
| `CRON_SECRET` | **Yes** | Authenticates scheduled jobs | Cron jobs (daily scan, analytics refresh) stop running | — |
| `SENTRY_DSN` | No | Error tracking | No error alerts — you're flying blind | Free tier |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Client-side error tracking | Client errors not captured | Free tier |
| `SENTRY_AUTH_TOKEN` | No | Uploads source maps | Error stack traces are unreadable | — |
| `SENTRY_ORG` | No | Sentry organization | Source maps not uploaded | — |
| `SENTRY_PROJECT` | No | Sentry project | Source maps not uploaded | — |
| `ADMIN_EMAILS` | No | Auto-promote admin users | Must manually promote admins via API | — |
| `NEXT_PUBLIC_APP_URL` | No | Public URL for share links | Defaults to deepdive.careers | — |
| `EXCLUDED_IP_HASHES` | No | Exclude internal visits from analytics | Your own visits count as real traffic | — |
| `DB_SLOW_QUERY_LOG` | No | Log slow database queries in production | Slow queries go unnoticed | — |
| `RESEND_API_KEY` | No | Email service | Email features disabled | Resend billing |
| `STRIPE_SECRET_KEY` | No | Payment processing | Payment features disabled | — |

---

## Quick Reference: What to Check First

| Problem | Check first | Then check |
|---------|-----------|-----------|
| Site is down | Vercel Deployments | Neon Console |
| Reports failing | Sentry Dashboard | AI provider status pages |
| Slow performance | Neon Console (compute) | Sentry (error spikes) |
| Login not working | AUTH_SECRET env var | Vercel deployment status |
| Costs spiking | Admin → AI Usage tab | OpenAI/Anthropic billing pages |
| Data missing | Admin → search user | Neon → branch recovery |

---

*Last updated: 2026-04-03*
*Keep this link in your phone notes for emergencies.*
