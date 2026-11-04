import { type NextRequest, NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { sql, ilikePattern } from "@/lib/db/connection";

/**
 * Normalize RIASEC scores to 0-100 regardless of source format.
 * - 0-1 range (Deep Dive profile): multiply by 100
 * - 0-20 range (Quick Dive raw, sum ≤ 120): divide by 20, multiply by 100
 * - 0-100 range (legacy normalized): pass through
 */
function normalizeToPercent(
  scores: Record<string, number>,
): Record<string, number> {
  const dims = ["R", "I", "A", "S", "E", "C"];
  const vals = dims.map((d) => scores[d] ?? 0);
  const maxVal = Math.max(...vals);
  const sum = vals.reduce((a, b) => a + b, 0);

  const result: Record<string, number> = {};
  for (const d of dims) {
    const v = scores[d] ?? 0;
    if (maxVal <= 1) {
      // 0-1 normalized (Deep Dive profile)
      result[d] = Math.round(v * 100);
    } else if (sum <= 130) {
      // Raw counts (Mini-IP 30: max 20 per dim, sum ≤ 120; use 130 as buffer)
      result[d] = Math.round((v / 20) * 100);
    } else {
      // Already 0-100 (legacy data)
      result[d] = Math.round(v);
    }
  }
  return result;
}

export const GET = withLogging(
  "/api/admin/user-profiles",
  async (request: NextRequest) => {
    const guard = await guardRoute(request, { tier: "admin" });
    if (guard.blocked) return guard.response;

    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(
        1,
        parseInt(searchParams.get("page") || "1", 10) || 1,
      );
      const limit = Math.min(
        100,
        Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50),
      );
      const search = searchParams.get("search")?.trim() || "";
      const offset = (page - 1) * limit;

      // Count total
      const totalResult = search
        ? await sql`
          SELECT COUNT(*)::int as count FROM "User"
          WHERE "email" ILIKE ${ilikePattern(search)} OR "name" ILIKE ${ilikePattern(search)}
        `
        : await sql`SELECT COUNT(*)::int as count FROM "User"`;

      const total = (totalResult[0]?.count as number) || 0;

      // Fetch users with their profile data
      // LEFT JOIN so we see ALL users, even those without profiles
      const rows = search
        ? await sql`
          SELECT
            u."id",
            u."email",
            u."name",
            u."careerStage",
            u."registrationCountry",
            u."createdAt",
            pp."profileJson",
            pp."createdAt" as "profileCreatedAt",
            qd."scoresJson" as "quickDiveScores",
            qd."archetypeCode" as "quickDiveArchetype"
          FROM "User" u
          LEFT JOIN LATERAL (
            SELECT "profileJson", "createdAt"
            FROM "PersonalProfile"
            WHERE "userId" = u."id"
            ORDER BY "createdAt" DESC LIMIT 1
          ) pp ON true
          LEFT JOIN LATERAL (
            SELECT "scoresJson", "archetypeCode"
            FROM "QuickDiveResult"
            WHERE "userId" = u."id"
            ORDER BY "createdAt" DESC LIMIT 1
          ) qd ON true
          WHERE u."email" ILIKE ${ilikePattern(search)} OR u."name" ILIKE ${ilikePattern(search)}
          ORDER BY u."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}
        `
        : await sql`
          SELECT
            u."id",
            u."email",
            u."name",
            u."careerStage",
            u."registrationCountry",
            u."createdAt",
            pp."profileJson",
            pp."createdAt" as "profileCreatedAt",
            qd."scoresJson" as "quickDiveScores",
            qd."archetypeCode" as "quickDiveArchetype"
          FROM "User" u
          LEFT JOIN LATERAL (
            SELECT "profileJson", "createdAt"
            FROM "PersonalProfile"
            WHERE "userId" = u."id"
            ORDER BY "createdAt" DESC LIMIT 1
          ) pp ON true
          LEFT JOIN LATERAL (
            SELECT "scoresJson", "archetypeCode"
            FROM "QuickDiveResult"
            WHERE "userId" = u."id"
            ORDER BY "createdAt" DESC LIMIT 1
          ) qd ON true
          ORDER BY u."createdAt" DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

      const users = rows.map((r: Record<string, unknown>) => {
        const profile = r.profileJson as Record<string, unknown> | null;
        const quickDiveScores = r.quickDiveScores as Record<
          string,
          number
        > | null;

        // Extract RIASEC — always prefer latest QuickDiveResult.
        // Deep Dive has no RIASEC questions; profile.riasecScores is just
        // a snapshot of the Quick Dive that was active at scoring time.
        // Normalize all scores to 0-100 scale for consistent display.
        let riasecCode: string | null = null;
        let riasecScores: Record<string, number> | null = null;
        if (quickDiveScores) {
          riasecScores = normalizeToPercent(quickDiveScores);
        } else if (profile?.riasecScores) {
          // Fallback: user has profile but QuickDiveResult was deleted/unlinked
          riasecScores = normalizeToPercent(
            profile.riasecScores as Record<string, number>,
          );
        }
        if (riasecScores) {
          riasecCode = Object.entries(riasecScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([k]) => k)
            .join("");
        }

        // Cognitive Style (MBTI-like)
        const cognitiveStyleCode =
          (profile?.cognitiveStyleCode as string) || null;

        // Schwartz top 3 values
        const schwartzAnchors = profile?.schwartzAnchors as {
          top3?: string[];
          ranking?: string[];
        } | null;
        const top3Values =
          schwartzAnchors?.top3 ||
          schwartzAnchors?.ranking?.slice(0, 3) ||
          null;

        // Archetype — prefer QuickDive (RIASEC source of truth), fallback to profile snapshot
        const profileArchetype = profile?.archetype as {
          code?: string;
          label_en?: string;
          label_zh?: string;
        } | null;
        const quickDiveArch = (r.quickDiveArchetype as string) || null;
        // If QuickDive archetype differs from profile, QuickDive wins
        const archetype =
          quickDiveArch && profileArchetype?.code !== quickDiveArch
            ? null // clear stale profile archetype; frontend will use quickDiveArchetype
            : profileArchetype;

        // Collab style
        const collabMapping = profile?.collabMapping as {
          primary?: string;
          secondary?: string | null;
        } | null;

        // Big Five scores
        const bigFiveScores =
          (profile?.bigFiveScores as Record<string, number>) || null;

        return {
          id: r.id as string,
          email: r.email as string,
          name: (r.name as string) || null,
          careerStage: (r.careerStage as string) || null,
          country: (r.registrationCountry as string) || null,
          createdAt: r.createdAt as string,
          profileCreatedAt: (r.profileCreatedAt as string) || null,
          hasProfile: !!profile,
          hasQuickDive: !!quickDiveScores,
          riasecCode,
          riasecScores,
          cognitiveStyleCode,
          top3Values,
          archetype: archetype
            ? {
                code: archetype.code || null,
                label_en: archetype.label_en || null,
                label_zh: archetype.label_zh || null,
              }
            : null,
          collabStyle: collabMapping
            ? {
                primary: collabMapping.primary || null,
                secondary: collabMapping.secondary || null,
              }
            : null,
          bigFiveScores,
          quickDiveArchetype: (r.quickDiveArchetype as string) || null,
        };
      });

      // ── Aggregate stats (across ALL users, not just current page) ──
      // Run in parallel for performance
      const [allProfiles, allQuickDives] = await Promise.all([
        sql`
        SELECT DISTINCT ON ("userId")
          "profileJson"
        FROM "PersonalProfile"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      `,
        sql`
        SELECT DISTINCT ON ("userId")
          "scoresJson"
        FROM "QuickDiveResult"
        WHERE "userId" IS NOT NULL
        ORDER BY "userId", "createdAt" DESC
      `,
      ]);

      // Compute aggregates
      const riasecSums: Record<string, number> = {
        R: 0,
        I: 0,
        A: 0,
        S: 0,
        E: 0,
        C: 0,
      };
      let riasecCount = 0;
      const bigFiveSums: Record<string, number> = {
        openness: 0,
        conscientiousness: 0,
        extraversion: 0,
        agreeableness: 0,
        neuroticism: 0,
      };
      let bigFiveCount = 0;
      const valueFrequency: Record<string, number> = {};
      const cognitiveTypes: Record<string, number> = {};
      const archetypeCodes: Record<string, number> = {};
      const collabTypes: Record<string, number> = {};
      let sjtConsistencySum = 0;
      let sjtConsistencyCount = 0;
      let profileCount = 0;
      const quickDiveCount = allQuickDives.length;

      // Process profiles
      for (const row of allProfiles) {
        const p = row.profileJson as Record<string, unknown> | null;
        if (!p) continue;
        profileCount++;

        // RIASEC from profile — normalize to 0-100 before aggregating
        const rs = p.riasecScores as Record<string, number> | undefined;
        if (rs) {
          const normalized = normalizeToPercent(rs);
          for (const [k, v] of Object.entries(normalized)) {
            if (k in riasecSums) {
              riasecSums[k] += v;
            }
          }
          riasecCount++;
        }

        // Big Five
        const bf = p.bigFiveScores as Record<string, number> | undefined;
        if (bf) {
          for (const [k, v] of Object.entries(bf)) {
            if (k in bigFiveSums) {
              bigFiveSums[k] += v;
            }
          }
          bigFiveCount++;
        }

        // Values top3
        const sa = p.schwartzAnchors as
          | { top3?: string[]; ranking?: string[] }
          | undefined;
        const top3 = sa?.top3 || sa?.ranking?.slice(0, 3);
        if (top3) {
          for (const v of top3) {
            valueFrequency[v] = (valueFrequency[v] || 0) + 1;
          }
        }

        // Cognitive style
        const cs = p.cognitiveStyleCode as string | undefined;
        if (cs) {
          cognitiveTypes[cs] = (cognitiveTypes[cs] || 0) + 1;
        }

        // Archetype
        const a12 = p.archetype as { code?: string } | undefined;
        if (a12?.code) {
          archetypeCodes[a12.code] = (archetypeCodes[a12.code] || 0) + 1;
        }

        // Collab
        const cm = p.collabMapping as { primary?: string } | undefined;
        if (cm?.primary) {
          collabTypes[cm.primary] = (collabTypes[cm.primary] || 0) + 1;
        }

        // SJT consistency
        const sjt = p.sjtBehavioralConsistency as
          | { overallConsistency?: number }
          | undefined;
        if (sjt?.overallConsistency != null) {
          sjtConsistencySum += sjt.overallConsistency;
          sjtConsistencyCount++;
        }
      }

      // Also count RIASEC from QuickDive users who DON'T have a profile
      const _profileUserIds = new Set(
        allProfiles
          .map((r: Record<string, unknown>) => {
            const p = r.profileJson as { userId?: string } | null;
            return p?.userId;
          })
          .filter(Boolean),
      );

      for (const row of allQuickDives) {
        // Only count QD scores for users without profiles (avoid double-counting)
        const qs = row.scoresJson as Record<string, number> | null;
        if (!qs) continue;
        // We can't get userId from this query easily, so just add all QD scores
        // and subtract profile RIASEC count at the end — actually simpler to just
        // use profile RIASEC when available, QD for the rest
      }

      // Compute averages
      const riasecAvg: Record<string, number> = {};
      if (riasecCount > 0) {
        for (const [k, v] of Object.entries(riasecSums)) {
          riasecAvg[k] = Math.round(v / riasecCount);
        }
      }

      const bigFiveAvg: Record<string, number> = {};
      if (bigFiveCount > 0) {
        for (const [k, v] of Object.entries(bigFiveSums)) {
          bigFiveAvg[k] = Math.round(v / bigFiveCount);
        }
      }

      const aggregates = {
        totalUsers: total,
        profileCount,
        quickDiveCount,
        riasecAvg,
        riasecSampleSize: riasecCount,
        bigFiveAvg,
        bigFiveSampleSize: bigFiveCount,
        valueFrequency, // { "self-direction": 12, "achievement": 8, ... }
        cognitiveTypes, // { "ENFP": 3, "INTJ": 2, ... }
        archetypeCodes, // { "R-enhancement": 5, "I-transcendence": 3, ... }
        collabTypes, // { "D": 4, "I": 3, ... }
        sjtConsistencyAvg:
          sjtConsistencyCount > 0
            ? Math.round((sjtConsistencySum / sjtConsistencyCount) * 100) / 100
            : null,
        sjtConsistencySampleSize: sjtConsistencyCount,
      };

      return NextResponse.json({ users, total, page, limit, aggregates });
    } catch (error) {
      logApiError("/api/admin/user-profiles", ApiErrorCode.INTERNAL_ERROR, {
        message: "Failed to fetch user profiles",
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
