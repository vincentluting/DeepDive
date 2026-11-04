#!/bin/bash
# Stop hook: auto-verify TypeScript + affected tests when Claude stops
# Phase 1: tsc --noEmit → Phase 2: vitest --changed
# If either fails → block stop so Claude self-corrects
# If both pass or timeout → allow stop

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Only verify if .ts/.tsx files were actually modified (unstaged = just edited by Claude)
CHANGED=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | head -1)
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$' | head -1)

[ -z "$CHANGED" ] && [ -z "$UNTRACKED" ] && exit 0

# --- Phase 1: TypeScript compilation (30s) ---
TSC_OUTPUT=$(timeout 30 npx tsc --noEmit 2>&1)
TSC_EXIT=$?

# Timed out → skip tsc, still try tests
if [ $TSC_EXIT -ne 124 ] && [ $TSC_EXIT -ne 0 ]; then
  ERRORS=$(echo "$TSC_OUTPUT" | grep "error TS" | head -15)
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS")

  if [ "$ERROR_COUNT" -gt 0 ]; then
    REASON="TypeScript compilation failed ($ERROR_COUNT errors). Fix before finishing:\n$ERRORS"
    ESCAPED=$(echo -e "$REASON" | jq -Rs .)
    echo "{\"decision\":\"block\",\"reason\":$ESCAPED}"
    exit 0
  fi
fi

# --- Phase 2: Affected unit tests (45s) ---
# Check if any non-test source files changed
CHANGED_SRC=$(git diff --name-only 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -vE '\.test\.|\.spec\.|__tests__|\.config\.' || true)
UNTRACKED_SRC=$(git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(ts|tsx)$' | grep -vE '\.test\.|\.spec\.|__tests__|\.config\.' || true)

[ -z "$CHANGED_SRC" ] && [ -z "$UNTRACKED_SRC" ] && exit 0

TEST_OUTPUT=$(timeout 45 npx vitest run --changed --reporter=verbose --bail 3 2>&1)
TEST_EXIT=$?

# Passed or timed out → allow stop
[ $TEST_EXIT -eq 0 ] && exit 0
[ $TEST_EXIT -eq 124 ] && exit 0

# Check for actual test failures (vitest can exit non-zero for "no tests found" too)
if echo "$TEST_OUTPUT" | grep -qE "Tests\s+[0-9]+\s+failed|FAIL\s"; then
  FAILURES=$(echo "$TEST_OUTPUT" | grep -E "FAIL |❌|✗|AssertionError|Expected|Received" | head -10)
  FAIL_SUMMARY=$(echo "$TEST_OUTPUT" | grep -E "Tests\s+" | tail -1)

  REASON="Affected tests failed. Fix before finishing:\n$FAIL_SUMMARY\n$FAILURES\n\nRun: npm run test"
  ESCAPED=$(echo -e "$REASON" | jq -Rs .)
  echo "{\"decision\":\"block\",\"reason\":$ESCAPED}"
  exit 0
fi

# No clear failures → allow stop
exit 0
