# LLM Quality Watch — Daily Routine (Thesis Collection Window)

> **Audience**: Founder operating during论文数据采集 window.
> **Cadence**: ~5 minutes per day for the first 2 weeks of采集, then weekly.
> **Goal**: Catch any report that didn't hit the 99%+ primary-provider + quality-gate bar so it can be regenerated manually before it enters论文 export.

This is the **Phase 3.5** lightweight alternative to the deferred Phase 3 fail-fast. It assumes Phase 1 + Phase 2 are deployed (commits `e33b994e` + `e4b50fb3`).

## Background

| Phase                    | Question it answers                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------- |
| Phase 1                  | Which provider wrote each section of every report? (`CareerReport.llmProviderMap`)                        |
| Phase 1                  | Did the report degrade any section to algorithmic text? (`CareerReport.qualityScore`, `degradedSections`) |
| Phase 2                  | Did each LLM call pass length / field / locale / repetition gates? (`LLMUsageLog.qualityCheckResult`)     |
| **Phase 3.5 (this doc)** | **What do I, the founder, do with that information?**                                                     |

## Daily routine

Open a terminal in the repo root. **Make sure `ANTHROPIC_API_KEY` is unset in your shell** (see `pitfalls` — Claude Code parent shell sets it to empty; unset before any dev work):

```bash
unset ANTHROPIC_API_KEY ANTHROPIC_BASE_URL
```

### Step 1 — One-page audit (60s)

```bash
node --env-file=.env.local --import tsx scripts/audit-llm-quality.ts
```

Output sections:

1. **Per-task call stats** — calls / success % / quality-pass % / fail count.
   - 🚨 Stop if any `narrative` task (`profile-narrative`, `integration`) shows a provider OTHER than `anthropic`. The `⚠` marker on the left flags this. The "expects" column shows the configured primary.
   - 🚨 Stop if quality-pass % < 95% for any task.
2. **Per-day report quality** — reports per day + average `qualityScore` + count `< 1.00`.
   - 🚨 Stop if any day has `<1.00` count > 0.
3. **Top error messages** — provider failures.
   - 🟡 Investigate if a single error repeats > 5 times.
4. **Provider health (10 min window)** — same window `model-router` uses for health-aware routing.
   - 🟢 ≥ 95% success: ignore. 🟡 80–94%: monitor. 🔴 < 80%: see `.claude/rules/llm-provider-failover.md`.
5. **Degraded sections** — count of `careerMatch / careerPathway / integration` that fell back.

If everything is 🟢, you're done in 30 seconds.

### Step 2 — Drill into degraded reports (only if step 1 surfaced any)

```bash
node --env-file=.env.local --import tsx scripts/list-degraded-reports.ts --days 1
```

Use `--cohort thesis_2026` to filter to論文 users only.

This lists each degraded report with:

- `reportId`, `user`, `cohort`
- `qualityScore`
- which sections fell back (`degradedSections`)
- which task ran on a non-expected provider (`provider drift`)

### Step 3 — Decide per report

| Situation                                                                   | Action                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `qualityScore = 1.00` but `provider drift` only on `career-match-narrative` | **No action.** `career-match-narrative` primary IS `gemini` by design (cost). The script flags it for visibility only.              |
| `qualityScore < 1.00` AND user is in `thesis_2026` cohort                   | **Regenerate.** See Step 4.                                                                                                         |
| `qualityScore < 1.00` AND user is `beta_2026` (or earlier)                  | **Optional.** Beta users tolerate fallback; only regenerate if user complains.                                                      |
| `qualityScore = NULL` AND `userId` is set                                   | **Investigate.** Phase 1 race-retry should have populated this. Inspect with `tsx scripts/list-degraded-reports.ts --user <email>`. |
| `qualityScore = NULL` AND `userId` is null                                  | **No action.** Anonymous flow; expected.                                                                                            |

### Step 4 — Regenerate a report

```bash
# Preview only
npm run llm:regenerate <reportId>

# Apply: supersede active CareerReport + reset AssessmentPipeline
npm run llm:regenerate <reportId> -- --confirm
```

The `--confirm` path does two atomic mutations (matching exactly what `POST /api/assessment/<assessmentId>/regenerate-report` does in production):

1. **Supersede** every active `CareerReport` for the same `assessmentId` (sets `supersededAt = NOW()`). The partial unique index `CareerReport_assessment_active_idx` then permits a new active `INSERT`.
2. **Reset the pipeline** row: `reportStatus → 'not_requested'`, `retryCount → 0`, `nextAttemptAt → NULL`, `lastStepError → NULL`. Without this step the cron `pipeline-worker` stays on the old `'done'` status and never picks up the supersede — which was the original Phase 3.5 bug (codex review, 2026-05-21).

After `--confirm`, the cron `pipeline-worker` (1-minute tick) picks up the assessment and produces a fresh `CareerReport` with new `llmProviderMap` + `qualityScore`. To watch it land:

```bash
npm run llm:degraded -- --user <email> --days 1
```

If no `AssessmentPipeline` row exists for that assessment (pre-pipeline-FSM legacy users), the script prints instructions to hit `POST /api/assessment/<assessmentId>/regenerate-report` once — that endpoint lazily creates the pipeline row AND triggers regen in a single call.

## Weekly summary (Mondays)

```bash
node --env-file=.env.local --import tsx scripts/audit-llm-quality.ts --days 7
```

Track three numbers in your weekly notes:

- **Primary hit rate** (per task, from "calls" + provider column)
- **Quality pass rate** (per task)
- **Total degraded reports** (sum of `<1.00` from "Per-day report quality")

If primary hit rate trends DOWN week-over-week, that's the signal to revisit Phase 3 (fail-fast). Stable 98%+ means the current passive monitoring is enough.

## When something is actually broken

| Symptom                                                             | Runbook                                                                                                                                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider success rate < 80% in step 1's health snapshot             | `.claude/rules/llm-provider-failover.md`                                                                                                                                                        |
| Multiple repeated `errorMessage` 401/403                            | Same — auth error path                                                                                                                                                                          |
| `Database connection string not found`                              | Re-set `POSTGRES_URL` / `DATABASE_URL` in shell or use `--env-file=.env.local`                                                                                                                  |
| Provider drift on `profile-narrative` (Gemini instead of Anthropic) | Check `ANTHROPIC_API_KEY` in shell — Claude Code parent shell often clears it. `unset ANTHROPIC_API_KEY ANTHROPIC_BASE_URL` then restart dev/cron. (See `.claude/memory/feedback_*` if logged.) |

## Background: why no fail-fast

Phase 3 (fail-fast on primary degradation → user gets 503) was deferred because:

- 30-day prod degraded rate = 1.45% (5 calls out of 344).
- 论文 N = 50–100. Expected degraded reports = 0–2.
- Manual regenerate of 0–2 reports per week takes ~3 minutes.
- An automatic 503 page would lose ~1 in 70论文 candidates to招募 dropout — net negative for论文 sample size.

If degraded rate climbs > 5% over a 2-week window, revisit. The plan file at `.claude/plans/llm-99-fall-back-profile-hashed-kay.md` retains the full Phase 3 design for future activation.
