---
title: Monthly UX Audit — March 2026
category: product
sources:
  - components/
  - app/[locale]/
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Monthly UX Audit — March 2026

> **Historical snapshot** — 本文档记录 2026-03-06 的代码库状态。此后多个组件已重构/拆分/删除（如 `landing-content.tsx` → `components/features/landing/`，`report-header.tsx` / `career-development-narrative.tsx` / `insight-grid.tsx` 已移除），部分审计项可能已不适用。引用的文件路径反映审计时的实际路径，不做追溯修改。

**Date:** 2026-03-06
**Scope:** First paint & bundle, mobile responsiveness, interaction quality, accessibility
**Baseline device:** 375px (iPhone SE/14), 768px (iPad), 1024px+ (Desktop)

---

## Severity Legend

- 🔴 **CRITICAL** — Broken experience for significant user segment
- 🟠 **HIGH** — Measurable UX degradation, fix within current sprint
- 🟡 **MEDIUM** — Noticeable friction, fix next sprint
- 🟢 **LOW** — Polish/compliance items

---

## 1. First Paint & Bundle Size

### 🔴 CRITICAL-1 — LandingContent (43.9 KB) blocks FCP on home page

**File:** `components/features/landing-content.tsx` (43.9 KB)
**Import in:** `app/[locale]/page.tsx` — synchronous
**Problem:** The entire landing page component — including a canvas particle system, framer-motion scroll animations, 85 star positions, and an ArchetypeMarquee — blocks First Contentful Paint. On low-end devices the canvas particle system also blocks the main thread.
**Fix:** Wrap in `dynamic({ ssr: false, loading: () => <Skeleton className="h-screen" /> })` in `app/[locale]/page.tsx`. Estimated gain: **15–20% faster FCP**.

---

### 🟠 HIGH-2 — Embla carousel (50 KB) loaded for all users, used only on mobile

**File:** `app/[locale]/report/[id]/report-client.tsx` line 6
**Problem:** `embla-carousel-react` is imported synchronously. Desktop users (~90% of traffic) pay 50 KB for a library they never use.
**Fix:** Lazy-load behind a `useEffect` viewport check:

```ts
const EmblaCarousel = dynamic(() => import("embla-carousel-react"), {
  ssr: false,
});
// Only render when isMobile === true
```

Estimated gain: **30–40% faster initial load for desktop**.

---

### 🟠 HIGH-3 — Recharts (200 KB) loaded synchronously in admin pages

**Files:**

- `components/admin/research/thesis-analytics.tsx` line 23 (39.8 KB file)
- `components/admin/insights/insights-tab.tsx` line 26 (35.4 KB file)

**Problem:** Both import the full recharts package synchronously. The only correctly code-split recharts usage in the project is `RIASECRadarChart` in `components/profile-panels/dimension-explorer.tsx` — use that as the template.
**Fix:** Wrap both components in `dynamic({ ssr: false })` at their parent page import sites.

---

### 🟡 MEDIUM-4 — questionnaire-shell.tsx (53.4 KB) is the largest component file

**File:** `components/questionnaire/questionnaire-shell.tsx` (53.4 KB)
**Problem:** Largest single component. Loaded on every Deep Dive route entry. Contains submission pipeline, zone card rendering, CDSE post-flow, and resume upload — all bundled together.
**Fix:** Extract below-fold flows (CDSE post-assessment, resume upload panel) into separate dynamic imports. Lower priority — the questionnaire route is intentional and users expect loading time.

---

### 🟡 MEDIUM-5 — unified-explore-result.tsx (39.6 KB) loaded upfront in Quick Dive

**File:** `components/quickdive/unified-explore-result.tsx` (39.6 KB)
**Problem:** Results screen loaded synchronously even before user completes the Quick Dive.
**Fix:** Lazy-load after questionnaire completion trigger.

---

## 2. Mobile Responsiveness

### 🔴 CRITICAL-6 — Landing hero does not stack on mobile (no flex-col)

**File:** `components/features/landing-content.tsx` line 423
**Problem:** `flex items-center justify-between gap-[60px]` with no `flex-col` — hero copy and visual are forced side-by-side on 375px screens. Layout breaks entirely.
**Fix:** Add `flex-col md:flex-row gap-6 md:gap-[60px]` to the hero wrapper div.

---

### 🔴 CRITICAL-7 — Hero copy container fixed at 540px, overflows mobile

**File:** `components/features/landing-content.tsx` line 426
**Problem:** `style={{ maxWidth: 540 }}` inline style — on 375px mobile this clips or causes horizontal scroll.
**Fix:** Change to `style={{ maxWidth: 'min(100%, 540px)' }}` or className `max-w-[90vw] sm:max-w-[540px]`.

---

### 🟠 HIGH-8 — AlertDialog lacks mobile responsive sizing progression

**File:** `components/ui/alert-dialog.tsx` line 57
**Problem:** `max-w-[calc(100%-2rem)]` on mobile jumps directly to `sm:max-w-lg` (512px) at the 640px breakpoint. Missing intermediate step; appears cramped at 375px then oversized at 640px.
**Fix:** Change to `max-w-[calc(100%-1rem)] sm:max-w-md md:max-w-lg`.

---

### 🟠 HIGH-9 — Report header badges use `flex-nowrap`, overflow on mobile

**File:** `components/report/report-header.tsx` line 245
**Problem:** `flex flex-nowrap overflow-x-auto` forces up to 4 badges (Cognitive Style, Cross-Cultural Type, Collaboration Style, etc.) into a single non-wrapping row. On 375px this results in silent horizontal scroll — users miss metadata badges.
**Fix:** Change to `flex flex-wrap sm:flex-nowrap`.

---

### 🟠 HIGH-10 — Report header avatar jumps 180 → 340px with no intermediate breakpoint

**File:** `components/report/report-header.tsx` lines 112, 121
**Problem:** `w-[180px] sm:w-[340px]` — a 340px avatar is 91% of mobile width on landscape orientation. Causes layout shift and pushes adjacent content off-screen.
**Fix:** Add intermediate step: `w-[140px] sm:w-[200px] md:w-[340px]`.

---

### 🟠 HIGH-11 — Career development narrative phase tabs have no flex-wrap fallback

**File:** `components/report/career-development-narrative.tsx` line 63
**Problem:** Three phase tab buttons in a horizontal row with no `flex-wrap`. On 375px the third tab may be hidden. There's no visual scroll indicator so users may not discover Phase 2 and Phase 3 content.
**Fix:** Add `flex-wrap sm:flex-nowrap` to the tab container, or add a scroll-hint chevron.

---

### 🟡 MEDIUM-12 — Post-assessment survey container cramped on mobile

**File:** `components/features/post-assessment-survey.tsx` line 396
**Problem:** `max-w-lg` (512px) centered in 375px screen leaves ~16px padding total. No breathing room for form fields.
**Fix:** `max-w-[calc(100vw-2rem)] sm:max-w-md md:max-w-lg`.

---

### 🟡 MEDIUM-13 — Landing glass card has no lateral padding safety on 320px screens

**File:** `components/features/landing-content.tsx` line 482
**Problem:** `style={{ width: '100%', maxWidth: 340 }}` — on 320px (iPhone SE) the card touches screen edges.
**Fix:** `style={{ width: 'min(100%, 340px)' }}` + `mx-auto` + `px-4` padding inside.

---

## 3. Interaction Quality

### ✅ Auth forms — PASS

`components/auth/login-form.tsx`, `register-form.tsx`: Loading state, disabled button, error display, double-submit prevention all correctly implemented.

### ✅ Deep Dive questionnaire submission — PASS

`components/questionnaire/use-assessment-submission.ts`: Multi-stage pipeline with 120s timeout, localStorage-backed retry for failed `assessmentId`, distinguishes retryable vs non-retryable errors. Excellent.

### ✅ Reality conditions form — PASS

`components/reality-conditions/real-conditions-form.tsx`: `isSaving` state, disabled button, retry option on error.

### ✅ Coaching chat — PASS

`components/features/coaching-chat.tsx`: Typing indicator (3-dot animation), disabled textarea + send button during streaming, 100s abort timer with reset on each chunk, graceful error with partial message cleanup.

### ✅ Settings (logout, export, delete) — PASS

All three actions have loading states, disabled buttons, and error handling.

### 🟡 MEDIUM-14 — Quick Dive question selection: no visual disabled feedback during advance

**File:** `components/quickdive/classic-explore-question.tsx` lines 55–62
**Problem:** `if (selectedValue !== null) return` prevents double-submit, but there's no spinner or disabled visual. 200ms delay before advancing. Users may tap again thinking nothing happened.
**Fix:** Set a `isAdvancing` state on selection and apply `pointer-events-none opacity-60` to the option grid while true.

---

## 4. Accessibility

### 🟠 HIGH-15 — 28+ low-contrast text instances (white/30–50 on dark backgrounds)

**WCAG 2.1 AA requires 4.5:1; these fail at ~1.9:1–3.1:1**

Top offenders by file:

| File                                               | Lines              | Worst Pattern                 | Est. Contrast |
| -------------------------------------------------- | ------------------ | ----------------------------- | ------------- |
| `components/quickdive/report-preview-modal.tsx`    | 300–309            | `text-white/30` (6 instances) | ~1.9:1 ❌     |
| `components/questionnaire/deep-dive-intro.tsx`     | 295                | `text-white/30`               | ~1.9:1 ❌     |
| `components/animation/anticipation-loader.tsx`     | 255                | `text-white/30`               | ~1.9:1 ❌     |
| `components/report/confidence-indicator.tsx`       | 76, 88             | `text-white/40`               | ~2.5:1 ❌     |
| `components/report/evidence-popover.tsx`           | 264, 283, 290      | `text-white/40–50`            | ~2.5–3.1:1 ❌ |
| `components/profile-panels/identity-hero.tsx`      | 174, 183           | `text-white/40–50`            | ~2.5–3.1:1 ❌ |
| `components/profile-panels/identity-card.tsx`      | 143, 191, 205, 220 | `text-white/50`               | ~3.1:1 ❌     |
| `components/questionnaire/questionnaire-shell.tsx` | 280, 291, 596      | `text-white/40–50`            | ~2.5–3.1:1 ❌ |
| `components/share/share-button.tsx`                | 270                | `text-white/40`               | ~2.5:1 ❌     |

**Fix:** Increase all decorative `text-white/30` → `/60`, all supporting `text-white/40` → `/70`, all secondary `text-white/50` → `/75`. Use WCAG contrast checker for final values against actual background color.

---

### 🟠 HIGH-16 — Weak focus indicators across form inputs

**WCAG 2.1 2.4.7 (Focus Visible): keyboard users cannot track focus**

| File                                             | Lines    | Current                                      | Minimum Required                                     |
| ------------------------------------------------ | -------- | -------------------------------------------- | ---------------------------------------------------- |
| `components/features/coaching-chat.tsx`          | 560, 636 | `focus:ring-1 focus:ring-primary/20`         | `focus-visible:ring-2 focus-visible:ring-primary/60` |
| `components/features/coaching-feedback.tsx`      | 108      | `focus:ring-1 focus:ring-primary/20`         | Same                                                 |
| `components/features/post-assessment-survey.tsx` | 615      | `focus:ring-1 focus:ring-primary/30`         | Same                                                 |
| `components/features/report-nps.tsx`             | 212      | `focus:ring-2 focus:ring-primary/20`         | Increase to `/60`                                    |
| `components/features/memory-panel.tsx`           | 413, 423 | `focus:outline-none focus:border-primary/50` | Add `focus-visible:ring-2`                           |

**Fix:** Standardise on `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary` across all inputs. Use `focus-visible:` (not `focus:`) to avoid visible rings on mouse clicks.

---

### 🟡 MEDIUM-17 — `text-muted-foreground/30–40` secondary text risk in light theme

**Files:**

- `components/report/insight-grid.tsx` line 244 — `text-muted-foreground/30`
- ~~`components/profile-panels/narrative-exits.tsx`~~ — file deleted (2026-03-11)
- `components/features/memory-panel.tsx` line 501 — `text-muted-foreground/0` (starts fully transparent, animated in — confirm final value is ≥ /70)

**Fix:** Audit these in both light and dark themes. Decorative separators are acceptable at lower opacity; readable content text should be ≥ `/70`.

---

### ✅ Images — PASS

All `<img>` and Next.js `<Image>` components have descriptive `alt` attributes.

### ✅ Icon-only buttons — PASS

All icon-only buttons (close, copy, etc.) have `aria-label` attributes.

### ✅ Dialog/Modal semantics — PASS

Proper `aria-modal`, `role="dialog"`, `aria-expanded` usage throughout.

---

## Prioritised Fix List

| #   | Severity | Issue                                 | File                                       | Effort |
| --- | -------- | ------------------------------------- | ------------------------------------------ | ------ |
| 6   | 🔴       | Hero no flex-col stacking on mobile   | `landing-content.tsx:423`                  | XS     |
| 7   | 🔴       | Hero copy 540px overflow              | `landing-content.tsx:426`                  | XS     |
| 1   | 🔴       | LandingContent blocks FCP             | `page.tsx` + `landing-content.tsx`         | S      |
| 15  | 🟠       | 28+ low-contrast white text instances | Multiple                                   | M      |
| 16  | 🟠       | Weak focus indicators                 | Multiple forms                             | S      |
| 2   | 🟠       | Embla carousel desktop waste          | `report-client.tsx:6`                      | S      |
| 8   | 🟠       | AlertDialog mobile sizing             | `alert-dialog.tsx:57`                      | XS     |
| 9   | 🟠       | Badge row `flex-nowrap` overflow      | `report-header.tsx:245`                    | XS     |
| 10  | 🟠       | Avatar 180→340px jump                 | `report-header.tsx:112`                    | XS     |
| 11  | 🟠       | Phase tabs no wrap                    | `career-development-narrative.tsx:63`      | XS     |
| 3   | 🟠       | Recharts 200 KB in admin              | `thesis-analytics.tsx`, `insights-tab.tsx` | S      |
| 12  | 🟡       | Post-assessment cramped mobile        | `post-assessment-survey.tsx:396`           | XS     |
| 13  | 🟡       | Glass card no safe padding            | `landing-content.tsx:482`                  | XS     |
| 14  | 🟡       | Quick Dive no advancing state         | `classic-explore-question.tsx:55`          | XS     |
| 17  | 🟡       | muted-foreground/30–40 light theme    | Multiple                                   | S      |
| 4   | 🟡       | questionnaire-shell.tsx 53 KB         | `questionnaire-shell.tsx`                  | L      |
| 5   | 🟡       | unified-explore-result.tsx lazy       | `unified-explore-result.tsx`               | S      |

**Effort key:** XS < 30 min · S = 30–90 min · M = half day · L = full day

---

## What's Already Good

- Auth forms: full loading/error/double-submit protection
- Coaching chat: typing indicator, 100s timeout, graceful error recovery, input lock
- Questionnaire submission pipeline: localStorage-backed retry, 120s timeout, multi-stage error handling
- Reality conditions form: step-by-step with saving state and retry
- Settings (export, delete, logout): all have loading/error states
- `html-to-image` already lazy-loaded on demand in `letter-to-user.tsx` — use as template
- `RIASECRadarChart` already code-split with `dynamic()` in `dimension-explorer.tsx` — use as template for recharts
- All images have `alt` attributes; all icon buttons have `aria-label`
- Full dialog/modal ARIA semantics (`aria-modal`, `role="dialog"`, `aria-expanded`)
