---
title: LLM Call Inventory — Complete Reference
category: architecture
sources:
  - lib/ai/model-router.ts
  - lib/report-generation/
  - lib/coaching/
  - app/api/
sync_mode: manual
last_verified: 2026-04-13
verified_by: claude-code
---

# LLM Call Inventory

> 全站 LLM 调用的唯一来源文档。每次新增/修改 LLM 调用必须同步更新此文档。
>
> **快速规则**: 所有 LLM 调用必须通过 `callLLM()` / `streamLLM()`（`lib/ai/model-router.ts`），
> 禁止直接导入 `openai-client` 或 `anthropic-client`。

## 1. 模型配置

### 当前模型

| Provider  | Model ID            | 用途         | Input $/M | Output $/M |
| --------- | ------------------- | ------------ | --------- | ---------- |
| Anthropic | `claude-sonnet-4-6` | 叙事 / 教练  | $3.00     | $15.00     |
| Google    | `gemini-2.5-flash`  | 职业匹配叙事 | $0.30     | $2.50      |
| OpenAI    | `gpt-4o-mini`       | 结构化提取   | $0.15     | $0.60      |

### 环境变量

| 变量                | 默认值                    | 说明                                                                                                                         |
| ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | —                         | Tier S 叙事 / 教练主 provider。缺失时 `profile-narrative`/`integration` 仅可回退到 Gemini；`coaching*` 不再静默降级到 OpenAI |
| `OPENAI_API_KEY`    | —                         | OpenAI 主 provider。缺失时结构化 task 可尝试 Gemini fallback                                                                 |
| `ANTHROPIC_MODEL`   | `claude-sonnet-4-6`       | 可覆盖 Anthropic 模型                                                                                                        |
| `OPENAI_MODEL`      | `gpt-4o-mini`             | 可覆盖 OpenAI 模型                                                                                                           |
| `GOOGLE_API_KEY`    | —                         | Gemini provider。缺失时 `career-match-narrative` 退到 Anthropic；`profile-narrative`/`integration` 会失去唯一批准的降级备选  |
| `GEMINI_MODEL`      | `gemini-2.5-flash`        | 可覆盖 Gemini 模型                                                                                                           |
| `E2E_USE_GROQ`      | `false`                   | ⚠️ 仅用于 E2E 测试，**生产环境禁止设为 true**。启用后所有 task 路由到 Groq                                                   |
| `GROQ_API_KEY`      | —                         | 仅用于 E2E，生产环境不应设置                                                                                                 |
| `GROQ_MODEL`        | `llama-3.3-70b-versatile` | Groq 使用的模型 (免费 tier)                                                                                                  |

### 超时配置

| 层级                              | 超时 | 位置                                                                     |
| --------------------------------- | ---- | ------------------------------------------------------------------------ |
| Anthropic per-request             | 100s | `anthropic-client.ts:41`                                                 |
| OpenAI per-request                | 90s  | `openai-client.ts:22`                                                    |
| Report pipeline per-call          | 90s  | `report-generation/index.ts:50`                                          |
| Report pipeline total             | 180s | `report-generation/index.ts:47`                                          |
| Report route maxDuration          | 300s | `app/api/generate-report/route.ts:32`                                    |
| Coaching stream inactivity        | 15s  | `model-router.ts`                                                        |
| Coaching stream first-content     | 60s  | `model-router.ts`                                                        |
| Coaching stream overall           | 90s  | `model-router.ts`                                                        |
| Coaching route maxDuration        | 120s | `app/api/coaching-chat/route.ts`                                         |
| callLLM default per-call          | 90s  | `model-router.ts` (CALL_TIMEOUT_MS, overridable via `timeoutMs` option)  |
| callLLM global (primary+failover) | 250s | `model-router.ts` (GLOBAL_CALL_TIMEOUT_MS, stays under 300s maxDuration) |
| Profile narrative per-call        | 30s  | `generate-identity-narratives.ts` (via `timeoutMs: 30_000`)              |

### 重试策略

> **设计原则 (2026-04-12 重构)**: 单层重试 + 单层降级。`callLLM` 拥有所有 API 重试，
> 生成函数只做验证重试（JSON 不完整/重复），编排层只做降级（不重试）。

| 层级                             | 重试次数 | 退避              | 条件                                                                      |
| -------------------------------- | -------- | ----------------- | ------------------------------------------------------------------------- |
| `callLLM()` primary              | 3 次     | 指数退避 + jitter | 429 / 5xx / timeout / overloaded                                          |
| `callLLM()` provider failover    | 3 次     | 指数退避 + jitter | 按 task 的显式 fallback chain；仅尝试批准的下一级 provider                |
| `streamLLM()` provider failover  | 1 次     | 0s                | `coaching`/`coaching-first` fallback to OpenAI streaming                  |
| Circuit breaker (per provider)   | —        | 5min              | 连续 3 次失败 → 断路 → 5min 后 half-open 单探测 (probing flag 防并发穿透) |
| CareerMatch/Integration 生成函数 | 1 次验证 | 0s                | JSON 解析失败 / 不完整 / 重复。API 错误不重试，直接 fallback              |
| 报告编排层 (`index.ts`)          | 0 次     | —                 | 函数失败后直接降级到算法 fallback，不重试                                 |
| `streamLLM()`                    | 0 次     | —                 | 流式无法重试（但有 provider failover）                                    |

## 2. Task 全景表

### Tier S — 产品灵魂（Anthropic Claude Sonnet）

> 这些 task 的写作质量直接决定产品差异化。现在采用显式降级策略，而不是统一静默掉到低质量模型。

| Task                | Provider          | Temp | MaxTokens                         | 调用方                         | 文件位置                                                 | 说明                                                                                    |
| ------------------- | ----------------- | ---- | --------------------------------- | ------------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `profile-narrative` | Anthropic         | 0.6  | 6000 (override: zh:2000, en:2500) | `generateIdentityNarratives()` | `lib/profile-generation/generate-identity-narratives.ts` | 身份叙事 (7段), 2 并行调用 (Call A: 4 fields ‖ Call B: 3 fields), 在 profile 生成时调用 |
| `integration`       | Anthropic         | 0.5  | 2000 (override: en:1200, zh:900)  | `generateIntegration()`        | `lib/report-generation/integration.ts`                   | coreInsight + letterToUser                                                              |
| `coaching`          | Anthropic         | 0.7  | 1500                              | `streamLLM()`                  | `app/api/coaching-chat/route.ts:147`                     | AI 教练流式对话                                                                         |
| `coaching-first`    | Anthropic (Haiku) | 0.7  | 800                               | `streamLLM()`                  | `app/api/coaching-chat/route.ts`                         | 教练首次消息 (Haiku 低延迟)。Fallback: OpenAI streaming                                 |

### Tier A — 结构化叙事（Gemini 2.5 Flash）

| Task                     | Provider | Temp | MaxTokens      | 调用方                           | 文件位置                                          | 说明                                                                                 |
| ------------------------ | -------- | ---- | -------------- | -------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `career-match-narrative` | Gemini   | 0.5  | 2000 (en:2000) | `generateCareerMatchNarrative()` | `lib/report-generation/career-match-narrative.ts` | 每个职业方向的 whySuitable + challenges。fallback chain: Gemini → Anthropic → OpenAI |

**已优化 ✅**: `career-match-narrative` 已迁移到 Gemini 2.5 Flash（$0.30/$2.50），省 85%/调用。

### Tier C — 结构化提取（OpenAI GPT-4o-mini）

> 已经是低成本配置，无需优化。

| Task                    | Temp | MaxTokens | 调用方                                     | 文件位置                                      | 说明                                                                          |
| ----------------------- | ---- | --------- | ------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------- |
| `career-pathway`        | 0.4  | 1000      | `generateCareerPathway()`                  | `lib/report-generation/career-pathway.ts`     | 职业路径 + 30天行动计划                                                       |
| `resume-parse`          | 0.2  | 1000      | `parseResume()`                            | `lib/resume/parse-resume.ts:133`              | 简历 JSON 提取                                                                |
| `memory-extract`        | 0.3  | 500       | `callLLM()`                                | 多处（见下方调用点）                          | 从对话中提取记忆                                                              |
| `coaching-summary`      | 0.3  | 500       | `callLLM()`                                | `app/api/coaching-summary/route.ts:169`       | 教练对话摘要                                                                  |
| `action-plan-enrich`    | 0.5  | 2000      | `enrichActionPlan()` (`callLLMStructured`) | `lib/action-hub/llm-enrich.ts:99`             | Action Hub 行动计划 LLM 富化。fallback: Gemini → Anthropic                    |
| `career-tier-inference` | 0.1  | 300       | 维护脚本（非运行时）                       | `scripts/backfill-career-job-zone-llm.ts:137` | 职业 job-zone/tier 推断，回填 career-directions。fallback: Gemini → Anthropic |

### 已移除的 task

| Task                      | 移除日期   | 原因               |
| ------------------------- | ---------- | ------------------ |
| ~~`diary-parse`~~         | 2026-03-09 | 日记功能已删除     |
| ~~`diary-insight`~~       | 2026-03-09 | 日记功能已删除     |
| ~~`daily-action-select`~~ | 2026-03-09 | 从未被调用，死代码 |
| ~~`mood-detect`~~         | 2026-03-09 | 改为纯算法实现     |
| ~~`adaptive-adjust`~~     | 2026-03-09 | 从未被调用，死代码 |
| ~~`coaching-intro`~~      | 2026-04-12 | 从未被调用，死代码 |

### 规划中的 task（Coaching Companion — 尚未实现）

> 以下 task 定义在 `docs/product/coaching-companion-blueprint.md`，尚未注册到 TASK_CONFIG。
> API route 和代码均不存在，仅作为功能规划参考。

**Companion 管道 (Anthropic)**:

- `daily-briefing` (0.6, 800) — 每日简报
- `reflection-response` (0.7, 600) — 反思回应
- `graduation-report` (0.5, 3000) — 毕业报告

**Action Hub Toolkit (OpenAI)**:

- `elevator-pitch` (0.5, 500), `linkedin-optimize` (0.4, 1000), `networking-script` (0.5, 800)
- `action-plan` (0.5, 2500), `resume-optimize` (0.4, 2000), `cover-letter` (0.6, 1500), `interview-prep` (0.7, 1500)
- `weekly-digest` (0.3, 500), `action-feedback` (0.3, 300)

## 3. 调用管道

### 报告生成管道（2-3 LLM 调用）

> Profile 和 Report 现在是独立产品。Profile 在评测完成后生成（含 profile-narrative LLM 调用）。
> Report 按需生成，读取 profile 的 algoSnapshot，不再重复计算 profile 算法。

```
用户提交 → /api/generate-report (maxDuration: 300s)
  │
  ├── Step 0: buildReportHeader() [算法，无 LLM]
  ├── Step 1: computeCareerMatchAlgorithm() [算法，无 LLM]
  │   (profile 算法已在 profile 生成时完成，从 DB algoSnapshot 读取)
  │
  ├── Step 2 (并行，90s 超时/每个):
  │   ├── generateCareerMatchNarrative() → callLLM('career-match-narrative')  [Gemini]
  │   ├── generateCareerPathway()        → callLLM('career-pathway')         [OpenAI] (仅有 realConditions 时)
  │   └── generateCareerDrainAlgorithmic() [算法，无 LLM]
  │
  └── Step 3 (串行，90s 超时):
      └── generateIntegration()          → callLLM('integration')            [Anthropic]

总管道超时: 180s
每个函数内部: 2 次尝试 (JSON 验证失败时重试，API 错误不重试)
callLLM 内部: 3 次重试 + 1 failover chain (429/5xx/timeout/network 时)
编排层: 0 次重试 — 函数失败后直接降级到算法 fallback
失败时:
  - `careerPathway` reject → 编排层直接回退到 placeholder
  - `careerMatchNarrative` → 编排层降级到 assembleCareerMatchLite (算法 fallback)
  - `integration` → 编排层降级到基于原型标签的模板信件
```

### Profile 生成管道（独立，2 并行 LLM 调用）

```
评测完成 → /api/generate-profile (maxDuration: 90s)
  │
  ├── generateProfile() [算法，无 LLM]
  │   (computeProfileAlgorithm + shadow/core/social/leadership 算法)
  │
  └── after() 异步触发 generateIdentityNarratives()
      ├── 外层: 2 次 after() 重试，间隔 3s
      ├── 内层: 2 并行 callLLM('profile-narrative')
      │   ├── Call A: identitySummary + archetypeNarrative + bigFiveNarrative + valueNarrative
      │   └── Call B: sjtTensionNarrative + crossDimensionNarrative + growthMapInsight
      └── 单次 call 额外 30s timeout，避免被 model-router 的 90s timeout 拖死

失败时:
  - 有效字段部分保留，不再 1 个字段坏就整组丢弃
  - 全部重试耗尽后写入 `failedAt`
  - UI 自动 polling，并在 `failed/partial` 状态下展示已有内容 + retry
```

### 教练对话管道（1 LLM 调用/轮）

```
用户发消息 → /api/coaching-chat (maxDuration: 120s)
  │
  ├── guardRoute() + CSRF 检查
  ├── 加载: 报告上下文 + 用户记忆 (Top 15) + Companion 状态
  ├── buildCoachingSystemPrompt() [构建 system prompt]
  │
  └── streamLLM('coaching', messages)  [Anthropic SSE 流式]
      ├── 超时: 15s 无活动 / 60s 首内容 / 90s 总时间
      ├── Provider failover: Anthropic 失败 → OpenAI streaming fallback
      └── 前端保留 partial content，并显示 retry 提示

后续:
  /api/coaching-summary    → callLLM('coaching-summary')  [OpenAI] JSON
```

### Companion 管道（规划中 — API route 尚未实现）

> 以下管道定义在 `docs/product/coaching-companion-blueprint.md`，代码尚未编写。

```
规划中:
  /api/companion/daily/briefing    → callLLM('daily-briefing')      [Anthropic] JSON
  /api/companion/daily/reflection  → callLLM('reflection-response') [Anthropic]
  /api/companion/weekly-insight    → callLLM('weekly-digest')       [OpenAI] JSON
  /api/companion/graduate          → callLLM('graduation-report')   [Anthropic] JSON

  /api/action-hub/toolkit/[tool]   → callLLM(config.taskName, ...)  [OpenAI] JSON
  /api/action-hub/items/[id]/feedback → callLLM('action-feedback')  [OpenAI]
```

## 4. memory-extract 的调用点

| 调用方         | 文件                      | 说明         |
| -------------- | ------------------------- | ------------ |
| General memory | `app/api/memory/route.ts` | 通用记忆提取 |

> 历史：曾有 `/api/memory/coaching-extract` 端点，2026-05-18 删除——其功能已被 `/api/coaching-summary` 的单次合并调用完全覆盖（避免每轮额外 LLM 调用）。

## 5. 降级与容错

### 自动降级

```
按 task 的显式 fallback chain 路由:
  profile-narrative  : anthropic → gemini
  integration        : anthropic → gemini
  career-match       : gemini → anthropic → openai
  structured tasks   : openai → gemini
  coaching/coaching-first(stream): anthropic → openai (streaming failover)

当 fallback 实际发生时:
  → Sentry warning: "LLM provider degraded"
  → LLMUsageLog.degraded = true
```

### callLLM 重试 + Provider Failover

```
callLLM() 遇到 429/5xx/timeout/overloaded
  → 指数退避 (1s/2s/4s/8s..., ±20% jitter) → 重试最多 3 次 (同 provider)
  → 仍失败 → 按 task 的 fallback chain 尝试下一批准 provider (同样最多 3 次重试)
  → Failover 也失败: Sentry.captureException() + 抛出错误

streamLLM() Provider Failover
  → coaching/coaching-first: anthropic → openai streaming failover
  → 主 provider 不可用或失败: 尝试 fallback provider 的 streaming
  → OpenAI streaming 现在通过 stream_options 记录 token 用量

生成函数 (career-match-narrative / integration)
  → 仅验证重试 (incomplete JSON / repetitive text): 最多 1 次
  → API 错误: 不重试, 直接 break 到 algorithmic fallback
  → 编排层 (report-generation/index.ts): 不重试, 直接降级

Groq 模式 (E2E_USE_GROQ=true): 跳过 failover，已在使用免费 tier

不重试的错误: 401 (invalid key), 400 (bad request), 配置错误
```

### 报告 Fallback

每个生成函数都有 fallback：

- `profile-narrative`: 无模板整包 fallback；部分字段保留，失败写 `failedAt`，UI 展示已有内容/失败提示 + retry
- `career-match-narrative`: 基于算法分数的通用文本
- `career-pathway`: `buildPathwayPlaceholder()` — 编排层在并行 reject 时回退占位，不再拖死 report
- `integration`: 基于原型标签的模板信件

## 6. 成本估算

### 每份报告

| Task | Provider | Est. Input Tokens | Est. Output Tokens | Est. Cost |
| --------------------------- | --------- | ----------------- | ------------------ | ----------- | ----------------------------------------------------------------- |
| profile-narrative (×2 并行) | Anthropic | ~6,000×2 | ~2,000×2 | ~$0.096     | (during profile generation, 2 parallel calls with prompt caching) |
| career-match-narrative      | Gemini    | ~5,000            | ~2,000             | ~$0.007 | (migrated from Anthropic, 85% cost reduction) |
| integration | Anthropic | ~3,000 | ~1,000 | ~~$0.024     |                                                                   |
| career-pathway              | OpenAI    | ~3,000            | ~1,000             | ~$0.001 | |
| **Total** | | | | **~~$0.128** | (was ~$0.166 before Gemini migration) |

### 每次教练对话（10 轮）

| Task             | Provider  | Est. Input/轮 | Est. Output/轮 | Est. Cost/10轮 |
| ---------------- | --------- | ------------- | -------------- | -------------- |
| coaching         | Anthropic | ~3,000        | ~1,500         | ~$0.32         |
| coaching-summary | OpenAI    | ~2,000        | ~500           | ~$0.001        |
| memory-extract   | OpenAI    | ~1,500        | ~300           | ~$0.0005       |

### 每日 Companion（规划中）

> Companion 功能尚未上线，以下为预估成本。

| Task                | Provider  | Est. Cost   |
| ------------------- | --------- | ----------- |
| daily-briefing      | Anthropic | ~$0.014     |
| reflection-response | Anthropic | ~$0.012     |
| memory-extract      | OpenAI    | ~$0.0005    |
| **Total/天**        |           | **~$0.027** |

## 7. 优化路线图

| 阶段       | 动作                                                                                                                                                                                                                  | 预期省幅                                    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Phase 1 ✅ | 修复 Anthropic 超时 (25s→55s→100s) + callLLM 重试 + provider failover (anthropic→openai)                                                                                                                              | 报告从 0% 恢复正常，failover 使成功率 ~100% |
| Phase 2 ✅ | career-match-narrative → Gemini 2.5 Flash + 断路器 + 多 provider failover chain                                                                                                                                       | 每报告省 $0.038 (23%), 断路器防雪崩         |
| Phase 3    | Companion 上线后: daily-briefing + reflection → Claude Haiku 4.5                                                                                                                                                      | Companion 日成本 -65%                       |
| Phase 4 🔄 | Anthropic prompt caching (profile-narrative 已启用, 报告管道待扩展)                                                                                                                                                   | Anthropic input 成本 -90%                   |
| Phase 5    | 微任务 → Gemini Flash Lite                                                                                                                                                                                            | 锦上添花                                    |
| Phase 6 ✅ | 安全+可靠性加固: Gemini key→header, semaphore idempotent release, circuit breaker probing, prompt sanitization, LLMTask 类型约束, dispatchProvider DRY, integration anti-repetition retry, coaching-summary DB 并行化 | 14 项 P1/P2 修复                            |
| Phase 7 ✅ | LLM resilience 升级 (2026-04-07): MAX_RETRIES 1→3, 指数退避+jitter, retry-after honor, 401 立即开 circuit, 529 不计 circuit, /api/health/llm + /api/cron/llm-digest 监控, key format validation                       | 04-04 outage 类故障在 24h 内可见            |

## 8. Resilience — Retry / Failover / Circuit Breaker / Health

> 上线于 2026-04-07，回应 04-02→04-04 期间的 Anthropic API key outage。Runbook 见 `.claude/rules/llm-provider-failover.md`。
>
> 本节描述 `model-router.ts` 现在如何处理 transient 错误，以及监控/告警/恢复机制。

### 8.1 Retry 策略（指数退避 + jitter）

| 参数                       | 值     | 说明                                        |
| -------------------------- | ------ | ------------------------------------------- |
| `MAX_RETRIES`              | 3      | 每次 callLLM 最多重试 3 次（共 4 次尝试）   |
| `BASE_RETRY_DELAY_MS`      | 1,000  | 标准 transient 错误起始延迟                 |
| `OVERLOADED_BASE_DELAY_MS` | 4,000  | 529 overloaded 起始延迟（避免追加压力）     |
| `MAX_BACKOFF_MS`           | 30,000 | 单次 backoff 上限                           |
| `RETRY_AFTER_CAP_MS`       | 60,000 | honored `retry-after` header 上限           |
| Jitter                     | ±20%   | 防止 thundering herd，所有 backoff 都加抖动 |

**Backoff 决策优先级**（`getBackoffMs(retryIndex, err)`):

1. 如果 LLMError 携带 `retryAfterMs`（来自上游 `retry-after` header）→ 直接用，capped at 60s
2. 如果 LLMError 是 529 overloaded → base = 4s，再指数退避
3. 否则 → base = 1s，指数退避：`min(30s, BASE * 2^retryIndex)` ± 20% jitter

**只重试可重试错误**：401/403/400 立即失败，不浪费 latency。

### 8.2 错误分类（`LLMError.code`）

| `code`        | HTTP                             | retryable | 特殊处理                                         |
| ------------- | -------------------------------- | --------- | ------------------------------------------------ |
| `auth`        | 401, 403                         | ❌        | **立即开 circuit**（不等 3 次失败）              |
| `rate_limit`  | 429                              | ✅        | honor `retry-after` header                       |
| `overloaded`  | 529                              | ✅        | longer initial delay; **不计入 circuit breaker** |
| `server`      | 500/502/503/504 + network errors | ✅        | 标准指数退避。网络异常 (DNS/conn reset) 也归此类 |
| `timeout`     | n/a                              | ✅        | 标准指数退避                                     |
| `bad_request` | 400/404/413/422                  | ❌        | 不重试                                           |
| `unknown`     | 其他                             | ❌        | 不重试                                           |

`LLMError` 提供 `isAuth`、`isOverloaded`、`isRateLimit` getter 供 router 使用。
`LLMError.networkError(provider, err)` 将原始网络异常包装为 retryable `server` 错误 (2026-04-12)。

### 8.3 Circuit Breaker

| 参数                                | 值      | 说明                                                         |
| ----------------------------------- | ------- | ------------------------------------------------------------ |
| `CIRCUIT_FAILURE_THRESHOLD`         | 3       | 连续失败次数达到此值开 circuit                               |
| `CIRCUIT_COOLDOWN_MS`               | 5min    | circuit open 后多久允许 half-open probe                      |
| `OVERLOADED_SOFT_CIRCUIT_THRESHOLD` | 5       | 连续 529 次数达到此值触发软断路，主动路由到 fallback         |
| Half-open                           | 1 probe | cooldown 后允许 1 个请求探测，成功 → close，失败 → 重新 open |

**特殊规则**：

- **`isAuth` (401/403)**：第一次失败立即把 `consecutiveFailures` 置为 threshold，circuit 立即 open。理由：API key 失效不会因为重试而恢复，浪费 latency 没意义。这就是 04-04 outage 的直接修复——当时 41 次 401 + retry 才被 fallback 接住。
- **`isOverloaded` (529)**：不计入 `consecutiveFailures`。529 是上游对所有客户的压力，不是 provider 对我们坏掉。但更新 `lastFailureAt` 让 half-open probe 计时仍然正确。
- **529 软断路 (soft-circuit)**：连续 529 达到 `OVERLOADED_SOFT_CIRCUIT_THRESHOLD` (5) 次后触发软断路，主动路由到 fallback，避免每次请求消耗 ~28s 重试延迟。软断路同样使用 5min cooldown + half-open probe 恢复。成功或非 529 错误重置计数器。

### 8.3.1 冷启动种子 (Cold-Start Seeding)

> 上线于 2026-04-12。解决 serverless 冷启动时断路器状态丢失的问题。

**问题**：每次 Vercel cold start 创建全新 `_circuits` Map，新实例不知道 provider 正在宕机，浪费 3 次失败请求才能开路。

**方案**：`ensureCircuitsSeeded()` 在首次 `callLLM`/`streamLLM` 调用时查询 `LLMUsageLog` 最近 5 分钟的失败率。如果某 provider 失败率 >50% 且失败次数 ≥3，预开路。

| 参数       | 值   | 说明                                            |
| ---------- | ---- | ----------------------------------------------- |
| 查询窗口   | 5min | 匹配 circuit cooldown                           |
| 失败率阈值 | 50%  | 避免偶发错误误开路                              |
| 最小样本   | 3    | 匹配 CIRCUIT_FAILURE_THRESHOLD                  |
| 调用频率   | 1次  | 每实例冷启动只查 1 次（Promise singleton 保证） |
| 失败处理   | 静默 | DB 不可达时降级为纯内存断路器                   |

使用 partial index `idx_llm_usage_provider_failures` (migration 071) 确保查询效率。

### 8.4 Health Check & 监控

**`/api/health/llm`** — 公开 health 端点（需 `Authorization: Bearer ${HEALTH_CHECK_SECRET || CRON_SECRET}`）

- 对每个 provider 跑 5-token 探测，并行执行
- HTTP status 反映状态：200 healthy / 207 degraded / 503 unhealthy
- 推荐 UptimeRobot / Vercel monitoring 每 15 分钟 ping

**`/api/cron/llm-digest`** — 每日 09:30 UTC（`vercel.json` cron）

- 聚合最近 24h 的 LLM 调用指标
- 4 个告警规则：
  1. 任一 provider 成功率 < 95%（且 ≥10 次调用）→ Sentry critical
  2. 整体 degraded rate > 5% → Sentry critical
  3. 实时 probe 显示任一 provider 不健康 → Sentry critical
  4. 同一 auth 错误重复 ≥3 次（key 可能已吊销）→ Sentry critical

**Key 格式预校验** (`lib/ai/health-check.ts:validateKeyFormat`)：Anthropic `sk-ant-` / OpenAI `sk-` 或 `gsk_` / Gemini `AIza`。纯本地校验，捕获最常见的部署错误。

### 8.5 设计原则

- **Fail fast on auth, retry slow on overload**: 不可恢复错误浪费时间没有价值；上游过载值得等
- **Prefer transparency over cleverness**: 每次降级打 Sentry warning，每次 outage 第二天 09:30 必须出现在 digest 里
- **Don't blame the upstream when it's not its fault**: 529 不开 circuit，401 立即开 circuit
- **Cap everything**: max retries / max backoff / max retry-after honor — 永远没有"无限等待"

### 8.6 Outage 复盘表

| 日期               | 持续 | 类型                                       | 用户影响                                  | 触发改进                                  |
| ------------------ | ---- | ------------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| 2026-04-02 → 04-04 | ~48h | Anthropic API key 失效 (41× 401) + 1天 502 | 0（fallback 接住，但运营层 3 天后才发现） | Phase 7 全套：监控 + retry + circuit 升级 |

## 9. 新增 LLM 调用 Checklist

新增 LLM 调用时，必须完成以下步骤：

- [ ] 在 `TASK_CONFIG` (model-router.ts) 中注册新 task
- [ ] 选择 provider: 叙事质量 → Anthropic / 结构化叙事 → Gemini / 结构化提取 → OpenAI
- [ ] 设置合理的 temperature 和 maxTokens
- [ ] prompt 中包含语言指令 (`"Respond entirely in {locale}"`)
- [ ] 通过 `callLLM(task, messages)` 或 `streamLLM(task, messages)` 调用
- [ ] 错误处理: try/catch + 用户友好的 fallback
- [ ] 更新本文档的 Task 全景表
- [ ] 更新 `docs/architecture/ai-routing.md` 的 TASK_CONFIG 表
