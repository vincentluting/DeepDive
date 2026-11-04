---
disable-model-invocation: true
---

# Deep Fix — 根据审计报告逐项修复

> 放置路径: `.claude/commands/deep-fix.md`  
> 使用方式: 在 Claude Code 中输入 `/deep-fix`，然后粘贴需要修复的 bug 条目
> 推荐模型: Sonnet（简单 bug）或 Opus（复杂逻辑 bug）

Read CLAUDE.md and CONVENTIONS.md first. Then fix the bugs I list below.

## Rules

1. Fix bugs ONE BY ONE in the priority order I provide (CRITICAL → HIGH → MEDIUM → LOW).
2. Before changing any file, tell me which files you'll modify and what the change will be. Then proceed.
3. After EACH fix, run `npm run build` to verify no new errors were introduced.
4. For CSS/layout fixes, consider both 375px (mobile) and 1440px+ (desktop) viewports.
5. Follow all conventions in CONVENTIONS.md — file headers, naming, error handling patterns.
6. Add i18n entries (both `en.json` and `zh.json`) for any new user-facing strings.
7. Do NOT change any files or functionality I haven't asked you to fix.
8. Do NOT refactor surrounding code "while you're at it" — minimal targeted changes only.
9. If a fix turns out to be more complex than expected, STOP and explain the complexity before proceeding.

## After ALL fixes are complete

Run these checks and report results:
1. `npm run build` — must pass with zero errors
2. `npm run lint` — report any new warnings
3. List every file you modified with a one-line summary of what changed

## Bugs to fix:

$ARGUMENTS
