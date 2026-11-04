// ============================================================
// /api/companions/profile — Companion public profile (self)
//
// GET   — fetch own profile (or null if not yet onboarded)
// POST  — first-time onboarding; reads archetype + RIASEC scores from
//         the user's latest QuickDiveResult and creates the row
// PATCH — update displayName / bio / visibility on existing profile
//
// All variants enforce two-layer gate:
//   1. cohort entitlements.socialFeatures
//   2. User.socialEnabled = true
// Both must be true.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccess } from "@/lib/cohort/entitlements";
import { parseBody } from "@/lib/validation/parse-body";
import {
  companionProfileCreateSchema,
  companionProfileUpdateSchema,
} from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import {
  getCompanionProfileByUserId,
  setCompanionVisibility,
  upsertCompanionProfile,
} from "@/lib/db/companions";
import { getLatestQuickDiveByUserId } from "@/lib/db/platform";
import { parseArchetypeCode } from "@/lib/companions/compatibility";
import type { CompanionRiasecScores } from "@/lib/types/companion";

const RIASEC_KEYS: ReadonlyArray<"R" | "I" | "A" | "S" | "E" | "C"> = [
  "R",
  "I",
  "A",
  "S",
  "E",
  "C",
];

/** Best-effort coercion of QuickDive scoresJson into a complete RIASEC vector. */
function coerceRiasecScores(
  raw: Record<string, number>,
): CompanionRiasecScores | null {
  const result = {} as CompanionRiasecScores;
  for (const k of RIASEC_KEYS) {
    const v = raw[k];
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    result[k] = v;
  }
  return result;
}

type GateResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Cohort-only gate. Profile management (create/read/update of one's own
 * companion profile) intentionally does NOT enforce User.socialEnabled —
 * because the FIRST profile creation IS the act of opting in (the toggle
 * is flipped after the form submits). Reading and editing while disabled
 * are also useful UX (preserve drafts, surface old bio when re-enabling).
 *
 * Discovery / connections / blocks / reports still enforce both layers
 * via gateCompanionRequest in lib/companions/api-gate.ts.
 */
async function gateRequest(request: NextRequest): Promise<GateResult> {
  const guard = await guardRoute(request, {
    tier: "write",
    requireAuth: true,
  });
  if (guard.blocked) return { ok: false, response: guard.response };

  if (!canAccess(guard.user!.cohort, "socialFeatures")) {
    return {
      ok: false,
      response: createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Companion is not available for your account.",
        403,
      ),
    };
  }

  return { ok: true, userId: guard.user!.id };
}

export const GET = withLogging("/api/companions/profile", async (request) => {
  try {
    const gate = await gateRequest(request);
    if (!gate.ok) return gate.response;

    const profile = await getCompanionProfileByUserId(gate.userId);
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logApiError("/api/companions/profile", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to read companion profile",
      cause: err,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to load profile. Please try again.",
      500,
    );
  }
});

export const POST = withLogging("/api/companions/profile", async (request) => {
  try {
    const gate = await gateRequest(request);
    if (!gate.ok) return gate.response;

    const parsed = await parseBody(request, companionProfileCreateSchema);
    if ("error" in parsed) return parsed.error;

    const quickDive = await getLatestQuickDiveByUserId(gate.userId);
    if (!quickDive) {
      // Onboarding precondition: must have completed Quick Dive
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Complete Quick Dive before creating your Companion profile.",
        412,
      );
    }

    const scores = coerceRiasecScores(quickDive.scoresJson);
    if (!scores) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Quick Dive scores are incomplete; please retake before joining Companion.",
        412,
      );
    }

    // Verify the archetype code is in the canonical 12-type form
    // ("R-enhancement", "I-transcendence", etc.). Legacy QuickDiveResult
    // rows from earlier scoring versions stored single-letter codes ("A")
    // or RIASEC duos ("RE") that compatibility.parseArchetypeCode can't
    // parse — those users would silently get zero discovery matches.
    // Force a retake instead of writing an unusable profile.
    if (!parseArchetypeCode(quickDive.archetypeCode)) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "Your Quick Dive result predates the 12-type archetype system. Retake Quick Dive to enable Companion.",
        412,
      );
    }

    const profile = await upsertCompanionProfile({
      userId: gate.userId,
      displayName: parsed.data.displayName,
      bio: parsed.data.bio ?? null,
      archetypeCode: quickDive.archetypeCode,
      scoresJson: scores,
      locale: parsed.data.locale,
      visibility: parsed.data.visibility ?? "discoverable",
    });

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logApiError("/api/companions/profile", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to create companion profile",
      cause: err,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to create profile. Please try again.",
      500,
    );
  }
});

export const PATCH = withLogging("/api/companions/profile", async (request) => {
  try {
    const gate = await gateRequest(request);
    if (!gate.ok) return gate.response;

    const parsed = await parseBody(request, companionProfileUpdateSchema);
    if ("error" in parsed) return parsed.error;

    const existing = await getCompanionProfileByUserId(gate.userId);
    if (!existing) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        "No Companion profile to update — create one via POST first.",
        404,
      );
    }

    // visibility-only updates take a fast path so we don't re-write all fields
    if (
      parsed.data.visibility !== undefined &&
      parsed.data.displayName === undefined &&
      parsed.data.bio === undefined
    ) {
      await setCompanionVisibility(gate.userId, parsed.data.visibility);
      const refreshed = await getCompanionProfileByUserId(gate.userId);
      return NextResponse.json({ ok: true, profile: refreshed });
    }

    const profile = await upsertCompanionProfile({
      userId: gate.userId,
      displayName: parsed.data.displayName ?? existing.displayName,
      bio: parsed.data.bio !== undefined ? parsed.data.bio : existing.bio,
      archetypeCode: existing.archetypeCode,
      scoresJson: existing.scoresJson,
      locale: existing.locale,
      visibility: parsed.data.visibility ?? existing.visibility,
    });

    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    logApiError("/api/companions/profile", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to update companion profile",
      cause: err,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to update profile. Please try again.",
      500,
    );
  }
});
