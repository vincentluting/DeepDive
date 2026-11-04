---
title: Cohort & Entitlements
category: architecture
sources:
  - lib/cohort/config.ts
  - lib/cohort/entitlements.ts
  - lib/cohort/types.ts
  - lib/cohort/progress.ts
sync_mode: partial
last_verified: 2026-04-13
verified_by: claude-code
---

# Cohort & Entitlements

声明式多租户系统：邀请码 → cohort → entitlements（功能门控）。支持研究性 A/B 分组和旅程进度追踪。

---

## 概述

```
用户注册 (带邀请码)
    ↓
resolveInviteCode() → cohort_id
    ↓
User.cohort = cohort_id
    ↓ (若 cohort 启用 A/B)
resolveResearchGroup() → 'classic' | 'immersive'
    ↓
User.researchGroup = group
    ↓
getUserEntitlements(cohort) → CohortEntitlements
    ↓
canAccess(cohort, feature) → boolean  ← 各 API / 页面调用
```

## 活跃 Cohort

### thesis_2026

**用途**: 毕业论文数据采集 (University of Amsterdam MBA)

| 属性            | 值                                                                               |
| --------------- | -------------------------------------------------------------------------------- |
| 旅程步骤        | pre_assessment → quick_dive → deep_dive → coaching → post_immediate → post_1week |
| 研究追踪        | ✅ `trackingEnabled: true`                                                       |
| A/B 分组        | 随机均衡分配 (`autoAssignResearchGroup: 'random'`)                               |
| Quick Dive 变体 | 由分组决定 (classic / immersive)                                                 |
| 需研究知情同意  | ✅                                                                               |
| 教练日限        | 20 轮                                                                            |

### beta_2026

**用途**: 公开测试

| 属性           | 值                     |
| -------------- | ---------------------- |
| 旅程步骤       | quick_dive → deep_dive |
| 研究追踪       | ❌                     |
| A/B 分组       | 用户自选               |
| 需研究知情同意 | ❌                     |
| 教练日限       | 10 轮                  |

## Entitlement 门控

### CohortEntitlements 接口

```typescript
interface CohortEntitlements {
  immersiveDive: boolean; // 沉浸式 Quick Dive UX
  deepDive: boolean; // 86 题 Deep Dive
  aiProfile: boolean; // 档案生成 (LLM)
  aiReport: boolean; // 职业报告生成
  aiCoaching: boolean; // AI 教练
  coachingDailyLimit: number | null; // null = 无限
  requireResearchConsent: boolean;
  researchSurveys: boolean; // 前后测问卷
}
```

### 默认值 (无 cohort / 无效 cohort)

所有 boolean = `false`，`coachingDailyLimit = 0`。

### 使用方式

```typescript
// API route 或页面中
import { canAccess } from "lib/cohort/entitlements";

if (!canAccess(user.cohort, "deepDive")) {
  return Response.json({ error: "Feature not available" }, { status: 403 });
}
```

## A/B 研究分组

**仅对 `autoAssignResearchGroup: 'random'` 的 cohort 生效。**

`resolveResearchGroup(cohortId)`:

1. 查询当前 cohort 内 classic / immersive 各有多少用户
2. 将新用户分配到人数较少的组（强制均衡）
3. 结果写入 `User.researchGroup`

## 旅程进度追踪

`computeCohortProgress(userId, cohortId)` 通过查询多表判断各步骤完成状态：

| 步骤             | 证据来源                                |
| ---------------- | --------------------------------------- |
| `pre_assessment` | `PrePostAssessment` 表                  |
| `quick_dive`     | `QuickDiveResult` 表                    |
| `deep_dive`      | `CareerReport` 表（作为 DD+报告的代理） |
| `coaching`       | `CoachingSession` 表                    |
| `post_immediate` | `PrePostAssessment` 表                  |
| `post_1week`     | `PrePostAssessment` 表                  |

无独立进度追踪表 — 全部从业务数据推导。

## DB 字段

| 表.列                    | 类型        | 说明                     |
| ------------------------ | ----------- | ------------------------ |
| `User.cohort`            | TEXT        | cohort ID                |
| `User.researchGroup`     | TEXT        | 'classic' 或 'immersive' |
| `User.researchConsentAt` | TIMESTAMPTZ | 知情同意时间             |

## 辅助函数

| 函数                          | 用途                  |
| ----------------------------- | --------------------- |
| `isCohortActive(cohortId)`    | 检查 cohort 是否活跃  |
| `isResearchCohort(cohortId)`  | 是否启用研究追踪      |
| `getCohortSteps(cohortId)`    | 获取旅程步骤列表      |
| `getUserEntitlements(cohort)` | 解析完整 entitlements |
| `canAccess(cohort, feature)`  | 单功能门控检查        |

## 关键文件

| 文件                         | 大小   | 职责                               |
| ---------------------------- | ------ | ---------------------------------- |
| `lib/cohort/config.ts`       | 4.7 KB | 声明式 cohort 定义 (COHORT_CONFIG) |
| `lib/cohort/entitlements.ts` | 1.0 KB | entitlement 解析 + canAccess       |
| `lib/cohort/types.ts`        | 2.1 KB | TypeScript 接口                    |
| `lib/cohort/progress.ts`     | 2.7 KB | 旅程进度计算                       |
