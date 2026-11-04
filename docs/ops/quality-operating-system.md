# Quality Operating System

> last_verified: 2026-04-28
> owner: CTO / Engineering
> scope: release gates, E2E reliability, LLM health, production confidence

本文件定义 Deep Dive 的长期质量机制。目标不是承诺“没有 bug”，而是让每次改动都经过可重复、可追踪、分层的信心建立过程。

---

## 质量原则

1. **把质量分层，不把所有风险塞进一个测试命令。**
   类型、单元测试、构建、i18n、浏览器流程、外部 LLM、生产监控分别负责不同风险。

2. **核心用户路径优先。**
   发布前必须保护 Guest -> Quick Dive -> result、register/login、Explore Hub、AI Career Check、Deep Dive entry、report latest、mobile navigation。

3. **E2E 要测真实行为，但不要依赖脆弱文案。**
   面向用户可见结构使用 stable `data-testid`；文案可另由 i18n/lint 覆盖。

4. **外部依赖要可观测、可降级、可隔离。**
   LLM provider、Neon、Sentry、Stripe、Redis 都不能只靠浏览器测试间接暴露。

5. **每个失败都进入账本。**
   不把 flaky 当作“偶发”，也不把 fallback 成功当作 provider 健康。

---

## 发布门禁

### P0: PR Gate

每个合并前必须通过：

```bash
npx tsc --noEmit
npm run test
npm run lint
npm run lint:i18n
npm run build
```

阻断条件：

- TypeScript error
- test failure
- ESLint error
- i18n missing key 或硬编码用户文案
- production build failure

允许但必须记录：

- `npm run lint:i18n` 的 S4 warning
- 测试环境中预期的 DB fallback/error 日志

### P1: Release Gate

每次手动发布前必须通过：

```bash
npm run test:e2e -- --project=auth-redirects
npm run test:e2e -- --project=quickdive-flow
npm run test:e2e -- --project=explore-hub-flow --project=ai-career-check-flow
npm run test:e2e -- --project=mobile-responsive
npm run test:e2e -- --project=public-pages-smoke
```

要求：

- 使用临时 Neon branch
- 运行后自动清理 branch
- E2E 中 analytics server-side 短路
- LLM 依赖走 deterministic stub 或明确记录 real-provider 模式

### P2: Nightly Gate

每天至少跑一次：

```bash
npm run test:e2e
```

并额外采集：

- failed project
- failed file/test title
- trace artifact
- provider error rate
- slow query count
- rerun 后是否通过

### P3: Weekly Production Confidence

每周检查：

- Sentry error trend
- LLM provider 403/429/5xx rate
- report generation success rate
- coaching SSE completion rate
- Quick Dive completion funnel
- registration conversion after Quick Dive
- p95 route latency for `/api/score`, `/api/generate-report`, `/api/auth/me`

---

## E2E 设计标准

稳定选择器：

- CTA / workflow step 使用 `data-testid`
- 图表、结果页、附录、弹窗使用 `data-testid`
- 不用长文案、营销文案、视觉标题作为唯一断言

稳定导航：

- 页面入口优先 `waitUntil: "domcontentloaded"`
- 不依赖 `load` 等所有图片和第三方资源完成
- 对 Framer Motion 入场按钮，测试 helper 可使用 force click，但必须先断言可见

稳定环境：

- 每次 E2E 使用 isolated DB branch
- 不复用真实用户数据
- 不把 analytics 写入核心业务断言路径
- E2E 里禁止依赖真实邮箱或真实支付

---

## LLM 健康线

LLM 相关质量分两条跑：

1. **产品路径可用性**
   E2E 可以允许 fallback，使用户流程继续完成。

2. **Provider 健康**
   单独监控并阻断发布：
   - OpenAI/Groq/Anthropic auth error
   - 403/401 必须 P0 处理
   - 429/5xx 需要 fallback 成功率和重试预算
   - provider circuit open 超过 10 分钟必须报警

当前已知风险：

- 2026-04-28 E2E 中 OpenAI 返回 403，系统 fallback 后接口仍返回 200；这说明产品有降级能力，但 provider 配置不健康。

---

## 当前基线

2026-04-28 已验证：

- `npx tsc --noEmit`: pass
- `npm run test`: pass, 1987 passed, 1 skipped
- `npm run lint`: pass
- `npm run lint:i18n`: pass with 6 S4 warnings
- `npm run build`: pass
- `npm run test:e2e -- --project=auth-redirects`: 13/13 pass
- `npm run test:e2e -- --project=quickdive-flow`: 5/5 pass
- `npm run test:e2e -- --project=explore-hub-flow --project=ai-career-check-flow`: 12/12 pass

2026-04-28 初始 full core E2E 基线：

- 103 passed
- 14 failed
- 1 skipped

已修复/加固的失败类别：

- Quick Dive 新增 gender step 后 E2E 路径未更新
- Quick Dive result page 旧文案/旧 raw-data 断言
- Quick Dive animated start button click instability
- auth redirect waits too tightly coupled to full page load
- Explore Hub card navigation selector ambiguity
- AI Career Check back/search/occupation selectors
- mobile sheet link close timing
- analytics server-side E2E bypass

仍需收口：

- 重跑 full core E2E，确认 14 个初始失败是否全部消失
- mobile-responsive 专项回归
- public-pages-smoke 专项回归
- deep-dive-flow 专项回归
- OpenAI 403 provider health
- E2E analytics 客户端仍会发送请求；当前仅 server-side 短路

---

## 事故分级

P0:

- 用户无法登录/注册
- Quick Dive 无法完成或无法保存
- Deep Dive 无法进入或提交
- 报告生成全部失败
- LLM auth error 影响生产主路径
- 数据库迁移失败

P1:

- 核心 E2E flaky 超过 2 次
- fallback 可用但真实 provider 失败
- mobile nav 阻塞关键页面
- i18n key 缺失导致用户看到 raw key

P2:

- 单个非关键页面 smoke failure
- S4 i18n warning
- 慢查询但未影响完成率

---

## 执行节奏

每天：

- 查看 nightly E2E summary
- triage 新 failure
- 把 flaky 标记为 owner + due date

每周：

- 跑 full E2E + provider health check
- 复盘 top 5 slow queries
- 清理过时 E2E selector

每次发布前：

- 跑 P0 + P1 gates
- 确认 provider health
- 确认 feature flags / env vars
- 确认 DB migration status
- 记录发布基线

