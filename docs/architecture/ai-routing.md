---
title: AI Model Routing
category: architecture
sources:
  - lib/ai/model-router.ts
  - lib/ai/anthropic-client.ts
  - lib/ai/openai-client.ts
  - lib/ai/stream-openai-response.ts
  - lib/ai/prompt-sanitization.ts
  - lib/ai/provider-health.ts
sync_mode: partial
last_verified: 2026-04-23
verified_by: claude-code
---

# AI Model Routing

Entry point: `callLLM()` and `streamLLM()` in `lib/ai/model-router.ts`.

## Design

All LLM calls go through the model router. Direct imports of `openai-client` or `anthropic-client` are prohibited.

```typescript
import { callLLM, streamLLM } from "@/lib/ai/model-router";

const text = await callLLM("profile-narrative", messages);
const response = await streamLLM("coaching", messages, { routeName });
```

## Task-to-Model Mapping (TASK_CONFIG)

> Source of truth: `lib/ai/model-router.ts` TASK_CONFIG. Currently **9 tasks**. Model versions configurable via `ANTHROPIC_MODEL`, `OPENAI_MODEL`, and `GEMINI_MODEL` env vars.

### Anthropic Claude Sonnet 4.6 (narrative quality)

Default model: `claude-sonnet-4-6`

| Task                | Temperature | Max Tokens | Use Case                                                      |
| ------------------- | ----------- | ---------- | ------------------------------------------------------------- |
| `profile-narrative` | 0.6         | 6000       | Personality profile narrative (structured JSON, needs 60-90s) |
| `integration`       | 0.5         | 2000       | Cross-section synthesis                                       |
| `coaching`          | 0.7         | 1500       | Interactive coaching chat (full sessions)                     |
| `coaching-first`    | 0.7         | 800        | First coaching round (uses Haiku for faster TTFB ~200ms)      |

### Google Gemini 2.5 Flash (cost-effective narrative)

Default model: configurable via `GEMINI_MODEL`

| Task                     | Temperature | Max Tokens | Use Case                                                      |
| ------------------------ | ----------- | ---------- | ------------------------------------------------------------- |
| `career-match-narrative` | 0.5         | 2000       | Career direction narratives (85% cost reduction vs Anthropic) |

Fallback chain: `gemini -> anthropic -> openai`.

### OpenAI GPT-4o-mini (cost-effective structured output)

Default model: `gpt-4o-mini`

| Task               | Temperature | Max Tokens | Use Case                    |
| ------------------ | ----------- | ---------- | --------------------------- |
| `career-pathway`   | 0.4         | 1000       | Action pathway (structured) |
| `resume-parse`     | 0.2         | 1000       | Resume parsing              |
| `memory-extract`   | 0.3         | 500        | Memory extraction           |
| `coaching-summary` | 0.3         | 500        | Coaching summary            |

### Groq E2E Testing Mode

When `E2E_USE_GROQ=true` and `GROQ_API_KEY` is set, ALL tasks are routed through Groq's OpenAI-compatible API (default model: `llama-3.3-70b-versatile`, configurable via `GROQ_MODEL`). Failover is skipped in Groq mode.

### LLM Mock Mode

When `LLM_TEST_MODE=mock`, all tasks return pre-recorded fixture responses (zero cost, zero latency). Used for E2E testing without any LLM provider dependency.

### Removed tasks

| Task             | Removed    | Reason                                           |
| ---------------- | ---------- | ------------------------------------------------ |
| `diary-parse`    | 2026-03-09 | DailyHealthSummary feature deleted (Sentry 替代) |
| `diary-insight`  | 2026-03-09 | Same as above                                    |
| `coaching-intro` | 2026-04-12 | Never called, dead code                          |

### Planned tasks (Coaching Companion — not yet implemented)

> 以下任务定义在 `docs/product/coaching-companion-blueprint.md`，尚未加入 TASK_CONFIG。

- `daily-briefing`, `reflection-response`, `graduation-report` (Anthropic)
- `daily-action-select`, `mood-detect`, `adaptive-adjust` (OpenAI)
- `elevator-pitch`, `linkedin-optimize`, `networking-script` (OpenAI)
- `weekly-digest`, `action-feedback`, `action-plan` (OpenAI)
- `resume-optimize`, `cover-letter`, `interview-prep` (OpenAI)

## Fallback Strategy

Fallback is **task-specific and explicit**, not a universal `anthropic -> openai` downgrade:

- `profile-narrative`: `anthropic -> gemini`
- `integration`: `anthropic -> gemini`
- `career-match-narrative`: `gemini -> anthropic -> openai`
- Structured JSON tasks: `openai -> gemini`
- Streaming coaching tasks (`coaching`, `coaching-first`): `anthropic -> openai` (streaming failover)

When a fallback is actually used, the router logs a warning, captures Sentry `"LLM provider degraded"`, and writes `LLMUsageLog.degraded = true`.

## Provider Health Routing

`lib/ai/provider-health.ts` layers a soft selector on top of the circuit breaker. Two-stage filter:

1. **Circuit breaker** — hard gate. Fully dead providers (3 consecutive non-529 failures) are removed from the candidate chain.
2. **Health routing** — soft selector. Among circuit-closed providers, demote ones with partial outages (20–70% failure band) **before** their circuit trips.

### `selectHealthiest(preferenceChain)`

Queries `LLMUsageLog` for the last `LLM_HEALTH_WINDOW_MIN` minutes (default 10) and classifies each provider:

| Success rate     | Status                       |
| ---------------- | ---------------------------- |
| ≥ 0.95           | healthy                      |
| 0.80 – 0.95      | degraded                     |
| < 0.80           | unhealthy                    |
| `totalCalls < 3` | unknown (treated as healthy) |

Returns a reordered chain with healthy providers first, degraded after. When the original primary is unhealthy and a healthy alternative exists, the router swaps it — and passes the **full health-ordered chain** down to failover so later hops also follow health order, not static `TASK_CONFIG` order. Consumed from `resolveConfigAsync()` in `model-router.ts`.

### Environment scoping

Aggregation filters `LLMUsageLog` by `environment` (`development` → `"test"`, else `"production"`). Mirrors `detectEnvironment()` in `lib/db/llm-usage.ts`. Without this, a handful of failed dev calls (`MIN_CALLS = 3`) could tip a provider to "unhealthy" and skew production routing.

### Cache + concurrency

Module-level singleton cache with 60s TTL (one serverless instance = one cache). Concurrent refresh calls serialize through `inflightRefresh` so only one DB query fires per TTL window. DB errors silently degrade to identity — health routing never throws.

### Kill switch

Set `LLM_HEALTH_ROUTING_DISABLED=1` (or `true`) to short-circuit `selectHealthiest()` to identity. No DB query, pure pass-through.

### Tunable env vars

| Variable                         | Default | Role                                |
| -------------------------------- | ------- | ----------------------------------- |
| `LLM_HEALTH_WINDOW_MIN`          | 10      | Aggregation window (minutes)        |
| `LLM_HEALTH_MIN_CALLS`           | 3       | Minimum calls before classification |
| `LLM_HEALTH_UNHEALTHY_THRESHOLD` | 0.80    | Below = unhealthy                   |
| `LLM_HEALTH_DEGRADED_THRESHOLD`  | 0.95    | Below = degraded                    |
| `LLM_HEALTH_ROUTING_DISABLED`    | unset   | Kill switch                         |

## API Functions

### `callLLM(task, messages, options?)`

Non-streaming. Returns full response text. Options: `maxTokens`, `temperature`, `responseFormat` (`'json'` | `'text'`), `enableCache`.

Includes up to 3 automatic retries for transient errors (429, 5xx, timeouts, Anthropic overloaded) with exponential backoff + jitter, plus task-specific provider failover (also up to 3 retries). A 250s global timeout guard (`GLOBAL_CALL_TIMEOUT_MS`) caps the entire invocation (primary + retries + failover) to stay under Vercel's 300s maxDuration. `LLM_TEST_MODE=mock` bypasses provider resolution entirely, so tests do not depend on API keys. All calls are logged via `logLLMUsage()`.

For JSON mode:

- OpenAI: uses `response_format: { type: 'json_object' }`
- Anthropic: appends JSON instruction suffix to system prompt
- JSON responses are post-processed to strip markdown code fences (`\`\`\`json ... \`\`\``) that Anthropic sometimes adds

**Prompt caching** (`enableCache: true`): Sends the Anthropic system message as an array with `cache_control: { type: 'ephemeral' }`, reducing input token cost by ~90% for shared prefixes.

### `streamLLM(task, messages, options)`

SSE streaming. Returns a `Response` object with readable stream. Options: `routeName` (for error logging), `maxTokens`, `temperature`, `onStreamError`.

Streaming failover is attempted when the task has an approved streaming fallback provider. Current coaching tasks (`coaching`, `coaching-first`) fall back from Anthropic to OpenAI streaming. The failover is tried both on non-ok HTTP responses and on connection throws. Groq mode skips failover. All calls are logged via `logLLMUsage()`.

**Anthropic streaming** uses layered prompt caching: when multiple system messages are provided, `cache_control` is placed on the first block (the static prefix) to maximize cache hits across users/turns. A 529 soft-circuit (`OVERLOADED_SOFT_CIRCUIT_THRESHOLD = 5`) proactively routes to fallback during sustained Anthropic overload events, avoiding ~28s of retry delays per request.

## Supporting Modules

| File                        | Role                                                                                                                                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anthropic-client.ts`       | Anthropic API client wrapper. Exports `AnthropicMessage`, `AnthropicSystemBlock` (for cache_control), `AnthropicCompletionParams`. Timeout: 100s.                                              |
| `openai-client.ts`          | OpenAI-compatible client (also used for Groq E2E mode). Timeout: 90s. Exports `LLM_CONFIG` for legacy section-level token limits.                                                              |
| `stream-openai-response.ts` | OpenAI SSE stream helper. `fetchOpenAIChatStream()` returns a streaming `Response`. Timeout: 15s inactivity + 90s overall wall-clock. Supports Groq routing.                                   |
| `prompt-sanitization.ts`    | Input sanitization for prompts. `sanitizeField()` strips injection patterns, control characters, truncates to max length. `sanitizeRealConditions()` sanitizes the full RealConditions object. |
