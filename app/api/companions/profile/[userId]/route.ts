// ============================================================
// GET /api/companions/profile/[userId] — view another user's
//      Companion profile.
//
// Visibility rules:
//   - Caller must pass the standard two-layer gate
//     (cohort entitlement + socialEnabled)
//   - Target's profile must exist
//   - If neither side is friends, target.visibility must be 'discoverable'
//     (preview view used in Discover)
//   - If they're accepted friends, any non-'hidden' visibility is shown
//   - Mutual block in either direction → 404 (don't leak existence)
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import {
  areFriends,
  getCompanionProfileByUserId,
  isBlockedEitherWay,
} from "@/lib/db/companions";
import { canAccess } from "@/lib/cohort/entitlements";
import { sql } from "@/lib/db/connection";
import { toPublicCompanionProfile } from "@/lib/types/companion";

export const GET = withLogging(
  "/api/companions/profile/[userId]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const gate = await gateCompanionRequest(request, { tier: "read" });
      if (!gate.ok) return gate.response;

      const { userId: targetId } = await context.params;
      if (!targetId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "User id is required.",
          400,
        );
      }

      // Reading my own profile via this route — bounce to the canonical
      // self-read at /api/companions/profile.
      if (targetId === gate.userId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Use /api/companions/profile to read your own profile.",
          400,
        );
      }

      // Block defence — never confirm a blocked user exists.
      if (await isBlockedEitherWay(gate.userId, targetId)) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Profile not found.",
          404,
        );
      }

      // Target's own cohort + socialEnabled must hold (defence in depth).
      const userRows = (await sql`
        SELECT "cohort", "socialEnabled" FROM "User"
        WHERE "id" = ${targetId} LIMIT 1
      `) as unknown as Array<{ cohort: string | null; socialEnabled: boolean }>;
      if (
        userRows.length === 0 ||
        !canAccess(userRows[0].cohort ?? null, "socialFeatures") ||
        !userRows[0].socialEnabled
      ) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Profile not found.",
          404,
        );
      }

      const profile = await getCompanionProfileByUserId(targetId);
      if (!profile) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Profile not found.",
          404,
        );
      }
      if (profile.visibility === "hidden") {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Profile not found.",
          404,
        );
      }

      const friend = await areFriends(gate.userId, targetId);

      // Discoverable strangers see a preview; friends see everything except
      // hidden. friends_only requires friendship.
      //
      // We return 404 (not 403) so a non-friend holding a stale userId
      // (e.g. someone who saw the user before they switched to friends_only)
      // can't fingerprint the user's privacy state by distinguishing
      // "exists but private" from "doesn't exist". This matches the 404
      // surfaces used for hidden / disabled / blocked above.
      if (profile.visibility === "friends_only" && !friend) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Profile not found.",
          404,
        );
      }

      // Privacy: strip raw RIASEC scoresJson before sending to peer.
      return NextResponse.json({
        ok: true,
        profile: toPublicCompanionProfile(profile),
        isFriend: friend,
      });
    } catch (err) {
      logApiError(
        "/api/companions/profile/[userId]",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to read companion profile",
          cause: err,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load profile. Please try again.",
        500,
      );
    }
  },
);
