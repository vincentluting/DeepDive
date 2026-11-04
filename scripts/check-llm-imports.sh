#!/usr/bin/env bash
# ============================================================
# Check that no code outside lib/ai/ directly imports LLM clients.
# All LLM calls must go through lib/ai/model-router.ts.
# ============================================================

set -euo pipefail

VIOLATIONS=$(grep -rn \
  -e "from.*['\"].*openai-client['\"]" \
  -e "from.*['\"].*anthropic-client['\"]" \
  --include='*.ts' --include='*.tsx' \
  lib/ app/ \
  | grep -v 'lib.*ai/model-router' \
  | grep -v 'lib.*ai/openai-client' \
  | grep -v 'lib.*ai/anthropic-client' \
  | grep -v 'lib.*ai/stream-openai' \
  | grep -v 'node_modules' \
  | grep -v '__tests__' \
  || true)

if [ -n "$VIOLATIONS" ]; then
  echo "ERROR: Direct LLM client imports found outside lib/ai/"
  echo "All LLM calls must go through lib/ai/model-router.ts"
  echo ""
  echo "Violations:"
  echo "$VIOLATIONS"
  exit 1
fi

echo "OK: No direct LLM client imports found outside lib/ai/"
