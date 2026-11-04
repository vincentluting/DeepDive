---
disable-model-invocation: true
---

Audit frontend code from a user experience perspective.

## First Paint & Bundle Size
1. Check `app/[locale]/page.tsx` (landing page) import chain. Flag unnecessary large dependencies loaded synchronously. Identify components that should use `dynamic()` import.
2. List component files in `components/` exceeding 50KB — candidates for code splitting.

## Mobile Responsiveness
3. Scan all `.tsx` files in `components/`:
   - Fixed widths (`w-[XXXpx]`) without responsive variants
   - `overflow-hidden` without corresponding text-wrap handling
   - Horizontal `flex` layouts without `flex-wrap`
4. Check all Dialog/Modal components for mobile-appropriate sizing.

## Interaction Quality
5. Check all form submissions (Quick Dive, Deep Dive questionnaire, coaching chat):
   - Loading state during submission?
   - Error message on failure?
   - Double-submit prevention?
6. Check all LLM-waiting interactions (report generation, coach reply) for loading animations.

## Accessibility Baseline
7. All `<img>` tags have `alt` attributes?
8. All `<button>` elements have accessible text?
9. Color contrast: light text on dark backgrounds sufficient?

## Output
Issue list sorted by severity. Each with file location and one-line fix suggestion.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: monthly-ux-audit
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
