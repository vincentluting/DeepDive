import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod/v4";
import { guardRoute } from "@/lib/api/api-guard";
import { withLogging } from "@/lib/api/with-logging";
import { parseBody } from "@/lib/validation/parse-body";

// Stripe price IDs — set in Stripe dashboard, configure via env vars
const PRICE_MAP: Record<string, string | undefined> = {
  report: process.env.STRIPE_PRICE_REPORT,
  journey: process.env.STRIPE_PRICE_JOURNEY,
  coaching: process.env.STRIPE_PRICE_COACHING,
};

// Coaching is a subscription; report and journey are one-time payments
const SUBSCRIPTION_TIERS = new Set(["coaching"]);

const checkoutSchema = z.object({
  tier: z.enum(["report", "journey", "coaching"]),
});

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export const POST = withLogging(
  "/api/stripe/checkout",
  async (request: NextRequest) => {
    // Require authenticated user
    const guard = await guardRoute(request, {
      tier: "write",
      requireAuth: true,
    });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, checkoutSchema);
    if ("error" in parsed) return parsed.error;
    const { tier } = parsed.data;

    const priceId = PRICE_MAP[tier];
    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price not configured for tier "${tier}". Set STRIPE_PRICE_${tier.toUpperCase()} env var.`,
        },
        { status: 503 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const locale = request.headers.get("x-locale") || "en";
    const isSubscription = SUBSCRIPTION_TIERS.has(tier);

    try {
      const stripe = getStripe();

      const session = await stripe.checkout.sessions.create({
        mode: isSubscription ? "subscription" : "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/${locale}/dashboard?payment=success&tier=${tier}`,
        cancel_url: `${appUrl}/${locale}/pricing?payment=cancelled`,
        client_reference_id: guard.user!.id,
        metadata: {
          userId: guard.user!.id,
          tier,
        },
      });

      return NextResponse.json({ url: session.url });
    } catch (err) {
      console.error("[stripe/checkout] Error creating session:", err);
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 },
      );
    }
  },
);
