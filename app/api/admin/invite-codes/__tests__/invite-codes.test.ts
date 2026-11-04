import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    CONFLICT: "CONFLICT",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/db/invite-codes", () => ({
  saveInviteCode: vi.fn(),
  listInviteCodes: vi.fn(),
  getClaimedUsersProgress: vi.fn(),
  toggleInviteCode: vi.fn(),
  updateInviteCodeNote: vi.fn(),
  deleteInviteCode: vi.fn(),
}));

vi.mock("@/lib/cohort/config", () => ({
  isCohortActive: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { parseBody } from "@/lib/validation/parse-body";
import {
  saveInviteCode,
  listInviteCodes,
  getClaimedUsersProgress,
  toggleInviteCode,
  updateInviteCodeNote,
  deleteInviteCode,
} from "@/lib/db/invite-codes";
import { isCohortActive } from "@/lib/cohort/config";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(method = "GET"): Request {
  return new Request("http://localhost/api/admin/invite-codes", {
    method,
    headers: { "Content-Type": "application/json" },
    body: method !== "GET" ? "{}" : undefined,
  });
}

function allowAdmin() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: { id: "admin-1", isAdmin: true },
  });
}

function blockGuard(status = 403) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Forbidden", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET ──────────────────────────────────────────────────────
describe("GET /api/admin/invite-codes", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(403);
  });

  it("returns invite codes list", async () => {
    allowAdmin();
    (listInviteCodes as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "c1",
        code: "ABC123",
        cohortId: "research-2026",
        claimedByUserIds: [],
      },
    ]);
    (getClaimedUsersProgress as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.codes).toHaveLength(1);
    expect(json.codes[0].code).toBe("ABC123");
  });

  it("maps full claimed-user progress into userProgress", async () => {
    allowAdmin();
    (listInviteCodes as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "c1",
        code: "ABC123",
        cohortId: "research-2026",
        claimedByUserIds: ["u1"],
      },
    ]);
    (getClaimedUsersProgress as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        userId: "u1",
        email: "a@x.com",
        name: "Ann",
        furthestStep: "report",
        createdAt: "2026-06-01T00:00:00.000Z",
        updatedAt: "2026-06-02T00:00:00.000Z",
        country: "NL",
        language: "en",
      },
    ]);

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.userProgress.u1).toEqual({
      email: "a@x.com",
      name: "Ann",
      furthestStep: "report",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-02T00:00:00.000Z",
      country: "NL",
      language: "en",
    });
  });
});

// ── POST ─────────────────────────────────────────────────────
describe("POST /api/admin/invite-codes", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    const res = await handler(makeRequest("POST"));
    expect(res.status).toBe(403);
  });

  it("returns 400 when cohort is inactive", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "NEW123", cohortId: "expired" },
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const res = await handler(makeRequest("POST"));
    expect(res.status).toBe(400);
  });

  it("creates invite code (happy path)", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "new123", cohortId: "research-2026" },
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (saveInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ic-1",
      code: "NEW123",
    });

    const res = await handler(makeRequest("POST"));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.inviteCode.code).toBe("NEW123");

    // Code should be uppercased
    expect(saveInviteCode).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NEW123", cohortId: "research-2026" }),
    );
  });

  it("returns 409 on duplicate code", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { code: "DUP", cohortId: "research-2026" },
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const err = new Error("unique violation") as Error & { code: string };
    err.code = "23505";
    (saveInviteCode as ReturnType<typeof vi.fn>).mockRejectedValue(err);

    const res = await handler(makeRequest("POST"));
    expect(res.status).toBe(409);
  });
});

// ── PATCH ────────────────────────────────────────────────────
describe("PATCH /api/admin/invite-codes", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.PATCH as unknown as (req: Request) => Promise<Response>;
  });

  it("toggles invite code active status", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c1", isActive: false },
    });
    (toggleInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest("PATCH"));
    expect(res.status).toBe(200);

    expect(toggleInviteCode).toHaveBeenCalledWith("c1", false);
  });

  it("updates the assignment note", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c1", adminNote: "Zhang San" },
    });
    (updateInviteCodeNote as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest("PATCH"));
    expect(res.status).toBe(200);

    expect(updateInviteCodeNote).toHaveBeenCalledWith("c1", "Zhang San");
    expect(toggleInviteCode).not.toHaveBeenCalled();
  });

  it("clears the assignment note (null)", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c1", adminNote: null },
    });
    (updateInviteCodeNote as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest("PATCH"));
    expect(res.status).toBe(200);

    expect(updateInviteCodeNote).toHaveBeenCalledWith("c1", null);
  });

  it("updates both active status and note together", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c1", isActive: true, adminNote: "Li Si" },
    });
    (toggleInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (updateInviteCodeNote as ReturnType<typeof vi.fn>).mockResolvedValue(
      undefined,
    );

    const res = await handler(makeRequest("PATCH"));
    expect(res.status).toBe(200);

    expect(toggleInviteCode).toHaveBeenCalledWith("c1", true);
    expect(updateInviteCodeNote).toHaveBeenCalledWith("c1", "Li Si");
  });
});

// ── DELETE ───────────────────────────────────────────────────
describe("DELETE /api/admin/invite-codes", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.DELETE as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 403 when non-admin", async () => {
    blockGuard();
    const res = await handler(makeRequest("DELETE"));
    expect(res.status).toBe(403);
  });

  it("deletes invite code (happy path)", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c1" },
    });
    (deleteInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      deleted: true,
    });

    const res = await handler(makeRequest("DELETE"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(deleteInviteCode).toHaveBeenCalledWith("c1");
  });

  it("returns 404 when code not found", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "missing" },
    });
    (deleteInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      deleted: false,
      reason: "not_found",
    });

    const res = await handler(makeRequest("DELETE"));
    expect(res.status).toBe(404);
  });

  it("returns 409 when code has been claimed", async () => {
    allowAdmin();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { codeId: "c-used" },
    });
    (deleteInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      deleted: false,
      reason: "has_usage",
    });

    const res = await handler(makeRequest("DELETE"));
    expect(res.status).toBe(409);
  });
});
