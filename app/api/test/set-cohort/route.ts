import { NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";

/**
 * POST /api/test/set-cohort
 * Set cohort for an E2E test user. Only available in non-production environments.
 *
 * guardRoute exempt: E2E-only endpoint, production-blocked, email pattern validated.
 *
 * Input: { email: string, cohort: string }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 404 },
    );
  }

  if (process.env.VERCEL) {
    const auth = request.headers.get("authorization");
    const expected = process.env.CRON_SECRET;
    if (!expected || auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = await request.json().catch(() => null);
  const email = body?.email;
  const cohort = body?.cohort;
  const researchGroup = body?.researchGroup; // optional: "classic" | "immersive"
  const isAdmin = body?.isAdmin; // optional test-only admin promotion

  if (typeof email !== "string" || !email.endsWith("@test.deepdive.dev")) {
    return NextResponse.json(
      { error: "Invalid email — must end with @test.deepdive.dev" },
      { status: 400 },
    );
  }

  if (typeof cohort !== "string" || cohort.length === 0) {
    return NextResponse.json({ error: "cohort is required" }, { status: 400 });
  }

  if (isAdmin !== undefined && typeof isAdmin !== "boolean") {
    return NextResponse.json(
      { error: "isAdmin must be a boolean when provided" },
      { status: 400 },
    );
  }

  try {
    const result = await sql`
      UPDATE "User"
      SET "cohort" = ${cohort},
          "researchGroup" = COALESCE(${researchGroup ?? null}, "researchGroup"),
          "isAdmin" = COALESCE(${typeof isAdmin === "boolean" ? isAdmin : null}, "isAdmin")
      WHERE "email" = ${email}
      RETURNING "id"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      userId: result[0].id,
      cohort,
    });
  } catch (error) {
    console.error("[test/set-cohort] Failed:", error);
    return NextResponse.json(
      { error: "Failed to set cohort" },
      { status: 500 },
    );
  }
}
