/**
 * Verification tests for April 2026 monthly audit fixes.
 *
 * #5  Pipeline error UI: useAssessmentSubmission exposes pipelineError + retrySubmission + dismissError
 * #6  MobileMapSheet ARIA: role="dialog", aria-label, aria-modal, focus management, Escape key
 * #8  disabled:opacity-40: Tailwind class uses 40 not 20
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ── #5: Pipeline error UI ──────────────────────────────────

describe("pipeline error UI (fix #5)", () => {
  it("useAssessmentSubmission hook exposes pipelineError state + retry + dismiss", () => {
    const src = readFileSync(
      join(__dirname, "../use-assessment-submission.ts"),
      "utf8",
    );

    // Hook returns pipelineError in its return value
    expect(src).toContain("pipelineError,");

    // Hook returns retrySubmission and dismissError callbacks
    expect(src).toContain("retrySubmission,");
    expect(src).toContain("dismissError,");

    // finalizeAndNavigate sets pipelineError instead of silently navigating
    expect(src).toContain("setPipelineError(");

    // retrySubmission clears error before retrying
    expect(src).toMatch(/retrySubmission[\s\S]*setPipelineError\(null\)/);

    // dismissError navigates to profile as graceful fallback
    expect(src).toMatch(/dismissError[\s\S]*window\.location\.href/);
  });

  it("questionnaire-shell renders recoverable processing UI with retry and dismiss buttons", () => {
    const src = readFileSync(
      join(__dirname, "../questionnaire-shell.tsx"),
      "utf8",
    );

    // Error screen checks pipelineError state
    expect(src).toContain("submission.pipelineError");

    // Error screen has retry button
    expect(src).toContain("submission.retrySubmission");

    // Error screen has dismiss/continue button
    expect(src).toContain("submission.dismissError");

    // Uses recovery-oriented i18n keys, not hardcoded terminal failure text
    expect(src).toContain("tReview.pipelineRecoveryTitle");
    expect(src).toContain("tReview.pipelineRecoveryMessage");
    expect(src).toContain("tReview.pipelineRecoveryRetrying");
    expect(src).toContain("tReview.pipelineRetry");
    expect(src).toContain("tReview.pipelineRecoveryLeave");

    // Shows a loading affordance, not a terminal error icon.
    expect(src).toContain("Loader2");
  });

  it("i18n keys exist in both en and zh", () => {
    const en = JSON.parse(
      readFileSync(
        join(__dirname, "../../../lib/i18n/dictionaries/en/deepdive.json"),
        "utf8",
      ),
    );
    const zh = JSON.parse(
      readFileSync(
        join(__dirname, "../../../lib/i18n/dictionaries/zh/deepdive.json"),
        "utf8",
      ),
    );

    const keys = [
      "pipelineErrorTitle",
      "pipelineErrorMessage",
      "pipelineRecoveryTitle",
      "pipelineRecoveryMessage",
      "pipelineRecoveryRetrying",
      "pipelineRecoveryLeave",
      "pipelineRetry",
      "pipelineContinue",
    ];
    for (const key of keys) {
      expect(en.questionnaireReviewPage[key]).toBeTruthy();
      expect(zh.questionnaireReviewPage[key]).toBeTruthy();
    }
  });
});

// ── #5b: Profile reveal waits for complete LLM narratives ───

describe("profile reveal availability", () => {
  it("processing page navigates only after profile and narratives are done", () => {
    const src = readFileSync(
      join(
        __dirname,
        "../../../app/[locale]/(app)/processing/processing-client.tsx",
      ),
      "utf8",
    );

    expect(src).toContain('status?.profileStatus === "done"');
    expect(src).toContain('status?.narrativesStatus === "done"');
    expect(src).toContain("status?.profileId");
    expect(src).toContain("router.replace(`/${locale}/profile/${profileId}`)");

    // The user should never enter Profile while identity narratives are partial.
    expect(src).toMatch(
      /status\?\.profileStatus === "done"[\s\S]{0,220}status\?\.narrativesStatus === "done"[\s\S]{0,220}status\?\.profileId/,
    );
  });

  it("profile page redirects incomplete profiles back to processing", () => {
    const src = readFileSync(
      join(
        __dirname,
        "../../../app/[locale]/(app)/profile/[id]/page.tsx",
      ),
      "utf8",
    );

    expect(src).toContain("hasCompleteNarratives(profile.narrativeSnapshots)");
    expect(src).toContain("getPipelineByAssessment(profile.assessmentId)");
    expect(src).toContain("`/${locale}/processing?pipelineId=");
  });

  it("assessment completion kick-starts the profile step after responding", () => {
    const src = readFileSync(
      join(__dirname, "../../../app/api/assessment/complete/route.ts"),
      "utf8",
    );

    expect(src).toContain('import { after, NextResponse } from "next/server"');
    expect(src).toContain('pipeline.profileStatus !== "done"');
    expect(src).toContain("advancePipeline(pipeline");
    expect(src).toContain("cron will retry");
  });

  it("Deep Dive completion runs lifecycle but isolates its failures from the response", () => {
    const completeRoute = readFileSync(
      join(__dirname, "../../../app/api/assessment/complete/route.ts"),
      "utf8",
    );
    const scoreRoute = readFileSync(
      join(__dirname, "../../../app/api/score/route.ts"),
      "utf8",
    );

    // Lifecycle is still invoked — we still need the registry/journey/cache
    // updates. The bug being prevented is letting a non-essential lifecycle
    // failure crash the route. Both routes must continue to call it.
    expect(completeRoute).toContain("afterAssessmentComplete({");
    expect(scoreRoute).toContain("afterAssessmentComplete({");

    // The original silent fire-and-forget pattern (chained .catch on the
    // call) is banned. It hid bugs from observability without solving
    // ordering, and was the shape that originally regressed.
    expect(completeRoute).not.toMatch(
      /afterAssessmentComplete\(\{[\s\S]{0,400}\}\)\.catch\(/,
    );
    expect(scoreRoute).not.toMatch(
      /afterAssessmentComplete\(\{[\s\S]{0,400}\}\)\.catch\(/,
    );

    // /api/assessment/complete: lifecycle must run inside `after(...)` so
    // the response (and pipeline creation) is not blocked by lifecycle work.
    expect(completeRoute).toMatch(
      /after\(async \(\) => \{[\s\S]{0,400}afterAssessmentComplete\(\{/,
    );

    // /api/score: lifecycle must be wrapped in try/catch so failures are
    // logged but never propagated to the caller.
    expect(scoreRoute).toMatch(
      /try \{[\s\S]{0,200}await afterAssessmentComplete\(\{[\s\S]{0,200}\}\)[;\s]*\}\s*catch/,
    );
  });

  it("profile lifecycle recovers a missing deep_dive_complete transition", () => {
    const src = readFileSync(
      join(__dirname, "../../../lib/db/assessment-lifecycle.ts"),
      "utf8",
    );

    // Quote-agnostic — Prettier may rewrite single↔double quotes.
    expect(src).toMatch(/state === ["']quick_dive_complete["']/);
    expect(src).toMatch(/["']COMPLETE_DEEP_DIVE["']/);
    expect(src).toMatch(/["']GENERATE_PROFILE["']/);
    expect(src).toMatch(/recoveredBy:\s*["']afterProfileGenerated["']/);
  });

  it("afterAssessmentComplete tolerates idempotent retakes and isolates cache failures", () => {
    const src = readFileSync(
      join(__dirname, "../../../lib/db/assessment-lifecycle.ts"),
      "utf8",
    );

    // FSM violations from a retake (already past target state) must not
    // throw — the registry insert + journey transition are idempotent and
    // a re-completion is a legitimate flow.
    expect(src).toMatch(/isExpectedRetakeState\(/);
    // recomputeUserContext is cache-class and must be wrapped so its
    // failure does not abort lifecycle for the caller.
    expect(src).toMatch(
      /try \{[\s\S]{0,200}recomputeUserContext\([\s\S]{0,200}\}\s*catch/,
    );
  });
});

// ── #6: MobileMapSheet ARIA + focus management ─────────────

describe("MobileMapSheet ARIA (fix #6)", () => {
  it("has role='dialog', aria-label, and aria-modal='true'", () => {
    const src = readFileSync(
      join(__dirname, "../mobile-map-sheet.tsx"),
      "utf8",
    );

    expect(src).toContain('role="dialog"');
    expect(src).toContain("aria-label={dict.mapTitle}");
    expect(src).toContain('aria-modal="true"');
  });

  it("backdrop has aria-hidden='true'", () => {
    const src = readFileSync(
      join(__dirname, "../mobile-map-sheet.tsx"),
      "utf8",
    );

    expect(src).toContain('aria-hidden="true"');
  });

  it("has focus management: ref, tabIndex, useEffect for auto-focus + Escape key", () => {
    const src = readFileSync(
      join(__dirname, "../mobile-map-sheet.tsx"),
      "utf8",
    );

    // useRef for focus target
    expect(src).toContain("useRef<HTMLDivElement>");

    // tabIndex=-1 for programmatic focus
    expect(src).toContain("tabIndex={-1}");

    // Auto-focus on open
    expect(src).toMatch(/if\s*\(el\)\s*el\.focus\(\)/);

    // Escape key dismissal
    expect(src).toContain('"Escape"');
    expect(src).toContain("onClose");

    // Cleanup on unmount
    expect(src).toContain("removeEventListener");
  });
});

// ── #8: disabled:opacity-40 (not 20) ──────────────────────

describe("disabled:opacity-40 (fix #8)", () => {
  it("questionnaire-shell uses opacity-40, not opacity-20, for disabled state", () => {
    const src = readFileSync(
      join(__dirname, "../questionnaire-shell.tsx"),
      "utf8",
    );

    expect(src).toContain("disabled:opacity-40");
    expect(src).not.toContain("disabled:opacity-20");
  });

  it("post-assessment-survey uses opacity-40, not opacity-20, for disabled state", () => {
    const src = readFileSync(
      join(__dirname, "../../features/post-assessment-survey.tsx"),
      "utf8",
    );

    expect(src).toContain("disabled:opacity-40");
    expect(src).not.toContain("disabled:opacity-20");
  });
});

// ── #9: Double-submit guard on pipeline finalization ──────

describe("double-submit guard (fix #9)", () => {
  it("useAssessmentSubmission uses a ref guard (not just state) against re-entry", () => {
    const src = readFileSync(
      join(__dirname, "../use-assessment-submission.ts"),
      "utf8",
    );

    // Ref-based guard — must be a ref, not state, because setState is async
    // and two clicks in the same microtask would both pass a state check.
    expect(src).toContain("isSubmittingRef");
    expect(src).toMatch(/isSubmittingRef\s*=\s*useRef\(false\)/);

    // Early return BEFORE the async work and BEFORE setIsSubmitting(true).
    // Order matters: the ref check must come first, then ref assignment,
    // then state. Otherwise a second caller could flip state between the
    // check and the ref write.
    expect(src).toMatch(
      /if\s*\(isSubmittingRef\.current\)\s*return;\s*isSubmittingRef\.current\s*=\s*true;\s*setIsSubmitting\(true\)/,
    );

    // Release in catch so retry is possible after transient failures.
    expect(src).toMatch(
      /catch[\s\S]*isSubmittingRef\.current\s*=\s*false;\s*setIsSubmitting\(false\)/,
    );

    // Return object exposes isSubmitting for disable binding.
    expect(src).toMatch(/return\s*\{[\s\S]*isSubmitting,[\s\S]*\};/);
  });

  it("questionnaire-shell retry button is disabled while submitting", () => {
    const src = readFileSync(
      join(__dirname, "../questionnaire-shell.tsx"),
      "utf8",
    );

    // Retry button must bind disabled to submission.isSubmitting.
    expect(src).toMatch(
      /submission\.retrySubmission[\s\S]{0,200}disabled=\{submission\.isSubmitting\}/,
    );
  });
});

// ── #10: coach-companion Send button aria-label ────────────

describe("coach-companion Send aria-label (fix #10)", () => {
  it("icon-only Send button exposes an accessible name via aria-label", () => {
    const src = readFileSync(
      join(__dirname, "../../coach/coach-companion.tsx"),
      "utf8",
    );

    // The handleSend button carries aria-label using the i18n key.
    expect(src).toMatch(
      /onClick=\{handleSend\}[\s\S]{0,200}aria-label=\{cc\.sendMessage\}/,
    );
  });

  it("coachCompanion.sendMessage key exists in en and zh dictionaries", () => {
    const en = JSON.parse(
      readFileSync(
        join(__dirname, "../../../lib/i18n/dictionaries/en/common.json"),
        "utf8",
      ),
    );
    const zh = JSON.parse(
      readFileSync(
        join(__dirname, "../../../lib/i18n/dictionaries/zh/common.json"),
        "utf8",
      ),
    );

    expect(en.coachCompanion.sendMessage).toBeTruthy();
    expect(zh.coachCompanion.sendMessage).toBeTruthy();
  });
});
