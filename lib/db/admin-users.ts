// ============================================================
// Admin Users — Admin user listing with stats, search, and
// pagination. Used by the admin dashboard user management page.
// ============================================================

import { sql, ilikePattern } from "./connection";

export interface AdminUserListResult {
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    isAdmin: boolean;
    createdAt: string;
    registrationCountry: string | null;
    registrationIp: string | null;
    careerStage: string | null;
    languages: string[];
    reportCount: number;
    lastReportAt: string | null;
    researchGroup: "classic" | "immersive" | null;
    researchParticipantId: string | null;
    researchConsentAt: string | null;
    cohort: string | null;
  }>;
  total: number;
  stats: {
    total: number;
    todayCount: number;
    weekCount: number;
    totalReports: number;
    totalQuickDives: number;
    byCareerStage: Record<string, number>;
    byCountry: Record<string, number>;
  };
}

export async function listUsersWithStats(
  page: number,
  limit: number,
  search: string,
): Promise<AdminUserListResult> {
  const offset = (page - 1) * limit;

  let users;
  let totalResult;

  if (search) {
    const searchPattern = ilikePattern(search);

    totalResult = await sql`
      SELECT COUNT(*) as count FROM "User"
      WHERE "email" ILIKE ${searchPattern} OR "name" ILIKE ${searchPattern}
    `;

    users = await sql`
      WITH all_reports AS (
        SELECT "id", "userId", "createdAt" FROM "CareerReport"
        UNION ALL
        SELECT "id", "userId", "createdAt" FROM "QuickDiveResult"
      )
      SELECT
        u."id", u."email", u."name", u."isAdmin",
        u."createdAt",
        u."registrationCountry", u."registrationIp", u."careerStage",
        u."researchGroup", u."researchParticipantId", u."researchConsentAt", u."cohort",
        COUNT(ar."id")::int AS "reportCount",
        MAX(ar."createdAt") AS "lastReportAt"
      FROM "User" u
      LEFT JOIN all_reports ar ON ar."userId" = u."id"
      WHERE u."email" ILIKE ${searchPattern} OR u."name" ILIKE ${searchPattern}
      GROUP BY u."id", u."name", u."email", u."isAdmin", u."createdAt",
               u."registrationCountry", u."registrationIp", u."careerStage",
               u."researchGroup", u."researchParticipantId", u."researchConsentAt", u."cohort"
      ORDER BY u."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    totalResult = await sql`
      SELECT COUNT(*) as count FROM "User"
    `;

    users = await sql`
      WITH all_reports AS (
        SELECT "id", "userId", "createdAt" FROM "CareerReport"
        UNION ALL
        SELECT "id", "userId", "createdAt" FROM "QuickDiveResult"
      )
      SELECT
        u."id", u."email", u."name", u."isAdmin",
        u."createdAt",
        u."registrationCountry", u."registrationIp", u."careerStage",
        u."researchGroup", u."researchParticipantId", u."researchConsentAt", u."cohort",
        COUNT(ar."id")::int AS "reportCount",
        MAX(ar."createdAt") AS "lastReportAt"
      FROM "User" u
      LEFT JOIN all_reports ar ON ar."userId" = u."id"
      GROUP BY u."id", u."name", u."email", u."isAdmin", u."createdAt",
               u."registrationCountry", u."registrationIp", u."careerStage",
               u."researchGroup", u."researchParticipantId", u."researchConsentAt", u."cohort"
      ORDER BY u."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const total = parseInt(totalResult[0]?.count as string, 10) || 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // Run stats, language aggregation, and totals in parallel
  const [
    statsResult,
    langRows,
    reportsTotal,
    quickDivesTotal,
    careerStageResult,
    countryResult,
  ] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= ${todayStart}) as "todayCount",
        COUNT(*) FILTER (WHERE "createdAt" >= ${weekStart}) as "weekCount"
      FROM "User"
    `,
    sql`
      SELECT "userId", array_agg(DISTINCT "language") AS "languages"
      FROM "QuestionnaireSession"
      WHERE "userId" IS NOT NULL
      GROUP BY "userId"
    `,
    sql`SELECT COUNT(*)::int AS "count" FROM "CareerReport"`,
    sql`SELECT COUNT(*)::int AS "count" FROM "QuickDiveResult"`,
    sql`
      SELECT "careerStage", COUNT(*)::int as "count"
      FROM "User"
      WHERE "careerStage" IS NOT NULL
      GROUP BY "careerStage"
    `,
    sql`
      SELECT "registrationCountry", COUNT(*)::int as "count"
      FROM "User"
      WHERE "registrationCountry" IS NOT NULL
      GROUP BY "registrationCountry"
    `,
  ]);

  const todayCount = parseInt(statsResult[0]?.todayCount as string, 10) || 0;
  const weekCount = parseInt(statsResult[0]?.weekCount as string, 10) || 0;

  // Build language lookup map
  const langMap: Record<string, string[]> = {};
  for (const row of langRows) {
    langMap[row.userId as string] = Array.isArray(row.languages)
      ? (row.languages as unknown[]).map(String)
      : [];
  }

  const byCareerStage: Record<string, number> = {};
  for (const row of careerStageResult) {
    byCareerStage[row.careerStage as string] = row.count as number;
  }

  const byCountry: Record<string, number> = {};
  for (const row of countryResult) {
    byCountry[row.registrationCountry as string] = row.count as number;
  }

  return {
    users: users.map((u: Record<string, unknown>) => ({
      id: u.id as string,
      email: u.email as string,
      name: (u.name as string) || null,
      isAdmin: u.isAdmin === true,
      createdAt: u.createdAt as string,
      registrationCountry: (u.registrationCountry as string) || null,
      registrationIp: (u.registrationIp as string) || null,
      careerStage: (u.careerStage as string) || null,
      languages: langMap[u.id as string] || [],
      reportCount: (u.reportCount as number) || 0,
      lastReportAt: u.lastReportAt ? String(u.lastReportAt) : null,
      researchGroup: (u.researchGroup as "classic" | "immersive") || null,
      researchParticipantId: (u.researchParticipantId as string) || null,
      researchConsentAt: u.researchConsentAt
        ? String(u.researchConsentAt)
        : null,
      cohort: (u.cohort as string) || null,
    })),
    total,
    stats: {
      total,
      todayCount,
      weekCount,
      totalReports: (reportsTotal[0]?.count as number) || 0,
      totalQuickDives: (quickDivesTotal[0]?.count as number) || 0,
      byCareerStage,
      byCountry,
    },
  };
}
