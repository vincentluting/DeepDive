import { after, type NextRequest, NextResponse } from "next/server";
import {
  createUser,
  emailExists,
  createSession,
  setSessionCookie,
} from "@/lib/auth";
import { isAdminEmail } from "@/lib/auth/admin";
import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import { registerSchema } from "@/lib/validation/api-schemas";
import {
  ApiErrorCode,
  createErrorResponse,
  logApiError,
} from "@/lib/api/api-errors";
import { withLogging } from "@/lib/api/with-logging";
import { validateInviteCode, claimInviteCode } from "@/lib/db/invite-codes";
import { isCohortActive, resolveResearchGroup } from "@/lib/cohort/config";
import { sql } from "@/lib/db/connection";
import {
  enqueuePostRegistrationJob,
  handlePostRegistrationJob,
  type PostRegistrationJobPayload,
} from "@/lib/jobs/post-registration";
import { runDueJobs } from "@/lib/jobs/runner";
import { trackFunnelEvent } from "@/lib/analytics/funnel";
import { createRequestTimer } from "@/lib/observability/timing";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export const POST = withLogging(
  "/api/auth/register",
  async (request: NextRequest) => {
    const timing = createRequestTimer({
      route: "/api/auth/register",
      slowMs: 1200,
    });
    const finish = <T extends Response>(response: T): T =>
      timing.attach(response);

    try {
      const guard = await timing.time("guard", () =>
        guardRoute(request, { tier: "auth" }),
      );
      if (guard.blocked) return finish(guard.response);

      const parsed = await timing.time("parse_body", () =>
        parseBody(request, registerSchema),
      );
      if ("error" in parsed) return finish(parsed.error);
      const { name, email, password, careerStage, anonymousId, inviteCode } =
        parsed.data;

      // Check if email already exists
      let exists: boolean;
      try {
        exists = await timing.time("email_exists", () => emailExists(email));
      } catch (emailCheckError) {
        logApiError("/api/auth/register", ApiErrorCode.DB_CONSTRAINT_FAILED, {
          message: "Database error checking email",
          cause: emailCheckError,
        });
        return finish(
          createErrorResponse(
            ApiErrorCode.DB_CONSTRAINT_FAILED,
            "Database error checking email",
            500,
          ),
        );
      }

      if (exists) {
        logApiError("/api/auth/register", ApiErrorCode.CONFLICT, {
          message: "Email already exists",
        });
        // Generic message to prevent email enumeration — rate limiting (tier: 'auth')
        // already prevents bulk attacks, but we avoid confirming email existence
        return finish(
          createErrorResponse(
            ApiErrorCode.CONFLICT,
            "Unable to create account. If you already have an account, please sign in.",
            409,
          ),
        );
      }

      // Validate invite code BEFORE creating user — reject early if invalid
      let inviteValidation: Awaited<
        ReturnType<typeof validateInviteCode>
      > | null = null;
      if (inviteCode) {
        try {
          inviteValidation = await timing.time("validate_invite", () =>
            validateInviteCode(inviteCode),
          );
          if (!inviteValidation.valid) {
            return finish(
              createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                `Invalid invite code: ${inviteValidation.reason}`,
                400,
              ),
            );
          }
          if (!isCohortActive(inviteValidation.cohortId)) {
            return finish(
              createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                "This invite code belongs to an inactive cohort",
                400,
              ),
            );
          }

          // THESIS LOCALE GATE (bug-log #002 follow-up; obviates #013 and #017
          // for the thesis cohort): the consent instrument and the Module B
          // (DDVQ-21 / Schwartz PVQ) prompts are only professionally translated
          // in en + zh. Allowing thesis enrolment in other locales would mean
          // participants read English consent / English DDVQ prompts → invalid
          // informed consent + invalid psychometric data. Block at registration.
          const isThesisCohort =
            inviteValidation.cohortId?.startsWith("thesis_") ?? false;
          const submittedLocale = parsed.data.locale ?? null;
          const THESIS_ALLOWED_LOCALES = ["en", "zh"] as const;
          const isThesisLocaleAllowed =
            submittedLocale !== null &&
            (THESIS_ALLOWED_LOCALES as readonly string[]).includes(
              submittedLocale,
            );
          if (isThesisCohort && !isThesisLocaleAllowed) {
            return finish(
              createErrorResponse(
                ApiErrorCode.VALIDATION_ERROR,
                "This research study is currently only available in English (en) and Chinese (zh). Please switch the site language and try again.",
                400,
              ),
            );
          }
        } catch (inviteErr) {
          logApiError("/api/auth/register", ApiErrorCode.INTERNAL_ERROR, {
            message: "Invite code validation failed",
            cause: inviteErr,
          });
          return finish(
            createErrorResponse(
              ApiErrorCode.INTERNAL_ERROR,
              "Failed to validate invite code",
              500,
            ),
          );
        }
      }

      // Extract client IP for geo tracking
      const clientIp = getClientIp(request);

      // Create the user (with registration IP)
      let user;
      try {
        const isAdmin = isAdminEmail(email);
        user = await timing.time("create_user", () =>
          createUser(email, password, name, isAdmin, clientIp, careerStage),
        );
      } catch (createUserError) {
        logApiError("/api/auth/register", ApiErrorCode.DB_CONSTRAINT_FAILED, {
          message: "Failed to create user account",
          cause: createUserError,
        });
        return finish(
          createErrorResponse(
            ApiErrorCode.DB_CONSTRAINT_FAILED,
            "Failed to create user account",
            500,
          ),
        );
      }

      // ── Invite code → cohort enrollment (already validated above) ──
      // Retry once on failure because user is already created — losing cohort
      // assignment means they can't access Deep Dive/Report/Coaching features.
      let researchGroup: string | null = null;
      let cohortClaimFailed = false;
      if (inviteValidation && inviteValidation.valid) {
        await timing.time("claim_invite", async () => {
          for (let attempt = 1; attempt <= 2; attempt++) {
            try {
              const claimed = await claimInviteCode(
                inviteValidation.codeId,
                user.id,
              );
              if (!claimed) {
                // Bug-log #085: code filled / deactivated / expired between
                // validate and claim (TOCTOU). This is NOT a transient DB error,
                // so retrying is pointless — mark the claim as failed and stop.
                console.warn(
                  "[Cohort] Invite code no longer claimable (full/inactive/expired) — skipping cohort assignment",
                );
                cohortClaimFailed = true;
                break;
              }

              // Use invite code's pre-assigned group, fall back to cohort-level resolution
              researchGroup =
                inviteValidation.researchGroup ??
                (await resolveResearchGroup(inviteValidation.cohortId));
              await sql`
              UPDATE "User"
              SET
                "cohort" = ${inviteValidation.cohortId},
                "researchGroup" = COALESCE(${researchGroup}, "researchGroup"),
                "updatedAt" = NOW()
              WHERE "id" = ${user.id}
            `;
              // NOTE: researchConsentAt is intentionally NOT set here. Assignment
              // to a research group ≠ informed consent. The timestamp is set
              // exclusively by POST /api/pre-post-assessment/consent when the
              // participant explicitly checks the consent box (research-ethics
              // requirement: audit field must reflect the actual moment of consent).
              break; // Success
            } catch (inviteErr) {
              if (attempt < 2) {
                console.warn(
                  `[Cohort] Invite code claim attempt ${attempt}/2 failed, retrying:`,
                  inviteErr instanceof Error ? inviteErr.message : inviteErr,
                );
                await new Promise((r) => setTimeout(r, 1000));
              } else {
                console.error(
                  "[Cohort] Invite code claim failed after 2 attempts:",
                  inviteErr instanceof Error ? inviteErr.message : inviteErr,
                );
                cohortClaimFailed = true;
              }
            }
          }
        });
      }

      const locale =
        request.cookies.get("NEXT_LOCALE")?.value ??
        request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ??
        null;

      // Create session
      let session;
      try {
        session = await timing.time("create_session", () =>
          createSession(user.id),
        );
      } catch (sessionError) {
        logApiError("/api/auth/register", ApiErrorCode.DB_CONSTRAINT_FAILED, {
          message: "Failed to create session",
          cause: sessionError,
        });
        return finish(
          createErrorResponse(
            ApiErrorCode.DB_CONSTRAINT_FAILED,
            "Failed to create session",
            500,
          ),
        );
      }

      try {
        await timing.time("set_cookie", () => setSessionCookie(session.id));
      } catch (cookieError) {
        // Log but continue — user is still created
        logApiError("/api/auth/register", ApiErrorCode.INTERNAL_ERROR, {
          message: "Failed to set session cookie",
          cause: cookieError,
        });
      }

      const postRegistrationPayload: PostRegistrationJobPayload = {
        user,
        email,
        anonymousId,
        clientIp,
        locale,
        researchGroup,
      };

      // Track registration funnel event — fire-and-forget, never block the
      // response on analytics. Parity with the OAuth path (which already
      // emits this event). Without this the email-register path is a black
      // hole in our funnel and the cohort/registration count diverge.
      trackFunnelEvent("registered", {
        userId: user.id,
        metadata: {
          provider: "email",
          ...(inviteValidation?.valid
            ? {
                cohort: inviteValidation.cohortId,
                researchGroup: researchGroup ?? undefined,
              }
            : {}),
          ...(locale ? { language: locale } : {}),
        },
      }).catch(() => {});

      try {
        await timing.time("enqueue_post_registration", () =>
          enqueuePostRegistrationJob(postRegistrationPayload),
        );
        after(() =>
          runDueJobs({ limit: 1, types: ["post_registration"] }).catch(
            (err) => {
              console.warn(
                "[durable-job] post-registration kick failed:",
                err instanceof Error ? err.message : err,
              );
            },
          ),
        );
      } catch (queueError) {
        logApiError("/api/auth/register", ApiErrorCode.INTERNAL_ERROR, {
          message: "Failed to enqueue post-registration job",
          cause: queueError,
        });
        after(() =>
          handlePostRegistrationJob(postRegistrationPayload).catch((err) => {
            logApiError("/api/auth/register", ApiErrorCode.INTERNAL_ERROR, {
              message: "Post-registration fallback failed",
              cause: err,
            });
          }),
        );
      }

      return finish(
        NextResponse.json({
          success: true,
          user: { id: user.id, email: user.email, name: user.name },
          ...(cohortClaimFailed ? { warning: "invite_claim_failed" } : {}),
        }),
      );
    } catch (error) {
      logApiError("/api/auth/register", ApiErrorCode.INTERNAL_ERROR, {
        message: "Registration failed",
        cause: error,
      });
      return finish(
        createErrorResponse(
          ApiErrorCode.INTERNAL_ERROR,
          "Internal server error",
          500,
        ),
      );
    }
  },
);
