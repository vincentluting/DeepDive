---
disable-model-invocation: true
---

Perform a comprehensive dead code scan across the codebase.

## Unused Exported Functions
1. Scan `lib/` for all `export function` and `export async function`.
2. For each, search the entire project for import references.
3. List functions that are "defined but never imported by any file".
   — Exclude `lib/db/index.ts` re-exports (may be used indirectly)
   — Exclude references only in `__tests__/` directories

## Unused Type Definitions
4. Scan `lib/types/` for all `export type` and `export interface`.
5. Check which are never referenced outside their own file.

## Unused Components
6. Scan `components/` for all exported components.
7. Check which component files are never imported by any page or other component.

## File-Level Dead Code
8. Check if any entire `.ts`/`.tsx` file is never imported by any other file.

## Output (sorted by confidence)
```
🔴 Confirmed dead (zero references): [file:export]
🟠 Possibly dead (only referenced in tests): [file:export]
🟡 Low usage (referenced by only 1 file, may be legacy): [file:export]

Summary: X functions / X files safe to delete, ~X lines recoverable
```

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: biweekly-dead-code
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
