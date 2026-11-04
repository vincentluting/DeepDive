// ============================================================
// POST /api/user/social-toggle — Flip the per-user Companion opt-in
//
// Two-layer access (Companion v1):
//   Layer 1: cohort entitlements.socialFeatures (this route enforces it)
//   Layer 2: User.socialEnabled (this route flips it)
//
// Side-effects:
//   - On enable: leaves the existing CompanionProfile (if any) untouched.
//     The client is expected to call POST /api/companions/profile to create
//     the public profile when none exists, or PATCH to flip visibility back
//     to 'discoverable'.
//   - On disable: hides the public profile (visibility='hidden') without
//     deleting it, so re-enabling later does not lose displayName/bio.
//
// Input:  { enabled: boolean }
// Output: { ok: true, hasProfile: boolean }
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccess } from "@/lib/cohort/entitlements";
import { parseBody } from "@/lib/validation/parse-body";
import { socialToggleSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import {
  setUserSocialEnabled,
  getCompanionProfileByUserId,
} from "@/lib/db/companions";

export const POST = withLogging("/api/user/social-toggle", async (request) => {
  try {
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    // Cohort gate — thesis_2026 must never reach this endpoint
    if (!canAccess(guard.user!.cohort, "socialFeatures")) {
      return createErrorResponse(
        ApiErrorCode.UNAUTHORIZED,
        "Companion is not available for your account.",
        403,
      );
    }

    const parsed = await parseBody(request, socialToggleSchema);
    if ("error" in parsed) return parsed.error;
    const { enabled } = parsed.data;
    const userId = guard.user!.id;

    await setUserSocialEnabled(userId, enabled);

    // We do NOT touch CompanionProfile.visibility here — that field is
    // the user's deliberate privacy choice (discoverable | friends_only |
    // hidden) and would be lost if we overwrote it on every toggle.
    //
    // Discovery / connections / profile-by-id queries all gate on
    // User.socialEnabled = TRUE, so flipping the flag is sufficient
    // to make the user disappear from peer surfaces.
    const existing = await getCompanionProfileByUserId(userId);

    return NextResponse.json({
      ok: true,
      hasProfile: existing !== null,
    });
  } catch (err) {
    logApiError("/api/user/social-toggle", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to toggle social opt-in",
      cause: err,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to update Companion setting. Please try again.",
      500,
    );
  }
});
