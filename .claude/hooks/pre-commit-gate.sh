#!/bin/bash
# Pre-commit quality gate — blocks git commit if lint/i18n fails
# Exit code 2 = block with reason, 0 = allow
# Only activates on git commit commands

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Only gate git commit commands
if ! echo "$COMMAND" | grep -qE '^git commit'; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Run ESLint
LINT_OUTPUT=$(npx eslint . --max-warnings 10 2>&1)
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ]; then
  echo "BLOCKED: ESLint failed. Fix lint errors before committing." >&2
  echo "$LINT_OUTPUT" | tail -20 >&2
  exit 2
fi

# Run i18n check
I18N_OUTPUT=$(npm run lint:i18n 2>&1)
I18N_EXIT=$?

if [ $I18N_EXIT -ne 0 ]; then
  echo "BLOCKED: i18n check failed. Ensure en/zh dictionaries are in sync." >&2
  echo "$I18N_OUTPUT" | tail -10 >&2
  exit 2
fi

exit 0
