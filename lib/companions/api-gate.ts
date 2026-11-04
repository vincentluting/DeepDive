// ============================================================
// Companion API gate — shared two-layer access check
//
// Layer 1: cohort entitlements.socialFeatures (canAccess)
// Layer 2: User.socialEnabled (per-user opt-in)
// Both must be true before any /api/companions/** route reads or
// writes data. Centralising this here keeps the per-route handlers
// small and prevents drift between routes.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccess } from "@/lib/cohort/entitlements";
import { ApiErrorCode, createErrorResponse } from "@/lib/api/api-errors";
import { getUserSocialEnabled } from "@/lib/db/companions";

export type CompanionGateResult =
  | { ok: true; userId: string; cohort: string | null }
  | { ok: false; response: NextResponse };

type GuardTier = "ai" | "write" | "read" | "admin" | "auth" | "telemetry";

interface GateOptions {
  /** Tier for guardRoute — defaults to 'write'. Use 'read' for GET routes. */
  tier?: GuardTier;
  /** Skip the per-user opt-in check (rare — only for endpoints the user
   *  needs even when toggled off, like reading the toggle state). */
  skipSocialEnabledCheck?: boolean;
}

/**
 * Two-layer gate for any /api/companions/** route.
 *
 * On success: returns `{ ok: true, userId, cohort }`.
 * On failure: returns `{ ok: false, response }` — caller must `return gate.response` immediately.
 */
export async function gateCompanionRequest(
  request: NextRequest,
  opts: GateOptions = {},
): Promise<CompanionGateResult> {
  const guard = await guardRoute(request, {
    tier: opts.tier ?? "write",
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

  const userId = guard.user!.id;

  if (!opts.skipSocialEnabledCheck) {
    const enabled = await getUserSocialEnabled(userId);
    if (!enabled) {
      return {
        ok: false,
        response: createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Enable Companion in Settings before using this feature.",
          403,
        ),
      };
    }
  }

  return { ok: true, userId, cohort: guard.user!.cohort ?? null };
}
