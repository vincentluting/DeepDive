// ============================================================
// GET /api/journey — Get current user's journey state
//
// Returns: { state: JourneyState, unlocked: { profile, report, coaching } }
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import {
  ApiErrorCode,
  logApiError,
  createErrorResponse,
} from "@/lib/api/api-errors";
import { getJourneyState } from "@/lib/db/journey";
import { deriveUnlocked } from "@/lib/journey/state-machine";

export const GET = withLogging("/api/journey", async (request) => {
  const guard = await guardRoute(request, { tier: "read", requireAuth: true });
  if (guard.blocked) return guard.response;

  try {
    const state = await getJourneyState(guard.user!.id);

    return NextResponse.json({
      state,
      unlocked: deriveUnlocked(state),
    });
  } catch (error) {
    logApiError("/api/journey", ApiErrorCode.INTERNAL_ERROR, {
      message: "Failed to get journey state",
      cause: error,
    });
    return createErrorResponse(
      ApiErrorCode.INTERNAL_ERROR,
      "Failed to load journey state",
      500,
    );
  }
});
