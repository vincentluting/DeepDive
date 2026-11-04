/**
 * Regression guard for the resume-enhancement feature line.
 *
 * Captures every fix from the six codex cross-review rounds so none of them
 * can silently regress. The test style is source-level assertion (matches
 * this project's existing conventions — see reality-conditions-flow.test.ts)
 * because the surface spans SQL fragments, API routes, client components
 * and prompt builders, and React component mounting infrastructure isn't
 * otherwise used here.
 *
 * If you change a file this test references, update the assertion to match
 * the new reality — don't loosen the guard without re-running codex review.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../../..");
function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf-8");
}

describe("Resume-enhancement invariants", () => {
  // ── Round 1 — P0: CareerReport ON CONFLICT must match partial unique index
  describe("R1 P0 — saveReport ON CONFLICT matches partial unique index", () => {
    it("saveReport uses WHERE supersededAt IS NULL in ON CONFLICT", () => {
      const src = read("lib/db/reports.ts");
      expect(src).toMatch(
        /ON CONFLICT \("assessmentId"\) WHERE "supersededAt" IS NULL DO NOTHING/,
      );
    });

    it("migration 078 drops the old unconditional idx_report_assessment", () => {
      const src = read("scripts/migrations/078-resume-match-persistence.sql");
      expect(src).toMatch(/DROP INDEX IF EXISTS idx_report_assessment/);
      expect(src).toMatch(/CareerReport_assessment_active_idx/);
    });
  });

  // ── Round 1 — P1: upload route uses canAccessFeature + verifyAssessmentOwnership
  describe("R1 P1 — upload route security", () => {
    const src = read("app/api/documents/upload/route.ts");

    it("uses canAccessFeature (supports purchased tier) rather than cohort-only canAccess", () => {
      expect(src).toMatch(/from "@\/lib\/access\/check-access"/);
      expect(src).toMatch(/canAccessFeature\(/);
      expect(src).not.toMatch(/from "@\/lib\/cohort\/entitlements"/);
    });

    it("uses verifyAssessmentOwnership (with session fallback) rather than the short-circuit-bypassable getAssessmentOwner pattern", () => {
      expect(src).toMatch(/verifyAssessmentOwnership\(/);
      // The old buggy pattern would use `owner.userId && owner.userId !== userId`
      // which silently allowed null userId legacy rows.
      expect(src).not.toMatch(/owner\.userId && owner\.userId !== userId/);
    });
  });

  // ── Round 1 — P2: depth-mode dialog wires through to the backend
  describe("R1 P2 — depth-mode plumbing", () => {
    it("ReportDepthDialog forwards a ReportDepthMode to onGenerate", () => {
      const src = read("components/report/report-depth-dialog.tsx");
      expect(src).toMatch(
        /export type ReportDepthMode = "standard" \| "enhanced"/,
      );
      expect(src).toMatch(/onGenerate: \(mode: ReportDepthMode\) => void/);
      expect(src).toMatch(/onGenerate\("standard"\)/);
    });

    it("generateReportSchema accepts depthMode", () => {
      const src = read("lib/validation/api-schemas.ts");
      expect(src).toMatch(
        /depthMode: z\.enum\(\["standard", "enhanced"\]\)\.optional\(\)/,
      );
    });

    it("generate-report non-stream route skips resume lookup on Standard", () => {
      const src = read("app/api/generate-report/route.ts");
      expect(src).toMatch(/depthMode === "standard"/);
      expect(src).toMatch(/const resumeMatch/);
    });

    it("generate-report SSE route skips resume lookup on Standard", () => {
      const src = read("app/api/generate-report/stream/route.ts");
      expect(src).toMatch(/depthMode === "standard"/);
    });

    it("cron report step honors resumeAnalysisStatus instead of always loading the latest match", () => {
      const src = read("lib/pipeline/steps/report.ts");
      expect(src).toMatch(
        /pipeline\.resumeAnalysisStatus === "done"[\s\S]*getLatestActiveResumeMatch/,
      );
    });

    it("regenerate-report route sets resumeAnalysisStatus=skipped on Standard and backfills=done on Enhanced for legacy rows", () => {
      const src = read(
        "app/api/assessment/[assessmentId]/regenerate-report/route.ts",
      );
      expect(src).toMatch(
        /setResumeAnalysisStatusByAssessment\([^,]+, "skipped"\)/,
      );
      expect(src).toMatch(
        /setResumeAnalysisStatusByAssessment\([^,]+, "done"\)/,
      );
    });

    it("regenerate-report resets locale atomically with reportStatus (fixes updatePipelineLocale no-op on 'done')", () => {
      const src = read(
        "app/api/assessment/[assessmentId]/regenerate-report/route.ts",
      );
      // The single UPDATE must set both columns.
      expect(src).toMatch(
        /UPDATE "AssessmentPipeline"[\s\S]*"reportStatus" = 'not_requested'[\s\S]*"locale" = \$\{requestedLocale\}/,
      );
    });

    it("regenerate-report uses verifyAssessmentOwnership (legacy session fallback)", () => {
      const src = read(
        "app/api/assessment/[assessmentId]/regenerate-report/route.ts",
      );
      expect(src).toMatch(/verifyAssessmentOwnership\(/);
    });

    it("report-client language-mismatch regenerate carries depthMode inherited from current report", () => {
      const src = read("app/[locale]/(report)/report/[id]/report-client.tsx");
      expect(src).toMatch(/inheritedDepthMode/);
      expect(src).toMatch(/report\.meta[\s\S]*resumeEnhanced/);
      expect(src).toMatch(/depthMode: inheritedDepthMode/);
    });
  });

  // ── Round 2 — P2: Dialog null handling + Banner null handling
  describe("R2 P2 — null upload result semantics", () => {
    it("ReportDepthDialog maps null result to Standard mode (user backed out of preview)", () => {
      const src = read("components/report/report-depth-dialog.tsx");
      expect(src).toMatch(/onGenerate\(result \? "enhanced" : "standard"\)/);
    });

    it("ResumeRegenerateBanner refuses to regenerate on null result (user skipped preview)", () => {
      const src = read("components/report/resume-regenerate-banner.tsx");
      // `if (!result) return;` is the exact guard; allow whitespace variance
      expect(src).toMatch(/if \(!result\)\s*return/);
    });

    it("ResumeRegenerateBanner pins depthMode=enhanced when it does fire regenerate", () => {
      const src = read("components/report/resume-regenerate-banner.tsx");
      expect(src).toMatch(/depthMode=enhanced/);
    });
  });

  // ── Round 2 — P1: resume-match supersede+insert is atomic (CTE)
  describe("R2 P1 — atomic supersede+insert via CTE", () => {
    const src = read("lib/db/resume-match.ts");

    it("createResumeMatchResult uses a single CTE combining UPDATE+INSERT", () => {
      expect(src).toMatch(/WITH superseded AS/);
      // The pre-fix path called supersedeActiveResumeMatches() before the
      // INSERT — that separate call must NOT appear inside createResumeMatchResult.
      const createFn = src.split(
        "export async function createResumeMatchResult",
      )[1];
      expect(createFn).toBeTruthy();
      // The supersede-then-insert anti-pattern would call this exported helper.
      expect(createFn!.split("export async function")[0]).not.toMatch(
        /await supersedeActiveResumeMatches\(/,
      );
    });
  });

  // ── Round 3 — P1: prompt-injection sanitization for resume evidence
  describe("R3 P1 — prompt-injection sanitization", () => {
    const src = read("lib/report-generation/common-rules.ts");

    it("buildResumeEvidenceBlock sanitizes every user-sourced string via sanitizeField", () => {
      expect(src).toMatch(
        /import \{ sanitizeField \} from "@\/lib\/ai\/prompt-sanitization"/,
      );
      // Each user-sourced piece goes through clean() which wraps sanitizeField.
      expect(src).toMatch(/const summary = clean\(/);
      expect(src).toMatch(/const dim = clean\(d\.dimension/);
      expect(src).toMatch(/const ev = clean\(d\.resumeEvidence/);
    });
  });

  // ── Round 4 — P1: multi-line bypass mitigation
  describe("R4 P1 — inline fields flattened to single line", () => {
    const src = read("lib/report-generation/common-rules.ts");

    it("clean() strips embedded newlines and tabs before returning", () => {
      // The fix replaces \r\n\t with a single space so a pasted
      // "...\n## Output Format..." string cannot grow new paragraphs
      // inside the prompt.
      expect(src).toMatch(/\.replace\(\/\[\\r\\n\\t\]\+\/g, " "\)/);
    });
  });

  // ── Round 4 — P2: generateIntegration receives resumeEvidence at every call site
  describe("R4 P2 — generateIntegration callers thread resumeEvidence", () => {
    it("generateIntegration signature accepts resumeEvidence", () => {
      const src = read("lib/report-generation/integration.ts");
      expect(src).toMatch(/resumeEvidence: ResumeMatchResult \| null = null/);
      expect(src).toMatch(/buildIntegrationPrompt\([\s\S]*?resumeEvidence/);
    });

    it("report-generation/index.ts forwards resumeEvidence to integration", () => {
      const src = read("lib/report-generation/index.ts");
      // Both career-match-narrative and integration must be called with
      // resumeEvidence. Additional trailing args (e.g. userId for observability)
      // are allowed — the contract is "resumeEvidence is in the arg list",
      // not "resumeEvidence is the last arg".
      expect(src).toMatch(
        /generateCareerMatchNarrative\([\s\S]*?resumeEvidence[\s\S]*?\)/,
      );
      expect(src).toMatch(
        /generateIntegration\([\s\S]*?resumeEvidence[\s\S]*?\)/,
      );
    });

    it("regenerate-pathway route forwards resumeEvidence to both integration attempts", () => {
      const src = read("app/api/report/[id]/regenerate-pathway/route.ts");
      const integrationCalls =
        src.match(/generateIntegration\([\s\S]*?\)/g) ?? [];
      expect(integrationCalls.length).toBeGreaterThanOrEqual(2);
      for (const call of integrationCalls) {
        expect(call).toMatch(/resumeEvidence/);
      }
    });
  });

  // ── Round 5 — P2: regenerate-pathway uses the report's OWN resumeEvidence snapshot
  describe("R5 P2 — regenerate-pathway reuses report snapshot, not latest match", () => {
    const src = read("app/api/report/[id]/regenerate-pathway/route.ts");

    it("reads resumeEvidence from report.resumeEvidence, not from DB", () => {
      expect(src).toMatch(/report\.resumeEvidence/);
    });

    it("does NOT re-query the latest active ResumeMatchResult from DB", () => {
      // The buggy pattern did `await getLatestActiveResumeMatch(report.assessmentId)`.
      expect(src).not.toMatch(/getLatestActiveResumeMatch\(/);
    });
  });

  // ── Round 6 — P0: Career Pathway prompt threads resumeEvidence
  // The 2026-05-23 audit found the 30-day plan completely ignored uploaded
  // resumes, recommending intro tasks to senior practitioners. Pathway must
  // now receive resumeEvidence at every call site so the prompt can
  // calibrate seniority + skip already-mastered skills.
  describe("R6 P0 — Career Pathway generator threads resumeEvidence", () => {
    it("generateCareerPathway signature accepts resumeEvidence", () => {
      const src = read("lib/report-generation/career-pathway.ts");
      expect(src).toMatch(/resumeEvidence: ResumeMatchResult \| null = null/);
      expect(src).toMatch(/buildPathwayPrompt\([\s\S]*?resumeEvidence/);
    });

    it("buildPathwayPrompt calls buildResumeEvidenceBlock and emits it into the prompt", () => {
      const src = read("lib/report-generation/career-pathway.ts");
      expect(src).toMatch(
        /import \{ buildResumeEvidenceBlock \} from "\.\/common-rules"/,
      );
      expect(src).toMatch(/const resumeBlock = buildResumeEvidenceBlock\(/);
      // The block must appear in the returned template literal (after
      // realConditionsBlock) — otherwise the prompt silently drops it.
      expect(src).toMatch(/\$\{realConditionsBlock\}\s*\n\$\{resumeBlock\}/);
    });

    it("prompt instructs the LLM to calibrate Week 1 tasks + seniority against resume experience", () => {
      const src = read("lib/report-generation/career-pathway.ts");
      // Both zh and en variants must carry the calibration rule.
      expect(src).toMatch(/简历经验校准/);
      expect(src).toMatch(/Resume Experience Calibration/);
    });

    it("report-generation/index.ts forwards resumeEvidence to generateCareerPathway", () => {
      const src = read("lib/report-generation/index.ts");
      expect(src).toMatch(
        /generateCareerPathway\([\s\S]*?resumeEvidence[\s\S]*?\)/,
      );
    });

    it("regenerate-pathway route forwards resumeEvidence to both pathway attempts", () => {
      const src = read("app/api/report/[id]/regenerate-pathway/route.ts");
      const pathwayCalls =
        src.match(/generateCareerPathway\([\s\S]*?\)/g) ?? [];
      expect(pathwayCalls.length).toBeGreaterThanOrEqual(2);
      for (const call of pathwayCalls) {
        expect(call).toMatch(/resumeEvidence/);
      }
    });
  });

  // ── Round 7 — P1: Career Match narrative mode surfaces sensitive constraints
  // The 2026-05-23 audit found that users felt their visa/family/salary inputs
  // were ignored in Career Match challenges (only generic conditional copy).
  // Narrative mode now exposes a sensitive sub-block with conditional-clause
  // discipline so the LLM can reference real constraints concretely without
  // copying bare field-name labels.
  describe("R7 P1 — narrative mode surfaces sensitive constraints as conditional thresholds", () => {
    const src = read("lib/report-generation/real-conditions-context.ts");

    it("exports a SENSITIVE_TITLE constant with conditional-clause directive", () => {
      expect(src).toMatch(/const SENSITIVE_TITLE: LocaleTexts/);
      // The title must explicitly forbid bare field-name copying.
      expect(src).toMatch(/never copy bare field names/);
    });

    it("defines a lineForSensitiveConstraints helper feeding narrative mode", () => {
      expect(src).toMatch(/function lineForSensitiveConstraints\(/);
      // Each sensitive line shows the VALUE + a "write as e.g." example so
      // the LLM has both ground-truth and a phrasing template.
      expect(src).toMatch(/write as e\.g\./);
    });

    it("narrative mode appends the sensitive sub-block when sensitiveFieldCount > 0", () => {
      // The narrative branch must call lineForSensitiveConstraints and
      // concatenate its block into the returned text.
      expect(src).toMatch(/lineForSensitiveConstraints\(safe, locale\)/);
      expect(src).toMatch(/sensitiveFieldCount/);
    });

    it("narrative mode picks footer based on whether sensitive constraints registered", () => {
      // Two distinct footers: one for "I rendered sensitive constraints, here
      // is the writing discipline" and one for "nothing registered, fall back
      // to generic conditional framing."
      expect(src).toMatch(/NARRATIVE_FOOTER_WITH_SENSITIVE/);
      expect(src).toMatch(/NARRATIVE_FOOTER_NO_SENSITIVE/);
    });

    it("with-sensitive footer enforces 1-2 sentence cap + paraphrase discipline", () => {
      // These are the two core directives that distinguish the new
      // approach from the old "assume they may apply" generic footer.
      expect(src).toMatch(/paraphrase the impact, never the field name/);
      // English footer uses "One-to-two", Chinese uses "1-2" — accept either.
      expect(src).toMatch(
        /(One-to-two|1-2) sentences per sensitive constraint/,
      );
    });
  });

  // ── Core wiring — report meta provenance
  describe("Report meta carries resume-enhancement provenance", () => {
    const src = read("lib/report-generation/index.ts");
    it("meta.resumeEnhanced + resumeMatchId + resumeMatchAt are set when a resume was layered in", () => {
      expect(src).toMatch(/resumeEnhanced: true/);
      expect(src).toMatch(/resumeMatchId: resumeMatch\.id/);
      expect(src).toMatch(/resumeMatchAt: resumeMatch\.createdAt\.getTime\(\)/);
    });
  });
});
