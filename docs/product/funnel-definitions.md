---
title: Funnel Conversion Definitions — Deep Dive Platform
category: product
last_verified: 2026-04-23
verified_by: claude-code
event_count: 39
---

# Funnel Conversion Definitions

> 定义每个漏斗步骤的成功标准、健康基准线、分群维度和监控策略。
> 代码实现见 `lib/analytics/funnel-queries.ts`。
> 事件类型定义: `lib/analytics/funnel-events.ts` — `FUNNEL_EVENTS` (39 events, source of truth)。

---

## 1. 核心漏斗（线性主路径）

```
Landing PV → quickdive_started → quickdive_completed → registered
  → deepdive_started → deepdive_completed → report_viewed
    → report_reacted → coaching_started
```

### 步骤定义

| #   | 事件                    | 触发条件                | 去重策略                                          | 成功标志                      |
| --- | ----------------------- | ----------------------- | ------------------------------------------------- | ----------------------------- |
| 0   | **Landing PV**          | 用户访问 `/(marketing)` | PageVisit 去 bot + 内部流量                       | 页面加载完成                  |
| 1   | **quickdive_started**   | 用户回答第 1 题         | `idempotencyKey` = `qd:{sessionId}:started`       | 问卷进入答题状态              |
| 2   | **quickdive_completed** | 30 题全部回答           | `idempotencyKey` = `qd:{sessionId}:completed`     | QuickDiveResult 写入 DB       |
| 3   | **registered**          | 用户完成注册            | `idempotencyKey` = `user:{userId}:registered`     | User 行写入 DB                |
| 4   | **deepdive_started**    | Deep Dive 第 1 题回答   | `idempotencyKey` = `dd:{sessionId}:started`       | 问卷进入答题状态              |
| 5   | **deepdive_completed**  | 86 题全部回答           | `idempotencyKey` = `dd:{sessionId}:completed`     | QuestionnaireSession 标记完成 |
| 6   | **report_viewed**       | 用户打开报告页面        | `idempotencyKey` = `report:{reportId}:viewed`     | 报告页面渲染                  |
| 7   | **report_reacted**      | 用户提交表情反馈或 NPS  | `idempotencyKey` = `report:{reportId}:reacted`    | ReportReaction/NPS 写入       |
| 8   | **coaching_started**    | 用户发送第一条教练消息  | `idempotencyKey` = `coaching:{sessionId}:started` | CoachingSession 创建          |

### 健康基准线

> **注意**: 以下基准线是早期阶段的参考值，需要随着用户量增长持续校准。
> 当前用户量较小，统计显著性有限。随着数据积累，应每季度更新。

| 转化步骤               | 计算公式                                  | 早期目标 | 成熟目标 | 说明                    |
| ---------------------- | ----------------------------------------- | -------- | -------- | ----------------------- |
| Landing → QD Start     | `quickdive_started / landing_pv`          | ≥15%     | ≥25%     | CTA 吸引力              |
| QD Start → Complete    | `quickdive_completed / quickdive_started` | ≥70%     | ≥80%     | 问卷体验流畅度          |
| QD Complete → Register | `registered / quickdive_completed`        | ≥40%     | ≥60%     | 注册价值传递            |
| Register → DD Start    | `deepdive_started / registered`           | ≥50%     | ≥65%     | Explore Hub 引导力      |
| DD Start → Complete    | `deepdive_completed / deepdive_started`   | ≥60%     | ≥75%     | 86 题完成率（最大挑战） |
| DD Complete → Report   | `report_viewed / deepdive_completed`      | ≥90%     | ≥95%     | 应近 100%（自动跳转）   |
| Report → React         | `report_reacted / report_viewed`          | ≥30%     | ≥50%     | 报告参与度              |
| Report → Coaching      | `coaching_started / report_viewed`        | ≥20%     | ≥35%     | 教练价值认知            |
| **端到端**             | `coaching_started / quickdive_started`    | ≥3%      | ≥8%      | 全旅程转化              |

---

## 2. 辅助事件（非线性漏斗）

### 2.1 参与、退出与系统事件

| 事件                          | 分类   | 用途                                 | 触发点                                                                                                                                              | 数据载荷                                                                                        |
| ----------------------------- | ------ | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `quickdive_abandoned`         | 退出   | 计算 QD 放弃率，诊断问卷体验         | `components/quickdive/classic-explore-shell.tsx` · `components/immersive-explore/immersive-explore-shell.tsx` — `beforeunload` / `visibilitychange` | `{ locale, exploreMode, lastQuestionIndex, questionsAnswered, totalQuestions, completionRate }` |
| `deepdive_abandoned`          | 退出   | 计算 DD 放弃率，定位模块流失点       | `components/questionnaire/questionnaire-shell.tsx` — `beforeunload` / `visibilitychange`                                                            | `{ sessionId, currentModule, questionsAnswered, totalQuestions, completionRate, locale }`       |
| `immersive_explore_started`   | 分支   | 沉浸式 vs 经典路径偏好               | `components/immersive-explore/immersive-explore-shell.tsx` — 角色介绍完成                                                                           | `{ language }`                                                                                  |
| `immersive_explore_completed` | 分支   | Explore Hub 完成率                   | `components/immersive-explore/use-immersive-engine.ts` — 30 题完成计分                                                                              | `{ archetypeCode, language, timeMs }`                                                           |
| `immersive_exit_clicked`      | 退出   | 沉浸体验中主动退出                   | `components/immersive-explore/immersive-explore-shell.tsx` — `ExitButton`                                                                           | `{ phase, questionIndex }`                                                                      |
| `share_clicked`               | 传播   | 报告分享意愿（病毒系数输入）         | `components/share/share-button.tsx` — 分享弹窗打开                                                                                                  | `{ archetypeCode, locale }`                                                                     |
| `profile_viewed`              | 参与   | 档案页面访问                         | `app/[locale]/(app)/profile/[id]/page.tsx` — 服务端                                                                                                 | `{ locale, hasProfile }`                                                                        |
| `action_hub_viewed`           | 参与   | 行动枢纽使用率                       | `app/[locale]/(app)/action-hub/page.tsx` — 服务端                                                                                                   | `{ locale, hasReport }`                                                                         |
| `intro_cta_clicked`           | 前漏斗 | Landing 具体 CTA 点击                | `components/quickdive/classic-explore-intro.tsx` — 开始按钮                                                                                         | `{ locale, secondsOnPage, exploreMode }`                                                        |
| `micro_feedback_shown`        | 参与   | 微反馈组件展示                       | `components/questionnaire/micro-feedback.tsx` — 组件挂载                                                                                            | `{ triggerType, sessionId }`                                                                    |
| `profile_generated`           | 系统   | 个人档案生成成功（算法阶段完成）     | `app/api/generate-profile/route.ts` — 服务端 (idempotencyKey: `profile_gen:{assessmentId}`)                                                         | `{ assessmentId }`                                                                              |
| `report_generated`            | 系统   | 报告生成成功（区别于 report_viewed） | `app/api/generate-report/route.ts` · `app/api/generate-report/stream/route.ts` — 服务端                                                             | `{ assessmentId, reportId, locale }`                                                            |
| `coaching_completed`          | 参与   | 教练会话完成                         | `app/api/coaching-summary/route.ts` — 服务端                                                                                                        | `{ sessionId, reportId, rounds, locale }`                                                       |

### 2.2 档案交互事件 (Profile)

| 事件                           | 触发条件                                  | 触发点                                                                           | 数据载荷                     |
| ------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------- |
| `profile_tab_switched`         | 用户在档案页切换 Tab                      | `components/profile-panels/profile-dashboard.tsx` — `handleTabChange` + 滑动切换 | `{ tab, previousTab }`       |
| `profile_cta_clicked`          | 用户点击档案页内的 CTA 链接（如"去教练"） | `components/profile-panels/dimension-overlay.tsx` · `inner-tensions.tsx`         | `{ dimension, destination }` |
| `profile_feedback_submitted`   | 用户提交维度准确性反馈（准/不准）         | `components/profile-panels/dimension-overlay.tsx` — `handleFeedback`             | `{ section, accurate }`      |
| `profile_transparency_toggled` | 用户展开/收起数据透明度面板               | `components/profile-panels/data-transparency.tsx`                                | `{ expanded }`               |

### 2.3 认证生命周期事件 (Auth Lifecycle)

| 事件     | 触发条件                         | 触发点                                                                 | 数据载荷                       |
| -------- | -------------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| `login`  | 用户登录成功（密码登录或 OAuth） | `app/api/auth/login/route.ts` · `app/api/auth/oauth/callback/route.ts` | `{}` 或 `{ provider }` (OAuth) |
| `logout` | 用户登出                         | `app/api/auth/logout/route.ts`                                         | `{}`                           |

### 2.4 导航与页面访问事件 (Navigation)

| 事件               | 触发条件                    | 触发点                                                                 | 数据载荷               |
| ------------------ | --------------------------- | ---------------------------------------------------------------------- | ---------------------- |
| `landing_viewed`   | 用户访问营销首页            | `app/[locale]/(marketing)/preview/page.tsx` — 客户端 `analytics.track` | `{ locale, referrer }` |
| `dashboard_viewed` | 已登录用户访问 Dashboard 页 | `app/[locale]/(app)/dashboard/page.tsx` — 服务端 `trackFunnelEvent`    | `{ locale }`           |

### 2.5 细粒度追踪事件 (Granular Engagement)

| 事件                     | 触发条件                                        | 触发点                                                                                                                                                       | 数据载荷                                                |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `question_answered`      | 每一题作答时打点（QD/DD/Immersive 共用）        | `components/questionnaire/use-questionnaire-flow.ts` · `components/quickdive/use-explore-engine.ts` · `components/immersive-explore/use-immersive-engine.ts` | `{ questionIndex, totalQuestions, module?, sessionId }` |
| `progress_milestone`     | 问卷到达 25% / 50% / 75% / 100% 进度节点        | `components/questionnaire/use-questionnaire-flow.ts` — 进度变化时匹配阈值                                                                                    | `{ milestone, sessionId }`                              |
| `coaching_prompt_shown`  | 教练页面主动显示提示/引导卡片                   | `components/features/coaching-chat.tsx` — prompt 渲染时                                                                                                      | `{ promptId, sessionId }`                               |
| `report_nps_submitted`   | 用户提交报告 NPS 评分                           | `app/api/report-nps/route.ts` — 服务端                                                                                                                       | `{ reportId, score }`                                   |
| `crisis_signal_detected` | 教练消息中双层危机检测（关键词 + LLM 分类）命中 | `components/features/coaching-chat.tsx` — 危机检测回调                                                                                                       | `{ sessionId, signalType, severity }`                   |

### 2.6 Pipeline 生命周期事件 (Assessment Pipeline)

> 由 server-orchestrated 的 assessment pipeline 发射，用于监控端到端可靠性。消费方: admin 漏斗面板、`verify:thesis` 掉落分类、Sentry 告警。

| 事件                          | 触发条件                                     | 触发点                                                                                                        | 数据载荷                                      |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `pipeline_started`            | Deep Dive 完成后 pipeline 首次启动           | `app/api/assessment/complete/route.ts` — `trackFunnelEvent("pipeline_started")`                               | `{ assessmentId, userId, sessionId }`         |
| `pipeline_completed`          | pipeline 所有步骤成功结束（narratives done） | `lib/pipeline/orchestrator.ts` — 终态写入后                                                                   | `{ assessmentId, durationMs }`                |
| `pipeline_step_failed`        | 任一 pipeline 步骤重试耗尽后失败             | `lib/pipeline/orchestrator.ts` — exp backoff 耗尽时                                                           | `{ assessmentId, step, attempts, errorCode }` |
| `report_generation_requested` | 用户点击 ReportDepthDialog 触发报告生成请求  | `app/api/assessment/[assessmentId]/request-report/route.ts` · `app/api/pipeline/[id]/request-report/route.ts` | `{ assessmentId, depth, resumeEvidence? }`    |
| `report_generation_failed`    | 报告生成步骤失败（独立于通用 step_failed）   | `lib/pipeline/orchestrator.ts` — report step 终态失败                                                         | `{ assessmentId, reason, attempts }`          |

---

## 3. 分群维度

> 代码实现: `FunnelFilters` in `funnel-queries.ts`

| 维度         | 值                                       | 数据来源                        | 分析目标           |
| ------------ | ---------------------------------------- | ------------------------------- | ------------------ |
| **语言**     | `en` / `zh`                              | `QuestionnaireSession.language` | 中英文用户行为差异 |
| **国家**     | ISO 国家码                               | `User.registrationCountry`      | 地域转化差异       |
| **设备**     | `mobile` / `desktop` / `tablet`          | `PageVisit.deviceType`          | 移动端体验优化     |
| **探索模式** | `classic` / `narrative` / `immersive`    | `QuickDiveResult.exploreMode`   | A/B 测试模式效果   |
| **研究分组** | `classic` / `immersive` / `non-research` | `User.researchGroup`            | 论文研究队列分析   |

### 关键分群对比

| 对比         | 假设                                   | 如何验证                                                                                       |
| ------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 中文 vs 英文 | 中文用户完成率更高（母语优势）         | `getFilteredConversionRates(30, { language: 'zh' })` vs `{ language: 'en' }`                   |
| 移动 vs 桌面 | 桌面用户 DD 完成率更高（长问卷）       | `getFilteredConversionRates(30, { device: 'desktop' })` vs `{ device: 'mobile' }`              |
| 沉浸 vs 经典 | 沉浸模式提升 DD 开始率但可能降低完成率 | `getFilteredConversionRates(30, { exploreMode: 'immersive' })` vs `{ exploreMode: 'classic' }` |

---

## 4. 步骤耗时基准

> 代码实现: `getFunnelStepTiming()` in `funnel-queries.ts`

| 步骤间隔                               | 含义               | 预期中位数 | 异常阈值                            |
| -------------------------------------- | ------------------ | ---------- | ----------------------------------- |
| registered → quickdive_started         | 注册后多久开始 QD  | ~1 分钟    | >1 天（流失风险）                   |
| quickdive_started → completed          | QD 答题时间        | 3-5 分钟   | <1 分钟（rush）或 >30 分钟（困惑）  |
| quickdive_completed → deepdive_started | QD→DD 的考虑时间   | 5-30 分钟  | >7 天（需要邮件唤醒）               |
| deepdive_started → completed           | DD 答题时间        | 15-25 分钟 | <8 分钟（rush）或 >2 小时（分多次） |
| deepdive_completed → report_viewed     | 等待报告生成       | 1-3 分钟   | >10 分钟（生成超时）                |
| report_viewed → report_reacted         | 阅读报告的时间     | 5-15 分钟  | <1 分钟（没读完）                   |
| report_reacted → coaching_started      | 决定进入教练的时间 | 0-60 分钟  | >7 天（需要推送）                   |

---

## 5. 物化视图与聚合查询

> 物化视图定义在 `scripts/migrations/018-create-materialized-views.sql`

### 5.1 analytics_daily_summary

| 字段              | 说明                           |
| ----------------- | ------------------------------ |
| `date`            | UTC 日期                       |
| `country`         | 国家码（`__unknown__` 为兜底） |
| `totalPV`         | 总页面访问数                   |
| `uniqueVisitors`  | 去重 IP 访客数                 |
| `registeredUsers` | 已注册用户的访问数             |
| `realPV`          | 过滤 bot + 内部流量后的真实 PV |
| `realUV`          | 真实独立访客                   |
| `mobilePV`        | 移动端 PV                      |
| `campaignPV`      | 带 UTM 参数的 PV               |

**用途**: 日级流量趋势、国家分布、移动端占比、营销活动效果

### 5.2 funnel_weekly_summary

| 字段              | 说明                    |
| ----------------- | ----------------------- |
| `week`            | 周起始日期 (DATE_TRUNC) |
| `event`           | 漏斗事件名              |
| `totalCount`      | 该周该事件总次数        |
| `uniqueUsers`     | 去重用户数              |
| `registeredUsers` | 其中已注册用户数        |

**用途**: 周级漏斗趋势、转化率周环比、季节性分析

### 5.3 cohort_retention_weekly

| 字段           | 说明                      |
| -------------- | ------------------------- |
| `cohortWeek`   | 用户注册周                |
| `activityWeek` | 用户活跃周                |
| `weekNumber`   | 距注册的周数 (0 = 注册周) |
| `activeUsers`  | 该队列中活跃用户数        |
| `cohortSize`   | 该队列总用户数            |

**用途**: 留存曲线 (`activeUsers / cohortSize`)、队列间留存对比

### 刷新策略

```sql
-- 首次刷新（视图为空时，不能用 CONCURRENTLY）:
REFRESH MATERIALIZED VIEW analytics_daily_summary;
REFRESH MATERIALIZED VIEW funnel_weekly_summary;
REFRESH MATERIALIZED VIEW cohort_retention_weekly;

-- 后续刷新（已有数据，用 CONCURRENTLY 避免锁表）:
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_daily_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY funnel_weekly_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY cohort_retention_weekly;
```

**建议刷新频率**:

- `analytics_daily_summary`: 每天 1 次 (UTC 凌晨)
- `funnel_weekly_summary`: 每周 1 次 (周一)
- `cohort_retention_weekly`: 每周 1 次 (周一)

> 当前无自动化 cron 刷新。可通过 Neon Console 手动执行，或后续集成 Vercel Cron / GitHub Action。

---

## 6. 监控与告警策略

### 自动化监控（已实现）

| 监控项                 | 实现                                                     | 位置                      |
| ---------------------- | -------------------------------------------------------- | ------------------------- |
| Analytics Error 健康度 | `getAnalyticsHealth()`                                   | `lib/analytics/errors.ts` |
| 错误按层分组           | 5 层: funnel / page_visit / engagement / identity / cron | Admin 面板                |
| Sentry 告警            | 所有分析错误自动上报 Sentry (level: warning)             | `logAnalyticsError()`     |

### 需要建立的监控

| 监控项       | 触发条件                       | 建议方式                        |
| ------------ | ------------------------------ | ------------------------------- |
| 漏斗断裂告警 | 某步骤日转化率 < 基准线 50%    | 周报 + Sentry custom alert      |
| 报告生成超时 | report_generated 延迟 > 120s   | 已有 100s 超时，Sentry 自动捕获 |
| 教练零启动   | 连续 7 天 coaching_started = 0 | 周报检查                        |
| Bot 流量异常 | bot PV 占比 > 50%              | `analytics_daily_summary` 周检  |

---

## 7. 漏斗查询速查

```typescript
import {
  getFunnelStats,
  getConversionRates,
  getFilteredConversionRates,
  getFunnelStepTiming,
  getFunnelFilterOptions,
} from "@/lib/analytics/funnel-queries";

// 过去 30 天总体转化率
const rates = await getConversionRates(30);

// 按中文移动端用户筛选
const zhMobile = await getFilteredConversionRates(30, {
  language: "zh",
  device: "mobile",
});

// 步骤间中位耗时
const timing = await getFunnelStepTiming(30);

// 可用筛选选项（填充下拉菜单）
const options = await getFunnelFilterOptions(30);
```
