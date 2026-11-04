---
disable-model-invocation: true
---

# Deep Audit — 全面 Bug 审计命令

> 放置路径: `.claude/commands/deep-audit.md`
> 使用方式: 在 Claude Code 中输入 `/deep-audit`
> 推荐模型: 先 `/model opus` 再执行

Perform a comprehensive deep bug audit of this entire project. Read CLAUDE.md and CONVENTIONS.md first for full project context, tech stack, and coding conventions.

IMPORTANT: This is DIAGNOSIS ONLY. Do NOT modify any files. Read, analyze, and produce a structured bug report.

## Audit Dimensions

Systematically check ALL of the following areas:

### 1. USER FLOW INTEGRITY
Trace every primary user flow end-to-end by reading the actual source files:
- Landing page → each CTA destination → what happens next?
- Every page that calls `getCurrentUser()` or any auth check → what happens when auth fails? Is there a graceful redirect or does it throw and trigger error.tsx?
- Every page that fetches data on mount → what happens if the API returns 404, 500, or partial data?
- Every redirect chain (e.g. unauthenticated → register → redirect back) → are there race conditions or flash-of-error states?
- Every form submission → what happens on double-submit, network timeout, or validation failure?

For each flow, note: does the user ever see an error screen, blank page, or broken state during normal usage?

### 2. MOBILE RESPONSIVENESS (375px and 320px viewports)
- Check every `absolute` or `fixed` positioned element → does it overlap with other content on small screens?
- Check every `min-h-screen` layout → does it account for iOS Safari address bar?
- Check every `grid` or `flex` layout → do items overflow or get truncated on narrow screens?
- Check every element with fixed pixel widths → does it fit within 320px?
- Check for horizontal overflow causing unwanted horizontal scroll
- Check if floating bars (signup bar, tab bar, cookie banners) overlap with each other or with page content
- Check text truncation: are long titles/names handled with proper overflow strategies?

### 3. COMPONENT-LEVEL BUGS
- Error boundaries: are they placed on all pages that need them? Do they reset properly on navigation?
- Loading states: does every async operation show a loading indicator?
- Empty states: what happens when a list/grid has zero items?
- Conditional rendering: are there cases where a component renders before its data is ready?
- Event handlers: are there missing cleanup functions in useEffect? Memory leaks from subscriptions?
- Refs and DOM: are there refs that could be null when accessed?

### 4. STATE & DATA MANAGEMENT
- Zustand/store hydration: are there SSR/client mismatches?
- localStorage usage: are ALL calls wrapped in try/catch? (Safari private mode throws)
- Race conditions: can two concurrent state updates conflict?
- Stale closures: do useCallback/useEffect dependencies include all necessary variables?
- Data consistency: if the same data is stored in multiple places, can they get out of sync?

### 5. API ROUTES
For EVERY API route in `app/api/`:
- Is auth/guard applied with the correct tier?
- Is the request body validated (Zod schema)?
- Are database errors caught and returned as proper JSON error responses (not 500)?
- For LLM-calling routes: is `maxDuration` set high enough?
- Are there missing CORS or CSRF protections?
- What happens with malformed input (wrong types, missing fields, extra fields)?

### 6. CSS, ANIMATION & VISUAL BUGS
- Are there CSS custom properties used but never defined in certain contexts?
- Do Framer Motion animations conflict with CSS animations on the same elements?
- Are there z-index conflicts between overlays, modals, headers, and floating elements?
- Is dark mode consistent — any hardcoded light-mode colors?
- Do `reveal-on-scroll` or other scroll-based animations work on all pages, or only specific ones?
- Are there animation performance issues (layout thrashing, excessive repaints)?

### 7. i18n COMPLETENESS
- Are ALL user-visible strings going through the i18n system?
- Search for hardcoded Chinese or English strings in components
- Are there dictionary keys used in code that don't exist in the JSON files?
- Do server (`getDictionary`) and client (`getDictionaryClient`) dictionary structures match?
- Are date/number formats locale-aware?

### 8. TYPE SAFETY & BUILD HEALTH
- Look for `any` types that could cause runtime errors
- Look for type assertions (`as`) that assume something that could be false at runtime
- Look for optional chaining (`?.`) where a value should be guaranteed (hiding real bugs)
- Are there unused imports or dead code?
- Are there circular dependency risks in `lib/` modules?

## Output Format

Produce a structured bug report:

```
## 🔴 CRITICAL (breaks user experience, users will notice)
### BUG-001: [Title]
- **File(s)**: [paths]
- **Symptom**: [what user sees]
- **Root Cause**: [technical analysis]  
- **Confidence**: HIGH / MEDIUM / LOW
- **Fix Approach**: [brief description of what to change]

## 🟠 HIGH (degraded experience, some users affected)
### BUG-XXX: [Title]
...

## 🟡 MEDIUM (cosmetic, edge case, or minor UX issue)
### BUG-XXX: [Title]
...

## 🟢 LOW (code quality, potential future issue)
### BUG-XXX: [Title]
...
```

Be thorough. Read each file carefully. Prioritize bugs that real users would encounter during normal usage over theoretical edge cases.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: deep-audit
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
