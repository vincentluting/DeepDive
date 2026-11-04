import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api/api-guard", () => ({ guardRoute: vi.fn() }));
vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_p: string, h: (...a: unknown[]) => unknown) => h,
}));
vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  },
  createErrorResponse: vi.fn(
    (c: string, m: string, s: number) =>
      new Response(JSON.stringify({ error: c, message: m }), { status: s }),
  ),
  logApiError: vi.fn(),
}));
vi.mock("@/lib/validation/parse-body", () => ({ parseBody: vi.fn() }));
vi.mock("@/lib/validation/api-schemas", () => ({
  actionItemUpdateSchema: {},
}));
vi.mock("@/lib/db/action-hub", () => ({
  completeActionItem: vi.fn(),
  updateActionItemStatus: vi.fn(),
  checkAndReachMilestones: vi.fn(),
}));
vi.mock("@/lib/achievements/engine", () => ({
  checkAchievements: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  completeActionItem,
  updateActionItemStatus,
  checkAndReachMilestones,
} from "@/lib/db/action-hub";

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
  return new Request("http://localhost/api/action-hub/items", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
}

beforeEach(() => vi.clearAllMocks());

describe("PATCH /api/action-hub/items", () => {
  let handler: (r: Request) => Promise<Response>;
  beforeEach(async () => {
    handler = (await import("../route")).PATCH as unknown as typeof handler;
  });

  it("returns 401 when blocked", async () => {
    blockGuard();
    expect((await handler(makeReq())).status).toBe(401);
  });

  it("completes an action item (happy path)", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { itemId: "item-1", status: "completed", note: "Done!" },
    });
    (completeActionItem as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (checkAndReachMilestones as ReturnType<typeof vi.fn>).mockResolvedValue([
      "ms-1",
    ]);

    const json = await (await handler(makeReq())).json();
    expect(json.success).toBe(true);
    expect(json.status).toBe("completed");
    expect(json.reachedMilestoneIds).toEqual(["ms-1"]);
  });

  it("updates status without completing", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { itemId: "item-1", status: "in_progress" },
    });
    (updateActionItemStatus as ReturnType<typeof vi.fn>).mockResolvedValue(
      true,
    );

    const json = await (await handler(makeReq())).json();
    expect(json.success).toBe(true);
    expect(json.status).toBe("in_progress");
    expect(json.reachedMilestoneIds).toEqual([]);
  });

  it("returns 404 when item not found", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { itemId: "missing", status: "completed" },
    });
    (completeActionItem as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    expect((await handler(makeReq())).status).toBe(404);
  });

  it("returns 500 on DB error", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { itemId: "item-1", status: "completed" },
    });
    (completeActionItem as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );
    expect((await handler(makeReq())).status).toBe(500);
  });
});
