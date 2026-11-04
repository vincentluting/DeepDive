#!/bin/bash
# Wrapper for `playwright test --update-snapshots`.
#
# guard-e2e.sh BLOCKS the --update-snapshots flag in any other context
# (including ALLOW_SNAPSHOT_UPDATE=1 inline) because string-level whitelist
# detection is unreliable. The only sanctioned path to update visual
# regression baselines is through this wrapper, with ALLOW_SNAPSHOT_UPDATE=1
# set in the wrapper's environment (verified inside the script, not in hook).
#
# Usage:
#   ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh [project ...]
#
# Examples:
#   ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh mobile-visual-regression
#   ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh   # all projects

set -o pipefail

if [ "${ALLOW_SNAPSHOT_UPDATE:-}" != "1" ]; then
  cat >&2 <<'EOF'
❌ snapshot-update.sh requires ALLOW_SNAPSHOT_UPDATE=1.

This is deliberate friction. Visual regression baselines encode design
intent — auto-updating them silently hides real UI regressions (the
2026-05-03 mobile-visual-regression run had a 0.99 ratio diff on landing-zh
that would have been masked by a casual `--update-snapshots` invocation).

Before running:
  1. Open test-results/*/*-diff.png and confirm each diff is intentional
  2. Re-run with explicit opt-in:
     ALLOW_SNAPSHOT_UPDATE=1 bash scripts/snapshot-update.sh [project]
EOF
  exit 64
fi

PROJECTS=()
for proj in "$@"; do
  PROJECTS+=("--project=$proj")
done

echo "▶  npx playwright test --update-snapshots ${PROJECTS[*]}"
exec npx playwright test --update-snapshots "${PROJECTS[@]}"
