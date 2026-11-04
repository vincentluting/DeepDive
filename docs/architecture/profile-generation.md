---
title: Profile Generation
category: architecture
sources:
  - lib/profile-generation/generate-profile.ts
  - lib/profile-generation/profile-algorithm.ts
  - lib/profile-generation/generate-identity-narratives.ts
  - lib/profile-generation/shadow-algorithm.ts
  - lib/profile-generation/core-qualities.ts
  - lib/profile-generation/meaning-compass.ts
  - lib/profile-generation/normalize-profile.ts
  - lib/db/profiles.ts
  - lib/types/assessment.ts
sync_mode: partial
last_verified: 2026-06-15
verified_by: claude-code
---

# Profile Generation

将 86 题 Deep Dive 评分结果 (`AssessmentResult`) 转化为结构化个人档案 (`PersonalProfileData`)。分为**纯算法层**（零 LLM）和**叙事生成层**（单次 "soul call" 一次成文 7 字段，失败回退 legacy 2 并行调用）。

---

## 数据流

```
AssessmentResult (from lib/scoring/)
    ↓
getEffectiveAssessment()  — 合并最新 Quick Dive RIASEC
    ↓
generateProfile(assessment, userId?, algoOutput?)
    ├── computeProfileAlgorithm()     ← 纯算法，零 LLM
    │   ├── RIASEC → riasecRadar (6 维度)
    │   ├── Big Five → domains + facets + facetPairs
    │   ├── Schwartz → centered scores + higher-order polarity
    │   └── SJT → tension scenarios + consistency
    │
    ├── 衍生框架 (全部纯算法)
    │   ├── computeShadowInsights()        盲点分析
    │   ├── computeCoreQualities()         Ofman 核心品质
    │   ├── computeSocialStyle()           Kramlinger 2×2
    │   ├── computeLeadershipStyle()       Goleman 6 模式
    │   ├── computeInterpersonalEnergy()   IPC 光谱
    │   ├── computeConflictHandling()      TKI 5 模式
    │   └── computeMeaningCompass()        Schwartz E/T 轴 × Ikigai 重叠
    │
    └── generateIdentityNarratives()  ← Soul Call (单次 LLM, 7 字段一次成文)
        ├── 主路径: 1 次 unified soul call → 7 必需字段
        ├── 字段缺失 (1-2 个) → field-level repair (仅补缺失)
        └── soul 失败 / 语言泄漏 → legacy 2-call 并行回退 (Call A 4 ‖ Call B 3)

    ↓
PersonalProfileData → 存入 PersonalProfile 表
    ↓
algoSnapshot 缓存 → 报告生成复用 (避免重算)
```

## 算法层

### 输入 (`AssessmentInput`)

| 字段                                   | 来源             | 说明                             |
| -------------------------------------- | ---------------- | -------------------------------- |
| `riasecNormalized`                     | Quick Dive 30 题 | 6 维度 R/I/A/S/E/C (0-100)       |
| `bigFive.facets` / `domainsNormalized` | IPIP-60 v3.0     | 5 域 30 面向                     |
| `schwartz`                             | PVQ-21           | centered scores + ranking + top3 |
| `tensions`                             | SJT 场景         | 情境判断 + 一致性                |
| `archetype`                            | Quick Dive 推导  | 12 型之一                        |
| `cognitiveStyleCode`                   | Big Five 推导    | 认知风格编码                     |

### 输出 (`PersonalProfileData`)

| 字段                                         | 说明                                 |
| -------------------------------------------- | ------------------------------------ |
| `archetype`                                  | 12 型编码 + 置信度                   |
| `riasecScores`                               | 标准化 6 维度                        |
| `bigFiveScores` / `cognitiveStyleDimensions` | 人格 + 认知风格                      |
| `schwartzAnchors`                            | 价值排序 + top3 + 冲突对             |
| `shadowInsights`                             | 盲点分析                             |
| `coreQualities`                              | Ofman 核心品质                       |
| `socialStyle` / `leadershipStyle`            | 社交风格 / 领导风格                  |
| `interpersonalEnergy` / `conflictHandling`   | IPC / TKI                            |
| `meaningCompass`                             | Schwartz E/T 轴 × top3 × Ikigai 重叠 |
| `algoSnapshot`                               | 缓存的算法输出（排除静态原型内容）   |
| `confidenceMap`                              | 各维度置信度                         |

### 衍生框架

| 框架                 | 源文件                       | 输入                          | 方法                    |
| -------------------- | ---------------------------- | ----------------------------- | ----------------------- |
| Shadow Insights      | `shadow-algorithm.ts`        | Big Five facets               | 极端值 + 跨维度矛盾检测 |
| Core Qualities       | `core-qualities.ts`          | Big Five facet 偏差           | Ofman 四象限映射        |
| Social Style         | `social-style.ts`            | Extraversion × Agreeableness  | Kramlinger 2×2 矩阵     |
| Leadership Style     | `leadership-style.ts`        | Big Five 5 域                 | Goleman 6 模式阈值      |
| Interpersonal Energy | `interpersonal-energy.ts`    | Big Five E+A+N                | IPC Circumplex 光谱     |
| Conflict Handling    | `conflict-handling-style.ts` | Big Five A+E+N+C              | TKI 5 模式权重          |
| Meaning Compass      | `meaning-compass.ts`         | Schwartz 高阶 + top3 + collab | E/T 轴 × Ikigai 重叠    |

## LLM 叙事层

**触发时机**: 档案首次创建时（`/api/generate-profile` POST）

**模型**: `claude-sonnet-4-6` (Anthropic)，启用 prompt caching

**安全设计**: LLM 从不接收原始分数 — 仅接收定性区间描述（极强/很强/偏强 或 very pronounced/pronounced/moderately pronounced）

**架构**: 主路径 = 单次 "soul call" 一次产出全部 7 个必需字段（`SOUL_CALL_TIMEOUT_MS = 60s`）。字段缺 1-2 个 → field-level repair 仅补缺失字段。soul call 失败或语言泄漏 → 回退到 legacy 2-call 并行模式（每 call `PER_CALL_TIMEOUT_MS = 45s`）。

| 路径                     | 输出字段                                                                                                                                                  | 说明                   |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **主路径** — Soul Call   | `identitySummary` + `archetypeNarrative` + `bigFiveNarrative` + `valueNarrative` + `sjtTensionNarrative` + `crossDimensionNarrative` + `growthMapInsight` | 1 次 unified 调用      |
| 回退 — legacy Call A ‖ B | A: 前 4 字段 ‖ B: 后 3 字段                                                                                                                               | soul 失败/泄漏时并行   |
| 懒生成 — Ch3 滚动触发    | `meaningCompassNarrative`（第 8 字段）                                                                                                                    | 单字段，~5% 流量才生成 |

> 第 8 个字段 `meaningCompassNarrative` 不在首次生成中产出，而是用户滚动到 Ch3 时由路由触发单字段懒生成（eager 生成会浪费 ~30% soul call token 预算）。所有 LLM 输出走 `enforceOutputLocale` 语言防护。

## DB 表

### PersonalProfile

| 列                        | 类型        | 说明                        |
| ------------------------- | ----------- | --------------------------- |
| `id`                      | UUID        | PK                          |
| `assessmentId`            | UUID FK     | → AssessmentResult (UNIQUE) |
| `userId`                  | UUID FK     | → User                      |
| `profileJson`             | JSONB       | 完整 PersonalProfileData    |
| `version`                 | TEXT        | "2.0" 或 "3.0"              |
| `createdAt` / `updatedAt` | TIMESTAMPTZ | 时间戳                      |

## 与其他模块的关系

| 上游           | 关系                                        |
| -------------- | ------------------------------------------- |
| `lib/scoring/` | 产出 AssessmentResult → 本模块的输入        |
| `lib/journey/` | 档案生成后触发 `profile_generated` 状态转换 |

| 下游                         | 关系                               |
| ---------------------------- | ---------------------------------- |
| `lib/report-generation/`     | 读取 `algoSnapshot` 避免重算算法   |
| `lib/coaching/`              | 注入档案上下文到教练 system prompt |
| `components/profile-panels/` | 渲染档案 UI                        |

## 关键文件

| 文件                              | 大小   | 职责                                   |
| --------------------------------- | ------ | -------------------------------------- |
| `generate-profile.ts`             | 5.6 KB | 入口：编排算法 + LLM                   |
| `profile-algorithm.ts`            | 5.3 KB | 核心：纯算法计算                       |
| `generate-identity-narratives.ts` | 32 KB  | LLM 叙事生成 (soul call + legacy 回退) |
| `shadow-algorithm.ts`             | 12 KB  | 盲点分析                               |
| `core-qualities.ts`               | 20 KB  | Ofman 核心品质                         |
| `normalize-profile.ts`            | 5.0 KB | 输出标准化                             |
| `social-style.ts`                 | 2.0 KB | Kramlinger 社交风格                    |
| `leadership-style.ts`             | 2.7 KB | Goleman 领导风格                       |
| `interpersonal-energy.ts`         | 3.8 KB | IPC 人际能量                           |
| `conflict-handling-style.ts`      | 4.3 KB | TKI 冲突处理                           |
| `meaning-compass.ts`              | —      | Schwartz E/T × Ikigai 罗盘             |
