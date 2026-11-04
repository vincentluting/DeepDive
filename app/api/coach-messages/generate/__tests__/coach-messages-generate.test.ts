import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: { INTERNAL_ERROR: "INTERNAL_ERROR" },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/validation/api-schemas", () => ({
  coachMessageGenerateSchema: {},
}));
vi.mock("@/lib/db/coach-messages", () => ({
  createCoachMessage: vi.fn(),
  hasMessageWithTrigger: vi.fn(),
}));
vi.mock("@/lib/coaching/proactive-messages", () => ({
  generateProactiveMessage: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  createCoachMessage,
  hasMessageWithTrigger,
} from "@/lib/db/coach-messages";
import { generateProactiveMessage } from "@/lib/coaching/proactive-messages";

function allowGuard(user = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}
function blockGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status: 401 }),
  });
}
function makeReq(): Request {
  return new Request("http://localhost/api/coach-messages/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/coach-messages/generate", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).POST as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns 400 for invalid trigger", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { trigger: "invalid_trigger" },
    });
    expect((await handler(makeReq())).status).toBe(400);
  });

  it("skips when trigger already sent", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { trigger: "welcome" },
    });
    (hasMessageWithTrigger as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const json = await (await handler(makeReq())).json();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe("already_sent");
  });

  it("generates and returns message (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { trigger: "welcome" },
    });
    (hasMessageWithTrigger as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );
    (generateProactiveMessage as ReturnType<typeof vi.fn>).mockReturnValue({
      userId: "u1",
      trigger: "welcome",
      title: "Welcome!",
    });
    (createCoachMessage as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "msg-1",
      title: "Welcome!",
    });

    const json = await (await handler(makeReq())).json();
    expect(json.message.id).toBe("msg-1");
  });

  it("returns 400 when generateProactiveMessage returns null", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { trigger: "welcome" },
    });
    (hasMessageWithTrigger as ReturnType<typeof vi.fn>).mockResolvedValue(
      false,
    );
    (generateProactiveMessage as ReturnType<typeof vi.fn>).mockReturnValue(
      null,
    );

    expect((await handler(makeReq())).status).toBe(400);
  });
});
