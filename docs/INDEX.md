# Deep Dive — 文档全景地图

> **最后审计**: 2026-06-11
>
> 本文件是文档体系的唯一索引。代码导航见 `docs/architecture/codebase-map.md`，文件 inventory 由 `npm run ai:map` 生成。

---

## 文档架构

```
docs/
├── INDEX.md                  ← 你在这里
├── architecture/             技术参考 — 系统如何工作 + 代码导航
├── database/                 数据参考 — 表结构与数据流
├── design/                   设计规范 — UI/UX/i18n/动画
├── product/                  产品策略 — 原则/旅程/规划/全景
├── reference/                内容素材 — 叙事/研究/映射
├── ops/                      运维指南 — 应急/恢复/质量门禁
├── operations/               商业化/基础设施蓝图
├── governance/               AI 治理 — Coach OS 风险/质检/版本
├── assessment/               技术评测
├── evaluation/               产品评测
└── _sync/                    自动化同步基础设施
```

### 分类原则 (Diataxis)

| Diataxis 象限            | 对应目录                                     | 用途                          |
| ------------------------ | -------------------------------------------- | ----------------------------- |
| **Reference** (查什么)   | `architecture/` · `database/` · `reference/` | 事实查询，改代码时按需读取    |
| **Explanation** (为什么) | `product/` · `assessment/` · `evaluation/`   | 理解决策背景，产品讨论时参考  |
| **How-to** (怎么做)      | `ops/` · `operations/` · `design/`           | 解决具体问题，操作时查阅      |
| **Governance**           | `governance/`                                | AI 风险、质检、变更审计       |
| **Tutorial**             | `.claude/skills/` (代替)                     | 手把手引导，由 Skill 系统承担 |

---

## 全量文件清单

### `architecture/` — 技术参考

| 文件                               | 状态         | sync_mode | last_verified | 说明                                                |
| ---------------------------------- | ------------ | --------- | ------------- | --------------------------------------------------- |
| `codebase-map.md`                  | ✅ current   | manual    | 06-11         | AI/人类代码入口地图，按任务指向最小读取集           |
| `ai-code-inventory.generated.md`   | ✅ generated | auto      | 06-11         | `npm run ai:map` 生成的文件计数/大文件/噪声清单     |
| `scoring-pipeline.md`              | ✅ current   | partial   | 04-13         | 86 题 v3.0 → 12 型评分管道                          |
| `report-generation.md`             | ✅ current   | partial   | 06-15         | 2-3 LLM 调用，5 章报告 + 多样性配额 + resume 增强   |
| `coaching-system.md`               | ✅ current   | partial   | 04-13         | SSE 流式教练 + 记忆注入                             |
| `auth-security.md`                 | ✅ current   | partial   | 04-13         | guardRoute 五级 + bcrypt + CSRF                     |
| `archetype-system.md`              | ✅ current   | partial   | 04-13         | 12 型分类法 (RIASEC × Enhancement/Transcendence)    |
| `ai-routing.md`                    | ✅ current   | partial   | 04-23         | provider 选择 + fallback 链 + health routing        |
| `ai-routing-v2.md`                 | ✅ current   | partial   | 04-23         | Health-aware 路由 v2 (10min 窗口降级 + kill switch) |
| `assessment-pipeline.md`           | ✅ current   | partial   | 04-23         | 评估后管道编排 + worker lock + 崩溃恢复             |
| `llm-call-inventory.md`            | ✅ current   | manual    | 04-13         | 全部 LLM 调用清单 (改 LLM 必读)                     |
| `analytics-architecture.md`        | ✅ current   | —         | 04-23         | 39 漏斗事件 + Sentry 三层                           |
| `sentry-llm-alerts.md`             | ✅ current   | manual    | 04-13         | LLM provider 健康告警规则 (Sentry source of truth)  |
| `profile-generation.md`            | ✅ current   | partial   | 06-15         | 纯算法 + Soul Call 叙事 → PersonalProfileData       |
| `journey-state-machine.md`         | ✅ current   | partial   | 04-13         | 6 状态 FSM + 功能解锁 + 教练访问门控                |
| `cohort-entitlements.md`           | ✅ current   | partial   | 04-13         | 邀请码 → cohort → 功能门控 + A/B 分组               |
| `research-lifecycle.md`            | ✅ current   | manual    | 05-08         | 研究数据生命周期 + 同意/撤回流程 (SCC-12 canonical) |
| `normalized-fact-tables-design.md` | ✅ design    | manual    | 05-19         | Post-thesis normalized fact tables 设计稿           |
| `admin-metrics.md`                 | ✅ current   | manual    | 06-11         | Admin/论文统计口径单源 (改 admin 统计前必读)        |

### `database/` — 数据参考

| 文件                 | 状态       | sync_mode | last_verified | 说明                                                        |
| -------------------- | ---------- | --------- | ------------- | ----------------------------------------------------------- |
| `DATA-DICTIONARY.md` | ✅ current | partial   | 05-08         | DB 表 + JSONB 列结构；schema source 为 `scripts/schema.sql` |
| `DATA-FLOW.md`       | ✅ current | partial   | 06-15         | Mermaid 数据管道全图 (含 resume-enhanced 分支)              |

### `design/` — 设计规范

| 文件                                | 状态       | last_verified | 说明                                     |
| ----------------------------------- | ---------- | ------------- | ---------------------------------------- |
| `i18n-style-guide.md`               | 📦 历史    | 03-20         | 双语语气/标点/UI (Meridian 接管)         |
| `motion-principles.md`              | 📦 历史    | 03-20         | Framer Motion + 水深隐喻 (Meridian 接管) |
| `visual-intensity-spec.md`          | 📦 历史    | 03-20         | 6 层深度色彩 + 玻璃态 (Meridian 接管)    |
| `multi-header-architecture-spec.md` | 📦 历史    | 03-20         | Header 响应式 (Meridian 接管)            |
| `avatar-style-research.md`          | ✅ current | —             | Avatar 设计风格全面研究                  |

### `product/` — 产品策略

| 文件                              | 状态        | last_verified | 说明                                         |
| --------------------------------- | ----------- | ------------- | -------------------------------------------- |
| `product-overview.md`             | ✅ current  | 06-15         | 产品全景 (5-10 分钟读懂当前形态)             |
| `product-principles.md`           | ✅ current  | 03-20         | 核心价值观：深度隐喻、算法优先信任           |
| `user-journeys.md`                | ✅ current  | 06-15         | 完整旅程 + v8 下潜 / Resume / Companion 分支 |
| `funnel-definitions.md`           | ✅ current  | 04-23         | 39 个漏斗事件定义 + 健康基准                 |
| `coaching-companion-blueprint.md` | ✅ planning | 03-20         | 教练 UX 详细蓝图 (1843 行)                   |
| `ultra-deep-dive-spec.md`         | ✅ planning | 03-20         | 未来规划：多语言深层评测                     |
| `ux-audit-2026-03.md`             | ✅ current  | 03-20         | 无障碍 + 移动端审计                          |

### `reference/` — 内容素材

| 文件                                          | 状态       | last_verified | 说明                           |
| --------------------------------------------- | ---------- | ------------- | ------------------------------ |
| `narrative-explore-storyline.md`              | ✅ current | 03-20         | Explore 模式叙事全文 (1257 行) |
| `mirror-feedback-all.md`                      | ✅ current | 03-20         | 阴影面/反思叙事素材            |
| `emerging-careers-research-2026.md`           | ✅ current | —             | AI 时代职业趋势研究            |
| `depth-mapping.md`                            | ✅ current | 03-20         | 原型→职业深度映射框架          |
| `career-recommendations-quantity-research.md` | ✅ current | —             | 推荐数量最优研究               |
| `archetypes-12-overview.md`                   | ✅ current | —             | 12 型原型完整参考              |

### `ops/` — 运维指南

| 文件                                   | 状态       | last_verified | 说明                                   |
| -------------------------------------- | ---------- | ------------- | -------------------------------------- |
| `emergency-runbook.md`                 | ✅ current | —             | 评分/报告/教练/DB 故障排查             |
| `disaster-recovery.md`                 | ✅ current | —             | 备份策略 + 恢复流程                    |
| `quality-operating-system.md`          | ✅ current | 04-28         | 发布门禁 + E2E/LLM 质量机制            |
| `durable-job-post-deploy-checklist.md` | ✅ current | 05-03         | DurableJob cron + 注册后置任务发布验证 |
| `llm-quality-watch.md`                 | ✅ current | 05-21         | 论文采集期 LLM 质量日常巡检            |
| `thesis-launch-checklist.md`           | ✅ current | 05-24         | 论文招募 batch 开启前检查清单          |

### `operations/` — 商业化/基础设施蓝图

| 文件                               | 状态         | last_verified | 说明                          |
| ---------------------------------- | ------------ | ------------- | ----------------------------- |
| `avatar-cdn-setup.md`              | ✅ current   | —             | Cloudflare R2 avatar CDN 设置 |
| `privacy-and-terms-draft.md`       | ✅ draft     | 05-19         | 商业化前隐私政策/服务条款草稿 |
| `stripe-monetization-blueprint.md` | ✅ blueprint | 05-19         | Post-thesis Stripe 变现蓝图   |

### `governance/` — AI 治理

| 文件                            | 状态       | last_verified | 说明                                |
| ------------------------------- | ---------- | ------------- | ----------------------------------- |
| `coach-os-governance.md`        | ✅ current | 06-10         | Coach OS 边界、升级、数据使用、版本 |
| `coach-os-risk-register.md`     | ✅ current | 06-10         | Coach OS 风险 register 与缓解措施   |
| `coach-os-quality-changelog.md` | ✅ current | 06-10         | 教练质量系统变更记录                |

### `assessment/` — 技术评测

| 文件                                      | 状态       | last_verified | 说明                          |
| ----------------------------------------- | ---------- | ------------- | ----------------------------- |
| `technical-architecture-assessment-v3.md` | ✅ current | —             | 32 框架评测，综合 8.4/10 (A-) |
| `narrative-eval-baseline.md`              | ✅ current | 04-03         | 叙事评测基线 (evals 框架)     |

### `evaluation/` — 产品评测

| 文件                                 | 状态       | last_verified | 说明                 |
| ------------------------------------ | ---------- | ------------- | -------------------- |
| `deep-dive-product-evaluation-v3.md` | ✅ current | —             | 6 维度产品完成度审计 |

### `_sync/` — 同步基础设施

| 文件                 | 用途                 |
| -------------------- | -------------------- |
| `sync-config.yaml`   | 自动同步规则定义     |
| `last-verified.json` | 各文档最后验证时间戳 |
| `drift-report.md`    | 最近一次漂移检测报告 |

---

## 三层文档加载模型

| 层级                    | 位置                                              | 加载时机          | 内容                         |
| ----------------------- | ------------------------------------------------- | ----------------- | ---------------------------- |
| **L1 Always-on**        | `AGENTS.md` + `CLAUDE.md` + `.claude/rules/`      | 每次 session 自动 | 行为规则、红线、索引         |
| **L2 Context-targeted** | 局部 `AGENTS.md` + `.claude/rules/*.md`           | 碰到匹配文件时    | 目录入口与领域特定约束       |
| **L3 On-demand**        | `docs/` + `.claude/skills/` + `.claude/commands/` | 按需读取          | 架构详情、设计规范、操作指南 |

---

## 维护节奏

| 时机         | 命令             | 做什么                     |
| ------------ | ---------------- | -------------------------- |
| 功能开发后   | Phase 3 收尾     | 检查受影响文档             |
| 代码地图变化 | `npm run ai:map` | 刷新 AI inventory          |
| 每周         | `/docs-sync`     | frontmatter 源漂移检测     |
| 每月         | `/docs-audit`    | 全量文档盘点 + 引用完整性  |
| 每季度       | 人工审视         | 清理过时文档，评估新增类别 |

---

## 设计原则

1. **CLAUDE.md 只放红线** — 架构知识按需加载，不污染每次 session 的 context
2. **文档按消费者分类** — 改代码读 architecture/，讨论产品读 product/，做设计读 design/
3. **Frontmatter 追踪源** — 每个技术文档声明依赖的源文件，漂移可检测
4. **能自动验证就自动化** — 数字从代码推导，人工只维护 "why"
5. **一个创始人的务实主义** — 不过度文档化，TypeScript 类型 + Zod schema = 自文档化
