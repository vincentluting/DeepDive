# LLM Provider 故障 Runbook

> 当 `/api/cron/llm-digest` 或 `/api/health/llm` 报警时，按本流程处理。
> 上线于 2026-04-07，源于 04-02→04-04 期间 Anthropic API key outage 的复盘。

## 告警来源

| 告警                                             | 触发条件                                                     | 严重度      |
| ------------------------------------------------ | ------------------------------------------------------------ | ----------- |
| **`LLM provider "X" success rate Y% below 95%`** | 24h 任一 provider 成功率 < 95% 且 ≥10 次调用                 | 🔴 critical |
| **`LLM overall degraded rate Y% above 5%`**      | 24h 整体 fallback 率 > 5%                                    | 🔴 critical |
| **`LLM live probe DEGRADED/UNHEALTHY`**          | `checkAllProviders()` 实时探测异常                           | 🔴 critical |
| **`LLM auth error repeated N×`**                 | 同一 401/403 错误重复 ≥3 次 — key 可能已吊销                 | 🔴 critical |
| **`LLM provider degraded` (Sentry warning)**     | 单次 fallback 触发，源自 `model-router.captureDegradedRoute` | 🟡 warning  |

## 分类处理

### Case 1: 401/403 (auth error) — 最常见，最简单

**症状**: digest 显示某 provider 大量 `invalid API key` 或 `invalid x-api-key`。

**根因**: API key 已轮换/过期/吊销/格式损坏。

**处理步骤**:

1. 登录 provider 控制台验证 key 状态：
   - Anthropic: https://console.anthropic.com/settings/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Google: https://aistudio.google.com/app/apikey
2. 如果 key 已失效 → 创建新 key，更新到 Vercel env vars
3. 触发重新部署（或等待下次 deploy）
4. 跑 `curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" https://YOUR_DOMAIN/api/health/llm` 验证恢复
5. **以及最重要的：检查 `lib/ai/model-router.ts` 中 circuit breaker 的 in-memory 状态**——
   serverless cold start 会重置，所以新 instance 会立即可用，但已经热的 instance 还需要 `CIRCUIT_COOLDOWN_MS` (5min) 才会探测

**用户影响**: 如果 fallback chain 配置正常 → **零影响**（用户拿到降级 provider 的内容）。否则 → 报告/教练失败。

### Case 2: 429 (rate limit)

**症状**: `rate limit error`，可能伴随高 `degraded` rate。

**根因**: 调用量超出 provider 配额，或者突然流量峰值。

**处理步骤**:

1. 查 provider 控制台的 rate limit dashboard
2. 如果是流量峰值且短暂 → 不需要操作，retry + backoff 会自然恢复
3. 如果是持续超限 → 升级 tier，或者把部分 task 路由到不同 provider
4. 检查是否有死循环/暴跑的 admin 工具

**用户影响**: 短暂延迟（retry），fallback 接住。

### Case 3: 529 (overloaded — Anthropic)

**症状**: `overloaded` errors，集中在某段时间。

**根因**: Anthropic 全网压力。**不是我们的问题**。

**处理步骤**:

1. 看 https://status.anthropic.com — 是否有公开 incident
2. 等待恢复（通常 15-60 分钟）
3. 不需要操作 model-router——已经配置 4s 起始 backoff + 不计入 circuit
4. 如果用户体感受影响 → 临时把 Anthropic 任务的 primary 切到 fallback（编辑 TASK_CONFIG，redeploy）

**用户影响**: 增加延迟，但 fallback 接住。

### Case 4: 500/502/503/504 (server error)

**症状**: 散发的 `server error`。

**根因**: provider 上游瞬时故障。

**处理步骤**:

1. 单次 502/503 → 不需要操作，retry 会接住
2. 持续 5xx → 看 provider status page
3. 如果某 provider 持续 5xx → 临时切到 fallback

**用户影响**: 短暂延迟。

### Case 5: 整体 `degraded rate > 5%` 但每个 provider 单看正常

**症状**: 单个 provider 都健康，但整体 degraded 率高。

**根因**: 多个零星问题叠加，或者某个特定 task 一直走 fallback。

**处理步骤**:

1. 跑 SQL 看哪个 task 的 degraded 率最高：
   ```sql
   SELECT "taskName", COUNT(*) FILTER (WHERE "degraded"=true)::float / COUNT(*) AS pct
   FROM "LLMUsageLog"
   WHERE "createdAt" > NOW() - INTERVAL '24 hours' AND "success" = true
   GROUP BY "taskName" ORDER BY pct DESC;
   ```
2. 检查那个 task 的 primary provider 是否有特定问题
3. 看看是不是 `circuit breaker` 卡在 OPEN 状态（serverless cold start 会重置，热 instance 会等 cooldown）
4. 也看是不是 **health-aware 路由** 把 primary 降级了（自 2026-04-23 起生效）。
   - `/api/health/llm` 的 `routingHealth.snapshots[*].status == "unhealthy"` 只表示 "10min 窗口成功率 < 80%"，**不等于** 路由层真的切了。`resolveConfigAsync` 只在链路里存在另一个更健康、available 且 circuit-closed 的 provider 时才换 primary；广泛 outage（所有候选都不健康）或备选被 circuit/availability gated 的情况下，仍然走原 primary。
   - 判断 "是否真降级" 看 Sentry `captureDegradedRoute` 的 `reason` 是否以 `health-demoted:` 开头，以及 `LLMUsageLog.degraded=true` 的实际行数。
   - 如果想临时退回纯静态路由：Vercel 设 `LLM_HEALTH_ROUTING_DISABLED=1` 再部署 ~45s
   - 详细设计：`docs/architecture/ai-routing-v2.md`

### Case 6: Sentry `captureDegradedRoute` 出现 `health-demoted:` 原因

**症状**：Sentry 看到 `LLM provider degraded` 告警，reason 字符串以 `health-demoted:` 开头，例如 `health-demoted: success-rate 12% over 10min (1/8)`。

**含义**：Health routing 依据 `LLMUsageLog` 滑窗聚合判定某 provider 不健康（成功率 < 80%），自动把它降到 fallback 链尾，不再作为 primary。**这是正常的自动化行为，不是系统 bug**。

**什么时候要管**：

- 短期频繁 health-demote（一天超过 10 次） → 进一步查 provider status page，是否值得把 TASK_CONFIG 的 primary 临时切换
- Provider 成功率恢复后 `health-demoted` 消失 → 无需人工介入，路由会在下一个 10min 窗口自动复位
- Health routing 和 circuit breaker 同时触发 → circuit breaker 优先（硬闸门），health routing 不覆盖它的判断

## 验证恢复

恢复后必须跑：

```bash
# 1. 实时探测
curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" https://YOUR_DOMAIN/api/health/llm
# 期望：200 + overallStatus=healthy

# 2. 手动触发 digest
curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/llm-digest
# 期望：alerts=[]
```

### Case 7: Env override masking — shell 父进程 export 空字符串遮蔽 .env.local（2026-05-24 incident）

**症状**：

- dev server 启动日志报 `[startup] LLM providers: X/3 healthy, 1 shell-masked`
- 或者 `[model-router] Primary provider unavailable for "<task>", routing to <fallback>` 每次都触发（不只是偶发）
- `npm run check:env` 报 `❌ CRITICAL — LLM key masked by empty shell value`
- 用户 / 测试者：coaching SSE 等 90s 后报 `StreamTimeoutError`

**根因**：

Shell 父进程导出了 `export ANTHROPIC_API_KEY=""`（或别的 LLM key），通常和 `ANTHROPIC_BASE_URL=<router>` 一起设置（Claude Code 自身 / 企业 LLM 代理常这么配）。

Next.js `loadEnvConfig` / dotenv 默认 `override: false` — 已经在 `process.env` 里的值（即使是空字符串）不会被 `.env.local` 覆盖。于是 `.env.local` 里的合法 key 被遮蔽。

`isAnthropicAvailable()` / `isGeminiAvailable()` 拿到空字符串 → 返回 false → router 直接选 fallback，**根本没去试 primary**。

**处理步骤**：

1. 跑诊断（不暴露 value）：

   ```bash
   node -e 'for (const k of ["ANTHROPIC_API_KEY","OPENAI_API_KEY","GOOGLE_API_KEY","ANTHROPIC_BASE_URL"]) console.log(k, {present: Object.hasOwn(process.env, k), truthy: !!process.env[k], len: (process.env[k]||"").length})'
   ```

   - `present: true, truthy: false, len: 0` = shell 在压制 .env.local
   - `present: false` = .env.local 是 source of truth，没问题

2. 临时修复（当前 shell + dev server）：

   ```bash
   kill <dev-server-pid>
   unset ANTHROPIC_API_KEY ANTHROPIC_BASE_URL
   npm run dev
   ```

3. 永久修复 — 找出 export 出处：

   ```bash
   grep -nE "ANTHROPIC_(API_KEY|BASE_URL)" ~/.zshrc ~/.zprofile ~/.zshenv ~/.bashrc ~/.bash_profile 2>/dev/null
   ```

   找到后注释掉，或加 `[ -z "$ANTHROPIC_API_KEY" ] || ...` 条件保护。

4. 验证：`npm run check:env` 应该 0 critical mask，dev server 启动日志应该 `3/3 healthy`。

**预防**：

- `package.json` 已经把 `predev` 设为 `check:env --soft`，每次 `npm run dev` 都会 warn
- `prebuild` 是 `--strict`，CI build 会硬 block
- Sentry Rule 0（`source=startup-validation`）会推送 prod 端的 mask（虽然 prod 不太可能踩这个坑，但 deploy script 注入错时能 catch）

**用户影响**：

- Dev：每次 LLM 调用走 fallback chain，多 1 跳 latency + 浪费 primary quota（如果还是降到 OpenAI 而非真 fallback）
- Prod：如果 deploy pipeline 误注入了空字符串到 Vercel env，所有 LLM 任务降级。这是 Rule 0 监控的核心场景。

---

## 永远不要做

- ❌ **不要 retry 401/403** —— 浪费 latency 且永远不会恢复（这是 04-04 outage 的教训）
- ❌ **不要把 529 计入 circuit breaker** —— 上游压力不是我们的问题，开 circuit 反而让我们和 fallback provider 一起被打挂
- ❌ **不要禁用 fallback chain "for performance"** —— fallback 是 outage 时唯一的护城河
- ❌ **不要 hardcode timeout 比 vercel maxDuration 还长** —— vercel 会先杀掉，得到 504 而不是优雅 timeout
- ❌ **不要在 shell rc 里裸 export LLM key 为空字符串** —— 见 Case 7

## 复盘检查清单

每次 outage 后填这个清单（追加到 `docs/architecture/llm-call-inventory.md` 章节 8 末尾）：

- [ ] outage 持续时间
- [ ] 用户影响（多少调用失败 / 多少 fallback 接住）
- [ ] 根因（auth / rate / server / overloaded / 我们的 bug）
- [ ] digest cron 是否第一时间发现？如果没有 → 调整告警阈值
- [ ] retry 策略是否合适？如果 429/529 频繁出现 → 考虑按 task 调整 max_tokens / batch
- [ ] 是否需要新增 fallback provider？
