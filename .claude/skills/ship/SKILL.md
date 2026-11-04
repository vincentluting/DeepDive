---
name: ship
description: "Commit changes, create branch, push, and create PR. Use after completing any development task."
disable-model-invocation: true
argument-hint: "[commit message]"
allowed-tools: Bash
---

# Ship Your Changes

用户说 `/ship` = 意图明确，一口气执行完，只在出错时停下。

## 执行流程

### Step 1: 检查状态 + 智能分组
```bash
git status
git diff --stat
```
- 分析所有改动文件，判断哪些属于**当前任务**（根据本次会话中讨论/修改的内容）
- 如果存在**无关改动**（不属于本次任务的文件）：只提交当前任务相关文件，简要告知用户哪些文件被跳过
- 如果所有改动都相关：全部提交

### Step 2: 运行验证
```bash
npx tsc --noEmit && npm run test && npm run lint
```
- 三项全过才继续
- 如果有错误，先修复再继续
- 如果只是 warnings（如 unused-vars），可以继续
- 如果是已知的 pre-existing 测试失败（改动前就存在），可以继续

### Step 3: 创建分支（如果还在 main 上）
```bash
git branch --show-current
```
- 在 `main` 或 `master` 上：创建新分支，格式 `feat/xxx` 或 `fix/xxx`
- 已在 feature 分支上：跳过

### Step 4: Commit
```bash
git add <具体文件>
git commit -m "<commit message>"
```
- 如果用户提供了 $ARGUMENTS，用它作为 commit message
- 如果没有，根据改动内容自动生成
- commit message 用英文，格式: `type: description`
  - type: feat / fix / style / refactor / docs / chore
- 只 `git add` 当前任务相关的具体文件，不用 `git add .`

### Step 5: Push
```bash
git push -u origin <branch-name>
```

### Step 6: PR — 智能判断
先检测当前分支是否已有 PR：
```bash
gh pr view --json url,state 2>/dev/null
```

**已有 PR** → 只 push（Step 5 已完成），输出已有 PR 的 URL，结束。

**没有 PR** → 创建：
1. `git log main..HEAD --oneline` 查看分支所有 commits
2. 生成 PR：
```bash
gh pr create --title "<PR标题>" --body "<PR描述>"
```
- PR 标题：1 个 commit 用 commit message；多个 commits 总结为一句话，< 70 字符
- PR 描述格式：
  - `## Summary` — 要点列表
  - `## Test plan` — 验证清单
  - 末尾加 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
3. 输出 PR URL

## 注意事项
- **不要逐步确认** — `/ship` 意图明确，一口气跑完所有步骤
- 只在出错（验证失败、push 冲突等）时停下来报告
- 不要修改任何代码文件，只做 git 操作
- 如果跳过了无关文件，最后提醒用户还有未提交的改动
