---
title: Sentry Alert Rules — LLM Provider Health
category: architecture
sources:
  - lib/ai/model-router.ts
  - app/api/cron/llm-digest/route.ts
  - .claude/rules/llm-provider-failover.md
sync_mode: manual
last_verified: 2026-04-13
verified_by: claude-code
---

# Sentry Alert Rules — LLM Provider Health

> 这份文档列出推荐的 Sentry 告警规则。配置在 Sentry 控制台手动完成
> （Sentry 没有 IaC SDK 可以从代码同步），所以本文档是 source of truth。

## 为什么需要这个

`/api/cron/llm-digest` cron 已经把 critical alerts 写入 Sentry 了，但 Sentry 默认不会主动推送给你——你需要配置 alert rules 把它们 pipe 到 Slack/邮件/PagerDuty。

没有这一步，新加的 digest cron 就只是另一个"日志写在那里没人看"的状态。

## 推荐的告警规则

### Rule 0: LLM startup key validation failure (P0)

**Why**: `instrumentation.ts` 在每个 nodejs runtime 启动时调 `validateLLMKeysAtStartup()`。它把 3 个 LLM key 分类成 `healthy / invalid-format / empty-string-override / unset`。`empty-string-override` 是 2026-05-24 incident 的精确画像 — shell 父进程 export `KEY=""` 把 .env.local 合法值遮蔽（dotenv 默认不覆盖），model-router 静默把 primary 降级到 fallback。

**Filter**:

- `event.tag.source == "startup-validation"`
- `message` matches one of:
  - `"No LLM providers healthy at startup"` (`event.level == "error"`)
  - `"LLM key issues at startup"` (任何 level)

**Action**:

- 立即推送到 admin 邮箱（论文期 = 立即响应 — 影响所有 LLM 调用质量）
- 包含 `extra.masked` / `extra.invalid` 让你 1 秒判定根因
- Frequency: 每条都发（startup 事件不会聚集）

**Expected volume**:

- 0/部署（健康状态）— 部署后第一次启动跑一次 `validateLLMKeysAtStartup`
- 1/部署当 prod env 漂移时 — Vercel rotation 出问题 / key 失效 / shell-style 覆盖渗进 prod

**Diagnostic snippet**（告警里附上）:

```bash
# Local check (mirror startup classifier):
node -e 'for (const k of ["ANTHROPIC_API_KEY","OPENAI_API_KEY","GOOGLE_API_KEY"]) console.log(k, {present: Object.hasOwn(process.env, k), truthy: !!process.env[k], len: (process.env[k]||"").length})'

# Vercel prod check:
vercel env ls
```

Runbook：`.claude/rules/llm-provider-failover.md` Case 7。

---

### Rule 1: LLM digest critical alerts (P0)

**Why**: digest cron 每天 09:30 UTC 跑一次，发现的任何 critical 都需要立即推送。

**Filter**:

- `event.tag.source == "llm-digest"`
- `event.tag.severity == "critical"`
- `event.level == "error"`

**Action**:

- 立即推送到 admin 邮箱（或 Slack `#alerts` 频道）
- Frequency: 每条告警都发，不去重

**Expected volume**: 0 条/天（健康状态）。任何一条都需要立即响应。

### Rule 2: LLM provider auth error (P0)

**Why**: 401/403 是最致命的——所有调用立即开始失败，且不会自愈。这是 04-04 outage 的精确画像。

**Filter**:

- `message contains "invalid API key"` OR `message contains "invalid x-api-key"`
- 任何 LLM-related transaction
- (可选) `event.tag.source == "llm-digest"` OR exception path

**Action**:

- 立即推送（不等聚合）
- 标记为 P0/critical

**Expected volume**: 0 条/天。任何一条 = 你需要现在去看 provider 控制台。

### Rule 3: LLM degraded route 频次 (P1)

**Why**: 单次 fallback 是正常的 — circuit breaker 在工作。但 1 小时内 >10 次说明某个 provider 持续有问题。

**Filter**:

- `message == "LLM provider degraded"`
- `event.level == "warning"`

**Frequency**: 1h 窗口 > 10 次

**Action**:

- 推送到 Slack `#warnings` 频道（不需要立即响应）
- 包含 `extra.task` 和 `extra.originalProvider` 让你快速定位

**Expected volume**: 0-2 次/天（正常 baseline）。> 10/h = 异常。

### Rule 4: Report language guard mismatch (P1)

**Why**: 英文报告里出现中文（或中文报告里出现英文）是 P0 级用户可见 bug（见 2026-04-22 Jacky outage）。语言守卫现在会自动检测并 regenerate，但任何 pass2 仍泄漏的 event 都需要人工介入。

**Filter (pass2 仍泄漏，必须立即看)**:

- `event.tag.feature == "report-generation"`
- `event.tag.guardPhase == "pass2"`
- `event.level == "error"`

**Action**:

- 立即推送（邮件或 `#alerts` Slack）
- 标记为 P1（仅次于 LLM auth error）

**Expected volume**: 0-2 条/周。多于这个就要审视 prompt 或 sanitize 策略。

**Filter (pass1 — 日汇总即可)**:

- `event.tag.feature == "report-generation"`
- `event.tag.guardPhase == "pass1"`
- `event.level == "warning"`

**Action**: 每日汇总邮件，按 `targetLocale` × `task` 分组。用于观察泄漏趋势。

**Tags schema**：

| Tag            | 取值范围                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `feature`      | `"report-generation"`                                                                            |
| `task`         | `"career-pathway"` / `"career-match-narrative"` / `"integration"`                                |
| `targetLocale` | `"en"` / `"zh"` / `"nl"` / `"de"` / `"fr"` / `"es"` / `"pt"` / `"it"` / `"ru"` / `"ja"` / `"ko"` |
| `guardPhase`   | `"pass1"`（首次检出）/ `"pass2"`（regenerate 后仍泄漏，error 级）                                |

**Extra payload**：`mismatchCount`, `mismatchedPaths[]`（最多 10 条点记法路径）, `samples[]`（最多 3 条，含 path + 前 80 字符 preview + foreignRatio）。不含 PII。

### Rule 5: LLM call exception (P2)

**Why**: 单个 call 失败往往会被 retry/fallback 接住，但持续异常说明有 bug。

**Filter**:

- `event.tag.task` is set (i.e., LLM exception captured by `Sentry.captureException` in model-router)
- `event.level == "error"`

**Frequency**: 1h 窗口 > 20 次

**Action**:

- 摘要邮件，每天一次
- 用于趋势分析，不用于实时响应

## Sentry 控制台配置位置

1. 登录 Sentry → 选择项目 → **Alerts** 标签
2. **Create Alert** → **Issues**（或 **Metric Alerts** for rate-based）
3. 复制粘贴上面的 filter

## 验证告警规则

部署完后跑：

```bash
# 触发一次 digest（即使没问题，会有 0 alerts 的日志）
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/llm-digest
```

如果想测试 P0 告警通路：临时把某个 task 的 success rate 阈值降到 99%（编辑 cron route），跑一次，确认推送收到，然后改回 95%。

## 不要做

- ❌ **不要给所有 warning 都设推送** — `LLM provider degraded` warning 是健康行为（fallback 在工作），不是 incident
- ❌ **不要把 retry 中的 warning 也设告警** — `LLM call retrying` 是预期行为，每次 transient 错误都会触发
- ❌ **不要忽略 0 条告警的 digest** — 跑成功本身就是健康信号，但如果 cron 一直没跑（Vercel cron 失败）→ 没有告警 ≠ 健康。建议额外设一个"cron 24h 没跑过"的告警

## Cron 自身健康检查

Sentry **Cron Monitors** 功能可以监控 cron 是否按时跑。在 `/api/cron/llm-digest` 加一行：

```ts
import * as Sentry from "@sentry/nextjs";
const checkInId = Sentry.captureCheckIn({
  monitorSlug: "llm-digest",
  status: "in_progress",
});
// ... cron 逻辑 ...
Sentry.captureCheckIn({
  checkInId,
  monitorSlug: "llm-digest",
  status: "ok", // 或 "error"
});
```

在 Sentry 控制台为 monitor `llm-digest` 配置 schedule `30 9 * * *`，如果 24h 没收到 check-in 自动告警。

> 这是后续可选优化，不在 Phase A 必须项内。

## Rule N+1: profile-narrative validation failures (P1)

**Why**: 用户卡在 `/processing` 是 narrative 生成失败的下游症状（最近案例：assessment `377de626-...`，2026-05-09→05-10 撞 retryCount=5）。LLM 返回 `success=true`，但我们的字段长度/schema 检查判残，整个 pipeline 失败。如果不告警，下次只能靠运气发现。

**Source**: `lib/profile-generation/narrative-telemetry.ts`:

- `reportNarrativeFailure()` — fires ONCE per terminal failure (top-level
  generator returns null, or the pipeline step's post-check rejects the
  payload). Used by the alert rule below.
- `addNarrativeBreadcrumb()` — fires at every intermediate fallback
  (soul → legacy, single call rejection, language-guard sanitize, ...).
  Sentry breadcrumbs are NOT events; they only appear as context attached
  to the next captureMessage/captureException in the same scope. Do NOT
  alert on these — a healthy generator run that goes soul → legacy →
  success produces 1-3 breadcrumbs and 0 events, which is correct.

Pre-2026-05-12 this split didn't exist — every intermediate emitted a
captureMessage, so a single user failure produced 3-5 Sentry events and
would falsely trigger the 24h ≥ 3 alert below.

**Filter** (terminal-only modes — these are not used in breadcrumb paths):

- `event.tag.feature == "profile-generation"`
- `event.tag.task == "profile-narrative"`
- `event.tag.mode in [
  "legacy-fields-missing",
  "legacy-language-guard",
  "generator-returned-null",
  "pipeline-step-incomplete"
]`

**Action**:

- 24h 内 ≥ 3 条 → 邮件推送 (P1，可以等到第二天处理)
- 24h 内 ≥ 10 条 → 立即 Slack alert (P0，可能是 LLM 输出格式整体漂移)

**Expected volume**: 0–1 条/天（健康状态下偶发的 LLM 抖动）。持续大于阈值意味着：

1. Prompt 改动后 LLM 输出格式漂移（看 `mode` 分布）
2. 某 provider 的 JSON 模式坏掉（看 LLMUsageLog `provider` 列）
3. Schema gate 阈值过严（看 extra.fieldLengths 是否集中在某个边界）

**Diagnosis playbook**:

1. 看 Sentry event 的 `extra.missingKeys` 和 `extra.fieldLengths` — 哪个字段挂了？
2. 用 `extra.assessmentId` 查 LLMUsageLog 的 `provider`/`outputTokens`
3. 用 `tag.mode == "pipeline-step-incomplete"` 过滤 — 如果出现，说明生成器的"null-or-complete"契约破了，这是 P0 regression

**Don't**:

- ❌ 不要给 `mode == "legacy-call-rejected"` 单独设告警 — A/B 单 call 失败是预期容错路径，只在 `legacy-both-failed` 时才是真问题
- ❌ 不要把这一类降级为 transient — 它们 retry 100 次模式不变，会烧 LLM 配额

---

## 论文采集期增补 (2026-05-18)

> 上面的告警是 LLM-focused。论文采集启动后，更直接的"数据丢失"风险来自 assessment / report 端点本身，以及 Neon 0.5GB 免费层触顶。补 3 条规则覆盖这些。

### Rule 6: Assessment save 失败 (P0 — 论文期最致命)

**Why**: 用户花 30-60 分钟填完 86 题, `/api/score` 失败 = 论文 N 减 1, 而且用户体验是"白填一遍"。`logApiError` 已经自动 capture 到 Sentry (`lib/api/api-errors.ts:85`), 但默认不告警。

**Filter**:

- `event.tag.route == "/api/score"` (logApiError 写入)
- `event.level == "error"`

**Action**:

- 立即推送 email (论文期间 P0)
- 包含 `extra.sessionId` 用于关联 LLMUsageLog / QuestionnaireSession 行为

**Expected volume**: 0-1 条/天 (健康 baseline). 任何持续上升都是论文采集断流信号。

### Rule 7: Report generate 失败 (P1)

**Why**: 报告生成失败不直接丢数据 (assessment 已经存), 但用户卡在"正在生成报告"屏幕, 论文体验受损; 持续失败说明 LLM provider 或 pipeline 有 bug。

**Filter**:

- `event.tag.route == "/api/generate-report"` OR `"/api/generate-report/stream"`
- `event.level == "error"`
- exclude code `AI_NOT_CONFIGURED` (启动配置问题, 不是 runtime)

**Frequency**: 24h 窗口 > 5 次

**Action**:

- 摘要邮件; 不是即时 incident
- 包含 `extra.assessmentId` 关联具体用户

### Rule 8: Neon DB capacity warning (P0 — 论文期数据丢失前置)

**Why**: Neon Free 0.5GB 触顶 = 新答案 INSERT 失败 = 论文 N 减 1. cleanup-old-data cron 每天 03:00 UTC 测 DB size, 80% 阈值发 warning, 95% 发 error (见 `app/api/cron/cleanup-old-data/route.ts`).

**Filter (warning level)**:

- `message contains "Neon DB size"` AND `event.level == "warning"`
- `event.tag.cron == "cleanup-old-data"` AND `event.tag.check == "db-capacity"`

**Action**:

- 推送 Slack `#warnings` (有 ~20% runway 可以处理)
- 提示: 跑 TRUNCATE 大表 / 增加 TTL 频率 / 升 Neon Launch tier ($19/月)

**Filter (error level)**:

- 同上但 `event.level == "error"` (>= 95%)

**Action**:

- 立即邮件推送
- 此时 INSERT 已经接近失败, 必须 1-2 小时内处理

**Expected volume**: 0 条/月 (健康 baseline). 第一条 warning 出现 = 有 1-2 周时间扩容; 第一条 error 出现 = 几小时窗口。

### Rule 9: Ownership gate 触发 (P1 — 安全审计)

**Why**: 2026-05-18 加的 `verifyAssessmentOwnership` 在所有 `getEffectiveAssessment` 调用路径上。Forbidden 结果会让 caller 返回 404 给用户, 但应该被 audit — 看是否有真实 cross-user 探测。

**Filter**:

- `event.tag.route` IN `["/api/generate-report", "/api/generate-report/stream", "/api/generate-profile", "/api/report/status", "/api/assessment/[assessmentId]/request-report", "/api/assessment/[assessmentId]/regenerate-report"]`
- `event.tag.code == "ASSESSMENT_NOT_FOUND"`

**Frequency**: 24h 窗口 > 20 次 (单个用户偶发是正常的; 持续高量 = 可能 attacker enumeration)

**Action**:

- 邮件汇总
- 包含 `extra.userId` 看是否有单一来源 (内部) — 这种情况是 P0 调查

**Expected volume**: 0-10 条/天 (用户合理重试 / 链接过期).
