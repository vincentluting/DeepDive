I need to fix a bug. Here's the issue: $ARGUMENTS

**Debugging protocol:**

1. **Reproduce**: Understand the exact symptom. If there's an error message, read it carefully.

2. **Locate**: Based on the symptom, narrow down which module is involved:
   - Report generation → `lib/report-generation/`
   - Scoring → `lib/scoring/`
   - AI/LLM → `lib/ai/` + the specific calling code
   - API errors → `app/api/{endpoint}/route.ts`
   - UI rendering → `components/{domain}/`
   - i18n → `lib/i18n/dictionaries/` + component using the key
   - Auth → `lib/auth/` + `middleware.ts`

3. **Diagnose**: Read the relevant file(s). Check:
   - Are there related tests? Run: `npm run test -- --reporter=verbose {test-file}`
   - Type error? Run: `npx tsc --noEmit`
   - Runtime error? Check the stack trace carefully.

4. **Fix**: Make the minimal change needed. Do NOT refactor surrounding code.

5. **Verify**:
   - Run related tests: `npm run test`
   - Run build: `npm run build`
   - If UI bug, confirm at both desktop and 375px mobile width

6. **Report**: Tell me what was the root cause, what files changed and why, whether tests were added/updated.

**Important**: Do NOT modify files listed in "不要碰的模块" in CLAUDE.md unless the bug is specifically in those files and I explicitly approve.
