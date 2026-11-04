import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import {
  saveInviteCode,
  listInviteCodes,
  getClaimedUsersProgress,
  toggleInviteCode,
  updateInviteCodeNote,
  deleteInviteCode,
  type ClaimedUserStep,
} from "@/lib/db/invite-codes";
import { isCohortActive } from "@/lib/cohort/config";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";

// ── GET: List all invite codes ──────────────────────────────
export const GET = withLogging(
  "/api/admin/invite-codes",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const codes = await listInviteCodes();

      // Reverse-resolve who claimed each code → email + furthest pipeline step.
      const claimedIds = Array.from(
        new Set(codes.flatMap((c) => c.claimedByUserIds)),
      );
      const progress = await getClaimedUsersProgress(claimedIds);
      const userProgress: Record<
        string,
        {
          email: string;
          name: string | null;
          furthestStep: ClaimedUserStep;
          createdAt: string;
          updatedAt: string;
          country: string | null;
          language: string | null;
        }
      > = {};
      for (const p of progress) {
        userProgress[p.userId] = {
          email: p.email,
          name: p.name,
          furthestStep: p.furthestStep,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          country: p.country,
          language: p.language,
        };
      }

      return NextResponse.json({ codes, userProgress });
    } catch (error) {
      logApiError("/api/admin/invite-codes", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to list invite codes",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);

// ── POST: Create a new invite code ──────────────────────────
const createInviteCodeSchema = z.object({
  code: z.string().min(3).max(50),
  cohortId: z.string().min(1).max(100),
  maxUses: z.number().int().min(1).max(10000).optional(),
  expiresAt: z.string().datetime().optional(),
  researchGroup: z.enum(["classic", "immersive"]).optional(),
});

export const POST = withLogging(
  "/api/admin/invite-codes",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, createInviteCodeSchema);
    if ("error" in parsed) return parsed.error;

    const { code, cohortId, maxUses, expiresAt, researchGroup } = parsed.data;

    // Validate cohortId references an active cohort
    if (!isCohortActive(cohortId)) {
      return createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        `Cohort "${cohortId}" is not active or does not exist`,
        400,
      );
    }

    try {
      const inviteCode = await saveInviteCode({
        code: code.toUpperCase(),
        cohortId,
        createdBy: guard.user!.id,
        maxUses: maxUses ?? 100,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        researchGroup: researchGroup ?? null,
      });

      return NextResponse.json({ inviteCode }, { status: 201 });
    } catch (error) {
      // Handle unique constraint violation (duplicate code)
      // Postgres error code 23505 = unique_violation
      const pgCode = (error as { code?: string }).code;
      if (pgCode === "23505") {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          `Invite code "${code.toUpperCase()}" already exists`,
          409,
        );
      }

      logApiError("/api/admin/invite-codes", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to create invite code",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);

// ── PATCH: Update invite code (toggle active status and/or assignment note) ──
const patchInviteCodeSchema = z
  .object({
    codeId: z.string().min(1),
    isActive: z.boolean().optional(),
    adminNote: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.isActive !== undefined || d.adminNote !== undefined, {
    message: "Nothing to update: provide isActive and/or adminNote",
  });

export const PATCH = withLogging(
  "/api/admin/invite-codes",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, patchInviteCodeSchema);
    if ("error" in parsed) return parsed.error;

    const { codeId, isActive, adminNote } = parsed.data;

    try {
      if (isActive !== undefined) {
        await toggleInviteCode(codeId, isActive);
      }
      if (adminNote !== undefined) {
        await updateInviteCodeNote(codeId, adminNote);
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/admin/invite-codes", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to update invite code",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);

// ── DELETE: Permanently remove an invite code ───────────────
const deleteInviteCodeSchema = z.object({
  codeId: z.string().min(1),
});

export const DELETE = withLogging(
  "/api/admin/invite-codes",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, deleteInviteCodeSchema);
    if ("error" in parsed) return parsed.error;

    try {
      const result = await deleteInviteCode(parsed.data.codeId);
      if (!result.deleted) {
        if (result.reason === "not_found") {
          return createErrorResponse(
            ApiErrorCode.VALIDATION_ERROR,
            "Invite code not found",
            404,
          );
        }
        if (result.reason === "has_usage") {
          return createErrorResponse(
            ApiErrorCode.CONFLICT,
            "Cannot delete an invite code that has been claimed. Deactivate it instead.",
            409,
          );
        }
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      logApiError("/api/admin/invite-codes", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to delete invite code",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Internal server error",
        500,
      );
    }
  },
);
