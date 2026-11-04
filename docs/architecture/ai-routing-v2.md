---
title: AI Routing v2 — Health-Aware Provider Selection
category: architecture
sources:
  - lib/ai/provider-health.ts
  - lib/ai/model-router.ts
  - lib/ai/health-check.ts
  - app/api/health/llm/route.ts
  - lib/db/llm-usage.ts
sync_mode: partial
last_verified: 2026-04-23
---

# AI Routing v2 — Health-Aware Provider Selection

## Why this exists

`lib/ai/model-router.ts` had a hardcoded `primary + fallback` chain per task (`TASK_CONFIG`). When a provider entered a partial outage (e.g. Gemini 2.5 Flash returning 503 on 70% of calls for hours), every request still hit the primary first, burned retry latency, and only then failed over. The symptoms were user-visible +40s latency and mixed provider styles in thesis data.

The fix: before dispatching, consult a small health tracker that aggregates per-provider success rates over a rolling window from `LLMUsageLog`. If the primary is "unhealthy" but another fallback is clearly healthier, demote the primary to the tail of the chain for this request.

## Two-stage filter

| Stage           | Module                       | Reaction speed                | Trigger                                                    |
| --------------- | ---------------------------- | ----------------------------- | ---------------------------------------------------------- |
| Circuit breaker | `model-router.ts` (existing) | Fast (3 consecutive failures) | Primary hard-dead; bypass entirely                         |
| Health routing  | `provider-health.ts` (new)   | Slow (10-min success rate)    | Primary partially degraded; prefer a healthier alternative |

The circuit breaker has the final say. If the circuit is open, the health module never upgrades a closed-circuit fallback back to primary — the circuit knows something recent the 10-min window can't see.

## Components

- **`lib/ai/provider-health.ts`** — the tracker. 60s module-level cache, DB-backed, kill-switch-aware.
- **`lib/ai/model-router.ts`** — exposes `resolveConfigAsync(task)` wrapper that calls `selectHealthiest` and rebuilds the fallback chain. `getFallbackConfig` / `getRemainingFallbackProviders` extended with optional `overrideChain`.
- **`app/api/health/llm/route.ts`** — returns `routingHealth` in the response for operator visibility.

## Thresholds & env vars

| Var                              | Default | Meaning                                                                            |
| -------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `LLM_HEALTH_WINDOW_MIN`          | `10`    | Minutes of `LLMUsageLog` aggregated                                                |
| `LLM_HEALTH_MIN_CALLS`           | `3`     | Below this, provider treated as `unknown` → healthy                                |
| `LLM_HEALTH_UNHEALTHY_THRESHOLD` | `0.80`  | Below → `unhealthy` → demoted to chain tail                                        |
| `LLM_HEALTH_DEGRADED_THRESHOLD`  | `0.95`  | Between this and unhealthy → informational `degraded`, **not demoted**             |
| `LLM_HEALTH_ROUTING_DISABLED`    | unset   | `=1` or `=true` → entire module no-op, preference order preserved, zero DB queries |

Rationale for the defaults:

- **10 min window** — long enough to smooth 1-2 flaky calls, short enough to notice an ongoing outage and demote within minutes.
- **MIN_CALLS=3** — cold-start safety. A single unrelated failure shouldn't tip routing.
- **0.80 unhealthy threshold** — catches the 20-70% partial-outage band that circuit breaker misses. Circuit trips at 100% failure rate; health picks up the slack below that.
- **60s cache TTL** — amortize DB cost across concurrent callLLM invocations. A 60s delay in picking up a newly-recovered provider is acceptable.

## Demotion semantics

`selectHealthiest(preference: Provider[])` never REMOVES a provider from the chain. It only reorders: unhealthy → tail, others → keep original relative order.

Example: `career-match-narrative` has `primary=gemini, fallbacks=[anthropic, openai]`. If Gemini shows 5% success rate over 10 min:

- Old behavior: every call tries Gemini → 95% chance retries exhaust → fails over to Anthropic → +40s latency
- New behavior: `selectHealthiest(["gemini","anthropic","openai"])` returns `orderedChain=["anthropic","openai","gemini"]`, demoted=[{gemini, reason: "success-rate 5% over 10min (1/20)"}]`. Router uses Anthropic as primary; Gemini still reachable if Anthropic+OpenAI both fail.

## Why `provider` is preserved on the resolved config

`logLLMUsage` marks `degraded: effectiveProvider !== provider`. The router keeps `resolved.provider` equal to the original `TASK_CONFIG[task].provider` even after a health demotion — only `effectiveProvider` flips. This ensures the monitoring dashboard and `/api/cron/llm-digest` correctly count health-demoted calls as degraded. (Caught by codex in review.)

## Kill switch — mandatory before user-facing rollout

Set `LLM_HEALTH_ROUTING_DISABLED=1` in Vercel and redeploy. Within ~45s:

- `resolveConfigAsync` becomes a pure pass-through (delegates to sync `resolveConfig` and returns its result).
- `selectHealthiest` short-circuits without a DB query.
- `getHealthSnapshot()` still readable for /api/health/llm diagnostics, but `routingHealth.enabled` will show `false`.

Behavior is bit-identical to pre-feature baseline.

## Rollout plan for this feature

1. Commits 1+2 (provider-health module + tests) — pure addition, no runtime effect, deployed.
2. Commit 3 (model-router integration) — deploy with `LLM_HEALTH_ROUTING_DISABLED=1` first, verify baseline. Later flip switch off.
3. Commits 4+5 (API extension + integration tests + this doc).

## Observability

Every health-driven demotion emits a Sentry breadcrumb via the existing `captureDegradedRoute()`:

```
reason: "health-demoted: success-rate 12% over 10min (1/8)"
from: gemini → to: anthropic
```

Operators seeing many `health-demoted:` entries for the same provider should check the provider's public status page and consider whether to temporarily swap the primary in `TASK_CONFIG` — but this should be rare; the whole point of v2 is to avoid needing manual config changes.

## Runbook

**Q: How do I check what the router is currently preferring?**  
A: `curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" https://.../api/health/llm | jq .routingHealth`

**Q: A provider is wrongly marked unhealthy — how to override?**  
A: Short term: set `LLM_HEALTH_ROUTING_DISABLED=1`, redeploy. Long term: check the thresholds; perhaps `UNHEALTHY_THRESHOLD` is too aggressive for your traffic pattern.

**Q: How to force-refresh the health cache?**  
A: Wait 60s (cache TTL) or redeploy (new instance = empty cache). There is deliberately no manual refresh endpoint — that would violate the "operators read, not write" principle.

**Q: Does this replace the circuit breaker?**  
A: No. Circuit breaker is the hard gate for dead providers; health routing is the soft selector for degraded ones. They run together on every `resolveConfigAsync` call.

## Related docs

- `.claude/rules/llm-provider-failover.md` — outage runbook (updated with health-demoted classification)
- `docs/architecture/ai-routing.md` — v1 design (still accurate for TASK_CONFIG + circuit breaker)
- `lib/db/llm-usage.ts` — data source for the health aggregation
