#!/bin/bash
# Wrapper that runs an npm test:e2e:* script with pipefail enabled and
# tees output to a log file. Use this instead of constructing your own
# `npm run test:e2e:* | tee` pipeline — guard-e2e.sh blocks the latter
# because pipefail enablement cannot be reliably detected in free-form shell.
#
# Usage:
#   scripts/e2e-tee.sh <suite> [log_path]
#
# Examples:
#   scripts/e2e-tee.sh full
#   scripts/e2e-tee.sh full /tmp/my-run.log
#   scripts/e2e-tee.sh core
#   scripts/e2e-tee.sh llm:prod
#
# Exit code: real exit code of the npm run command (preserved by pipefail).

set -o pipefail

SUITE="${1:?usage: $0 <suite> [log_path]   (suite = full|core|llm|llm:prod)}"
LOG="${2:-/tmp/e2e-${SUITE//\//-}-$(date +%s).log}"

case "$SUITE" in
  full|llm|llm:prod) SCRIPT="test:e2e:${SUITE}" ;;
  core)              SCRIPT="test:e2e" ;;  # default suite is "core"
  *)
    echo "❌ Unknown suite: $SUITE" >&2
    echo "   Valid: full | core | llm | llm:prod" >&2
    exit 64
    ;;
esac

mkdir -p "$(dirname "$LOG")" || {
  echo "❌ Cannot create log directory: $(dirname "$LOG")" >&2
  exit 73  # EX_CANTCREAT
}
echo "▶  npm run $SCRIPT  →  $LOG"
echo ""

npm run "$SCRIPT" 2>&1 | tee "$LOG"
NPM_EXIT=${PIPESTATUS[0]}
TEE_EXIT=${PIPESTATUS[1]}

# Append exit code marker — but if appending fails (disk full, permission
# revoked mid-run, etc), warn and don't pretend the log is complete.
APPEND_OK=1
{
  printf '\n'
  printf 'EXIT_CODE=%s\n' "$NPM_EXIT"
} >> "$LOG" 2>/dev/null || APPEND_OK=0

echo ""
if [ "$TEE_EXIT" -ne 0 ] || [ "$APPEND_OK" -eq 0 ]; then
  # Log integrity is suspect — say so explicitly rather than print ✅
  echo "⚠️  Log may be incomplete: $LOG" >&2
  echo "    npm exit: $NPM_EXIT  tee exit: $TEE_EXIT  append: $APPEND_OK" >&2
else
  echo "✅ Saved to $LOG  (exit $NPM_EXIT)"
fi

# Always propagate npm's real exit (preserved from PIPESTATUS[0]).
# Pipefail at the top of this script means a tee failure would have already
# made the pipeline fail, but PIPESTATUS[0] specifically gives us npm's code.
exit "$NPM_EXIT"
