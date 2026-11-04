// ============================================================
// GET /api/coach-persona — fetch user's coach persona preferences
// PATCH /api/coach-persona — update coach persona preferences
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";
import { coachPersonaUpdateSchema } from "@/lib/validation/api-schemas";
import { sql } from "@/lib/db/connection";
import type { CoachPersona } from "@/lib/coaching/persona-defaults";

export const GET = withLogging("/api/coach-persona", async (request) => {
  const guard = await guardRoute(request, { tier: "read", requireAuth: true });
  if (guard.blocked) return guard.response;

  const userId = guard.user!.id;
  const rows =
    await sql`SELECT "coachPersona" FROM "User" WHERE "id" = ${userId}`;
  const persona = rows[0]?.coachPersona as CoachPersona | null;

  return NextResponse.json({ persona });
});

export const PATCH = withLogging("/api/coach-persona", async (request) => {
  const guard = await guardRoute(request, { tier: "write", requireAuth: true });
  if (guard.blocked) return guard.response;

  const userId = guard.user!.id;
  const parsed = await parseBody(request, coachPersonaUpdateSchema);
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  // Merge with existing persona (or create new)
  const rows =
    await sql`SELECT "coachPersona" FROM "User" WHERE "id" = ${userId}`;
  const existing = (rows[0]?.coachPersona as CoachPersona | null) ?? {
    coachingStyle: "balanced",
    communicationStyle: "warm",
    responseDetail: "balanced",
    autoConfigured: false,
    configuredAt: new Date().toISOString(),
  };

  const updated: CoachPersona = {
    ...existing,
    ...body,
    autoConfigured: false,
    configuredAt: new Date().toISOString(),
  };

  await sql`UPDATE "User" SET "coachPersona" = ${JSON.stringify(updated)}, "updatedAt" = NOW() WHERE "id" = ${userId}`;

  return NextResponse.json({ persona: updated });
});
