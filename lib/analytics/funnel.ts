import { sql } from "@/lib/db/connection";
import { logAnalyticsError } from "@/lib/analytics/errors";
import { type FunnelEvent } from "@/lib/analytics/funnel-events";

// Re-export from the zero-dependency source of truth
export { FUNNEL_EVENTS, type FunnelEvent } from "@/lib/analytics/funnel-events";

// Table is created by initTables() in lib/db/admin.ts (synced with scripts/schema.sql).
// No lazy-init needed — UserFunnel table is guaranteed to exist at runtime.

/**
 * Record a funnel event. Failures are logged but never thrown —
 * tracking must never break the main user flow.
 *
 * When `idempotencyKey` is supplied the INSERT uses
 * ON CONFLICT ("idempotencyKey") DO NOTHING, so duplicate rows for the same
 * key (e.g. report_viewed on every page refresh) are silently dropped.
 */
export async function trackFunnelEvent(
  event: FunnelEvent,
  options: {
    userId?: string | null;
    clientId?: string | null;
    metadata?: Record<string, unknown>;
    idempotencyKey?: string;
    isAdmin?: boolean;
  } = {},
): Promise<void> {
  if (process.env.E2E_DISABLE_ANALYTICS === "true") return;

  try {
    const id = crypto.randomUUID();
    const {
      userId = null,
      clientId = null,
      metadata = {},
      idempotencyKey,
      isAdmin = false,
    } = options;

    if (idempotencyKey) {
      await sql`
        INSERT INTO "UserFunnel" ("id", "userId", "clientId", "event", "metadata", "idempotencyKey", "isAdmin")
        VALUES (
          ${id},
          ${userId ?? null},
          ${clientId ?? null},
          ${event},
          ${JSON.stringify(metadata)}::jsonb,
          ${idempotencyKey},
          ${isAdmin}
        )
        ON CONFLICT ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL DO NOTHING
      `;
    } else {
      await sql`
        INSERT INTO "UserFunnel" ("id", "userId", "clientId", "event", "metadata", "isAdmin")
        VALUES (
          ${id},
          ${userId ?? null},
          ${clientId ?? null},
          ${event},
          ${JSON.stringify(metadata)}::jsonb,
          ${isAdmin}
        )
      `;
    }
  } catch (error) {
    await logAnalyticsError("funnel", event, error);
  }
}
