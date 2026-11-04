import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────

// Set env BEFORE module load so PRICE_MAP picks them up
process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
process.env.STRIPE_PRICE_REPORT = "price_report";
process.env.STRIPE_PRICE_JOURNEY = "price_journey";
process.env.STRIPE_PRICE_COACHING = "price_coaching";

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

const mockCreate = vi.fn();
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      checkout = { sessions: { create: mockCreate } };
    },
  };
});

import { guardRoute } from "@/lib/api/api-guard";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowGuard(user: { id: string } = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("POST /api/stripe/checkout", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest({ tier: "report" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid tier", async () => {
    allowGuard();
    const res = await handler(makeRequest({ tier: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("returns checkout URL on success", async () => {
    allowGuard({ id: "u1" });
    mockCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    const res = await handler(makeRequest({ tier: "report" }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.url).toBe("https://checkout.stripe.com/session_123");
  });

  it("returns 500 on Stripe error", async () => {
    allowGuard({ id: "u1" });
    mockCreate.mockRejectedValue(new Error("Stripe down"));

    const res = await handler(makeRequest({ tier: "report" }));
    expect(res.status).toBe(500);
  });
});
