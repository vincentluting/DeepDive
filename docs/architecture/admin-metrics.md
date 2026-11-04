# Admin Metrics — 统计口径单一来源

> 本文档定义 admin panel 所有统计指标的精确口径。任何与本文档不一致的查询都是 bug。
> 代码层 source of truth: `lib/db/research-metrics.ts`（论文人群 + T0/T1/T2）+ `lib/research/pairing.ts`（配对规则）。
> 修订时间: 2026-06（admin panel 数据精确度修复，10 项风险清零）。

## 1. 论文（Thesis）口径

### 1.1 Canonical 研究人群

所有论文统计的人群过滤，四个条件**缺一不可**：

| 条件     | SQL                                                                                                 | 排除什么                                              |
| -------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 已分组   | `u."researchGroup" IS NOT NULL`                                                                     | 非研究用户（beta cohort 等）                          |
| 已同意   | `u."researchConsentAt" IS NOT NULL`                                                                 | 进入 cohort 但未提交 consent 的用户                   |
| 非管理员 | `u."isAdmin" = FALSE`                                                                               | 内部测试账号                                          |
| 同意有效 | `EXISTS (SELECT 1 FROM "ConsentRecord" cr WHERE cr."userId" = u."id" AND cr."withdrawnAt" IS NULL)` | **撤回 consent 的参与者**（audit 源即 ConsentRecord） |

应用位置：`lib/db/research-metrics.ts`、`lib/db/research-progress.ts`、`lib/db/admin-thesis-export.ts`、`lib/db/admin-insights.ts`（getResearchGroupComparison / getCompletionTimeDistribution / getReportEngagementStats / getCoachingDepthStats / getDropoffDistribution，后四者 researchOnly 参数，thesis 页传 true）、`lib/db/admin-overview.ts`（getResearchOverview cockpit — 招募进度 summary 用 canonical 子集，data-quality errors 仍用更宽的 getResearchChainRows）。
回归锁定：`lib/db/__tests__/research-consent-gate.test.ts`（"Withdrawn-consent gate"）。

### 1.2 Canonical 时点（T0/T1/T2）

每用户每时点**严格 1 行**：

| 时点   | assessmentType   | 取哪条                         | 理由                                      |
| ------ | ---------------- | ------------------------------ | ----------------------------------------- |
| **T0** | `pre`            | **首次**（earliest createdAt） | 基线必须先于干预暴露；重测的 pre 已被污染 |
| **T1** | `post_immediate` | **最新**（latest createdAt）   | 取最近一次完整作答                        |
| **T2** | `post_1week`     | **最新**（latest createdAt）   | 同上                                      |

同类型 >1 条记录的用户由 `getMultiRecordUsers()` 标记为数据质量告警（不剔除，但 canonical 行按上表规则取）。

实现：`lib/research/pairing.ts` `selectCanonicalTimepoints()`（纯函数，单测全覆盖于 `lib/research/__tests__/pairing.test.ts`）。

### 1.3 配对统计（SCC paired t-test / Cohen's d）

- **T0→T1 与 T0→T2 是两个独立的 paired test**，永远不合并进同一检验（合并会让同一用户出现两次且混淆两个窗口的效应）。
- 配对仅在两端分数都非 NULL 时成立（paired 检验不可插补）。
- 每个窗口最少 5 对才计算（`lib/admin/statistics.ts pairedTTest`）。
- 输出 shape：`PrePostEffectSummary { sccImmediate, scc1Week, summary }`（`lib/db/admin-insights-cross.ts`）。

### 1.4 组间比较（classic vs immersive）

`getResearchGroupComparison()`（`lib/db/admin-insights.ts`）全部按**人**计，每人恰好贡献一次：

| 指标              | 口径                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| completed / total | 有 ≥1 个 completed / ≥1 个 started quick session 的**人数**（不是 session 数，重做行为不得扭曲分母） |
| avgTimeMs         | 每用户**首次完成**的 quick session 时长均值（首次接触体验，不受重做练习效应污染）                    |
| RIASEC 均值       | 每用户**最新** QuickDiveResult                                                                       |
| NPS               | 每用户**最新** ReportNPS，按 userId 直连（经 CareerReport JOIN 会按报告数翻倍）                      |

### 1.5 完成时长分布（论文图表）

`getCompletionTimeDistribution({ researchOnly: true })` — 论文页传 `researchOnly: true`（研究参与者额外承担 T0/T1/T2 量表，与自由用户混合会扭曲时长）。中位数天然抗离群值；分桶上限 30+ 分钟。

### 1.6 导出（thesis-data export）

`lib/db/admin-thesis-export.ts`：人群 gate 同 1.1（`includeAllUsers=true` 是显式逃生门，导出非研究全量时使用）；T0 取首次（ASC）、T1/T2 取最新（DESC），与 1.2 一致。

### 1.7 校验脚本

`scripts/verify-thesis-data.ts`（`npm run verify:thesis`）：T0 = MIN(createdAt)、T1/T2 = MAX(createdAt)，与 1.2 一致。

## 2. 漏斗（Funnel）口径

### 2.1 唯一身份（identity stitching）

`lib/analytics/funnel-queries.ts` `getFunnelStats()` / `getConversionRates()`：

- 计数键：`COALESCE(uf."userId", il."userId", uf."clientId")` —— 匿名事件经 `IdentityLink`（anonymousId → userId）缝合，**匿名期 + 注册后的同一人计 1 个身份**。
- LATERAL + `LIMIT 1`（最早 link 优先）保证 join 不会乘行。
- 已知残余偏差：未注册且未链接的纯匿名访客按 clientId 计数；同一人换设备/清 cookie 仍会计多。

### 2.2 管理员/测试账号排除（双重闸门）

- 行级：`uf."isAdmin" = FALSE OR uf."isAdmin" IS NULL`（事件打点时标记）
- 账号级兜底：`NOT EXISTS (... User au WHERE au."id" = COALESCE(uf."userId", il."userId") AND au."isAdmin" = TRUE)`（捕获 isAdmin 标记上线前的历史事件 + 匿名期事件经缝合归属到 admin 的情况）

无 test-email 模式过滤（无可靠模式可循）；测试账号治理依赖 `isAdmin` 标记。

### 2.3 分段漏斗（filtered conversion）

`getFilteredConversionRates()` 的语言/设备/exploreMode 过滤是 **"按用户当前画像"**（latest profile）分段：中途从 zh 切到 en 的用户，其全部事件计入 "en"。这是口径选择而非 bug（事件时点画像需要逐事件快照，成本不成比例）；UI 的 filter 标签注明。仅统计注册用户（匿名行无画像）。

### 2.4 时间窗

所有 `days` 参数 = **滚动 N×24h 窗口（UTC）**，非日历天。趋势图的天分桶用 `date_trunc('day', ...)`（UTC）。KPI tooltip 标注 "rolling Nd (UTC)"。

## 3. 原型分布（Archetype Distribution）

`getArchetypeDistribution()`：按**唯一身份**计数，每身份恰好 1 个原型：

- 注册用户：CareerReport（深度评估）**优先于** QuickDiveResult；同源取最新。
- 匿名 Quick Dive：按 anonymousId 计 1（UI 标注"含匿名访客"）。
- 旧版 bug（QD + 报告双来源各计一次 → 同一人计 2）已修复，回归锁定于 `lib/db/__tests__/admin-insights-thesis.test.ts`。

## 4. 教练指标语义

| 字段           | 含义                                                        |
| -------------- | ----------------------------------------------------------- |
| `sessionCount` | 会话数（COUNT(\*)）                                         |
| `totalRounds`  | 所有会话轮次之和（SUM(roundNumber)），与 thesis-export 一致 |

（旧版 research-progress 用 MAX(roundNumber) 冒充 totalRounds，会低估多会话用户，已修复。）

## 5. 修订规则

- 改任何统计口径 → 先改本文档 + `research-metrics.ts` 的 JSDoc，再改查询，最后更新对应 `__tests__` 的 SQL 断言。
- 新增论文指标 → 必须复用 `research-metrics.ts` 的人群与时点函数，禁止在查询里另写人群条件。
