// ============================================================
// Post-registration durable job
//
// Moves best-effort registration side effects out of the request path while
// preserving eventual execution via DurableJob.
// ============================================================

import { z } from "zod/v4";
import {
  resolveIpCountry,
  updateUserRegistrationCountry,
} from "@/lib/auth/users";
import { serverAnalytics } from "@/lib/analytics/client";
import { enqueueDurableJob } from "@/lib/db/durable-jobs";

export const PostRegistrationJobPayloadSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().nullable(),
  }),
  email: z.string().email(),
  anonymousId: z.string().min(1).optional(),
  clientIp: z.string().min(1),
  locale: z.string().nullable(),
  researchGroup: z.string().nullable(),
});

export type PostRegistrationJobPayload = z.infer<
  typeof PostRegistrationJobPayloadSchema
>;

export async function enqueuePostRegistrationJob(
  payload: PostRegistrationJobPayload,
) {
  return enqueueDurableJob({
    type: "post_registration",
    payload,
    idempotencyKey: `post_registration:${payload.user.id}`,
    maxAttempts: 5,
  });
}

export async function handlePostRegistrationJob(
  rawPayload: unknown,
): Promise<void> {
  const input = PostRegistrationJobPayloadSchema.parse(rawPayload);
  const { user, email, anonymousId, clientIp, locale, researchGroup } = input;

  await serverAnalytics.track(
    "registered",
    {
      language: locale ?? undefined,
      researchGroup: researchGroup ?? undefined,
    },
    {
      userId: user.id,
      idempotencyKey: `registered:${user.id}`,
    },
  );

  const country = await resolveIpCountry(clientIp);
  if (country && country !== "LOCAL") {
    await updateUserRegistrationCountry(user.id, country);
  }

  // Identity backfill is idempotent and runs before email so retries do not
  // duplicate the welcome email when analytics/geo/identity work is the part
  // that failed.
  if (anonymousId) {
    await linkAnonymousIdentity(user.id, anonymousId);
  }

  await sendWelcomeEmail({
    email,
    name: user.name,
    locale: locale ?? "en",
  });
}

async function sendWelcomeEmail(input: {
  email: string;
  name: string | null;
  locale: string;
}): Promise<void> {
  const { sendEmail } = await import("@/lib/email/client");
  const { buildWelcomeEmail } = await import("@/lib/email/templates/welcome");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepdive.app";
  const { subject, html } = buildWelcomeEmail({
    name: input.name,
    locale: input.locale,
    appUrl,
  });

  await sendEmail({
    to: input.email,
    subject,
    html,
    category: "transactional",
  });
}

async function linkAnonymousIdentity(
  userId: string,
  anonymousId: string,
): Promise<void> {
  try {
    const { linkIdentity, backfillFunnelEvents, backfillPageVisits } =
      await import("@/lib/db/identity");
    await linkIdentity(userId, anonymousId, "registration");
    const funnelCount = await backfillFunnelEvents(userId, anonymousId);
    const visitCount = await backfillPageVisits(userId, anonymousId);
    await serverAnalytics.identify(userId, anonymousId);
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Identity] Linked ${anonymousId} -> ${userId}, ` +
          `backfilled ${funnelCount} funnel events, ${visitCount} page visits`,
      );
    }
  } catch (err) {
    try {
      const { logAnalyticsError } = await import("@/lib/analytics/errors");
      await logAnalyticsError("identity", "backfill_on_registration", err, {
        userId,
        anonymousId,
      });
    } catch {
      // Logging failure is non-critical.
    }
    throw err;
  }
}
