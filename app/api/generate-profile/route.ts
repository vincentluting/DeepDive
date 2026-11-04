// ============================================================
// POST /api/generate-profile — Profile Generation Endpoint
//
// Input:  { assessmentId: string, userId?: string }
// Output: PersonalProfileData
//
// GET /api/generate-profile?userId=xxx — Retrieve latest profile
// ============================================================

import { NextRequest, NextResponse, after } from "next/server";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import { generateIdentityNarratives } from "@/lib/profile-generation/generate-identity-narratives";
import { getEffectiveAssessment } from "@/lib/db/assessments";
import {
  saveProfile,
  getProfile,
  getProfileByAssessment,
  updateProfileNarratives,
} from "@/lib/db/profiles";
import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { parseBody } from "@/lib/validation/parse-body";
import { generateProfileSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { afterProfileGenerated } from "@/lib/db/assessment-lifecycle";
import { invalidateUserCache } from "@/lib/db/cached";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import type { PersonalProfileData } from "@/lib/types/platform";
import { getJourneyState } from "@/lib/db/journey";
import { hasReached } from "@/lib/journey/state-machine";
import { hasCompleteNarratives } from "@/lib/profile-generation/narrative-renderability";
import { computeNarrativeInputHash } from "@/lib/profile-generation/profile-fingerprint";

export const maxDuration = 90;

export const POST = withLogging(
  "/api/generate-profile",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "write",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      // Entitlement gate — cohort access OR Stripe purchase
      const hasAccess = await canAccessFeature(
        guard.user?.id,
        guard.user?.cohort,
        "aiProfile",
      );
      if (!hasAccess) {
        return createErrorResponse(
          ApiErrorCode.UNAUTHORIZED,
          "Profile generation requires a purchase or invite code. Visit /pricing to get started.",
          403,
        );
      }

      const parsed = await parseBody(request, generateProfileSchema);
      if ("error" in parsed) return parsed.error;
      const { assessmentId, userId: bodyUserId, locale } = parsed.data;

      // Prefer authenticated user from cookie; fall back to body userId
      const user = guard.user;
      const effectiveUserId = user?.id ?? bodyUserId ?? undefined;

      // --- 1. Fetch assessment with latest QD RIASEC merged ---
      const assessment = await getEffectiveAssessment(
        assessmentId,
        effectiveUserId,
      );
      if (!assessment) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Assessment not found",
          404,
        );
      }

      // --- 2. Generate profile (algorithmic, no LLM, <1s) ---
      const profile = generateProfile(assessment, effectiveUserId);

      // --- 3. Save algorithmic profile to DB immediately (no LLM blocking) ---
      const profileId = await saveProfile(profile);

      // --- 4. Funnel tracking + journey state machine ---
      // Profile generation itself already succeeded once saveProfile() returns.
      // Journey advancement should never flip that success into a 409.
      if (effectiveUserId) {
        trackFunnelEvent("profile_generated", {
          userId: effectiveUserId,
          metadata: { assessmentId },
          idempotencyKey: `profile_gen:${assessmentId}`,
          isAdmin: !!guard.user?.isAdmin,
        }).catch(() => {});

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await afterProfileGenerated(effectiveUserId);
            const journeyState = await getJourneyState(effectiveUserId);
            if (hasReached(journeyState, "profile_generated")) {
              break;
            }

            throw new Error(
              `Journey state remained ${journeyState} after profile generation`,
            );
          } catch (journeyErr) {
            if (attempt < 2) {
              console.warn(
                `[generate-profile] Journey advance attempt ${attempt}/2 failed, retrying in 1s:`,
                journeyErr instanceof Error ? journeyErr.message : journeyErr,
              );
              await new Promise((r) => setTimeout(r, 1000));
            } else {
              console.error(
                `[generate-profile] Journey advance failed for user ${effectiveUserId}, profile ${profileId} still returned:`,
                journeyErr,
              );
            }
          }
        }
      }

      // --- 5. Schedule LLM narrative generation AFTER response is sent ---
      // Uses Next.js after() so the user gets an instant response (<3s).
      // Narratives are written to DB asynchronously; frontend polls until ready.
      // Retries up to 2 times with 3s delay. Total worst-case ~65s (within maxDuration=90).
      // callWithRetry has its own 30s per-call timeout to prevent runaway LLM calls.
      const algo = profile.algoSnapshot;
      if (algo) {
        const MAX_RETRIES = 2;
        const RETRY_DELAY_MS = 3_000;

        after(async () => {
          let succeeded = false;
          for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
              const narratives = await generateIdentityNarratives(
                profile,
                algo,
                locale,
              );
              if (narratives && hasCompleteNarratives(narratives)) {
                await updateProfileNarratives(assessmentId, {
                  ...narratives,
                  narrativeLocale: locale,
                  narrativeInputHash: computeNarrativeInputHash(
                    profile.profileInputHash,
                    locale,
                  ),
                  populatedAt: new Date().toISOString(),
                });
                if (effectiveUserId) {
                  invalidateUserCache(effectiveUserId);
                }
                succeeded = true;
                break; // Success — exit retry loop
              }
              // narratives === null means all providers failed; an incomplete
              // payload is treated the same way because Profile must not open
              // with missing identity sections.
              if (attempt < MAX_RETRIES) {
                console.warn(
                  `[generate-profile/after] Attempt ${attempt}/${MAX_RETRIES} returned incomplete narratives, retrying in ${RETRY_DELAY_MS / 1000}s...`,
                );
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
              }
            } catch (err) {
              if (attempt < MAX_RETRIES) {
                console.warn(
                  `[generate-profile/after] Attempt ${attempt}/${MAX_RETRIES} threw, retrying in ${RETRY_DELAY_MS / 1000}s:`,
                  err instanceof Error ? err.message : err,
                );
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
              }
            }
          }

          // Mark failure in DB so frontend can show "failed" instead of eternal "generating"
          if (!succeeded) {
            console.error(
              `[generate-profile/after] All ${MAX_RETRIES} attempts failed for assessment ${assessmentId}`,
            );
            try {
              const Sentry = await import("@sentry/nextjs");
              Sentry.captureException(
                new Error(
                  `Narrative generation exhausted ${MAX_RETRIES} retries`,
                ),
                {
                  tags: { route: "/api/generate-profile/after" },
                  extra: { assessmentId, userId: effectiveUserId },
                },
              );
            } catch (_sentryErr) {
              /* Sentry itself failed — non-critical */
            }
            await updateProfileNarratives(assessmentId, {
              failedAt: new Date().toISOString(),
            }).catch(() => {});
          }

          // Non-critical side effects
          if (effectiveUserId) {
            import("@/lib/achievements/engine")
              .then((m) =>
                m.checkAchievements(effectiveUserId, "profile_generated"),
              )
              .catch(() => {});
            import("@/lib/coaching/trigger-coach-message").then(
              ({ triggerCoachMessage }) => {
                triggerCoachMessage(effectiveUserId, "profile_generated").catch(
                  () => {},
                );
              },
            );
          }
        });
      }

      // --- 6. Return profile immediately (narratives will be populated async) ---
      const postNs =
        profile.narrativeSnapshots as PersonalProfileData["narrativeSnapshots"];
      const postNarrativeStatus = hasCompleteNarratives(postNs)
        ? "ready"
        : postNs?.failedAt
          ? "failed"
          : "generating";
      return NextResponse.json({
        ...profile,
        id: profileId,
        narrativeStatus: postNarrativeStatus,
      });
    } catch (error) {
      logApiError("/api/generate-profile", ApiErrorCode.INTERNAL_ERROR, {
        message: "Profile generation error",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to generate profile",
        500,
      );
    }
  },
);

export const GET = withLogging(
  "/api/generate-profile",
  async (request: NextRequest) => {
    try {
      const guard = await guardRoute(request, {
        tier: "read",
        requireAuth: true,
      });
      if (guard.blocked) return guard.response;

      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");
      const assessmentId = searchParams.get("assessmentId");

      if (!userId && !assessmentId) {
        return createErrorResponse(
          ApiErrorCode.VALIDATION_ERROR,
          "Missing required query parameter: userId or assessmentId",
          400,
        );
      }

      // Ownership check: users can only access their own profile
      if (userId && guard.user && userId !== guard.user.id) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Profile not found",
          404,
        );
      }

      // Try userId lookup first, then fall back to assessmentId
      let profile = userId ? await getProfile(userId) : null;
      if (!profile && assessmentId) {
        profile = await getProfileByAssessment(assessmentId);
        // Ownership check: ensure the profile belongs to the authenticated user
        if (
          profile &&
          guard.user &&
          profile.userId &&
          profile.userId !== guard.user.id
        ) {
          return createErrorResponse(
            ApiErrorCode.ASSESSMENT_NOT_FOUND,
            "Profile not found",
            404,
          );
        }
      }

      if (!profile) {
        return createErrorResponse(
          ApiErrorCode.ASSESSMENT_NOT_FOUND,
          "Profile not found",
          404,
        );
      }

      const ns =
        profile.narrativeSnapshots as PersonalProfileData["narrativeSnapshots"];
      const narrativeStatus = hasCompleteNarratives(ns)
        ? "ready"
        : ns?.failedAt
          ? "failed"
          : "generating";
      return NextResponse.json({ ...profile, narrativeStatus });
    } catch (error) {
      logApiError("/api/generate-profile", ApiErrorCode.INTERNAL_ERROR, {
        message: "Profile fetch error",
        cause: error,
      });
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        "Failed to fetch profile",
        500,
      );
    }
  },
);
