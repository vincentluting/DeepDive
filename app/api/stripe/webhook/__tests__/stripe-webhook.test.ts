import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

// Set env BEFORE module load
process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

const mockConstructEvent = vi.fn();
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      webhooks = { constructEvent: mockConstructEvent };
    },
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

vi.mock("@/lib/db/purchases", () => ({
  recordPurchase: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body = "raw-body", sig = "sig_test"): Request {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/stripe/webhook", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 503 when webhook secret not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const res = await handler(makeRequest());
    expect(res.status).toBe(503);
  });

  it("returns 400 when signature missing", async () => {
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "raw-body",
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 on invalid signature", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 200 on valid checkout.session.completed event", async () => {
    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test",
          metadata: { userId: "u1", tier: "report" },
          client_reference_id: "u1",
          payment_intent: "pi_test",
          amount_total: 2900,
          currency: "usd",
        },
      },
    });

    const { recordPurchase } = await import("@/lib/db/purchases");

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
    expect(recordPurchase).toHaveBeenCalledWith({
      userId: "u1",
      tier: "report",
      stripeSessionId: "cs_test",
      stripePaymentIntentId: "pi_test",
      amountCents: 2900,
      currency: "usd",
    });
  });

  it("returns 200 for unhandled event types", async () => {
    mockConstructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: {} },
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
  });
});
