// ============================================================
// /api/companions/connections/[id] — per-connection actions
//
// PATCH  — recipient accepts or declines a 'pending' request
// DELETE — either side removes the row (unfriend an accepted, or
//          cancel a sent request, or recipient hard-deletes a
//          declined row they no longer want to see)
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "@/lib/validation/parse-body";
import { connectionDecisionSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  deleteConnection,
  getCompanionProfileByUserId,
  getConnectionById,
  getUserSocialEnabled,
  isBlockedEitherWay,
} from "@/lib/db/companions";
import { canAccess } from "@/lib/cohort/entitlements";
import { sql } from "@/lib/db/connection";

export const PATCH = withLogging(
  "/api/companions/connections/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const gate = await gateCompanionRequest(request, { tier: "write" });
      if (!gate.ok) return gate.response;

      const { id } = await context.params;
      if (!id) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Connection id is required.",
          400,
        );
      }

      const parsed = await parseBody(request, connectionDecisionSchema);
      if ("error" in parsed) return parsed.error;
      const { action } = parsed.data;

      // Verify the row exists and the caller is its recipient.
      // (acceptConnectionRequest / declineConnectionRequest both guard
      // on recipientId AND status='pending', but failing fast here lets
      // us return a clear 404 vs. 409 instead of one ambiguous response.)
      const conn = await getConnectionById(id);
      if (!conn) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Connection not found.",
          404,
        );
      }
      if (conn.recipientId !== gate.userId) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Only the recipient can accept or decline this request.",
          403,
        );
      }
      if (conn.status !== "pending") {
        return createErrorResponse(
          ApiErrorCode.CONFLICT,
          "This request has already been resolved.",
          409,
        );
      }

      // For accept (only): re-validate the requester's eligibility
      // BEFORE flipping the row to 'accepted'. Between sending the
      // pending request and now, the requester could have:
      //   - disabled Companion (User.socialEnabled = false)
      //   - moved to a cohort without socialFeatures
      //   - hidden their profile (visibility = 'hidden')
      //   - been involved in a new mutual block
      // Without this re-check, the recipient would land in an
      // accepted friendship with someone they can no longer see in
      // /connections (rendered as "—"), which is worse than just
      // 409'ing the stale request.
      // Decline / cancel paths skip these checks — denying or removing
      // a stale request is always safe.
      if (action === "accept") {
        const requesterRows = (await sql`
          SELECT "cohort", "socialEnabled" FROM "User"
          WHERE "id" = ${conn.requesterId} LIMIT 1
        `) as unknown as Array<{
          cohort: string | null;
          socialEnabled: boolean;
        }>;
        const requesterEligible =
          requesterRows.length > 0 &&
          canAccess(requesterRows[0].cohort ?? null, "socialFeatures") &&
          requesterRows[0].socialEnabled === true;
        if (!requesterEligible) {
          return createErrorResponse(
            ApiErrorCode.CONFLICT,
            "The requester is no longer available.",
            409,
          );
        }

        const requesterProfile = await getCompanionProfileByUserId(
          conn.requesterId,
        );
        if (!requesterProfile || requesterProfile.visibility === "hidden") {
          return createErrorResponse(
            ApiErrorCode.CONFLICT,
            "The requester is no longer available.",
            409,
          );
        }

        // Re-check mutual block — the requester or the recipient may
        // have blocked each other after the request was sent.
        if (await isBlockedEitherWay(gate.userId, conn.requesterId)) {
          return createErrorResponse(
            ApiErrorCode.CONFLICT,
            "The requester is no longer available.",
            409,
          );
        }

        // Belt-and-braces — also checks that the viewer (recipient)
        // is still socialEnabled. Their socialEnabled was already
        // verified by gateCompanionRequest, but a race between gate
        // and now could matter.
        const recipientEnabled = await getUserSocialEnabled(gate.userId);
        if (!recipientEnabled) {
          return createErrorResponse(
            ApiErrorCode.UNAUTHORIZED,
            "Re-enable Companion in Settings before accepting requests.",
            403,
          );
        }
      }

      const transitioned =
        action === "accept"
          ? await acceptConnectionRequest(id, gate.userId)
          : await declineConnectionRequest(id, gate.userId);

      if (!transitioned) {
        // A concurrent request flipped the state between our SELECT and
        // our UPDATE. Surface as 409 — the client should re-fetch.
        return createErrorResponse(
          ApiErrorCode.CONFLICT,
          "Request was already resolved.",
          409,
        );
      }

      return NextResponse.json({ ok: true, action });
    } catch (err) {
      logApiError(
        "/api/companions/connections/[id]",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to act on connection",
          cause: err,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to update connection. Please try again.",
        500,
      );
    }
  },
);

export const DELETE = withLogging(
  "/api/companions/connections/[id]",
  async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ) => {
    try {
      const gate = await gateCompanionRequest(request, { tier: "write" });
      if (!gate.ok) return gate.response;

      const { id } = await context.params;
      if (!id) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Connection id is required.",
          400,
        );
      }

      // deleteConnection itself enforces (requesterId = caller OR recipientId = caller).
      // We surface 404 when the WHERE matched nothing — covers both
      // "row doesn't exist" and "row exists but caller doesn't own it".
      const removed = await deleteConnection(id, gate.userId);
      if (!removed) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Connection not found or you do not own it.",
          404,
        );
      }

      return NextResponse.json({ ok: true });
    } catch (err) {
      logApiError(
        "/api/companions/connections/[id]",
        ApiErrorCode.INTERNAL_ERROR,
        {
          message: "Failed to delete connection",
          cause: err,
        },
      );
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to remove connection. Please try again.",
        500,
      );
    }
  },
);
