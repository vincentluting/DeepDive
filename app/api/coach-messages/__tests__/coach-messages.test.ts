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
  coachMessageMarkReadSchema: {},
}));
vi.mock("@/lib/db/coach-messages", () => ({
  getMessages: vi.fn(),
  getUnreadCount: vi.fn(),
  markMessageRead: vi.fn(),
  markAllRead: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  getMessages,
  getUnreadCount,
  markAllRead,
  markMessageRead,
} from "@/lib/db/coach-messages";

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
function makeReq(method = "GET"): Request {
  return new Request("http://localhost/api/coach-messages", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "PATCH" ? "{}" : undefined,
  });
}

beforeEach(() => vi.clearAllMocks());

describe("GET /api/coach-messages", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).GET as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("returns messages and unread count", async () => {
    allowGuard();
    (getMessages as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "m1", text: "Hello" },
    ]);
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    const json = await (await handler(makeReq())).json();
    expect(json.messages).toHaveLength(1);
    expect(json.unreadCount).toBe(1);
  });
});

describe("PATCH /api/coach-messages", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).PATCH as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq("PATCH"))).status).toBe(401);
  });

  it("marks all as read when markAll=true", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { markAll: true },
    });
    (markAllRead as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const json = await (await handler(makeReq("PATCH"))).json();
    expect(json.ok).toBe(true);
    expect(markAllRead).toHaveBeenCalledWith("u1");
  });

  it("marks single message as read", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { messageId: "m1" },
    });
    (markMessageRead as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const json = await (await handler(makeReq("PATCH"))).json();
    expect(json.ok).toBe(true);
    expect(markMessageRead).toHaveBeenCalledWith("m1", "u1");
  });
});
