# Deep Dive — CLAUDE.md

AI Career Self-Discovery Platform — 跨文化职业身份深潜探索。
Quick Dive (38题: 30 RIASEC + 8 TwIVI) → Deep Dive (86题 v3.0) → 个人档案 (纯算法) → 职业报告 (2-3 LLM调用, 按需生成, 可选简历增强) → AI教练。
Immersive Dive = Quick Dive 的叙事沉浸版 (7 章 + 6 同伴 + 揭晓场景)。

## 关键文件引用

| 需要什么                    | 去哪里找                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 跨 AI 工具通用指令          | `AGENTS.md` (Claude Code / Cursor / Copilot 共用)                                                             |
| **文档全景地图**            | **`docs/INDEX.md`** ← 文档体系入口                                                                            |
| **代码库导航地图**          | **`docs/architecture/codebase-map.md`** ← AI/人类找代码入口                                                   |
| **代码 inventory**          | **`docs/architecture/ai-code-inventory.generated.md`** ← `npm run ai:map` 生成                                |
| **产品全景**                | **`docs/product/product-overview.md`** ← 5-10 分钟读懂 Deep Dive 当前形态                                     |
| **命令索引**                | **`.claude/commands/_INDEX.md`** ← 命令分类导航                                                               |
| 代码模板 (API/组件/测试/DB) | `CONVENTIONS.md`                                                                                              |
| 数据流全图 (mermaid)        | `docs/database/DATA-FLOW.md`                                                                                  |
| **Admin 统计口径（论文）**  | **`docs/architecture/admin-metrics.md`** + `lib/db/research-metrics.ts` ← 改任何 admin/论文统计前必读         |
| JSONB 列结构                | `docs/database/DATA-DICTIONARY.md`                                                                            |
| 数据库表定义                | `scripts/schema.sql` (canonical schema) + `scripts/migrations/README.md`                                      |
| **个人 Claude 工作流**      | **`.claude/workflows/personal-developer-workflow.md`** ← Boris 精华 + 本项目落地                              |
| **CLAUDE.md 精华模板**      | **`.claude/templates/project-claude-md-essence.md`** ← 用于持续瘦身与重构主规则                               |
| Claude Code 优化计划        | `.claude/memory/claude-code-optimization-plan.md`                                                             |
| i18n 风格规范               | `docs/design/i18n-style-guide.md`                                                                             |
| 动画规范                    | `docs/design/motion-principles.md`                                                                            |
| 视觉强度规范                | `docs/design/visual-intensity-spec.md`                                                                        |
| 多 Header 架构              | `docs/design/multi-header-architecture-spec.md`                                                               |
| **Entitlement 门控**        | **`lib/cohort/entitlements.ts`** + **`lib/cohort/config.ts`**                                                 |
| **旅程状态机**              | **`lib/journey/state-machine.ts`** + **`lib/db/journey.ts`**                                                  |
| 类型定义                    | `lib/types/` (assessment, report, platform, memory, questionnaire, dimensions, achievement)                   |
| LLM task→model 映射         | `lib/ai/model-router.ts` 的 `TASK_CONFIG`                                                                     |
| **LLM 调用全景文档**        | **`docs/architecture/llm-call-inventory.md`** ← 改 LLM 必读                                                   |
| **LLM 故障 Runbook**        | **`.claude/rules/llm-provider-failover.md`** ← provider outage / digest 告警时按此处理                        |
| **LLM Sentry 告警配置**     | **`docs/architecture/sentry-llm-alerts.md`** ← 监控规则的 source of truth                                     |
| **Health-aware 路由**       | **`lib/ai/provider-health.ts`** + **`docs/architecture/ai-routing-v2.md`** ← 按 10min 成功率自动降级 provider |
| **UI/UX 设计规范**          | **`.claude/skills/deepdive-design/SKILL.md`** ← 改前端必读                                                    |
| **创始人工作台**            | **`founder/`** (私人文档，不要涉及)                                                                           |

## 技术栈

Next.js 16 (App Router) · TypeScript strict · React 19 · Tailwind CSS v4 (`globals.css`, 无 tailwind.config) · Radix/shadcn · Framer Motion 12 · Neon Postgres · Zustand v5 · **Zod v4 (`from 'zod/v4'`)** · Vitest · ESLint 10

Route ALL LLM calls through `lib/ai/model-router.ts`. Provider/task choices live in `TASK_CONFIG` and `docs/architecture/llm-call-inventory.md`. Never import providers directly.

## 命令

```bash
npm run dev              # Turbopack dev server
npm run build            # production build
npm run test             # Vitest (单次)
npm run lint             # ESLint
npm run lint:i18n        # i18n key 检查 + 硬编码检查
npm run ai:map           # 刷新 AI 代码地图 inventory
npm run verify:thesis    # 论文数据完整性
npm run db:migrate       # 执行待运行迁移
npm run test:e2e         # Playwright E2E 冒烟测试 (需要 dev server)
```

验证完成: `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`

## ⛔ 冻结区域 — 修改前必须与用户讨论

- `lib/scoring/` — 评分管道 v3.0 + Archetype 12 型
- `lib/content/archetypes-12.ts` — 12 型原创文案，只增不改
- `lib/db/career-directions.ts` — 职业方向 DB CRUD (1,141 条)
- `lib/content/shadow-content.ts` — 阴影面叙事，只增不改
- `lib/report-generation/career-drain-content.ts` — 精选叙事，只增不改
- `lib/ai/model-router.ts` — task→provider 路由

> 冻结区域由 `.claude/hooks/guard-frozen.sh` 硬性执行。动态冻结由 `.claude/hooks/dynamic-freeze.sh` 叠加执行（`/freeze` 激活，`/unfreeze` 解除）。

## 输出语言

**命令和 Skill 的输出默认使用中文**，方便用户快速理解。代码注释、commit message、变量名保持英文。

## Claude Code 工作流主干

遵循三件事: **并行 > 等待**、**验证 > 猜测**、**沉淀 > 重复提醒**。

### 任务分级

| 类型             | 何时使用                                                            | 默认流程                                                                         |
| ---------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **S** 小改动     | 单文件或机械同步，验收清晰，非冻结区，非 API/DB 合约变更            | 读文件 → 3-5 条短计划 → 实现 → 跑相关验证                                        |
| **M** 常规改动   | 2-5 文件，单一领域，可在一个上下文内完成                            | `Plan Mode` 或 `/impact-analysis` → 实现 → 定向验证                              |
| **L** 跨域改动   | 前端/API/DB/测试混合，或 4+ 文件，或明显适合拆分                    | `/impact-analysis` → 拆任务 → `worktree`/`/parallel-feature`/`/batch` → 集成验证 |
| **R** 高风险改动 | 冻结区、auth/security、payment、schema、`model-router.ts`、生产操作 | 先停下，与用户确认边界和验收标准                                                 |

### 会话分工

- **主会话**: 目标澄清、方案选择、整合结果
- **实现会话**: 专注一个明确子任务，不承担所有上下文
- **验证会话**: 专门跑 `tsc` / tests / lint / E2E / 浏览器检查
- **分析会话**: 只读日志、数据、trace、文档

### 进阶工作流工具

- **`/btw`**: 长任务执行中旁路查询，不打断主上下文、不污染对话历史
- **`/branch`**: 方案分叉 — 在当前位置创建分支会话，两个方向各走一步再比较
- **`/batch`**: L 类任务扇出 — 自动分析影响范围、拆执行单元、并行 worktree 执行
- **`/rc` 或 `--remote-control`**: 跨设备审批 — 手机扫码控制终端会话，审批权限请求
- **Chrome 扩展**: 日常开发视觉验证（Playwright MCP 继续用于 E2E 自动化测试）

### 默认收尾动作

- 不接受”理论上应该可行”，必须做实际验证
- 任务一旦跑偏，立即回到 `Plan Mode`，不要硬推
- 本次出现的新坑，优先沉淀到 `CLAUDE.md`、command、hook 或 skill

## 🟢🟡🔴 自主决策分级

| 级别        | Claude 自主执行                                                                                                  | 需要用户确认                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 🟢 **绿灯** | 读文件、搜索代码、跑测试、类型检查、lint、影响分析、编辑非冻结文件、i18n 双语同步、文档/测试新增、git add/commit | —                                                                                       |
| 🟡 **黄灯** | —                                                                                                                | 新增生产文件、修改 API 签名、DB schema 变更、新增依赖、删除代码、跨域 4+ 文件变更       |
| 🔴 **红灯** | —                                                                                                                | 碰冻结区域、git push、生产 DB 操作、修改认证/安全逻辑、支付相关、`model-router.ts` 变更 |

## ⛔ 禁止操作

- **不要对复杂任务直接开写** — 新功能、跨域改动、需求模糊时先做轻量计划或 `/impact-analysis`
- **不要跳过高风险联动检查** — 跨域、共享模块、API/DB 变更前查 `.claude/rules/impact-matrix.md`
- **不要无计划扫改** — 跨 4+ 文件或前后端/DB 混合改动必须先拆任务，优先 `worktree` 或 `/parallel-feature`
- 不要未经指令重构已有代码
- 不要在一次编辑中混入不相关改动
- 不要删除看起来"没用"的代码而不先确认
- 不要改变函数签名，除非任务明确要求
- 不要在生产代码中加 `console.log`（用 `if (__DEV__)` 保护）
- 不要修改 `lib/scoring/` 或 `lib/content/` 已有条目
- **⛔ 客户端状态变更 fetch 必须用 `csrfFetch`** — `components/**` 和 `app/**` 中任何 `POST/PUT/DELETE/PATCH` 请求必须从 `@/lib/auth/csrf-client` 导入 `csrfFetch`，**禁止**用原生 `fetch` + `method: "POST"`。`proxy.ts` 全局强制 CSRF 校验，原生 fetch 会被返回 403 并 silent-fail。豁免：Bearer token 认证的 admin 脚本、`ANALYTICS_CSRF_EXEMPT` 列表中的 sendBeacon 端点
- **⛔ UI 组件 catch 块禁止 silent return null** — Silent failure 会让 PM 误判为"功能缺失"。推荐使用 `reportClientError` 工具 (`lib/observability/client-error.ts`)：一次调用同时满足 dev `console.error` + prod Sentry 上报，并带 component/feature tag 便于分类
- **编辑后必须自检** — 对照变更影响矩阵逐项确认，报告：改了哪些文件、每个文件改了什么、影响矩阵中哪些关联区域已检查

## 功能开发标准流程

> 不再对所有任务一刀切走最重流程。默认按 `S / M / L / R` 分流。

- **S 类**: 读相关文件 → 3-5 条短计划 → 实现 → 跑相关验证 → 汇报改动/验证/风险
- **M 类**: `Plan Mode` 或 `/impact-analysis` → 实现 → 分层测试 → `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n` → 收尾
- **L 类**: `/impact-analysis` → 拆成 2-4 个任务 → `worktree`/`/parallel-feature` 并行 → 集成验证 → 收尾
- **R 类**: 先停止编码，和用户确认边界、风险、验收标准，再决定是否继续

### Phase 0 的触发条件

- 新功能或需求模糊
- 跨前后端 / DB / 测试
- 涉及 `impact-matrix` 中多条联动
- 可能触碰冻结区、认证、安全、支付、LLM 路由

### Phase 2 默认验证

- `npx tsc --noEmit`
- `npm run test`
- `npm run lint`
- `npm run lint:i18n`
- 前端或关键路径改动时，补浏览器验证或 `npm run test:e2e`

### Phase 3 — 收尾

- 变更摘要
- 验证结果
- 残余风险
- 检查 `CLAUDE.md` / command / hook / skill 是否需要增量更新
- 列出需要用户手动执行的操作

## 测试策略（永久规则 — CLAUDE.md 更新/重写时必须保留本节）

> 遵循测试金字塔 (Martin Fowler / Google Testing)：~70% 单测、~20% 集成测试、~10% E2E。
> 不追求"完全不手测"，而是让每层测试做它最擅长的事。

### 分层原则

| 层级         | 测什么                                         | 怎么测                                    | 占比   |
| ------------ | ---------------------------------------------- | ----------------------------------------- | ------ |
| **单测**     | 评分逻辑、状态流转、漏斗事件触发、数据转换     | Vitest + mock DB/LLM                      | ~70%   |
| **集成测试** | API 契约、DB 读写、认证守卫、cleanup 完整性    | Vitest + 真实 API handler (mock 外部依赖) | ~20%   |
| **E2E**      | **关键转化路径**：着陆→注册→核心问卷→报告→教练 | Playwright，只守"钱和转化相关"的主路      | ~10%   |
| **人工验收** | 视觉层次、文案感受、交互顺滑度、新功能合理性   | 大版本上线前手动走一遍                    | 必要时 |

### E2E 的边界

- ✅ 写 E2E：关键用户旅程（着陆页→QD→注册→DD→报告→教练）、支付流程、核心分享链路
- ❌ 不写 E2E：漏斗事件是否触发（用单测 mock `trackFunnelEvent`）、LLM 输出质量、评分正确性、CSS/视觉
- ❌ 不测你控制不了的：LLM 响应内容、第三方 OAuth 真实回调、外部邮件送达

### 新增代码时的判断流程

1. 改了业务逻辑（scoring/funnel/state）→ 写**单测**
2. 改了 API 签名或 DB 交互 → 写**集成测试**
3. 改了关键转化路径的 UI 流程 → 写 **E2E**
4. 改了视觉/文案/动画 → 列入**手动验收清单**，不硬写脆弱 E2E

### E2E 工具链

- `ensureSharedContext()` · `apiHeaders()` · `cleanupTestUser()`
- `POST /api/test/seed-questionnaire` 跳到任意问卷 Module
- `page.route()` 拦截 API 响应（时序控制）
- `page.evaluate()` 设置 localStorage（环境预设）
- LLM 依赖用 `test.skip()` 优雅降级

### Skill 1% 规则

> 如果某个 Skill 有哪怕 1% 的可能性适用于当前任务，**必须提及它**。

- 改了 UI → `/deepdive-design` 规范
- 改了 API → `/weekly-api` 合规性
- 改了数据流 → `/trace-data-path`
- 涉及文案 → `/copywriting`
- 涉及产品决策 → `/approver`

## 核心架构（详见 `docs/architecture/`）

> 完整架构文档按需加载: `scoring-pipeline.md` · `assessment-pipeline.md` · `report-generation.md` · `coaching-system.md` · `auth-security.md` · `archetype-system.md` · `ai-routing.md` · `docs/product/product-principles.md`

- **评分**: 86 题 v3.0 → `AssessmentResultV3`。原型 = 12 型 (RIASEC × Enhancement/Transcendence)。术语: Cognitive Style (非 MBTI), Collaboration Style (非 DISC)
- **个人档案**: `generateProfile()` = 纯算法 (0 LLM)，存储 `algoSnapshot` 供报告复用。含人际能量 (IPC Circumplex) + 冲突处理风格 (TKI) 两个新维度
- **Assessment Pipeline**: 4 步状态机 (`scoring → profile → narratives → report`) + 独立 `resumeAnalysis` 分支。Cron-orchestrated，exp backoff，worker lock，崩溃自愈。详见 `docs/architecture/assessment-pipeline.md`
- **职业报告**: 2-3 LLM 调用 (180s 超时)，5 章: 锚点→景观→阴影→信→方法论。可选简历增强路径 (`ReportDepthDialog` → `resumeEvidence` 注入 career-match + integration)
- **教练**: 注入报告 + 档案 + 记忆 (Top 15) + 回合指令。SSE 流式。含危机检测 (双层) + 年龄门控 + AI 披露
- **认证**: bcrypt 12 轮 · 30 天 session · CSRF 双提交 cookie · `guardRoute()` 五级守卫
- **Entitlement**: 邀请码 → cohort → `canAccess(user.cohort, feature)` in `lib/cohort/entitlements.ts`
