# Thesis Code Removal Checklist

> **When**: After thesis fieldwork ends and data is exported.
> **Trigger**: Set `RESEARCH_ENABLED = false` in `admin-client.tsx` first, verify nothing breaks, then execute this list.
> **Estimated effort**: 2-3 hours with Claude Code.

---

## Phase 1: Delete Entirely (~27 items)

### Components (Admin Research UI)

- [ ] `components/admin/research/research-export-panel.tsx`
- [ ] `components/admin/research/research-progress-panel.tsx`
- [ ] `components/admin/research/research-tab-container.tsx`
- [ ] `components/admin/research/thesis-analytics.tsx`

### API Routes

- [ ] `app/api/admin/research-progress/` (entire directory)
- [ ] `app/api/admin/research-export/` (entire directory, including `deep-dive/`)
- [ ] `app/api/admin/export/thesis-data/` (entire directory)
- [ ] `app/api/pre-post-assessment/` (entire directory, including `eligibility/`)

### Database & Data Modules

- [ ] `lib/db/research-progress.ts`
- [ ] `lib/db/admin-thesis-export.ts`
- [ ] `lib/db/admin-research-export.ts`
- [ ] `lib/db/admin-deepdive-export.ts`
- [ ] `lib/db/pre-post-assessment.ts`
- [ ] `lib/db/cdse.ts` (legacy CDSE CRUD)

### CDSE Instruments (entire directory)

- [ ] `lib/cdse/questions.ts`
- [ ] `lib/cdse/scc-questions.ts`
- [ ] `lib/cdse/research-questions.ts`
- [ ] `lib/cdse/ues-questions.ts`
- [ ] `lib/cdse/__tests__/` (all test files)

### Frontend Components

- [ ] `components/features/post-assessment-survey.tsx`
- [ ] `components/features/post-1week-reminder.tsx`
- [ ] `components/features/cdse-survey.tsx`

### Pages

- [ ] `app/[locale]/(immersive)/post-assessment/` (entire directory)

### Scripts

- [ ] `scripts/verify-thesis-data.ts`

---

## Phase 2: Modify (~9 files)

### Database Schema

- [ ] `lib/db/schema-init.ts` — Remove `researchGroup`, `researchParticipantId`, `researchConsentAt` columns
- [ ] Create migration `scripts/migrations/0XX-remove-research-columns.sql`:
  ```sql
  ALTER TABLE "User" DROP COLUMN IF EXISTS "researchGroup";
  ALTER TABLE "User" DROP COLUMN IF EXISTS "researchParticipantId";
  ALTER TABLE "User" DROP COLUMN IF EXISTS "researchConsentAt";
  DROP TABLE IF EXISTS "PrePostAssessment" CASCADE;
  DROP TABLE IF EXISTS "CDSEResponse" CASCADE;
  ```
- [ ] `scripts/schema.sql` — Remove research columns from User CREATE TABLE + drop PrePostAssessment/CDSEResponse table definitions

### Cohort Configuration

- [ ] `lib/cohort/config.ts` — Delete `thesis_2026` entry, delete `resolveResearchGroup()` function
- [ ] `lib/cohort/types.ts` — Remove `pre_assessment | post_immediate | post_1week` from `CohortJourneyStep`, remove `autoAssignResearchGroup` property, remove `requireResearchConsent`

### Admin Client

- [ ] `app/[locale]/(app)/admin/admin-client.tsx` — Remove `RESEARCH_ENABLED` flag, `ResearchTabContainer` dynamic import, "research" tab from `AdminTab` type

### Type Definitions

- [ ] `lib/types/platform.ts` — Remove `PrePostAssessmentType`, `ExperienceFeedback` interface

### Validation Schemas

- [ ] `lib/validation/api-schemas.ts` — Remove `prePostAssessmentSchema` and CDSE-related schemas

### Dashboard

- [ ] `app/[locale]/(app)/dashboard/page.tsx` — Remove `Post1WeekReminder` import and rendering

### Admin Insights

- [ ] `lib/db/admin-insights.ts` — Remove CDSE/pre-post score analysis functions
- [ ] `lib/db/admin-insights-cross.ts` — Remove `getPrePostEffectSummary()` and related CDSE cross-analysis

### Cohort Journey Panel

- [ ] `components/features/cohort-journey-panel.tsx` — Remove `pre_assessment`, `post_immediate`, `post_1week` step URL mappings

### i18n

- [ ] `lib/i18n/dictionaries/en/research.json` — Remove thesis-specific keys
- [ ] `lib/i18n/dictionaries/zh/research.json` — Same
- [ ] Other dictionaries (`cohort.json`, `admin.json`) — Remove thesis-related keys

---

## Phase 3: Rename & Evolve (optional, for Stripe integration prep)

- [ ] Rename `lib/cohort/` → `lib/entitlements/`
- [ ] Rename `COHORT_CONFIG` → `TIER_CONFIG`
- [ ] Add `User.tier` column (free / report / full / coaching_sub)
- [ ] `canAccess(cohort, feature)` → `canAccess(tier, feature)` (signature change)

---

## Phase 4: Verification

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run test` — all pass
- [ ] `npm run lint` — clean
- [ ] `npm run lint:i18n` — no missing keys
- [ ] Manual smoke test: register → Quick Dive → Deep Dive → Report → Coaching
- [ ] Verify beta_2026 users unaffected
- [ ] Verify admin panel loads without research tab

---

## What to KEEP

| File                                        | Reason                                    |
| ------------------------------------------- | ----------------------------------------- |
| `lib/cohort/entitlements.ts`                | `canAccess()` is permanent infrastructure |
| `lib/cohort/config.ts` (minus thesis entry) | Declarative config pattern stays          |
| `User.cohort` column                        | Needed for B2B/enterprise cohorts         |
| `InviteCode` table                          | Needed for B2B onboarding                 |
| `lib/db/admin.ts` (barrel export)           | Update imports after deleting modules     |

---

## Long-term Architecture Reminder

```
Current (thesis):          Post-thesis:              Stripe integration:
邀请码 → cohort            删 thesis_2026            Stripe webhook →
  → COHORT_CONFIG            保留 beta_2026            → User.tier
  → canAccess()              加 free/report/full       → TIER_CONFIG
                                                       → canAccess() (same API)
```

The `canAccess()` pattern is industry best practice. Don't replace it — just change what feeds into it.
