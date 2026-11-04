#!/bin/bash
# PostToolUse hook: run related test for edited source files
# Lightweight: single test file, 15s timeout, never blocks (exit 0 always)
# Output goes to stderr as informational warning

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Extract file path from tool input JSON
FILE=$(cat | jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] || [ ! -f "$FILE" ] && exit 0

# Make path relative to project root
REL_FILE="${FILE#$CLAUDE_PROJECT_DIR/}"

# Only for TypeScript/TSX source files
echo "$REL_FILE" | grep -qE '\.(ts|tsx)$' || exit 0

# Skip test files (avoid recursion)
echo "$REL_FILE" | grep -qE '\.test\.|\.spec\.|__tests__' && exit 0

# Skip non-source directories
echo "$REL_FILE" | grep -qE '^(lib|app|components|store)/' || exit 0

# Skip i18n dictionaries, config files, types-only files
echo "$REL_FILE" | grep -qE 'dictionaries/|\.config\.|\.d\.ts$' && exit 0

# Find co-located test file
BASENAME=$(basename "$REL_FILE" | sed 's/\.\(ts\|tsx\)$//')
DIR=$(dirname "$REL_FILE")

TEST_FILE=""
for CANDIDATE in \
  "$DIR/__tests__/$BASENAME.test.ts" \
  "$DIR/__tests__/$BASENAME.test.tsx" \
  "$DIR/$BASENAME.test.ts" \
  "$DIR/$BASENAME.test.tsx"; do
  if [ -f "$CANDIDATE" ]; then
    TEST_FILE="$CANDIDATE"
    break
  fi
done

# No related test found → suggest visual verify for frontend files
if [ -z "$TEST_FILE" ]; then
  if echo "$REL_FILE" | grep -qE '^(components|app)/.*\.(tsx)$'; then
    echo "💡 No unit test for $REL_FILE — verify visually: /preview or /qa browser" >&2
  fi
  exit 0
fi

# Run the single test file (15s timeout, dot reporter for minimal output)
OUTPUT=$(timeout 15 npx vitest run "$TEST_FILE" --reporter=dot --bail 1 2>&1)
EXIT_CODE=$?

# Passed or timed out → exit silently
[ $EXIT_CODE -eq 0 ] && exit 0
[ $EXIT_CODE -eq 124 ] && exit 0

# Failed → output warning to stderr (informational only, never blocks)
FAIL_LINE=$(echo "$OUTPUT" | grep -E "FAIL |Tests.*failed" | head -3)
echo "⚠ Related test failed: $TEST_FILE" >&2
[ -n "$FAIL_LINE" ] && echo "$FAIL_LINE" >&2
exit 0
