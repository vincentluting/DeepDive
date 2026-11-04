// ============================================================
// POST /api/admin/auto-fill — Admin Auto-Fill for Testing
//
// Generates questionnaire data and runs it through the
// scoring + report generation pipeline.
//
// Supports:
//   type: "quick"     — Quick Dive only (RIASEC → save to QuickDiveResult)
//   type: "immersive" — Immersive Dive (same as quick, exploreMode='immersive')
//   type: "deep"      — Full v3.0 pipeline (QE + Deep Dive scoring + report)
//
// Modes:
//   usePreset: false (default) — generate random answers
//   usePreset: true            — use admin's saved answer preset
//
// Admin-only: requires guardRoute with tier: 'admin'.
// ============================================================

import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { parseBody } from "@/lib/validation/parse-body";
import { adminAutoFillSchema } from "@/lib/validation/api-schemas";
import {
  QUESTIONS,
  type RiasecKey,
} from "@/components/quickdive/quickdive-data";
import {
  generateQuickDiveAnswers,
  computeQuickDiveResult,
  normalizeRiasecScores,
  buildArchetype,
  generateDeepDiveAnswersV3,
  generateSessionMetadataV3,
  generateRandomQuickTwIVIAnswers,
} from "@/lib/admin/generate-random-answers";
import { computeQuickValueOrientation } from "@/lib/assessment/twivi-quick";
import { runScoringPipelineV3 } from "@/lib/scoring";
import { saveAssessmentResult } from "@/lib/db/assessments";
import { ensureSessionExists } from "@/lib/db/sessions";
import { generateCareerReport } from "@/lib/report-generation";
import { saveReportTransactional } from "@/lib/db/reports";
import { saveQuickDiveResult } from "@/lib/db/platform";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import { computeNarrativeInputHash } from "@/lib/profile-generation/profile-fingerprint";
import { saveProfile } from "@/lib/db/profiles";
import { getAdminPreset } from "@/lib/db/admin-presets";
import { afterAssessmentComplete } from "@/lib/db/assessment-lifecycle";
import { fallbackGenderForCode } from "@/components/quickdive/archetype-avatar-asset";
import type { QuestionnaireAnswersV3 } from "@/lib/scoring/index";

// Allow up to 120s for report generation LLM calls
export const maxDuration = 120;

export const POST = withLogging(
  "/api/admin/auto-fill",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, { tier: "admin" });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, adminAutoFillSchema);
      if ("error" in parsed) return parsed.error;
      const { type, locale, generateReport, usePreset, avatarGender } =
        parsed.data;

      // ── Load preset if requested ──────────────────────────────

      let preset: Awaited<ReturnType<typeof getAdminPreset>> = null;
      if (usePreset) {
        preset = await getAdminPreset(guard.user!.id);
        if (!preset) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "No answer preset found. Import your answers from the Admin panel first.",
            400,
          );
        }
      }

      // ── Step 1: Quick Dive (all modes need this) ──────────────

      type RiasecScores = Record<RiasecKey, number>;
      let scores: RiasecScores;
      let rawScores: RiasecScores;

      if (usePreset && preset?.quickDiveAnswers) {
        // Use preset RIASEC scores directly
        const presetQD = preset.quickDiveAnswers as {
          scores: Record<string, number>;
        };
        scores = presetQD.scores as RiasecScores;
        rawScores = { ...presetQD.scores } as RiasecScores;
      } else {
        // Random generation
        const generated = generateQuickDiveAnswers(QUESTIONS);
        scores = generated.scores;
        rawScores = generated.rawScores;
      }

      const qeResult = computeQuickDiveResult(scores, rawScores, locale);
      const riasecNormalized = normalizeRiasecScores(scores);
      const randomValueAnswers = generateRandomQuickTwIVIAnswers();
      const valueResult = computeQuickValueOrientation(randomValueAnswers);
      const archetype = buildArchetype(
        riasecNormalized,
        valueResult.orientation,
        valueResult.scores,
      );

      // ── Track generation source for data quality filtering ──────
      const generationSource = usePreset
        ? "admin-preset"
        : ("admin-random" as const);
      const resolvedAvatarGender =
        avatarGender ?? fallbackGenderForCode(qeResult.code);

      // ── Quick / Immersive: save to QuickDiveResult and return ──

      if (type === "quick" || type === "immersive") {
        const exploreMode = type === "immersive" ? "immersive" : "classic";

        // Inject generationSource into resultData for traceability
        const resultData = {
          ...(qeResult.resultData as Record<string, unknown>),
          generationSource,
        };

        const reportId = await saveQuickDiveResult({
          scores: riasecNormalized,
          archetypeCode: qeResult.code,
          archetypeLabel: qeResult.label,
          language: locale,
          userId: guard.user?.id ?? null,
          resultData,
          exploreMode,
          avatarGender: resolvedAvatarGender,
        });

        // Unified lifecycle: AssessmentCompletion + journey + cache + achievements
        if (guard.user?.id) {
          const assessmentType =
            type === "immersive" ? "immersive_dive" : ("quick_dive" as const);
          await afterAssessmentComplete({
            userId: guard.user.id,
            assessmentType,
            resultId: reportId,
            adminSkipTo: "quick_dive_complete",
            achievementContext: { exploreMode },
          });
        }

        return NextResponse.json({
          type,
          reportId,
          code: qeResult.code,
          label: qeResult.label,
          exploreMode,
          avatarGender: resolvedAvatarGender,
          riasecNormalized,
          archetype: {
            primary: archetype.primary,
            code: archetype.code,
          },
        });
      }

      // ── Step 1b: Save QuickDiveResult for deep mode too ────────
      // Deep Dive inherits RIASEC from Quick Dive. When admin auto-fills
      // deep directly, we must also write QuickDiveResult so the Quick Dive
      // results page shows the same archetype as the Profile.
      await saveQuickDiveResult({
        scores: riasecNormalized,
        archetypeCode: qeResult.code,
        archetypeLabel: qeResult.label,
        language: locale,
        userId: guard.user?.id ?? null,
        resultData: {
          ...(qeResult.resultData as Record<string, unknown>),
          generationSource,
        },
        exploreMode: "classic",
        avatarGender: resolvedAvatarGender,
      });

      // ── Step 2: Deep Dive v3.0 Scoring ────────────────────────

      const sessionId = crypto.randomUUID();

      let answers: QuestionnaireAnswersV3;
      if (usePreset && preset?.deepDiveAnswers) {
        // Use preset Deep Dive answers
        const presetDD = preset.deepDiveAnswers as {
          sjt: Array<{
            scenarioId: number;
            wouldChoice: string;
            shouldChoice: string;
          }>;
          values: Record<string, number>;
          ipip60: Record<string, number>;
        };
        answers = {
          sjt: presetDD.sjt.map((s) => ({
            scenarioId: s.scenarioId,
            wouldChoice: s.wouldChoice as "A" | "B" | "C" | "D",
            shouldChoice: s.shouldChoice as "A" | "B" | "C" | "D",
          })),
          values: Object.fromEntries(
            Object.entries(presetDD.values).map(([k, v]) => [Number(k), v]),
          ),
          ipip60: Object.fromEntries(
            Object.entries(presetDD.ipip60).map(([k, v]) => [Number(k), v]),
          ),
        };
      } else {
        answers = generateDeepDiveAnswersV3();
      }

      const metadata = generateSessionMetadataV3(sessionId);

      // Ensure session exists in DB before saving assessment
      await ensureSessionExists(sessionId, locale, "deep", guard.user?.id);

      const assessmentResult = runScoringPipelineV3(
        answers,
        riasecNormalized,
        metadata,
      );

      // Stamp generationSource for data quality filtering
      assessmentResult.meta.generationSource = generationSource;

      // ── Step 3: Save Assessment ───────────────────────────────

      const assessmentId = await saveAssessmentResult(
        assessmentResult,
        guard.user?.id,
        "3.0",
      );

      // ── Step 4: Generate Profile + Narratives (unlocks /profile page) ──

      const profile = generateProfile(assessmentResult, guard.user?.id);

      // Generate LLM identity narratives (best-effort, non-blocking on failure)
      const algo = profile.algoSnapshot;
      if (algo) {
        try {
          const { generateIdentityNarratives } =
            await import("@/lib/profile-generation/generate-identity-narratives");
          const narratives = await generateIdentityNarratives(
            profile,
            algo,
            locale as "en" | "zh",
          );
          if (narratives) {
            profile.narrativeSnapshots = {
              ...profile.narrativeSnapshots,
              ...narratives,
              narrativeLocale: locale,
              narrativeInputHash: computeNarrativeInputHash(
                profile.profileInputHash,
                locale,
              ),
              populatedAt: new Date().toISOString(),
            };
          }
        } catch (err) {
          console.error("[auto-fill] Narrative generation failed:", err);
        }
      }

      await saveProfile(profile);

      // ── Step 5: Optional Report Generation ────────────────────
      // Mirror the manual flow: pass profileAlgoSnapshot, build narrativeSnapshots,
      // save with saveReportTransactional for full equivalence.

      let reportId: string | null = null;
      if (generateReport) {
        try {
          const profileAlgoSnapshot = profile.algoSnapshot ?? undefined;
          const report = await generateCareerReport(
            assessmentResult,
            null, // no real conditions for auto-fill (admin testing)
            locale,
            profileAlgoSnapshot,
          );

          // Build narrative snapshots from report integration (same as manual flow)
          const reportNarrativeSnapshots = {
            letterToUser: report.integration?.letterToUser,
            coreInsight: report.integration?.coreInsight,
            careerDrainSummary: report.careerDrainWarning?.drainingDirections
              ? report.careerDrainWarning.drainingDirections
                  .slice(0, 2)
                  .map((d) =>
                    locale === "zh"
                      ? d.title_zh || d.title_en
                      : d.title_en || "",
                  )
                  .join(", ")
              : undefined,
            populatedAt: new Date().toISOString(),
          };

          reportId = await saveReportTransactional(
            report,
            guard.user?.id,
            sessionId,
            assessmentId,
            reportNarrativeSnapshots,
          );
        } catch (reportError) {
          // Report generation is optional — don't fail the whole request
          console.error("[auto-fill] Report generation failed:", reportError);
        }
      }

      // ── Step 6: Unified lifecycle for both Quick Dive + Deep Dive completions ──
      if (guard.user?.id) {
        const targetState = reportId
          ? ("report_generated" as const)
          : ("profile_generated" as const);
        // Record Quick Dive completion (deep auto-fill also generates QD data)
        await afterAssessmentComplete({
          userId: guard.user.id,
          assessmentType: "quick_dive",
          resultId: sessionId,
          adminSkipTo: targetState,
          achievementContext: { exploreMode: "classic" },
        });
        // Record Deep Dive completion
        await afterAssessmentComplete({
          userId: guard.user.id,
          assessmentType: "deep_dive",
          resultId: sessionId,
          adminSkipTo: targetState,
        });
      }

      return NextResponse.json({
        type: "deep",
        sessionId,
        assessmentId,
        reportId,
        archetype: {
          primary: assessmentResult.archetype.primary,
          code: assessmentResult.archetype.code,
          label_en: assessmentResult.archetype.label_en,
          label_zh: assessmentResult.archetype.label_zh,
        },
        riasecNormalized,
        bigFive: assessmentResult.bigFive.domainsNormalized,
        schwartzTop3: assessmentResult.schwartz.top3,
        tensionCount: assessmentResult.tensions.notableTensions.length,
        cognitiveStyleCode: assessmentResult.cognitiveStyleCode?.code ?? null,
      });
    } catch (error) {
      logApiError("/api/admin/auto-fill", ApiErrorCode.INTERNAL_ERROR, {
        message: "Auto-fill failed",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Auto-fill failed",
        500,
      );
    }
  },
);
