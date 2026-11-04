import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";

// CSRF exempt — Stripe webhooks cannot set custom headers.
// Signature verification replaces CSRF protection.

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  // Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.userId || session.client_reference_id;
    const rawTier = session.metadata?.tier;
    const VALID_TIERS = ["report", "journey"] as const;
    const tier = (VALID_TIERS as readonly string[]).includes(rawTier ?? "")
      ? (rawTier as (typeof VALID_TIERS)[number])
      : undefined;

    if (!userId || !tier) {
      console.error(
        "[stripe/webhook] Missing or invalid userId/tier in session metadata",
        {
          sessionId: session.id,
          hasUserId: Boolean(userId),
          rawTier,
        },
      );
      // Return 200 so Stripe doesn't retry — bad metadata is a config issue.
      return NextResponse.json({ received: true });
    }

    try {
      // Record the purchase in DB
      const { recordPurchase } = await import("@/lib/db/purchases");
      await recordPurchase({
        userId,
        tier,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string | null,
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
      });

      console.log(
        `[stripe/webhook] Purchase recorded: tier=${tier} session=${session.id}`,
      );
    } catch (err) {
      console.error("[stripe/webhook] Failed to record purchase:", err);
      Sentry.captureException(err, {
        tags: { component: "stripe-webhook" },
        extra: { userId, tier, sessionId: session.id },
      });
      // Return 500 so Stripe retries
      return NextResponse.json({ error: "Failed to process" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
