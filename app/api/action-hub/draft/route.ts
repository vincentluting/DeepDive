// ============================================================
// POST /api/action-hub/draft — Confirm a coach action draft
//
// Input:  { sessionId, reportId?, title, actions[1..3] }
// Output: { success, planId, itemIds }
// ============================================================

import { NextRequest, NextResponse } from "next/server";

import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import {
  createActionItem,
  createActionPlan,
  getActiveActionPlan,
} from "@/lib/db/action-hub";
import { getCoachingSessionForUser } from "@/lib/db/coaching";
import { sql } from "@/lib/db/connection";
import { parseBody } from "@/lib/validation/parse-body";
import { confirmCoachingActionDraftSchema } from "@/lib/validation/api-schemas";

export const POST = withLogging(
  "/api/action-hub/draft",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;
      const userId = guard.user!.id;

      const parsed = await parseBody(request, confirmCoachingActionDraftSchema);
      if ("error" in parsed) return parsed.error;
      const { sessionId, reportId, title, actions } = parsed.data;

      const session = await getCoachingSessionForUser(sessionId, userId);
      if (!session) {
        return createErrorResponse(
          ApiErrorCode.SESSION_NOT_FOUND,
          "Coaching session not found",
          404,
        );
      }

      let plan = await getActiveActionPlan(userId);
      if (!plan) {
        if (!reportId) {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "A report is required to create an action plan",
            400,
          );
        }
        const reportRows = await sql`
          SELECT "id"
          FROM "CareerReport"
          WHERE "id" = ${reportId} AND "userId" = ${userId}
          LIMIT 1
        `;
        if (reportRows.length === 0) {
          return createErrorResponse(
            ApiErrorCode.SESSION_NOT_FOUND,
            "Career report not found",
            404,
          );
        }
        const planId = crypto.randomUUID();
        await createActionPlan({
          id: planId,
          userId,
          reportId,
          locale: session.locale,
          contextJson: {
            source: "coaching",
            coachingSessionId: sessionId,
            title,
            confirmedAt: new Date().toISOString(),
          },
        });
        plan = {
          id: planId,
          userId,
          reportId,
          status: "active",
          locale: session.locale,
          contextJson: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      const itemIds: string[] = [];
      for (const [index, action] of actions.entries()) {
        const itemId = crypto.randomUUID();
        itemIds.push(itemId);
        await createActionItem({
          id: itemId,
          planId: plan.id,
          userId,
          title: action.title,
          description: action.description,
          category: action.category,
          intensity:
            action.category === "network"
              ? "social"
              : action.category === "create"
                ? "creative"
                : "active",
          priority: 100 - index,
          estimatedMinutes: action.estimatedMinutes,
          sourceDimension: `coaching:${sessionId}`,
        });
      }

      return NextResponse.json({
        success: true,
        planId: plan.id,
        itemIds,
      });
    } catch (error) {
      logApiError("/api/action-hub/draft", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to confirm coaching action draft",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to save action draft",
        500,
      );
    }
  },
);
