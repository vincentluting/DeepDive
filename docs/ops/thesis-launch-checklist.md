---
title: Thesis Launch Checklist
category: ops
purpose: Every item must PASS before opening recruitment to a new batch of research participants.
last_verified: 2026-05-24
---

# Thesis Launch Checklist

> 这份 checklist 在论文招募（thesis_2026 cohort）每个 batch 开启前**必须全部 PASS**。
> 任何一项 FAIL 都阻塞招募 — 别想着"先开一两个用户试试"，论文数据完整性不能赌。

## 检查跑哪里？

- **本地仓库**：用本地的 dev 环境跑（cd 到仓库，npm run dev 在跑）
- **Vercel prod**：需要 `vercel login` + `vercel link` 已 done

## Section A — 代码 + 类型 + 测试 (5 分钟)

- [ ] `npx tsc --noEmit` — 0 errors
- [ ] `npm run lint` — 0 errors
- [ ] `npm run lint:i18n` — 11 locale 同步 + S1-S4 全 0 findings
- [ ] `npm run test` — 全套通过（当前 baseline ≈ 2606 passed / 1 skipped / 236 files）
- [ ] `npm run build` — production build 成功

## Section B — DB Schema + 数据完整性 (5 分钟)

- [ ] `npm run db:migrate:status` — 0 pending（all migrations applied）
- [ ] `npm run verify:thesis` — thesis 数据完整性 PASS

## Section C — Env 配置正确性 (5 分钟)

- [ ] `npm run check:env:strict` — 0 critical issues, 0 missing required, 0 shell-override masks
  - 如果有 shell override → 按 `.claude/rules/llm-provider-failover.md` Case 7 修
- [ ] `npm run check:vercel-env` — Vercel prod parity OK，0 critical missing
- [ ] 手动 spot-check：Vercel prod 的 `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_API_KEY` 都设了真实 key（非 placeholder）

## Section D — LLM Provider 健康 (3 分钟)

- [ ] `curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" https://YOUR_DOMAIN/api/health/llm` → `overallStatus: "healthy"`
- [ ] dev server log 启动行 `[startup] LLM providers: X/3 healthy` — X >= 2（至少 primary + 1 fallback）
- [ ] Sentry dashboard 9+1 条 alert rule 全部 enabled（含 Rule 0 startup validation）

## Section E — 关键 API smoke (5 分钟)

- [ ] `npm run smoke:thesis` — exit 0（所有 13 步 PASS）
  - 如果 exit 1 → 代码 regression，查 commit
  - 如果 exit 2 → LLM provider/env 问题，回去 Section C/D 排查
  - 如果 exit 3 → 没设 HEALTH_CHECK_SECRET，pre-flight 跳过了

## Section F — Bug Log 状态 (3 分钟)

- [ ] `.claude/quality/bug-log.md` 11 条 P0 状态：
  - 9 已 Claude ✅ + commit
  - 2 已被 CPO 战略 obviate（#013 / #017 via thesis locale en/zh only）
  - 全部都已不阻塞采集

## Section G — 真实用户端到端 (10 分钟)

> 这步是论文招募的最后一道关卡。bug-log 明确规定 "必须 User ✅" 才能启动。

用真实邀请码注册一个测试账号（用你自己的私人邮箱，跑完后 admin 后台手动删除），完整走通：

- [ ] 注册（thesis_2026 邀请码 → cohort 正确分配）
- [ ] Consent v4.1 (CDC-5 + SCC-12 + UES-12 + Trust-5 + DR-3) 提交成功
- [ ] T0 pre-assessment 写入 `PrePostAssessment` 表
- [ ] Quick Dive 完成 → resultId 生成
- [ ] Deep Dive 完成 → assessmentId 生成
- [ ] Profile 算法生成 < 5s
- [ ] Report LLM 生成 30-90s，**非 fallback template**（admin 后台看 reportJson.careerMatch.summary 不要以 "Based on your interest map..." 开头）
- [ ] Coaching 至少 1 round SSE 流畅返回
- [ ] T1 post-assessment 通过 #018 gate（DD + report + coaching 都满足 prerequisite）
- [ ] Admin user-journey 页能定位测试用户 + 跳转到对应 profile（验证 admin 排障能力）

## Section H — 监控 + Runbook 准备 (3 分钟)

- [ ] `/api/cron/llm-digest` cron schedule 在 vercel.json 仍是 `30 9 * * *`
- [ ] `.claude/rules/llm-provider-failover.md` 7 个 case 你都看过一遍（招募期间 outage 时直接对照处理）
- [ ] 招募期间负责人手机能收到 Sentry P0 告警

## 任何一项 FAIL = 不开放招募

完成上面所有项 → 可以批量启动 thesis_2026 邀请码发放。

如果 Section G 某一步失败，**不要绕开**。常见误判：

- "smoke 通过就行" — Section G 走真实路径才能 catch UI/i18n/timing/race condition 的回归
- "我刚才看过没问题" — UI 改完几小时后再回归走一遍，免得自己习惯了 broken 状态
- "用户应该会自己 retry" — research integrity ≠ best-effort 用户产品，不允许 silent loss

## 重新评估周期

- 每个批次（10-20 人）开启前完整跑一次本 checklist
- 任何 LLM router 改动 / DB schema 改动 / auth 改动后追加跑一次 Section A-D
- 跑完写日期到本文档 `last_verified` frontmatter

## Section I — Vercel deploy webhook（一次性配置，可选 Tier 4 加固）

> 这一项是部署后的兜底：每次 Vercel `production` deploy 成功后自动 probe `/api/health/llm`，发现 unhealthy 时自动告警或回滚。一次配置永久受益，但需要在 Vercel dashboard 手动操作（CI 代码动不了）。

- [ ] Vercel dashboard → Project Settings → Deploy Hooks，新建 `deploy-success-llm-probe` hook
- [ ] 把 hook URL 加到 Vercel → Settings → Notifications → "Production deploy succeeded" 的 webhook target
- [ ] Webhook payload 由 Vercel POST 给一个简单的 serverless function（可放到 Cloudflare Workers / Lambda / 任何能跑 curl 的地方），function 内部跑：

  ```bash
  curl -fsS -H "Authorization: Bearer $HEALTH_CHECK_SECRET" "$PROD_URL/api/health/llm" || \
    curl -X POST $SLACK_WEBHOOK -d '{"text":"⚠️ Prod LLM probe failed after deploy"}'
  ```

- [ ] 一次性验证：手动跑 `vercel deploy --prod`，看 Slack/email 是否在 ~30s 内收到 "healthy" 确认
- [ ] 一次性 break 验证：临时把 Vercel `ANTHROPIC_API_KEY` 改成空字符串再 deploy，确认 webhook 触发 unhealthy 告警（验证完恢复原值）

Why：这是 Sentry Rule 0 的兜底 — Sentry 依赖 instrumentation 在新 instance startup 时上报，cold-start 之前的几分钟有盲区。Webhook 在 deploy 成功瞬间 probe，覆盖盲区。
