---
title: Journey State Machine
category: architecture
sources:
  - lib/journey/state-machine.ts
  - lib/db/journey.ts
sync_mode: partial
last_verified: 2026-04-13
verified_by: claude-code
---

# Journey State Machine

纯有限状态机 (FSM)，控制用户从注册到教练的全旅程进度。每个状态门控对应功能的解锁，所有状态转换原子性写入数据库。

---

## 状态转换图

```
not_started
    │ COMPLETE_QUICK_DIVE
    ▼
quick_dive_complete
    │ COMPLETE_DEEP_DIVE
    ▼
deep_dive_complete
    │ GENERATE_PROFILE
    ▼
profile_generated
    │ GENERATE_REPORT
    ▼
report_generated
    │ (终态)
    ▼
coaching_unlocked

※ 每个非终态均有 ADMIN_SKIP → coaching_unlocked 的跳转
```

## 状态与事件

| 状态                  | 事件                  | 目标状态              |
| --------------------- | --------------------- | --------------------- |
| `not_started`         | `COMPLETE_QUICK_DIVE` | `quick_dive_complete` |
| `quick_dive_complete` | `COMPLETE_DEEP_DIVE`  | `deep_dive_complete`  |
| `deep_dive_complete`  | `GENERATE_PROFILE`    | `profile_generated`   |
| `profile_generated`   | `GENERATE_REPORT`     | `report_generated`    |
| `report_generated`    | —                     | 终态                  |
| `coaching_unlocked`   | —                     | 终态                  |
| 任意非终态            | `ADMIN_SKIP`          | `coaching_unlocked`   |

**转换函数**: `transition(currentState, event)` → `nextState | null`（无效转换返回 null）

## 派生逻辑

### 功能解锁 (`deriveUnlocked`)

```typescript
deriveUnlocked(state): {
  quickDive: true,                                    // 始终可用
  deepDive: hasReached(state, 'quick_dive_complete'), // QD 完成后
  profile: hasReached(state, 'profile_generated'),    // 档案生成后
  report: hasReached(state, 'report_generated'),      // 报告生成后
  coaching: hasReached(state, 'report_generated'),    // 报告生成后
}
```

### 用户等级 (`deriveUserLevel`)

| 等级 | 条件                                             | 说明        |
| ---- | ------------------------------------------------ | ----------- |
| 0    | 未完成 Quick Dive                                | 新用户      |
| 1    | `quick_dive_complete` 但未到 `profile_generated` | 仅 QD       |
| 2    | `profile_generated` 但无 power user 数据         | 有档案/报告 |
| 3    | `coaching_unlocked` + 多报告/洞察                | 深度用户    |

### 教练访问 (`deriveCoachAccess`)

| 等级 | 条件                                              | 对话轮次上限 |
| ---- | ------------------------------------------------- | ------------ |
| 0    | 未到 `quick_dive_complete`                        | 0（锁定）    |
| 1    | `quick_dive_complete` 但未到 `deep_dive_complete` | 3 轮         |
| 2    | 已到 `deep_dive_complete`                         | 无限         |

## 数据库存储

**字段**: `User.journeyState` (TEXT)

**约束**: PostgreSQL CHECK 确保仅允许有效状态值

**原子更新**: `transitionJourney(userId, event, triggeredBy, metadata?)`

- 使用 `WHERE "journeyState" = currentState` 防止并发竞态
- `triggeredBy` 记录触发来源（API route / lifecycle hook）

**读取**: `getJourneyState(userId)` → 当前状态 或 `'not_started'`

## API 集成

| 触发点                       | 事件                  | 说明                                          |
| ---------------------------- | --------------------- | --------------------------------------------- |
| Quick Dive 完成              | `COMPLETE_QUICK_DIVE` | `afterQuestionnaireCompletion()` 生命周期钩子 |
| Deep Dive 提交               | `COMPLETE_DEEP_DIVE`  | 评分完成后                                    |
| `/api/generate-profile` 成功 | `GENERATE_PROFILE`    | `afterProfileGenerated()` 钩子                |
| `/api/generate-report` 成功  | `GENERATE_REPORT`     | 报告存入 DB 后                                |
| Admin 操作                   | `ADMIN_SKIP`          | 跳过至 coaching_unlocked                      |

**门控模式**: 各 API route 通过 `hasReached(state, requiredState)` 检查权限，未达到则返回 403。

## 关键文件

| 文件                           | 大小   | 职责                       |
| ------------------------------ | ------ | -------------------------- |
| `lib/journey/state-machine.ts` | 5.2 KB | FSM 定义 + 转换 + 派生逻辑 |
| `lib/db/journey.ts`            | —      | DB 读写 + 原子转换         |
