#!/bin/bash
# Guard frozen zones — blocks edits to protected files
# Exit code 2 = block with reason, 0 = allow

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# If no file_path (e.g. Write tool uses different key), try other fields
if [ -z "$FILE_PATH" ]; then
  FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
fi

# No file path found — allow
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Frozen zones — must discuss with user before editing
FROZEN_PATTERNS=(
  "lib/scoring/"
  "lib/content/archetypes-12.ts"
  "lib/content/career-directions-db.ts"
  "lib/content/shadow-content.ts"
  "lib/report-generation/career-drain-content.ts"
  "lib/ai/model-router.ts"
)

for pattern in "${FROZEN_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: $FILE_PATH is in a frozen zone ($pattern). You must discuss with the user before editing this file." >&2
    exit 2
  fi
done

exit 0
