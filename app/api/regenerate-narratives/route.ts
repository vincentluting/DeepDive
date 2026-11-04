// ============================================================
// POST /api/regenerate-narratives — Retry narrative generation
//
// Called when narratives failed during initial profile generation.
// Fetches existing profile, regenerates narratives via LLM, updates DB.
//
// Input:  { assessmentId: string, locale?: string }
// Output: { success: true } or error
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import {
  generateIdentityNarratives,
  generateMeaningCompassNarrative,
} from "@/lib/profile-generation/generate-identity-narratives";
import {
  getProfileByAssessment,
  updateProfileNarratives,
} from "@/lib/db/profiles";
import { hasCompleteNarratives } from "@/lib/profile-generation/narrative-renderability";
import { computeNarrativeInputHash } from "@/lib/profile-generation/profile-fingerprint";
import { invalidateUserCache } from "@/lib/db/cached";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { z } from "zod/v4";
import { parseBody } from "@/lib/validation/parse-body";

const regenerateNarrativesSchema = z.object({
  assessmentId: z.string().min(1),
  locale: z.enum(["en", "zh"]).optional().default("en"),
  // "all" (default) regenerates the 7 required narratives.
  // "meaning-compass" only regenerates the lazy meaningCompassNarrative
  // field, fired-and-forgotten when the user actually opens Ch3.
  scope: z.enum(["all", "meaning-compass"]).optional().default("all"),
});

export const maxDuration = 120;

export const POST = withLogging(
  "/api/regenerate-narratives",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const parsed = await parseBody(request, regenerateNarrativesSchema);
      if ("error" in parsed) return parsed.error;
      const { assessmentId, locale, scope } = parsed.data;

      // Fetch existing profile
      const profile = await getProfileByAssessment(assessmentId);
      if (!profile) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Profile not found",
          404,
        );
      }

      // Ownership check (defence-in-depth — guard already requires auth, but
      // we re-assert here so future tier/auth refactors can't silently turn
      // this into an anonymous-write hole. We also fail closed when either
      // side lacks a userId rather than short-circuiting through truthiness.)
      if (!guard.user) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Authentication required",
          401,
        );
      }
      if (!profile.userId || profile.userId !== guard.user.id) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Profile not found",
          404,
        );
      }

      const algo = profile.algoSnapshot;
      if (!algo) {
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Profile missing algorithm snapshot",
          500,
        );
      }

      if (scope === "meaning-compass") {
        // Lazy single-field path. If it's already present we no-op so a
        // fire-and-forget IntersectionObserver call never wastes an LLM
        // call on idempotent revisits.
        const existing =
          profile.narrativeSnapshots?.meaningCompassNarrative?.trim();
        if (existing && existing.length >= 20) {
          return NextResponse.json({ success: true, skipped: true });
        }
        const narrative = await generateMeaningCompassNarrative(
          profile,
          algo,
          locale,
        );
        if (!narrative) {
          return createErrorResponse(
            ApiErrorCode.INTERNAL_ERROR,
            "Meaning compass narrative did not complete — please try again",
            500,
          );
        }
        await updateProfileNarratives(assessmentId, {
          meaningCompassNarrative: narrative,
          narrativeLocale: locale,
          narrativeInputHash: computeNarrativeInputHash(
            profile.profileInputHash,
            locale,
          ),
          populatedAt: new Date().toISOString(),
        });
        if (guard.user) invalidateUserCache(guard.user.id);
        return NextResponse.json({ success: true });
      }

      // Default: regenerate the 7 required narratives (with provider failover).
      const narratives = await generateIdentityNarratives(
        profile,
        algo,
        locale,
      );

      if (!narratives || !hasCompleteNarratives(narratives)) {
        return createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Narrative generation did not complete — please try again",
          500,
        );
      }

      // Update DB
      await updateProfileNarratives(assessmentId, {
        ...narratives,
        narrativeLocale: locale,
        narrativeInputHash: computeNarrativeInputHash(
          profile.profileInputHash,
          locale,
        ),
        populatedAt: new Date().toISOString(),
      });

      // Invalidate cache so next page load reads fresh profile with narratives
      if (guard.user) {
        invalidateUserCache(guard.user.id);
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/regenerate-narratives", ApiErrorCode.INTERNAL_ERROR, {
        message: "Narrative regeneration error",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to regenerate narratives",
        500,
      );
    }
  },
);
