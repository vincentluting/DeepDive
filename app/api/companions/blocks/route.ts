// ============================================================
// /api/companions/blocks — block other Companion users
//
// POST — block a user (creates / refreshes a CompanionBlock row;
//        also severs any existing CompanionConnection between them
//        so the relationship can't surface in the Friends tab)
// GET  — list users I've blocked (for a Settings affordance later;
//        v1 doesn't render a UI for this but the endpoint exists)
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { parseBody } from "@/lib/validation/parse-body";
import { companionBlockSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { gateCompanionRequest } from "@/lib/companions/api-gate";
import { createBlock, listBlocksByBlocker } from "@/lib/db/companions";
import { sql } from "@/lib/db/connection";

export const POST = withLogging(
  "/api/companions/blocks",
  async (request: NextRequest) => {
    try {
      // Safety endpoint — let the user block even after they've disabled
      // Companion. Without skipSocialEnabledCheck, a user disabling after
      // an incident would be unable to block the offender until they
      // re-enable, which is an unsafe recovery path.
      const gate = await gateCompanionRequest(request, {
        tier: "write",
        skipSocialEnabledCheck: true,
      });
      if (!gate.ok) return gate.response;

      const parsed = await parseBody(request, companionBlockSchema);
      if ("error" in parsed) return parsed.error;
      const { blockedId, reason } = parsed.data;

      if (blockedId === gate.userId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "You cannot block yourself.",
          400,
        );
      }

      // Block first, then sever any existing connection between us.
      // Order matters so the next page render of either side's discover/
      // connections views already excludes the row.
      const block = await createBlock({
        blockerId: gate.userId,
        blockedId,
        reason: reason ?? null,
      });

      // Severing here is hard-delete. CompanionConnection has no soft-delete
      // for v1; reasoning is that "you blocked them" already retains audit
      // history via CompanionBlock.
      await sql`
        DELETE FROM "CompanionConnection"
        WHERE ("requesterId" = ${gate.userId} AND "recipientId" = ${blockedId})
           OR ("requesterId" = ${blockedId} AND "recipientId" = ${gate.userId})
      `;

      return NextResponse.json({ ok: true, block });
    } catch (err) {
      logApiError("/api/companions/blocks", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to create block",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to block user. Please try again.",
        500,
      );
    }
  },
);

export const GET = withLogging(
  "/api/companions/blocks",
  async (request: NextRequest) => {
    try {
      // Safety endpoint — see POST handler comment.
      const gate = await gateCompanionRequest(request, {
        tier: "read",
        skipSocialEnabledCheck: true,
      });
      if (!gate.ok) return gate.response;

      const blocks = await listBlocksByBlocker(gate.userId);
      return NextResponse.json({ ok: true, blocks });
    } catch (err) {
      logApiError("/api/companions/blocks", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to list blocks",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load blocks. Please try again.",
        500,
      );
    }
  },
);
