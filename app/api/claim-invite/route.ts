// ============================================================
// POST /api/claim-invite — Claim invite code for existing users
//
// Two paths share this endpoint:
//   1) First-time claim — user has no cohort, fully enrolls them.
//   2) Cohort upgrade — user already in a non-research cohort (e.g.
//      beta_2026) claims a research-cohort code to join the study.
// Downgrades and same-cohort re-claims are rejected with 409 +
// `reason` so the UI can show targeted messaging.
//
// Input:  { inviteCode: string }
// Output: { success: true, cohort: string, researchGroup, switched }
// ============================================================

import { NextResponse } from "next/server";
import { guardRoute } from "@/lib/api/api-guard";
import { validateInviteCode, claimInviteCode } from "@/lib/db/invite-codes";
import {
  canSwitchToCohort,
  isCohortActive,
  resolveResearchGroup,
} from "@/lib/cohort/config";
import { sql } from "@/lib/db/connection";
import { withLogging } from "@/lib/api/with-logging";
import { z } from "zod/v4";
import { parseBody } from "@/lib/validation/parse-body";
import { locales } from "@/lib/i18n/config";

const claimInviteSchema = z.object({
  inviteCode: z.string().min(1).max(50),
  // Locale of the claim-invite UI. Used to gate thesis cohort entry to
  // languages where the consent / DDVQ instruments are professionally
  // translated (currently en + zh only). Optional for back-compat — but
  // any claim that maps to a thesis_* cohort REQUIRES a valid en/zh value.
  locale: z.enum(locales).optional(),
});

const THESIS_ALLOWED_LOCALES = ["en", "zh"] as const;

export const POST = withLogging("/api/claim-invite", async (request) => {
  const guard = await guardRoute(request, { tier: "write", requireAuth: true });
  if (guard.blocked) return guard.response;

  const parsed = await parseBody(request, claimInviteSchema);
  if ("error" in parsed) return parsed.error;
  const { inviteCode, locale } = parsed.data;

  const userId = guard.user!.id;
  const existingCohort = guard.user!.cohort ?? null;

  // Validate the invite code
  const validation = await validateInviteCode(inviteCode);
  if (!validation.valid) {
    return NextResponse.json(
      { error: `Invalid invite code: ${validation.reason}` },
      { status: 400 },
    );
  }

  // Verify cohort is active
  if (!isCohortActive(validation.cohortId)) {
    return NextResponse.json(
      { error: "This invite code belongs to an inactive cohort." },
      { status: 400 },
    );
  }

  // THESIS LOCALE GATE (bug-log #002 follow-up; obviates #013 + #017 for thesis):
  // mirror /api/auth/register's gate so logged-in users cannot bypass the
  // language restriction by claiming the invite from Settings instead of
  // through registration. The consent + Module B (DDVQ-21 / Schwartz PVQ)
  // instruments are only professionally translated in en + zh; any other
  // locale would mean invalid informed consent + invalid psychometric data.
  const isThesisCohort = validation.cohortId?.startsWith("thesis_") ?? false;
  const isThesisLocaleAllowed =
    typeof locale === "string" &&
    (THESIS_ALLOWED_LOCALES as readonly string[]).includes(locale);
  if (isThesisCohort && !isThesisLocaleAllowed) {
    return NextResponse.json(
      {
        error:
          "This research study is currently only available in English (en) and Chinese (zh). Please switch the site language and try again.",
        reason: "thesis_locale_not_supported",
      },
      { status: 400 },
    );
  }

  // Gate the transition: first-claim, upgrade-to-research, or reject.
  const transition = canSwitchToCohort(existingCohort, validation.cohortId);
  if (!transition.allowed) {
    const message =
      transition.reason === "already_in_target"
        ? "Already enrolled in this cohort."
        : "Cannot switch from a research cohort via invite code.";
    return NextResponse.json(
      { error: message, reason: transition.reason },
      { status: 409 },
    );
  }

  const isSwitch = existingCohort !== null;

  // Claim the code atomically (increments usedCount under a capacity guard,
  // appends userId to claimedByUserIds without duplicates).
  const claimed = await claimInviteCode(validation.codeId, userId);
  if (!claimed) {
    // Bug-log #085: code filled / deactivated / expired between validate and
    // claim (TOCTOU). Surface a 409 so the client can show "code unavailable"
    // rather than silently leaving the user un-enrolled.
    return NextResponse.json(
      {
        error: "This invite code is no longer available.",
        reason: "code_unavailable",
      },
      { status: 409 },
    );
  }

  // Use invite code's pre-assigned group, fall back to cohort-level resolution
  const researchGroup =
    validation.researchGroup ??
    (await resolveResearchGroup(validation.cohortId));

  // Update user with cohort + research group.
  // NOTE: researchConsentAt is intentionally NOT set here. Assignment to a
  // research group ≠ informed consent. The timestamp is set exclusively by
  // POST /api/pre-post-assessment/consent when the participant explicitly
  // checks the consent box (research-ethics requirement). On the upgrade
  // path this means the dashboard's consent gate will surface naturally
  // on the user's next visit.
  await sql`
    UPDATE "User" SET
      "cohort" = ${validation.cohortId},
      "researchGroup" = COALESCE(${researchGroup}, "researchGroup"),
      "updatedAt" = NOW()
    WHERE "id" = ${userId}
  `;

  return NextResponse.json({
    success: true,
    cohort: validation.cohortId,
    researchGroup,
    switched: isSwitch,
  });
});
