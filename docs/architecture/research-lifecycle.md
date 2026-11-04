# Research Data Lifecycle

> Owner: Founder (single-person dev)
> Last reviewed: 2026-05-08
> Trigger: thesis defense passed + grade received + 6 months retention

This document defines what counts as "research-only" data in Deep Dive,
and how it will be decommissioned after the MBA thesis is complete. It is
the source of truth for the post-thesis cleanup; any drop migration or
archive script must agree with this manifest.

The principle: **research data must be controllable, deletable, and not
keep contaminating product logic after the thesis ends.** During data
collection it stays — we touch nothing that could perturb the experiment.
Once the retention window closes, we execute a single planned decommission.

---

## 1. Research surface — what counts as "research-only"

### 1.1 Tables that DROP at decommission

| Table                  | Purpose                                          | Notes                                    |
| ---------------------- | ------------------------------------------------ | ---------------------------------------- |
| `PrePostAssessment`    | T0 / T1 / T2 SCC-12 + UES-12 + CDC-5 measurement | psychometric instruments; no product use |
| `Post1WeekReminderLog` | T2 reminder email idempotency                    | the reminder feature itself disappears   |

### 1.2 Tables KEPT post-decommission (product analytics)

These survive but lose their "research framing" (cohort breakdowns,
participantId joins). The tables stay; the research-specific aggregations
in admin and lib code go away.

| Table              | Why it stays                                                   |
| ------------------ | -------------------------------------------------------------- |
| `ReportNPS`        | NPS is a generic product satisfaction metric                   |
| `ReportReaction`   | report-page emoji feedback, used for content optimization      |
| `ReportEngagement` | scroll depth + dwell time, standard product analytics          |
| `CoachingFeedback` | coaching quality signal, ties into LLM model-router monitoring |

### 1.3 Tables retained per IRB policy (NOT dropped at thesis decommission)

| Table           | Retention rule                                                         |
| --------------- | ---------------------------------------------------------------------- |
| `ConsentRecord` | informed-consent audit trail; retain 5+ years post-publication per IRB |

### 1.4 Columns that DROP at decommission

| Table              | Column                  | Notes                                                           |
| ------------------ | ----------------------- | --------------------------------------------------------------- |
| `User`             | `researchGroup`         | A/B assignment field (replace product UX with free user choice) |
| `User`             | `researchParticipantId` | thesis participant id; not used by product                      |
| `User`             | `researchConsentAt`     | thesis consent timestamp (ConsentRecord remains)                |
| `InviteCode`       | `researchGroup`         | invite-code-driven cohort assignment                            |
| `ReportEngagement` | `scrollbacks`           | raw back-scroll event log; product code only reads array length |

### 1.5 Routes / pages that DROP at decommission

| Path                                        | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| `app/[locale]/(immersive)/post-assessment/` | T0 / T1 / T2 questionnaire flow |
| `app/api/pre-post-assessment/`              | submit pre/post responses       |
| `app/api/cron/post1week-reminders/`         | T2 daily cron                   |
| `app/api/admin/send-post1week-reminders/`   | manual T2 trigger               |

### 1.6 lib / db modules that DROP at decommission

| Path                                                      | Purpose                                |
| --------------------------------------------------------- | -------------------------------------- |
| `lib/db/pre-post-assessment.ts`                           | DB layer for PrePostAssessment         |
| `lib/db/post1week-reminders.ts`                           | DB layer for Post1WeekReminderLog      |
| `lib/db/admin-thesis-export.ts`                           | thesis summary export                  |
| `lib/db/admin-research-export.ts`                         | Quick Dive item-level export           |
| `lib/db/admin-deepdive-export.ts`                         | Deep Dive item-level export            |
| `lib/db/research-progress.ts`                             | research participant progress tracking |
| `lib/db/admin-insights.ts` (research-only sections)       | thesis analytics aggregations          |
| `lib/db/admin-insights-cross.ts` (research-only sections) | cross-cohort analytics                 |

### 1.7 admin UI sections that DROP at decommission

| Path                                            | Purpose                       |
| ----------------------------------------------- | ----------------------------- |
| `components/admin/research/` (entire directory) | Research tab in admin panel   |
| `app/api/admin/export/thesis-data/`             | thesis export endpoint        |
| `app/api/admin/research-export/`                | QD item-level export endpoint |
| `app/api/admin/research-export/deep-dive/`      | DD item-level export endpoint |
| `app/api/admin/research-progress/`              | research progress endpoint    |

### 1.8 i18n keys that DROP at decommission

| Dictionary section       | Notes                       |
| ------------------------ | --------------------------- |
| `admin.researchExport.*` | research export panel copy  |
| `admin.research.*`       | research tab labels         |
| `postAssessment.*`       | T0/T1/T2 questionnaire copy |

### 1.9 Cron jobs that DROP at decommission

| Cron                  | Purpose                                                |
| --------------------- | ------------------------------------------------------ |
| `post1week-reminders` | daily scan for T2-eligible participants and send email |

---

## 2. Trigger condition

Decommission may begin when **all** of the following are true:

1. Thesis defense passed
2. Final grade received and posted to UvA student record
3. 6 months elapsed since defense (retention window for any reproducibility
   request from supervisor or external reviewer)

If a journal submission is in flight that may require re-running analysis,
**defer** decommission until the paper is accepted or formally withdrawn.

---

## 3. Archive destination

Archive must capture the data in a form a third party (or future-you) can
re-analyze without access to the running database.

**Destination decision (pick one before running archive script — TBD)**:

- Option A: GitHub release (private repo) — versioned, easy to share with
  supervisor, GH retains forever, ~free
- Option B: AWS S3 bucket with versioning + retention policy — overkill for
  one-shot archive
- Option C: local zip → manual upload to UvA OneDrive thesis folder — simplest

**Default recommendation**: Option A. Privately-versioned, publicly auditable
on demand.

**Archive contents** (each as both JSONL and CSV):

- All `PrePostAssessment` rows (T0/T1/T2 raw responses + scoring)
- All `Post1WeekReminderLog` rows (reminder send history)
- All `ConsentRecord` rows (legally retained, archived for the thesis dataset)
- `User` table snapshot filtered to consented participants:
  `SELECT id, researchGroup, researchParticipantId, researchConsentAt,
 createdAt, locale, registrationCountry FROM "User"
 WHERE "researchGroup" IS NOT NULL AND "researchConsentAt" IS NOT NULL`
- `InviteCode` rows that touched research participants
- `ReportEngagement.scrollbacks` JSONB payloads for participants
- `ReportNPS` / `ReportReaction` / `ReportEngagement` summaries for
  participants (T0/T1/T2 attribution preserved)
- `CoachingFeedback` rows for participants
- Schema version (`migrations/` count + git commit hash at archive time)

**Archive must include**:

- File-level SHA-256 checksums in a manifest
- Schema version manifest (which migration was applied last)
- Code commit hash that produced the archive
- Generation timestamp
- Total participant count, broken down by `researchGroup`

---

## 4. Decommission runbook (high level — not specific SQL)

> Detailed SQL is written **at trigger time**, not in advance. Schema is
> still evolving (we are at migration 081+); pre-written migrations would
> drift before they are run.

### Step 0: Pre-flight

- Confirm trigger conditions (defense passed + 6 months + no pending journal
  submission)
- Re-read this document; confirm manifest still matches reality (search the
  codebase for new tables/columns that should be added to the manifest)
- Run `npx tsx scripts/research-retention-dry-run.ts` — confirm row counts
  match expected scale

### Step 1: Archive

- Write archive script `scripts/research-archive.ts` (NOT pre-written;
  spec lives in section 3 above)
- Execute archive against production read replica (Neon branch)
- Verify file checksums and row counts against dry-run output
- Upload archive to chosen destination (section 3)
- Tag git commit with `thesis-archive-<date>`

### Step 2: Decouple product UX from `researchGroup`

This is the original "Phase B" deferred from active research period.

- Remove A/B locking logic in `components/features/explore-hub.tsx`
- Remove `researchGroup`-based branching in
  `app/[locale]/(report)/report/[id]/report-client.tsx`
- Update `app/[locale]/(app)/explore/page.tsx` and immersive
  post-assessment routes to ignore researchGroup
- After this step, `researchGroup` is unread by product code

### Step 3: Drop research surface

In a single migration `scripts/migrations/NNN_decommission_thesis.sql`:

- Drop tables: `PrePostAssessment`, `Post1WeekReminderLog`
- Drop columns: `User.researchGroup`, `User.researchParticipantId`,
  `User.researchConsentAt`, `InviteCode.researchGroup`,
  `ReportEngagement.scrollbacks`
- Drop indices that referenced dropped columns
- Run `npm run db:generate-types` to refresh types
- **Do NOT drop `ConsentRecord`** (IRB retention)

### Step 4: Remove research code

- Delete files / directories listed in sections 1.5-1.8 of this manifest
- Remove i18n keys listed in section 1.8
- Remove `researchGroup` references in any remaining code (final grep
  should return zero results)
- Disable cron job listed in section 1.9
- Remove `lib/db/admin.ts` barrel exports for thesis modules
- Remove `lib/i18n/dictionaries/{en,zh}/admin.json` `researchExport` block

### Step 5: Verification

- `npx tsc --noEmit` clean
- `npm run test` all passing
- `npm run lint:i18n` 0 findings
- `grep -rn "researchGroup\|researchConsentAt\|PrePostAssessment\|Post1WeekReminder" app/ components/ lib/ scripts/` returns zero non-archive hits
- Smoke-test: log in as previously-classic user, log in as previously-immersive
  user, both can choose either explore mode freely
- Archive checksums verified against post-decommission dataset (i.e., the
  archive is the only remaining copy)

### Step 6: Documentation cleanup

- Update `CLAUDE.md` to remove research module references
- Move this document to `docs/archive/research-lifecycle-completed-<date>.md`
- Update `docs/INDEX.md` to remove research-doc links
- Update `scripts/schema.sql` header to reflect post-thesis state

---

## 5. What NOT to do during active research

For reference; these were considered and explicitly rejected during the
2026-05-08 plan review:

- ❌ **Phase B-lite**: pre-emptively add `experienceMode` column without
  switching product UX. Either creates dual-write risk on registration /
  invite-claim paths, or leaves new participants with incomplete data.
- ❌ **Decouple researchGroup from product UX now**: high blast radius,
  audit complexity for thesis defense, real risk of breaking A/B integrity
  for in-flight participants.
- ❌ **Pre-write the drop migration**: schema is still evolving (migration
  081+); pre-written SQL drifts.
- ❌ **Delete research code now**: thesis is not yet defended. Removing
  research code before publication risks breaking reproducibility analysis.
- ❌ **Move research code into `lib/research/` subdirectory**: 30+ import
  sites would need to change. The existing `admin-thesis-*` /
  `admin-research-*` / `research-progress` naming convention already provides
  enough boundary clarity.

What we do during active research:

- Hold consent gate on every research export endpoint (already done — 10
  SQL filter sites)
- Add unit tests for consent gate (regression insurance)
- Document the surface (this file)
- Add `-- RESEARCH ONLY` comments to `scripts/schema.sql` for future-you
- Maintain `scripts/research-retention-dry-run.ts` to preview decommission
  scale at any time

---

## 6. References

- Audit + Codex cross-verification: `/Users/l/.claude/plans/admin-panel-12-47-polished-canyon.md`
- Consent gate implementation: 10 SQL filter sites in
  `lib/db/admin-thesis-export.ts:347`,
  `lib/db/admin-research-export.ts:518-549`,
  `lib/db/admin-deepdive-export.ts:298-417`,
  `lib/db/research-progress.ts:102-103`
- Dry-run preview: `scripts/research-retention-dry-run.ts`
- Schema markers: search `scripts/schema.sql` for `RESEARCH ONLY`
- Thesis questionnaire spec: `founder/Thesis/` (private)
