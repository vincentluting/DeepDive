// ============================================================
// GET /api/companions/discover — Top-N compatibility-ranked candidates
//
// Discovery defends users with five filters BEFORE compatibility ranking:
//   1. visibility = 'discoverable'           (user wants to be found)
//   2. NOT viewer themselves
//   3. NOT in a cohort that hides social features (canAccess gate)
//      AND target user has socialEnabled = true
//   4. NO mutual CompanionBlock in either direction
//   5. NO CompanionConnection in 'pending' or 'accepted' state
//
// Compatibility scoring runs in JS over a candidate window (max 200 rows)
// pulled by SQL, then we sort and slice to Top-N. This keeps the SQL
// simple (no in-DB cosine math) and the per-request cost predictable.
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccess } from "@/lib/cohort/entitlements";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { sql } from "@/lib/db/connection";
import {
  getCompanionProfileByUserId,
  getUserSocialEnabled,
} from "@/lib/db/companions";
import { computeCompatibility } from "@/lib/companions/compatibility";
import {
  toPublicCompanionProfile,
  type CompanionCandidate,
  type CompanionProfile,
  type CompanionRiasecScores,
} from "@/lib/types/companion";

const CANDIDATE_WINDOW = 200;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

interface CandidateRow {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  archetypeCode: string;
  scoresJson: CompanionRiasecScores;
  locale: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  cohort: string | null;
}

function rowToProfile(r: CandidateRow): CompanionProfile {
  return {
    id: r.id,
    userId: r.userId,
    displayName: r.displayName,
    bio: r.bio,
    archetypeCode: r.archetypeCode,
    scoresJson: r.scoresJson,
    locale: r.locale === "zh" ? "zh" : "en",
    visibility:
      r.visibility === "discoverable" ||
      r.visibility === "friends_only" ||
      r.visibility === "hidden"
        ? r.visibility
        : "hidden",
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export const GET = withLogging(
  "/api/companions/discover",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "read",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      // Layer 1 — cohort entitlement
      if (!canAccess(guard.user!.cohort, "socialFeatures")) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Companion is not available for your account.",
          403,
        );
      }

      const userId = guard.user!.id;

      // Layer 2 — per-user opt-in
      const enabled = await getUserSocialEnabled(userId);
      if (!enabled) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Enable Companion in Settings to view discovery.",
          403,
        );
      }

      // Viewer must have a discoverable profile to play in discovery
      const viewerProfile = await getCompanionProfileByUserId(userId);
      if (!viewerProfile) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Create your Companion profile first.",
          412,
        );
      }

      const url = new URL(request.url);
      const rawLimit = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);
      const limit = Math.max(
        1,
        Math.min(
          MAX_LIMIT,
          Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT,
        ),
      );

      // Single SQL pulls candidates with cohort joined. All exclusion
      // filters live in WHERE so we never load thesis users / blocked
      // users / existing connections into JS.
      const rows = (await sql`
        SELECT
          cp."id",
          cp."userId",
          cp."displayName",
          cp."bio",
          cp."archetypeCode",
          cp."scoresJson",
          cp."locale",
          cp."visibility",
          cp."createdAt",
          cp."updatedAt",
          u."cohort"
        FROM "CompanionProfile" cp
        INNER JOIN "User" u ON u."id" = cp."userId"
        WHERE cp."visibility" = 'discoverable'
          AND u."socialEnabled" = TRUE
          AND cp."userId" <> ${userId}
          AND NOT EXISTS (
            SELECT 1 FROM "CompanionBlock" b
            WHERE (b."blockerId" = ${userId} AND b."blockedId" = cp."userId")
               OR (b."blockerId" = cp."userId" AND b."blockedId" = ${userId})
          )
          AND NOT EXISTS (
            -- Exclude any pending/accepted relationship AND past 'declined'
            -- rows. The DB still keeps declined rows (rate-limit purpose),
            -- so resurfacing the same person here would lead to a 409 on the
            -- next request attempt — we drop them from discovery instead.
            SELECT 1 FROM "CompanionConnection" c
            WHERE c."status" IN ('pending', 'accepted', 'declined')
              AND (
                   (c."requesterId" = ${userId} AND c."recipientId" = cp."userId")
                OR (c."requesterId" = cp."userId" AND c."recipientId" = ${userId})
              )
          )
        ORDER BY cp."updatedAt" DESC
        LIMIT ${CANDIDATE_WINDOW}
      `) as unknown as CandidateRow[];

      // Defence in depth — even though socialEnabled implies a
      // socialFeatures-granting cohort today, we re-check via canAccess
      // so a future cohort flip doesn't accidentally leak.
      const safeRows = rows.filter((r) =>
        canAccess(r.cohort ?? null, "socialFeatures"),
      );

      const candidates: CompanionCandidate[] = [];
      for (const row of safeRows) {
        const profile = rowToProfile(row);
        const compat = computeCompatibility(viewerProfile, profile);
        if (!compat) continue; // unparseable archetype — skip
        // Privacy: strip raw RIASEC scoresJson before sending to client.
        // Compatibility math is server-side; client only needs the score.
        candidates.push({
          profile: toPublicCompanionProfile(profile),
          compatibility: compat,
        });
      }

      candidates.sort((a, b) => b.compatibility.score - a.compatibility.score);

      return NextResponse.json({
        ok: true,
        candidates: candidates.slice(0, limit),
      });
    } catch (err) {
      logApiError("/api/companions/discover", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to load companion discovery",
        cause: err,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to load discovery. Please try again.",
        500,
      );
    }
  },
);
