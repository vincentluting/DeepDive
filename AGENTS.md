# Deep Dive — AGENTS.md

> 跨 AI 工具通用指令。Claude Code / Cursor / GitHub Copilot / Gemini CLI 均可读取。
> Claude Code 特有规则见 `CLAUDE.md`。

## 项目概述

AI Career Self-Discovery Platform — 跨文化职业身份深潜探索。
Quick Dive / Immersive Dive → Deep Dive v3.0 → 个人档案 (纯算法) → 职业报告 (2-3 LLM 调用) → AI 教练。

## 技术栈

Next.js 16 (App Router) · TypeScript strict · React 19 · Tailwind CSS v4 (`globals.css`, 无 tailwind.config) · Radix/shadcn · Framer Motion 12 · Neon Postgres · Zustand v5 · Zod v4 (`from 'zod/v4'`) · Vitest · ESLint 10

## 命令

```bash
npm run dev              # Turbopack dev server
npm run build            # production build
npm run test             # Vitest (单次)
npm run lint             # ESLint
npm run lint:i18n        # i18n key 检查 + 硬编码检查
npm run ai:map           # 刷新 AI 代码地图 inventory
npm run db:migrate       # 执行待运行迁移
npm run test:e2e         # Playwright E2E (需要 dev server)
```

验证完成: `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`

## 代码风格

- LLM 调用必须通过 `lib/ai/model-router.ts`，不要直接导入 provider client
- API route 使用 `guardRoute(request, { tier })` + `withLogging` 模式
- API 输入使用 `lib/validation/api-schemas.ts` 的 Zod schema 验证
- 所有用户可见文本走 i18n 字典 (`lib/i18n/dictionaries/`)，en/zh 必须同步
- 不在生产代码中加 `console.log`（用 `if (__DEV__)` 保护）
- TypeScript strict mode，不使用 `any`

## 项目结构

```
app/                    # Next.js App Router 页面
  [locale]/(app)/       # 国际化路由 (en/zh)
  api/                  # API routes
lib/                    # 核心业务逻辑
  scoring/              # 评分管道 v3.0 (⛔ 冻结)
  report-generation/    # 报告生成 (⛔ 冻结部分文件)
  coaching/             # AI 教练系统
  ai/                   # LLM 路由 (model-router.ts)
  db/                   # 数据库操作
  i18n/                 # 国际化字典
  types/                # TypeScript 类型定义
  cohort/               # 邀请码 + 功能门控
  journey/              # 用户旅程状态机
components/             # React 组件
store/                  # Zustand 状态管理
scripts/                # DB schema + 迁移 (schema.sql 是唯一来源)
docs/                   # 架构/设计/产品/运维文档
```

进入子目录前优先阅读最近的局部 `AGENTS.md`: `app/AGENTS.md`、`components/AGENTS.md`、`lib/AGENTS.md`、`scripts/AGENTS.md`。

## 冻结区域

以下文件/目录修改前必须与项目负责人讨论：

- `lib/scoring/` — 评分管道 v3.0
- `lib/content/archetypes-12.ts` — 12 型原创文案
- `lib/db/career-directions.ts` — 职业方向 DB CRUD
- `lib/content/shadow-content.ts` — 阴影面叙事
- `lib/report-generation/career-drain-content.ts` — 精选叙事
- `lib/ai/model-router.ts` — task→provider 路由

## 测试

- 框架: Vitest
- 运行: `npm run test`
- E2E: Playwright (`npm run test:e2e`)
- 类型检查: `npx tsc --noEmit`

## Git 工作流

- 主分支: `main`
- commit 前跑: `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`
- 不推送到 remote 除非明确要求

## 关键文档

| 需要什么             | 去哪里找                                  |
| -------------------- | ----------------------------------------- |
| 代码模板             | `CONVENTIONS.md`                          |
| Claude Code 特有规则 | `CLAUDE.md`                               |
| 文档全景地图         | `docs/INDEX.md`                           |
| 代码库导航地图       | `docs/architecture/codebase-map.md`       |
| 代码 inventory       | `docs/architecture/ai-code-inventory.generated.md` |
| 数据库表结构         | `docs/database/DATA-DICTIONARY.md`        |
| 数据流全图           | `docs/database/DATA-FLOW.md`              |
| LLM 调用清单         | `docs/architecture/llm-call-inventory.md` |
| UI/UX 设计规范       | `.claude/skills/deepdive-design/SKILL.md` |
| i18n 风格            | `docs/design/i18n-style-guide.md`         |
