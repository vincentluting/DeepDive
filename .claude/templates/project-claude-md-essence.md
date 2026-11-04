# Deep Dive — 项目级 CLAUDE.md 精华模板

> 用途: 作为项目内 `CLAUDE.md` 的理想骨架。保留高频、硬约束、工作流主干；把细节转移到 `docs/`、`.claude/commands/`、`.claude/rules/`。
> 更新: 2026-04-04

## 精华原则

### 应该放进 `CLAUDE.md` 的

- 项目一句话概述
- 4-8 条硬约束
- 任务分级与默认流程
- 默认验证命令
- 冻结区与必须确认事项
- 关键入口文档
- “任务结束后要不要更新规则”的闭环

### 不该放进 `CLAUDE.md` 的

- 大段架构说明
- 全量文件树
- 冗长操作日历
- 过细的业务背景
- 低频命令清单
- 任何可以从代码直接看出来的信息

## 可直接复制的模板

```md
# Deep Dive — CLAUDE.md

AI Career Self-Discovery Platform。
Quick Dive → Deep Dive → 个人档案（纯算法）→ 职业报告（2-3 LLM 调用）→ AI 教练。

## Always-on 规则

- 所有 LLM 调用必须走 `lib/ai/model-router.ts`
- API route 使用 `guardRoute()` + `withLogging`
- API 输入使用 `lib/validation/api-schemas.ts`
- 用户可见文本必须走 i18n 字典，`en/` 和 `zh/` 同步
- TypeScript strict mode，不使用 `any`
- 生产代码不要加 `console.log`（必要时用 `if (__DEV__)`）

## 任务分级

| 类型 | 触发条件 | 默认流程 |
| --- | --- | --- |
| S | 单文件或机械改动，验收清晰 | 读文件 → 短计划 → 实现 → 相关验证 |
| M | 2-5 文件、单一领域 | Plan Mode / 轻量影响分析 → 实现 → 定向验证 |
| L | 跨前后端/DB/测试，或 4+ 文件 | 影响分析 → 拆任务 → worktree / subagents → 集成验证 |
| R | 冻结区、auth/security、schema、生产操作 | 先停下，等人确认 |

## 默认验证

- `npx tsc --noEmit`
- `npm run test`
- `npm run lint`
- `npm run lint:i18n`
- 有 UI 改动时补浏览器验证
- 有关键路径改动时补 E2E 或手动旅程验证

## 冻结区域

- `lib/scoring/`
- `lib/content/archetypes-12.ts`
- `lib/db/career-directions.ts`
- `lib/content/shadow-content.ts`
- `lib/report-generation/career-drain-content.ts`
- `lib/ai/model-router.ts`

## 需要先确认的变更

- 冻结区
- API 签名变更
- DB schema / migration
- 认证、安全、支付
- 新增依赖
- 删除代码

## 工作流主干

- 小任务直接做，不要流程化过度
- 复杂任务先 Plan Mode，跑偏就回到规划
- 大任务先拆，再并行，不把所有工作塞进一个上下文
- 让 Claude 自己验证，不接受“理论上没问题”
- 每次真实踩坑后，增量更新 `CLAUDE.md` / command / hook / skill

## 关键入口

- 通用协作规则: `AGENTS.md`
- 代码模板: `CONVENTIONS.md`
- 影响矩阵: `.claude/rules/impact-matrix.md`
- 命令索引: `.claude/commands/_INDEX.md`
- 文档地图: `docs/INDEX.md`
- 个人工作流: `.claude/workflows/personal-developer-workflow.md`

## 任务结束时必须回答

1. 改了什么
2. 怎么验证的
3. 还有什么风险
4. 是否要把本次经验沉淀回系统
```

## 本项目的落地建议

- `CLAUDE.md` 保留规则、分级、冻结区、验证、入口文档
- `impact-matrix`、测试哲学、运维日历、复杂架构说明保持在外部文件
- 高频流程用 commands / hooks 固化，不用在 `CLAUDE.md` 写成长篇 SOP
- 真正的“去糟粕”不是删规则，而是把低频、低杠杆、可由系统自动化的内容移出主上下文
