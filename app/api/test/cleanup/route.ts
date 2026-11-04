import { NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";
import { cleanupUserDependencies } from "@/lib/db/user-data";

/**
 * POST /api/test/cleanup
 * Hard-delete E2E test user(s) and all associated data.
 * Only available in non-production environments.
 *
 * guardRoute exempt: E2E-only endpoint, production-blocked, email pattern validated.
 *
 * Modes:
 *   { email: string }  — delete one user (must end with @test.deepdive.dev)
 *   { all: true }      — delete ALL *@test.deepdive.dev users (run before each test suite)
 */
export async function POST(request: Request) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  // Secondary guard: require CRON_SECRET on non-local environments
  if (process.env.VERCEL) {
    const auth = request.headers.get("authorization");
    const expected = process.env.CRON_SECRET;
    if (!expected || auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);

  // Bulk mode: delete all test users
  if (body?.all === true) {
    return deleteAllTestUsers();
  }

  // Single mode: delete one test user
  const email = body?.email;
  const isTestEmail =
    typeof email === "string" &&
    (email.endsWith("@test.deepdive.dev") || email.endsWith("@deepdive.test"));
  if (!isTestEmail) {
    return NextResponse.json(
      {
        error:
          "Invalid email — must end with @test.deepdive.dev or @deepdive.test",
      },
      { status: 400 },
    );
  }

  return deleteTestUser(email);
}

async function deleteTestUser(email: string) {
  try {
    const users = await sql`
      SELECT "id" FROM "User" WHERE "email" = ${email}
    `;

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: false,
        message: "User not found",
      });
    }

    const userId = users[0].id as string;
    await cleanupUserDependencies([userId]);
    await sql`DELETE FROM "User" WHERE "id" = ${userId}`;
    const skipOrphanSweep = process.env.E2E_MANAGED === "true";
    const orphans = skipOrphanSweep ? {} : await sweepOrphanRows();

    return NextResponse.json({
      success: true,
      deleted: true,
      userId,
      orphansCleaned: orphans,
      orphanSweepSkipped: skipOrphanSweep,
    });
  } catch (error) {
    console.error("[test/cleanup] Failed to delete test user:", error);
    return NextResponse.json(
      { error: "Failed to clean up test user" },
      { status: 500 },
    );
  }
}

/**
 * L3 safety net: sweep orphan rows that slipped through L1 (branch isolation)
 * and L2 (pre-delete cleanup). Runs after user deletion as a final guard.
 *
 * Only deletes rows where userId IS NULL AND there's no other valid owner
 * (e.g. anonymousId for QuickDiveResult).
 */
async function sweepOrphanRows(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    const r1 = await sql`DELETE FROM "CareerReport" WHERE "userId" IS NULL`;
    const r2 = await sql`DELETE FROM "PersonalProfile" WHERE "userId" IS NULL`;
    const r3 = await sql`DELETE FROM "AssessmentResult" WHERE "userId" IS NULL`;
    const r4 =
      await sql`DELETE FROM "QuestionnaireSession" WHERE "userId" IS NULL`;
    const r5 =
      await sql`DELETE FROM "QuickDiveResult" WHERE "userId" IS NULL AND "anonymousId" IS NULL`;
    const r6 = await sql`DELETE FROM "RealConditions" WHERE "userId" IS NULL`;
    const r7 = await sql`DELETE FROM "ReportEngagement" WHERE "userId" IS NULL`;
    const r8 =
      await sql`DELETE FROM "UserFunnel" WHERE "userId" IS NULL AND "clientId" IS NULL`;
    const results: Array<[string, unknown]> = [
      ["CareerReport", r1],
      ["PersonalProfile", r2],
      ["AssessmentResult", r3],
      ["QuestionnaireSession", r4],
      ["QuickDiveResult", r5],
      ["RealConditions", r6],
      ["ReportEngagement", r7],
      ["UserFunnel", r8],
    ];
    for (const [name, r] of results) {
      const deleted = (r as unknown as { count?: number }).count ?? 0;
      if (deleted > 0) counts[name] = deleted;
    }
  } catch {
    // Best-effort: orphan sweep failure should never break cleanup
  }
  return counts;
}

async function deleteAllTestUsers() {
  try {
    const testUsers = await sql`
      SELECT "id", "email" FROM "User"
      WHERE "email" LIKE '%@test.deepdive.dev'
         OR "email" LIKE '%@deepdive.test'
    `;

    if (testUsers.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: "No test users found",
      });
    }

    const userIds = testUsers.map((u) => u.id as string);

    await cleanupUserDependencies(userIds);
    await sql`DELETE FROM "User" WHERE "id" = ANY(${userIds})`;
    const skipOrphanSweep = process.env.E2E_MANAGED === "true";
    const orphans = skipOrphanSweep ? {} : await sweepOrphanRows();

    const emails = testUsers.map((u) => u.email as string);
    console.log(
      `[test/cleanup] Bulk deleted ${emails.length} test users:`,
      emails,
      orphans,
    );

    return NextResponse.json({
      success: true,
      deletedCount: emails.length,
      emails,
      orphansCleaned: orphans,
      orphanSweepSkipped: skipOrphanSweep,
    });
  } catch (error) {
    console.error("[test/cleanup] Bulk delete failed:", error);
    return NextResponse.json(
      { error: "Failed to bulk clean up test users" },
      { status: 500 },
    );
  }
}
