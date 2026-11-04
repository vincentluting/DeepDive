// ============================================================
// Analytics Client — Unified entry point for all analytics tracking
//
// Wraps funnel event tracking with typed metadata validation,
// automatic idempotency keys, and context management.
// All errors are caught internally — tracking never breaks user flow.
//
// Two exported instances:
//   analytics        — client-side, sends HTTP to /api/analytics/event
//   serverAnalytics  — server-side, calls trackFunnelEvent() directly (DB)
// ============================================================

// Type-only imports — safe for client bundles (erased at compile time)
import type { FunnelEvent } from "@/lib/analytics/funnel";
import type { EventMetadata } from "@/lib/analytics/events";
import { validateEventMetadata } from "@/lib/analytics/events";

export interface AnalyticsContext {
  userId?: string | null;
  anonymousId?: string | null;
  sessionId?: string | null;
  locale?: string;
}

type Transport = "http" | "db";

class AnalyticsClient {
  private context: AnalyticsContext = {};
  private readonly transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  setContext(ctx: Partial<AnalyticsContext>): void {
    this.context = { ...this.context, ...ctx };
  }

  async track<T extends FunnelEvent>(
    event: T,
    metadata?: EventMetadata<T>,
    options?: {
      userId?: string | null;
      anonymousId?: string | null;
      idempotencyKey?: string;
    },
  ): Promise<void> {
    try {
      // L1 defense: silently skip tracking in automated browsers (Playwright, Puppeteer, Selenium).
      // navigator.webdriver is set by W3C WebDriver spec — no real user will have this.
      // Only applies to client-side (HTTP) transport; server-side DB transport is unaffected.
      if (
        this.transport === "http" &&
        typeof navigator !== "undefined" &&
        navigator.webdriver
      ) {
        return;
      }

      // Validate metadata (fail-closed: drop invalid metadata to keep DB clean)
      let validatedMetadata: Record<string, unknown> | undefined;
      if (metadata !== undefined) {
        const parsed = validateEventMetadata(event, metadata);
        if (parsed === null) {
          console.error(
            `[analytics] Invalid metadata for event "${event}", dropping:`,
            metadata,
          );
          // Fail-closed: send event without metadata rather than polluting DB
          validatedMetadata = undefined;
        } else {
          validatedMetadata = parsed as Record<string, unknown>;
        }
      }

      const userId = options?.userId ?? this.context.userId ?? null;
      const anonymousId =
        options?.anonymousId ?? this.context.anonymousId ?? null;

      // Auto-generate idempotency key for report_viewed
      let idempotencyKey = options?.idempotencyKey;
      if (
        event === "report_viewed" &&
        !idempotencyKey &&
        validatedMetadata?.reportId
      ) {
        const today = new Date().toISOString().slice(0, 10);
        idempotencyKey =
          this.makeIdempotencyKey(
            `rv:${validatedMetadata.reportId}`,
            userId ?? null,
            anonymousId ?? null,
          ) + `:${today}`;
      }

      if (this.transport === "db") {
        // Server-side: dynamic import to avoid pulling DB deps into client bundle
        const { trackFunnelEvent } = await import("@/lib/analytics/funnel");
        await trackFunnelEvent(event, {
          userId: userId ?? undefined,
          clientId: anonymousId ?? undefined,
          metadata: validatedMetadata,
          idempotencyKey,
        });
      } else {
        // Client-side: HTTP to /api/analytics/event (CSRF exempt endpoint)
        await fetch("/api/analytics/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event,
            clientId: anonymousId,
            metadata: validatedMetadata,
            idempotencyKey,
          }),
          keepalive: true,
        });
      }
    } catch (error) {
      // Client-side: silently swallow (ad blockers, network issues are expected)
      // Server-side: persist to DB for observability
      if (typeof window === "undefined") {
        try {
          const { logAnalyticsError } = await import("@/lib/analytics/errors");
          await logAnalyticsError("funnel", event, error);
        } catch {
          // Swallow — analytics errors must never crash the app
        }
      }
    }
  }

  async identify(
    userId: string,
    anonymousId: string | null | undefined,
  ): Promise<void> {
    if (!anonymousId) return;
    try {
      const { linkIdentity } = await import("@/lib/db/identity");
      await linkIdentity(userId, anonymousId, "registration");
    } catch {
      // fire-and-forget
    }
  }

  private makeIdempotencyKey(
    event: string,
    userId: string | null,
    anonymousId: string | null,
  ): string {
    const identity = userId ?? anonymousId ?? "unknown";
    return `${event}:${identity}`;
  }
}

/** Client-side instance — sends events via HTTP to /api/analytics/event */
export const analytics = new AnalyticsClient("http");

/** Server-side instance — calls trackFunnelEvent() directly (DB insert) */
export const serverAnalytics = new AnalyticsClient("db");
