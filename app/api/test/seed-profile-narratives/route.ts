import { NextResponse } from "next/server";
import { sql } from "@/lib/db/connection";
import { updateProfileNarratives } from "@/lib/db/profiles";

/**
 * POST /api/test/seed-profile-narratives
 * Seed minimal narrativeSnapshots for an E2E test user's PersonalProfile.
 *
 * Only available in non-production environments.
 * Input: { email: string, assessmentId?: string }
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
  const requestedAssessmentId = body?.assessmentId;

  if (typeof email !== "string" || !email.endsWith("@test.deepdive.dev")) {
    return NextResponse.json(
      { error: "Invalid email — must end with @test.deepdive.dev" },
      { status: 400 },
    );
  }

  if (
    requestedAssessmentId != null &&
    typeof requestedAssessmentId !== "string"
  ) {
    return NextResponse.json(
      { error: "assessmentId must be a string when provided" },
      { status: 400 },
    );
  }

  try {
    const rows = requestedAssessmentId
      ? await sql`
          SELECT pp."assessmentId"
          FROM "PersonalProfile" pp
          JOIN "User" u ON u."id" = pp."userId"
          WHERE u."email" = ${email}
            AND pp."assessmentId" = ${requestedAssessmentId}
          ORDER BY pp."updatedAt" DESC
          LIMIT 1
        `
      : await sql`
          SELECT pp."assessmentId"
          FROM "PersonalProfile" pp
          JOIN "User" u ON u."id" = pp."userId"
          WHERE u."email" = ${email}
          ORDER BY pp."updatedAt" DESC
          LIMIT 1
        `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Profile not found for test user" },
        { status: 404 },
      );
    }

    const assessmentId = rows[0].assessmentId as string;
    await updateProfileNarratives(assessmentId, {
      identitySummary:
        "You work best when creative exploration is paired with structured sense-making.",
      coreInsight:
        "You work best when creative exploration is paired with structured sense-making.",
      archetypeNarrative:
        "You are energized by interpreting complexity and turning it into a clear direction.",
      bigFiveNarrative:
        "You show a reflective, curious style and prefer depth over superficial motion.",
      valueNarrative:
        "Meaning, growth, and integrity matter more to you than status games.",
      sjtTensionNarrative:
        "You want room to experiment, but you also need enough structure to trust the path.",
      crossDimensionNarrative:
        "Your strongest pattern is combining imagination with analysis instead of choosing one over the other.",
      growthMapInsight:
        "The next stretch is learning how to test promising directions before overcommitting.",
      populatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      assessmentId,
    });
  } catch (error) {
    console.error("[test/seed-profile-narratives] Failed:", error);
    return NextResponse.json(
      { error: "Failed to seed profile narratives" },
      { status: 500 },
    );
  }
}
