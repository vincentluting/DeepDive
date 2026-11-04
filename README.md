# Deep Dive

**An AI-powered career exploration platform, designed, built and evaluated as my MBA thesis.**

🔗 **Live demo:** https://deepdive-pearl.vercel.app
🎟️ **Full access:** sign up at https://deepdive-pearl.vercel.app/en/register?invite=RECRUITER2026
(the invite code unlocks the AI report and the AI career coach)

> This repository is a portfolio snapshot of the product **as it stood when the thesis was completed (July 2026)**.
> The demo runs on a fresh database with no real user data. AI features run on a free open-model tier, so answers may be slower or less polished than in the original deployment.

---

## The problem

Most career assessments apply a single framework, produce a static PDF, and ignore real-world constraints such as visa status, location or salary needs. People in career transitions, especially people working across cultures, get a label but no direction.

## What Deep Dive does

Deep Dive combines four lenses into one profile, then turns that profile into guidance you can act on:

| Layer | Framework | What it adds |
| --- | --- | --- |
| Interests | Holland RIASEC | What kind of work pulls you in |
| Personality | Big Five (IPIP) | How you tend to work |
| Values | Schwartz-based values compass | What you keep choosing |
| Behaviour | Scenario-based questions | What you actually do under pressure |

The user journey:

1. **Quick Dive** (5 min, no sign-up): an interest and values snapshot matched against a library of ~1,200 career directions (O*NET-based, plus emerging AI-era roles).
2. **Deep Dive**: a longer assessment that adds personality, behaviour and real-world constraints.
3. **AI report**: a multi-step LLM pipeline writes a personalised, constraint-aware career report.
4. **AI coach**: a coaching chat that remembers the report and earlier sessions.

The product is bilingual (English / 中文), with dictionaries for 11 locales.

## The research (MBA thesis)

I evaluated the platform in a study with real participants: a single-arm pre-post design with a one-week follow-up, plus an embedded randomised comparison of two Quick Dive formats (classic vs. immersive).

Results reported in the thesis (aggregate figures only):

- **33** participants enrolled; **17** completed matched pre and post measures; **15** completed the one-week follow-up.
- **Career direction confidence (CDC-5)** rose significantly from baseline to one week later: **dz = 0.81, p = .007**, robust to attention-check screening.
- **60%** of follow-up respondents reported taking a concrete career action during that week.
- The immediate gain in career self-concept clarity (SCC-12, dz = 0.44) was not maintained at one week (dz = 0.07).
- Measurement reliability was good (Cronbach's α = .73 to .88). Participants rated the structured report and profile as more valuable than the AI coach.

The research tooling is part of this codebase: informed consent with version tracking, random group assignment, pre/post survey instruments, attention checks, an admin research dashboard and anonymised data export (see `lib/research`, `lib/pre-post-assessment`, `app/[locale]/(app)/admin/research`).

## Tech stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Zustand
- **Backend:** Next.js route handlers (~130 API routes), Neon serverless PostgreSQL, 100+ SQL migrations
- **AI:** a provider-agnostic model router (`lib/ai/model-router.ts`) with task-level routing, retries, circuit breakers, structured-output validation and streaming. It supports OpenAI, Anthropic, Google and Groq.
- **Quality:** ~3,200 unit tests (Vitest), Playwright end-to-end tests, ESLint, i18n completeness and purity checks, GitHub Actions CI
- **Operations:** Sentry, Upstash rate limiting, Vercel hosting

## Architecture at a glance

```
app/[locale]/        Pages, localised routing (en / zh / ...)
app/api/             Route handlers: assessment, reports, coaching, admin, research
lib/scoring/         Multi-layer psychometric scoring pipeline
lib/career-matching/ Profile-to-career matching against the career library
lib/report-generation/  Multi-step LLM report generation
lib/coaching/        AI coach: prompts, memory, safety, evaluation
lib/ai/              Model router and provider clients
lib/research/        Thesis study: consent, cohorts, surveys, export
lib/i18n/            Dictionaries and locale utilities
scripts/migrations/  Numbered SQL migrations
docs/                Architecture, database, product and design specs
```

More detail: [`docs/INDEX.md`](docs/INDEX.md) and [`docs/architecture`](docs/architecture).

## Run it locally

```bash
git clone https://github.com/vincentluting/DeepDive.git
cd DeepDive
npm install
cp .env.example .env.local   # add a Postgres URL, AUTH_SECRET and one LLM key
npm run dev
```

To use the free Groq tier instead of OpenAI, set `E2E_USE_GROQ=true`, `GROQ_API_KEY` and `GROQ_MODEL`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run test` | Unit tests |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply pending SQL migrations |

## About me

I'm Ting (Vincent) Lu. I designed the product, ran the research and built the platform end-to-end, working with AI coding assistants as a development partner.

- GitHub: [@vincentluting](https://github.com/vincentluting)
