---
disable-model-invocation: true
---

Audit data-to-UI wiring integrity — catch "computed but never displayed" bugs.

## 1. Engine → UI Field Coverage

For each data engine/hook that produces structured output, verify every returned field has a UI consumer:

### Quick Dive chain
1. Read `components/quickdive/use-explore-engine.ts` — list all fields in `computeResult()` return value.
2. Read `components/quickdive/quickdive-data.ts` — list all fields in `QuickDiveResultData`.
3. Read `components/quickdive/unified-explore-result.tsx` — list which fields from `result` are destructured and used.
4. Read `components/quickdive/claim-profile-wall.tsx` — list which fields from `careers` prop are rendered.
5. **Flag**: any field returned by the engine but never destructured/rendered in UI. Acceptable only if annotated with `// intentionally unused: <reason>`.

### Profile chain
6. Read `lib/profile-generation/profile-algorithm.ts` — list all fields in `ProfileAlgorithmOutput`.
7. Search `components/profile-panels/` for consumption of each field.
8. **Flag**: fields computed but never rendered.

### Report chain
9. Read `lib/report-generation/` entry point — list all sections in `CareerReport`.
10. Search `components/report/` for consumption of each section.
11. **Flag**: report sections generated but never rendered.

## 2. Conditional Gate Audit

Search for UI content hidden behind boolean gates that may be incorrect:

```
Patterns to search:
- isReportView &&
- isReportView ?
- isLoggedIn &&
- !isReportView &&
- showPreview &&
```

12. For each gate found, list:
    - File + line number
    - What content is hidden
    - Whether the gate has a clear product reason
13. **Flag**: gates that hide substantive user-facing content without an obvious reason (e.g., hiding computed insights behind an unrelated flag).

## 3. i18n Ghost Reference Check

14. Search all `.tsx` files for patterns: `t.someKey`, `t[someKey]`, `t["someKey"]`.
15. For each referenced key, verify it exists in both `lib/i18n/dictionaries/en/` and `lib/i18n/dictionaries/zh/` JSON files.
16. **Flag**: keys referenced in code but missing from one or both dictionaries.
17. Note: `npm run lint:i18n` covers static keys — this check targets dynamic/interpolated references that lint may miss.

## 4. Prop Passthrough Integrity

18. For key data-flow components, verify that parent components pass all available data to children:
    - `UnifiedExploreResult` → `ClaimProfileWall`: check `careers` prop completeness
    - `UnifiedExploreResult` → `ArchetypeIdentityCard`: check all identity fields passed
    - `ReportClient` → report section components: check all report data passed
19. **Flag**: parent has data available but doesn't pass it to child that accepts it.

## Output

```
🔌 Wiring Audit Results
━━━━━━━━━━━━━━━━━━━━━━
📊 Engine→UI: X fields covered / Y total (Z gaps)
🚪 Conditional gates: X found, Y flagged
🌐 i18n ghosts: X missing keys
🔗 Prop passthrough: X complete / Y checked

🚨 Gaps found:
  - [file:line] field `xyz` computed but never rendered
  - [file:line] gate `isReportView` hides [content] without clear reason
  - [file:line] `t.someKey` referenced but missing from zh dictionary

✅ All clear / ⚠️ N issues need attention
```

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: weekly-wiring
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
