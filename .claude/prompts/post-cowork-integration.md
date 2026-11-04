# Prompt: 集成 Cowork 交付的自动化基建文件

> Cowork session 于 2026-03-07 交付了 4 个新文件 + 2 个待执行 prompt。
> 此 prompt 负责: 验证 → 集成 → 更新文档 → 初始化。

Read CLAUDE.md first.

## Phase 1: 验证新增文件编译通过

```bash
npx tsc --noEmit
npm run test
```

重点关注:

- `scripts/schema.sql` 是否与 `scripts/migrations/` 最新迁移同步(schema-consistency.test.ts 已于 2026-04-08 废除,因为 schema-init.ts 已删除)
- 如果发现 drift,报告给我

## Phase 2: 更新 CLAUDE.md — 运维日历

在 CLAUDE.md 的「运维日历」表格中，在「每次 commit 前」行的 **上方** 新增一行:

```
| 每次 session 开始 | `/maintenance-check` | 智能调度逾期维护任务 |
```

## Phase 3: 更新 CLAUDE.md — 命令列表

如果 CLAUDE.md 中有命令文件数量的引用（如 "32 个 .md 文件"），更新为实际数量。
运行: `ls .claude/commands/*.md | wc -l` 获取最新数量。

## Phase 4: 更新现有维护命令 — 日志写入协议

以下命令文件需要在末尾追加「日志更新」步骤。对每个文件，在最后一个 Phase 之后追加:

**需要更新的文件列表:**

- `.claude/commands/auto-health.md`
- `.claude/commands/auto-weekly.md`
- `.claude/commands/weekly-api.md`
- `.claude/commands/weekly-schema.md`
- `.claude/commands/weekly-deps.md`
- `.claude/commands/weekly-tracking.md`
- `.claude/commands/biweekly-dataflow.md`
- `.claude/commands/biweekly-dead-code.md`
- `.claude/commands/biweekly-error-handling.md`
- `.claude/commands/monthly-health-report.md`
- `.claude/commands/monthly-security.md`
- `.claude/commands/monthly-db-health.md`
- `.claude/commands/monthly-ux-audit.md`
- `.claude/commands/deep-audit.md`

**追加内容（统一模板）:**

````markdown
## 日志更新（执行完毕后必做）

更新 `.claude/maintenance-log.json` 中对应任务的字段:

\```bash

# 任务 key 见 maintenance-log.json 中的 tasks 对象

# last_run: 当天日期 (YYYY-MM-DD)

# last_status: "pass" / "fail" / "partial"

\```
````

⚠️ 注意: 这步涉及 14 个文件，**可以分 3-4 轮完成**（每轮 3-4 个文件），不需要一次性改完。每轮改完后 `npx tsc --noEmit` 确认无副作用。

## Phase 5: 初始化 maintenance-log

运行 `/maintenance-check`，确认输出格式正常（所有任务应显示为「从未运行」）。
然后运行 `/auto-health`，验证日志更新机制是否生效（`auto-health` 的 `last_run` 应被写入今天日期）。

## Phase 6: Git 提交

```bash
git add .github/workflows/ci.yml
git add .claude/maintenance-log.json
git add .claude/commands/maintenance-check.md
git add .claude/prompts/
# 加上 Phase 4 中修改的命令文件
git commit -m "feat: add CI pipeline, maintenance log, and schema drift test

- .github/workflows/ci.yml: automated tsc + test + lint + i18n + thesis on push/PR
- .claude/maintenance-log.json: persistent task scheduling with overdue detection
- .claude/commands/maintenance-check.md: smart maintenance scheduler command
- (historical) lib/db/__tests__/schema-consistency.test.ts removed 2026-04-08 after schema-init.ts was deleted
- .claude/prompts/: Playwright E2E + PR command prompts for future setup
- Updated 14 maintenance commands with log-write protocol

All checks passed: tsc ✓ vitest ✓ eslint ✓ i18n ✓"
```

## 约束

- Phase 4 每轮不超过 4 个文件
- 不要改命令文件的已有逻辑，只在末尾追加日志更新段落
- 如果 schema consistency test 发现真实 drift，优先修复 drift 而不是改测试
