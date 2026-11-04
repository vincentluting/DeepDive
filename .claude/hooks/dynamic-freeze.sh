#!/bin/bash
# Dynamic freeze — blocks edits outside the allowed directory
# Works alongside guard-frozen.sh (static frozen zones)
# State file: .claude/state/freeze-dir.txt
# Exit code 2 = block with reason, 0 = allow

STATE_DIR="$CLAUDE_PROJECT_DIR/.claude/state"
FREEZE_FILE="$STATE_DIR/freeze-dir.txt"

# No freeze active — allow all
if [ ! -f "$FREEZE_FILE" ]; then
  exit 0
fi

ALLOWED_DIR=$(cat "$FREEZE_FILE" 2>/dev/null)

# Empty or invalid freeze file — allow all
if [ -z "$ALLOWED_DIR" ]; then
  exit 0
fi

# Extract file path from tool input
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Resolve to absolute path for comparison
if [[ "$FILE_PATH" != /* ]]; then
  FILE_PATH="$CLAUDE_PROJECT_DIR/$FILE_PATH"
fi

# Check if file is within the allowed directory
if [[ "$FILE_PATH" == "$ALLOWED_DIR"* ]]; then
  exit 0
fi

echo "BLOCKED: 动态冻结生效中。只允许编辑 $ALLOWED_DIR 内的文件。当前目标: $FILE_PATH。用 /unfreeze 解除限制。" >&2
exit 2
