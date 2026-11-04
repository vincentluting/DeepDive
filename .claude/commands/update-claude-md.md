---
disable-model-invocation: true
---

Perform an incremental update of CLAUDE.md based on recent changes. Do NOT rewrite the entire file — only update sections that are stale or missing.

## Step 1: Detect Changes (read-only scan)

### 1.1 Git History
- `git log --oneline -20` — identify recent commits
- `git diff HEAD~20 --name-only --diff-filter=A` — find newly ADDED files
- `git diff HEAD~20 --name-only --diff-filter=D` — find DELETED files
- `git diff HEAD~20 --name-only --diff-filter=M` — find MODIFIED files

### 1.2 Structural Changes
Compare CLAUDE.md against reality:
- Any NEW API routes in `app/api/` not listed in CLAUDE.md?
- Any NEW pages in `app/[locale]/` not listed?
- Any NEW component directories in `components/` not listed?
- Any NEW lib modules in `lib/` not listed?
- Any files listed in CLAUDE.md that no longer exist (renamed/deleted)?
- Any NEW or REMOVED npm scripts in package.json?

### 1.3 Architecture Changes
Quick-check for significant changes:
- Has `lib/ai/model-router.ts` changed? If so, update task→model mapping
- Has `package.json` changed? If so, check for version bumps or new/removed deps
- Have any frozen-zone files been modified? Flag this
- Any new `.env` variables used in code but not listed in CLAUDE.md?
- Any new Zustand stores or custom hooks?

### 1.4 Build Health
- `npm run build 2>&1 | tail -10`
- Count test files: `find lib -name "*.test.ts" | wc -l`

## Step 2: Apply Updates to CLAUDE.md

Based on findings, update ONLY the relevant sections:

1. **技术栈**: Update any version numbers that changed
2. **开发命令**: Add/remove any npm scripts
3. **项目结构**: Add new directories/routes, remove deleted ones
4. **核心架构概念**: Update any section where the underlying code changed
5. **环境变量**: Add new vars, remove unused ones
6. **冻结区域**: Flag if any frozen module was modified
7. **当前开发状态**: Update the date and refresh:
   - 构建 & 测试健康度 (from build/test results)
   - 最近开发焦点 (from git log)
   - 架构决策日志 (add entries for any significant changes)

## Step 3: Report

After updating, tell me:
1. **Sections updated**: Which parts of CLAUDE.md were changed and why
2. **New additions**: Any new routes/components/modules added to the docs
3. **Stale entries removed**: Any outdated references cleaned up
4. **Warnings**: Anything concerning (frozen zone modifications, build failures, missing env vars)
5. **No changes needed**: If CLAUDE.md is already accurate, say so

## Constraints
- ONLY modify CLAUDE.md
- Do NOT rewrite sections that are still accurate
- Preserve the existing document structure and formatting style
- If unsure whether something changed, check the actual file rather than guessing
- Keep the tone and style consistent with the existing document
