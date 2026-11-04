# /biz-audit — 业务逻辑正确性审计

> 验证评分算法、原型分配、报告内容、数据流管道的端到端正确性。
> 专为 Deep Dive 6 步管道定制：QuickDive → Score → Profile → Report → Coach。
> 所有输出使用中文。

## 触发条件

用户说 "业务审计"、"biz audit"、"评分对不对"、"逻辑检查"、"报告准不准"、"管道验证" 时激活。

## 可用工具

Bash, Read, Write, Edit, Glob, Grep, Agent

## 模式总览

| 模式         | 命令                    | 做什么                                      | 预估耗时 |
| ------------ | ----------------------- | ------------------------------------------- | -------- |
| **快速冒烟** | `/biz-audit quick`      | 评分单元测试 + 类型检查 + 关键断言          | ~1min    |
| **管道审计** | `/biz-audit` (默认)     | 6 步管道逐层验证，输入→输出一致性           | ~5min    |
| **原型审计** | `/biz-audit archetypes` | 12 型原型分配逻辑 + 文案一致性 + 覆盖完整性 | ~3min    |
| **报告审计** | `/biz-audit report`     | 报告 5 章内容准确性 + LLM prompt 一致性     | ~5min    |
| **职业库**   | `/biz-audit careers`    | 1,141 条职业方向数据完整性 + 匹配算法       | ~3min    |
| **全量**     | `/biz-audit full`       | 以上全部                                    | ~15min   |

---

## 阶段 0 — 环境检查 (所有模式共用)

```bash
# 类型检查 — 管道类型不过关一切免谈
npx tsc --noEmit 2>&1 | tail -20

# 评分管道测试
npx vitest run lib/scoring/ --reporter=verbose 2>&1 | tail -30
```

如果 tsc 或评分测试失败 → 先报告，不继续后续审计。

---

## 模式 1 — 快速冒烟 (`/biz-audit quick`)

> 最快验证核心管道没有断裂。

按顺序执行：

```bash
# 1. 评分管道测试
npx vitest run lib/scoring/ --reporter=verbose

# 2. 档案生成测试
npx vitest run lib/profile-generation/ --reporter=verbose

# 3. 报告生成测试
npx vitest run lib/report-generation/ --reporter=verbose

# 4. Immersive 数据一致性
npx vitest run components/immersive-explore/__tests__/ --reporter=verbose
```

**输出格式：**

```
🔍 业务逻辑快速冒烟

✅ 评分管道 — XX 测试通过
✅ 档案生成 — XX 测试通过
✅ 报告生成 — XX 测试通过
✅ Immersive 数据 — XX 测试通过

🟢 核心管道健康
```

---

## 模式 2 — 管道审计 (`/biz-audit` 默认)

> 沿 6 步管道逐层验证输入→输出契约。

### 检查清单

#### Layer 1: 问题定义 → 评分输入

| 检查项                           | 文件                                       | 验证方法                                   |
| -------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Quick Dive 30 RIASEC 题目完整    | `lib/questionnaire/questions.ts`           | 计数 = 30，每个 RIASEC 维度 5 题           |
| Deep Dive 86 题 v3.0 完整        | `lib/questionnaire/deep-dive-questions.ts` | 计数 = 86，覆盖所有评估维度                |
| TwIVI 8 题（Immersive 专用）完整 | `components/immersive-explore/data/`       | 计数 = 8，覆盖 Enhancement + Transcendence |
| 题目 ID 无重复                   | 全部题目文件                               | `Set(ids).size === ids.length`             |
| 选项分值范围正确                 | 同上                                       | Likert 1-5 或 1-7                          |

#### Layer 2: 评分输入 → RIASEC 分数

| 检查项                  | 文件                    | 验证方法                            |
| ----------------------- | ----------------------- | ----------------------------------- |
| RIASEC 计算公式正确     | `lib/scoring/riasec.ts` | 每维度 = Σ(该维度题目分数) / 题目数 |
| 单一权威源              | `lib/scoring/riasec.ts` | 无其他文件重新计算 RIASEC           |
| 分数范围 [1,5] 或 [1,7] | 同上                    | 边界测试                            |

#### Layer 3: RIASEC → 12 型原型

| 检查项                                         | 文件                           | 验证方法                                          |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| 原型 = RIASEC Top1 × Enhancement/Transcendence | `lib/scoring/archetype.ts`     | 6 RIASEC × 2 值取向 = 12                          |
| 12 型定义完整                                  | `lib/content/archetypes-12.ts` | 12 条记录，每条有 id, name, description, colorHex |
| 原型分配覆盖所有 RIASEC 组合                   | 同上                           | 无死路径                                          |

#### Layer 4: 评分结果 → Profile

| 检查项                             | 文件                      | 验证方法                         |
| ---------------------------------- | ------------------------- | -------------------------------- |
| `generateProfile()` 纯算法 (0 LLM) | `lib/profile-generation/` | 无 model-router import           |
| `algoSnapshot` 正确存储            | `lib/db/profiles.ts`      | 含 RIASEC + archetype + 所有维度 |
| 新维度: IPC Circumplex + TKI       | `lib/profile-generation/` | 计算逻辑存在且正确               |

#### Layer 5: Profile → Report

| 检查项                            | 文件                     | 验证方法                               |
| --------------------------------- | ------------------------ | -------------------------------------- |
| 报告 5 章结构完整                 | `lib/report-generation/` | 锚点→景观→阴影→信→方法论               |
| LLM 调用通过 model-router         | 同上                     | import from `lib/ai/model-router.ts`   |
| algoSnapshot 被复用（非重新计算） | 同上                     | 从 DB 读取，不调用 `generateProfile()` |
| 180s 超时配置                     | 同上                     | timeout 设置存在                       |

#### Layer 6: Report → Coach

| 检查项             | 文件                             | 验证方法                               |
| ------------------ | -------------------------------- | -------------------------------------- |
| 教练注入正确上下文 | `lib/coaching/`                  | 报告 + 档案 + 记忆 (Top 15) + 回合指令 |
| SSE 流式配置       | `app/api/coaching-chat/route.ts` | ReadableStream + TextEncoder           |
| 危机检测（双层）   | `lib/coaching/`                  | 关键词层 + LLM 语义层                  |

### 输出格式

```
🔍 管道审计报告

Layer 1 — 问题定义: ✅ 30+86+8 题完整，无重复 ID
Layer 2 — RIASEC 评分: ✅ 单一权威源，范围正确
Layer 3 — 原型分配: ✅ 12 型覆盖完整
Layer 4 — Profile 生成: ✅ 纯算法，含 IPC+TKI
Layer 5 — 报告生成: ✅ 5 章 + model-router + 180s 超时
Layer 6 — 教练系统: ✅ 上下文注入 + SSE + 危机检测

🟢 管道完整性: 6/6 层通过
```

---

## 模式 3 — 原型审计 (`/biz-audit archetypes`)

### 检查清单

```
读取以下文件并交叉验证：
- lib/content/archetypes-12.ts  → 12 型定义 (id, name, colorHex, description)
- lib/scoring/archetype.ts       → 分配算法
- lib/i18n/dictionaries/en/      → 英文文案
- lib/i18n/dictionaries/zh/      → 中文文案
```

| 检查项                            | 通过条件                                    |
| --------------------------------- | ------------------------------------------- |
| 12 型 ID 一致                     | archetypes-12.ts ↔ 评分 ↔ i18n 三处 ID 相同 |
| 英文名称一致                      | archetypes-12.ts ↔ en/ 字典                 |
| 中文名称一致                      | archetypes-12.ts ↔ zh/ 字典                 |
| colorHex 无重复                   | 12 种颜色各不相同                           |
| Enhancement/Transcendence 各 6 型 | 每个 RIASEC 维度恰好 2 个原型               |
| 叙事文案存在且非空                | 12 型 × en/zh = 24 条叙事                   |

---

## 模式 4 — 报告审计 (`/biz-audit report`)

### 检查清单

| 检查项                   | 文件                                            | 验证方法                                   |
| ------------------------ | ----------------------------------------------- | ------------------------------------------ |
| 5 章 prompt 模板存在     | `lib/report-generation/`                        | 锚点/景观/阴影/信/方法论                   |
| Prompt 包含语言指令      | 同上                                            | `"Respond entirely in {locale}"`           |
| 阴影面叙事完整           | `lib/content/shadow-content.ts`                 | 12 型 × en/zh                              |
| 职业排水沟叙事完整       | `lib/report-generation/career-drain-content.ts` | 内容存在且非空                             |
| LLM 模型配置正确         | `lib/ai/model-router.ts`                        | 叙事 → Claude Sonnet, 结构化 → GPT-4o-mini |
| failover 链存在          | 同上                                            | 主模型失败有备选                           |
| 报告渲染组件匹配数据结构 | `components/report/` ↔ `lib/types/report.ts`    | 字段对齐                                   |

---

## 模式 5 — 职业库审计 (`/biz-audit careers`)

### 检查清单

| 检查项                 | 文件                          | 验证方法                            |
| ---------------------- | ----------------------------- | ----------------------------------- |
| 职业方向总数           | `lib/db/career-directions.ts` | = 1,141 条                          |
| 每条含必填字段         | 同上                          | title, riasecCode, description 非空 |
| RIASEC 编码格式正确    | 同上                          | 3 字母 [RIASEC] 组合                |
| 无重复条目             | 同上                          | 按 title 去重                       |
| 匹配算法引用正确评分源 | 同上                          | 使用 RIASEC 单一权威源              |

---

## 关键规则

1. **只读审计** — 审计过程中不修改任何文件，只报告发现
2. **冻结区域感知** — `lib/scoring/` 和 `lib/content/` 是冻结区域，发现问题只报告不修复
3. **管道思维** — 始终从上游到下游验证，不孤立看某一层
4. **中文输出** — 所有报告使用中文
5. **证据先行** — 每个发现附带文件路径 + 行号 + 实际值 vs 期望值
