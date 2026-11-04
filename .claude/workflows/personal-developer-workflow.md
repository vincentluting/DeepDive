# Deep Dive — Claude Code 个人开发工作流

> 目标: 吸收 Boris Cherny 工作流的高杠杆部分，并与本项目现有 commands / hooks / skills / frozen zones 融合。
> 更新: 2026-04-04

## 核心原则

1. 并行优先，不串行等待。
2. 验证优先，不凭感觉收尾。
3. 沉淀优先，不重复口头纠错。
4. 复杂任务先规划，任务跑偏就回到规划。
5. `CLAUDE.md` 只保留 always-on 规则，细节放到 `docs/`、`.claude/commands/`、`.claude/rules/`。

## 先保留，再删减

### 保留的主干

- 冻结区域硬保护: `.claude/hooks/guard-frozen.sh`
- 变更联动检查: `.claude/rules/impact-matrix.md`
- `model-router.ts` / i18n / Zod / `guardRoute()` 等硬约束
- `tsc + test + lint + lint:i18n` 的验证闭环
- 现有 commands / skills / hooks 体系

### 要降级的旧习惯

- 不是所有任务都要先等用户二次确认才能开始
- 不是所有任务都要跑完整 Phase 0 大报告
- 不是所有改动都必须死守“最多 3 文件”
- 不把 `CLAUDE.md` 当百科全书

## 任务分级

| 类型           | 触发条件                                                         | 默认流程                                                   | 推荐工具                                 |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| **S** 小改动   | 单文件或机械同步，验收清晰，非冻结区，非 API/DB 合约变更         | 读文件 → 3-5 条短计划 → 实现 → 跑相关验证                  | 直接做，必要时 `/review-changes`         |
| **M** 常规改动 | 2-5 文件，单一领域，仍可在一个上下文内完成                       | `Plan Mode` 或 `/impact-analysis` → 实现 → 定向测试 → 收尾 | `/impact-analysis`                       |
| **L** 跨域改动 | 前端 + API + DB + 测试，或 4+ 文件，或需求有明显拆分空间         | 影响分析 → 拆任务 → worktree / subagents 并行 → 集成验证   | `/impact-analysis` + `/parallel-feature` |
| **R** 高风险   | 冻结区、auth/security、支付、schema、`model-router.ts`、生产操作 | 停止编码，先和人对齐边界与验收标准                         | `/approver` 或人工决策                   |

## 会话拓扑

### 1. 主会话

- 负责目标澄清、方案选择、整合结果
- 只保留高层上下文，不堆日志和大段代码

### 2. 实现会话

- 负责具体改动
- 一个会话只做一个明确子任务，避免上下文污染

### 3. 验证会话

- 专门跑 `tsc`、测试、lint、E2E、浏览器检查
- 大改动时不要让实现会话顺便验证所有东西

### 4. 分析会话

- 只读日志、查数据、看 traces、查文档
- 适合配合 BigQuery / Sentry / browser / DB CLI

## 与现有体系的结合方式

### 复杂功能

1. 先用 `/impact-analysis`，只做读文件和拆任务
2. 如果跨前后端或 4+ 文件，用 `/parallel-feature`
3. 主会话只整合，不把所有实现挤在一个上下文里

### API / 数据流

- 改 API 前先查 `CONVENTIONS.md`
- 改数据流时先跑 `/trace-data-path`
- 改 schema 时同步 `scripts/schema.sql`、迁移、对应 `lib/db/`

### 前端 / i18n

- 改 UI 前先读 `.claude/skills/deepdive-design/SKILL.md`
- 文案和组件变更同时同步 `en/` 与 `zh/`
- 有交互改动时补浏览器验证，不只看代码

### 收尾

- 用 `/review-changes` 做一次 reviewer 视角复盘
- 有新坑或新规则时，用 `/update-claude-md` 或手动增量更新 `CLAUDE.md`

## 推荐工作法

### S 类任务

```text
目标: [一句话]
约束: 不碰冻结区 / 不改 API 签名 / i18n 双语同步
验收: [可验证结果]

先读相关文件，给我 3-5 条短计划，然后直接实现并跑相关验证。
结束时只汇报: 改了什么、怎么验证的、是否需要更新 CLAUDE.md。
```

### M 类任务

```text
进入 Plan Mode。先做轻量影响分析:
- 受影响文件
- 冻结区检查
- 验证方案
- 是否需要拆任务

计划清楚后再实现。实现完成后跑相关测试，并汇报残余风险。
```

### L 类任务

```text
先用 /impact-analysis 拆成 2-4 个子任务。
如果前后端/测试可以解耦，就使用 worktrees 或 subagents 并行。

主会话负责:
- 确认任务边界
- 指定每个子任务的文件范围
- 最后做集成验证
```

### 验证 prompt

```text
不要只说“应该没问题”。请实际验证：
- 运行相关命令
- 说明通过/失败结果
- 如果没法验证，明确缺口
- 用 reviewer 视角指出潜在回归
```

## Worktree 使用准则

### 什么时候开 worktree

- 一个功能能自然拆成 UI / API / Tests
- 主分支工作区已经很脏，不想互相污染
- 你需要让一个 Claude 专心实现，另一个专心验证

### 什么时候不要开

- 单文件修复
- 明显只需 10-20 分钟的机械改动
- 还没弄清需求就先并行

### 建议命名

- `wt/<feature>-ui`
- `wt/<feature>-api`
- `wt/<feature>-verify`
- `wt/<feature>-analysis`

## 默认验证闭环

### 所有生产代码改动

- `npx tsc --noEmit`
- `npm run test`
- `npm run lint`
- `npm run lint:i18n`

### 定向补充

- API / DB 变更: 补集成测试
- 关键用户路径改动: 补 `npm run test:e2e` 或手动旅程验证
- UI / 动画 / 文案改动: 补浏览器检查和 375px 响应式检查
- LLM 管道改动: `npm run smoke:report` 验证全链路报告生成
- LLM 相关改动: 对照 `docs/architecture/llm-call-inventory.md`

## 验证工具选择指南

| 你要验证什么    | 用什么                              | 不要用什么                  |
| --------------- | ----------------------------------- | --------------------------- |
| LLM 管道端到端  | `npm run smoke:report`              | ❌ Playwright MCP           |
| 回归保护        | `npm run test` + `npm run test:e2e` | ❌ 手动                     |
| UI 视觉快速检查 | Playwright MCP（≤5 步交互）         | ❌ Playwright MCP 做 20+ 步 |
| 报告内容质量    | Neon SQL 直查                       | ❌ 浏览器翻页检查           |
| API 契约        | 集成测试                            | ❌ curl 手动拼              |

### Playwright MCP 使用规则

- ✅ 改了 UI 后截图验证（1-3 次截图）
- ✅ 检查页面是否能加载、元素是否存在
- ❌ 不要用它做 LLM 调用等待（>10 秒的 fetch）
- ❌ 不要在一个 session 里做 10+ 次交互
- ❌ 不要跨 dev server 重启使用同一个 browser context
- 如果需要重启 dev server，先用 Neon SQL 做数据验证，不靠浏览器

## CLAUDE.md 维护规则

- 只写 Claude 无法从代码里自然推断出的规则
- 新规则必须来自真实错误，不靠想象
- 同类规则超过 3 条，就考虑改成 command / hook / skill
- 长段解释移出 `CLAUDE.md`，只保留入口链接

## 一句话总结

对这个项目最有效的 Claude Code 用法不是“更复杂的提示词”，而是:

- 小任务直接做
- 中任务先规划
- 大任务先拆开并行
- 所有任务都要验证
- 每次踩坑都沉淀回系统
