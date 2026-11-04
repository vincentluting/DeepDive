I just finished a new feature: $ARGUMENTS

Run pre-deployment checks:

## Build & Test
1. `npm run build` — must pass with zero errors
2. `npm run lint` — no new warnings
3. `npm run test` — all tests pass

## New Files Check
4. File naming follows kebab-case?
5. File header comments present on non-trivial files?
6. TypeScript types defined (no `any`)?

## New API Endpoints (if any)
7. Follows standard `guardRoute` + `parseBody` pattern?
8. Has corresponding Zod schema?
9. Has error handling (try-catch with logApiError)?

## New Components (if any)
10. Renders correctly at 375px width?
11. All user-visible text in i18n dictionaries?
12. Has loading/error state handling?

## New DB Operations (if any)
13. Table/column names match `scripts/schema.sql`?
14. INSERT operations include all NOT NULL columns?

## New Tracking Events (if any)
15. FunnelEvent type added?
16. Triggered at the correct user behavior node?

If all pass: output `✅ Ready to deploy`
If issues found: list them and attempt to fix.
