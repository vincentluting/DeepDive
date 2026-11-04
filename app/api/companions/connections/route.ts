// ============================================================
// /api/companions/connections — friend request collection endpoint
//
// POST  — send a friend request (creates 'pending' CompanionConnection)
// GET   — list buckets for the viewer (incoming pending / outgoing pending / accepted)
//
// Per-id actions (accept / decline / unfriend / cancel) live at
// /api/companions/connections/[id]/route.ts.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "@/lib/validation/parse-body";
import { connectionRequestSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import {
  createConnectionRequest,
  getCompanionProfileByUserId,
  getConnectionBucketsWithProfiles,
  isBlockedEitherWay,
} from "@/lib/db/companions";
import { canAccess } from "@/lib/cohort/entitlements";
import { sql } from "@/lib/db/connection";

export const POST = withLogging(
  "/api/companions/connections",
  async (request: NextRequest) => {
    try {
      const gate = await gateCompanionRequest(request, { tier: "write" });
      if (!gate.ok) return gate.response;

      const parsed = await parseBody(request, connectionRequestSchema);
      if ("error" in parsed) return parsed.error;
      const { recipientId, message } = parsed.data;

      // Self-request — surfaces here as 400 even though createConnectionRequest
      // also returns 'self', so we can distinguish from auth errors in clients.
      if (recipientId === gate.userId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "You cannot send a Companion request to yourself.",
          400,
        );
      }

      // Recipient must be a Companion-eligible user with discoverable profile.
      // We verify that here so we don't pollute pending requests with
      // disabled / hidden / wrong-cohort recipients.
      const recipientRows = (await sql`
        SELECT u."cohort", u."socialEnabled", cp."visibility"
        FROM "User" u
        LEFT JOIN "CompanionProfile" cp ON cp."userId" = u."id"
        WHERE u."id" = ${recipientId}
        LIMIT 1
      `) as unknown as Array<{
        cohort: string | null;
        socialEnabled: boolean;
        visibility: string | null;
      }>;

      if (recipientRows.length === 0) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Recipient not found.",
          404,
        );
      }
      const recipient = recipientRows[0];
      // Only DISCOVERABLE profiles are valid request targets. friends_only
      // means "hidden from discovery / only existing friends see me" —
      // accepting new requests would defeat that promise (anyone holding
      // a stale userId, e.g. a former discovery view, could still ping).
      // Hidden / disabled / wrong-cohort users are also rejected.
      const recipientEligible =
        canAccess(recipient.cohort ?? null, "socialFeatures") &&
        recipient.socialEnabled === true &&
        recipient.visibility === "discoverable";
      if (!recipientEligible) {
        // Mask the failure reason — leaking "this user blocked Companion"
        // or "this user is friends_only" would let attackers fingerprint
        // user state.
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Cannot send a request to that user.",
          400,
        );
      }

      // Defence in depth — also enforced inside createConnectionRequest()
      // but we short-circuit here to keep the SQL out of the hot path.
      const blocked = await isBlockedEitherWay(gate.userId, recipientId);
      if (blocked) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Cannot send a request to that user.",
          400,
        );
      }

      // Sender must have a profile (so the recipient sees something useful).
      const senderProfile = await getCompanionProfileByUserId(gate.userId);
      if (!senderProfile) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Create your Companion profile before sending requests.",
          412,
        );
      }

      // Reject hidden senders. Without this check a user could PATCH their
      // visibility to 'hidden' and still send requests; the recipient
      // would see other:null in /connections (because the JOIN nulls
      // hidden peer profiles) and have to act blind. Force the sender
      // to make their profile visible (discoverable | friends_only)
      // before reaching out.
      if (senderProfile.visibility === "hidden") {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Set your Companion profile to discoverable or friends-only before sending requests.",
          412,
        );
      }

      const result = await createConnectionRequest({
        requesterId: gate.userId,
        recipientId,
        requesterMessage: message ?? null,
      });

      if (!result.ok) {
        if (result.reason === "duplicate") {
          return createErrorResponse(
            ApiErrorCode.CONFLICT,
            "You already have a request with this user.",
            409,
          );
        }
        // 'self' was filtered above; 'blocked' falls through to a 400.
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Cannot send a request to that user.",
          400,
        );
      }

      return NextResponse.json({ ok: true, connection: result.connection });
    } catch (err) {
      logApiError("/api/companions/connections", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to send connection request",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to send request. Please try again.",
        500,
      );
    }
  },
);

export const GET = withLogging(
  "/api/companions/connections",
  async (request: NextRequest) => {
    try {
      const gate = await gateCompanionRequest(request, { tier: "read" });
      if (!gate.ok) return gate.response;

      const buckets = await getConnectionBucketsWithProfiles(gate.userId);
      return NextResponse.json({ ok: true, buckets });
    } catch (err) {
      logApiError("/api/companions/connections", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to list connections",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load connections. Please try again.",
        500,
      );
    }
  },
);
