#!/bin/bash
# PreCompact hook: inject dynamic context (git diff + working state) into compact summary
# This ensures compact doesn't lose track of current work in progress

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Get list of uncommitted changed files
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null | head -10)
STAGED_FILES=$(git diff --name-only --cached 2>/dev/null | head -10)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | head -5)

# Build dynamic context
CONTEXT="压缩后务必保留: (1) LLM调用走 model-router.ts (2) 冻结区域不能碰 (3) i18n 必须 en/zh 双语同步 (4) 按 S/M/L/R 分级处理任务，不要一刀切 Phase 0 (5) 验证闭环: tsc + test + lint + lint:i18n (6) 当前正在做的任务和进度 (7) 已修改但未提交的文件列表"

if [ -n "$CHANGED_FILES" ] || [ -n "$STAGED_FILES" ] || [ -n "$UNTRACKED" ]; then
  CONTEXT="$CONTEXT\n\n--- 未提交变更 ---"
  [ -n "$STAGED_FILES" ] && CONTEXT="$CONTEXT\nStaged: $STAGED_FILES"
  [ -n "$CHANGED_FILES" ] && CONTEXT="$CONTEXT\nModified: $CHANGED_FILES"
  [ -n "$UNTRACKED" ] && CONTEXT="$CONTEXT\nUntracked: $UNTRACKED"
fi

# Output in hook format
echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PreCompact\",\"additionalContext\":\"$CONTEXT\"}}"
