---
title: Normalized Fact Tables — Design Doc (P3, post-thesis)
category: architecture
status: design
authored: 2026-05-19
target_implementation: post-thesis (W13+)
sources:
  - scripts/schema.sql
  - lib/coaching/build-system-prompt.ts
  - lib/report-generation/index.ts
  - .claude/plans/codex-quizzical-shell.md (Phase 3 P2)
---

# Normalized Fact Tables — Design

> 本文档是 **设计稿, 不实施**。论文交付后 (W13+) 启动 migration 时直接照搬。先把设计沉淀, 避免论文交付当天才开始想。

## Why (产品层)

当前架构每个功能存自己的 JSONB blob:

| 功能            | 存储位置                                           | 大小      | 重复编码        |
| --------------- | -------------------------------------------------- | --------- | --------------- |
| Coaching prompt | system message (memory Top 15 + profile + QD + RC) | ~8-12KB   | 每次对话重组    |
| Report          | `CareerReport.reportJson`                          | 150-250KB | 每次报告渲染    |
| Profile         | `PersonalProfile.algoSnapshot`                     | ~20KB     | 每次 profile 页 |
| Action Hub      | 多张表 + LLM enrichment                            | varies    | 每次重算        |

**同一个用户的相同事实 (e.g. "他擅长 Python, 不擅长公开演讲") 被反复编码进不同 blob, 每个功能维护自己的 view**。

Codex 二审独家发现的"持久职业知识图谱 + 可再生视图" framing 是正解:

- **Single source of truth**: 一组 normalized user facts
- **可再生 views**: 报告 / 教练 / Action Hub 都是这个 facts 层的渲染

## What (数据模型)

### 三张新表

#### 1. `QuestionnaireAnswer` — 一行一题

```sql
CREATE TABLE "QuestionnaireAnswer" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"    TEXT NOT NULL REFERENCES "QuestionnaireSession"("id") ON DELETE CASCADE,
  "userId"       TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "moduleCode"   TEXT NOT NULL,      -- 'A'|'B'|'C' (or scale code post-v3)
  "questionId"   TEXT NOT NULL,      -- canonical question identifier
  "scaleKey"     TEXT,                -- e.g. 'big_five:openness', 'twivi:enhancement'
  "value"        NUMERIC(4,2),        -- the actual Likert / numeric response
  "valueRaw"     JSONB,                -- original payload for SJT / non-numeric
  "answeredAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("sessionId", "questionId")
);
CREATE INDEX "idx_qa_user_module" ON "QuestionnaireAnswer"("userId", "moduleCode");
CREATE INDEX "idx_qa_scale" ON "QuestionnaireAnswer"("scaleKey") WHERE "scaleKey" IS NOT NULL;
```

**Why**: current `QuestionnaireSession.answersJson` is opaque blob — can't query "all answers to scale X across users" without full table scan. With this table, thesis-level analysis becomes `SELECT scaleKey, AVG(value) FROM QuestionnaireAnswer GROUP BY scaleKey, demographic`.

#### 2. `CoachingMessage` — extract from `CoachingSession.messagesJson`

```sql
CREATE TABLE "CoachingMessage" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sessionId"    TEXT NOT NULL REFERENCES "CoachingSession"("id") ON DELETE CASCADE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role"         TEXT NOT NULL CHECK ("role" IN ('user', 'assistant')),
  "content"      TEXT NOT NULL,
  "tokenCount"   INTEGER,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "idx_cm_session_time" ON "CoachingMessage"("sessionId", "createdAt");
CREATE INDEX "idx_cm_user_time" ON "CoachingMessage"("userId", "createdAt" DESC);
```

**Why**: enables "show me coaching messages where user expressed career pivot intent" or "rank users by engagement length" without loading the entire `messagesJson` JSONB per session. Also fixes the schema-type inconsistency Codex flagged (`messagesJson` JSONB vs `summaryJson` TEXT).

#### 3. `ReportSectionFact` — extract from `CareerReport.reportJson`

```sql
CREATE TABLE "ReportSectionFact" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "reportId"    TEXT NOT NULL REFERENCES "CareerReport"("id") ON DELETE CASCADE,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "section"      TEXT NOT NULL,       -- 'anchor'|'landscape'|'shadow'|'letter'|'pathway'
  "factKey"      TEXT NOT NULL,       -- e.g. 'top_career_match', 'shadow_archetype'
  "factValue"    JSONB NOT NULL,       -- the actual structured value
  "rendered"     TEXT,                 -- optional rendered narrative for this fact
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("reportId", "section", "factKey")
);
CREATE INDEX "idx_rsf_user_section" ON "ReportSectionFact"("userId", "section");
```

**Why**: today, rendering a single section of a report fetches the full 250KB blob. Per-section reads cut to ~5KB. Also enables incremental regeneration (e.g. user retakes QD → only re-render `landscape` section, leave `letter` intact).

### 一个 view

```sql
CREATE VIEW "user_facts" AS
  SELECT
    u."id" AS "userId",
    -- Big Five / Schwartz / RIASEC from latest QuestionnaireAnswer rows
    jsonb_object_agg("scaleKey", "value")
      FILTER (WHERE qa."scaleKey" IS NOT NULL) AS "scaleScores",
    -- Latest report facts
    jsonb_object_agg(rsf."factKey", rsf."factValue")
      FILTER (WHERE rsf."factValue" IS NOT NULL) AS "reportFacts",
    -- Profile + memory hookup ...
    MAX(u."lastActiveAt") AS "lastActiveAt"
  FROM "User" u
  LEFT JOIN "QuestionnaireAnswer" qa ON qa."userId" = u."id"
  LEFT JOIN "ReportSectionFact" rsf ON rsf."userId" = u."id"
  GROUP BY u."id";
```

**Why**: coaching / report / Action Hub prompt builders read **one query** instead of 5-7 separate fetches + manual merging. Single source of truth.

## How (双轨切换策略)

### Phase 1 (W13-15): 写双轨, 读旧

- 新表 + view 创建
- 在 `saveAssessmentResult` / coaching message append / report save 处, **同时**写新表 + 保留旧 JSONB
- 验证: 每天跑 `SELECT COUNT(*) FROM QuestionnaireAnswer vs JSON array length in QuestionnaireSession.answersJson` 差异
- 不切读路径

### Phase 2 (W16-18): 切读

- 一个一个功能切: profile-page → coaching prompt → report renderer → Action Hub
- 每个切换一周观察, Sentry 监控错误率
- 旧 JSONB 仍然写入, 作为 audit trail + 回滚保险

### Phase 3 (W19+): 收尾

- 旧 JSONB 列加 deprecation comment
- 6 个月后 (W43+) 评估是否 DROP 旧列 — 决策点是: 是否还需要 audit trail, 还是 `*Json` 已经被新表 + LLMUsageLog 完整覆盖

## 不做的事 (避免范围蔓延)

- ❌ **不动 scoring 算法** — 评分管道保持现状, 新表只是 "存储已计算结果" 的另一个 view
- ❌ **不替换 LLMUsageLog** — LLMUsageLog 仍是 LLM-call-level audit, 与 user facts 正交
- ❌ **不引入 ORM** — Neon HTTP + 手写 SQL 是 deliberate choice, ORM 在 serverless edge runtime 通常拖累
- ❌ **不做 multi-tenant** — 单租户产品, 用户 own 自己的 facts, 不需要 tenant_id 维度

## 风险

| 风险                      | 缓解                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| 双写不一致 (新表 vs JSON) | Phase 1 每日 reconcile job, 差异 >5% Sentry alert                     |
| 切读时漏掉 caller         | Phase 2 一次切一个 feature, 切完跑该功能的 E2E + 1 周观察             |
| Neon free 0.5GB 容量加压  | 新表压缩比 JSONB 高, 净占用应下降; 若不够, 商业化后升 Launch ($19/月) |
| 论文已发表后改 schema     | normalized 表是 additive, 不影响论文数据可重现性 — 关键是 JSON 仍在   |

## 工作量估算

- Phase 1: ~30h (3 张表 migration + 3 处写入 patch + reconcile job)
- Phase 2: ~40h (4 个 feature 切读 + E2E + 观察期总 8 周)
- Phase 3: ~10h (cleanup + 文档)

**总: ~80h, 跨 6-8 周, 论文交付后启动**.
