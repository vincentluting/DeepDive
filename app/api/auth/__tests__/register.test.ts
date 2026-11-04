import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
vi.mock("next/server", async (importOriginal) => {
  const original = await importOriginal<typeof import("next/server")>();
  return { ...original, after: vi.fn() };
});

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

vi.mock("@/lib/auth", () => ({
  createUser: vi.fn(),
  emailExists: vi.fn(),
  createSession: vi.fn(),
  setSessionCookie: vi.fn(),
  resolveIpCountry: vi.fn(),
  updateUserRegistrationCountry: vi.fn(),
}));

vi.mock("@/lib/db/invite-codes", () => ({
  validateInviteCode: vi.fn(),
  claimInviteCode: vi.fn(),
}));

vi.mock("@/lib/cohort/config", () => ({
  isCohortActive: vi.fn(),
  resolveResearchGroup: vi.fn(),
}));

vi.mock("@/lib/analytics/client", () => ({
  serverAnalytics: {
    track: vi.fn().mockResolvedValue(undefined),
    identify: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("@/lib/jobs/post-registration", () => ({
  enqueuePostRegistrationJob: vi.fn(),
  handlePostRegistrationJob: vi.fn(),
}));

vi.mock("@/lib/jobs/runner", () => ({
  runDueJobs: vi.fn(),
}));

vi.mock("@/lib/db/identity", () => ({
  linkIdentity: vi.fn(),
  backfillFunnelEvents: vi.fn(),
  backfillPageVisits: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
    DB_CONSTRAINT_FAILED: "DB_CONSTRAINT_FAILED",
    CONFLICT: "CONFLICT",
    VALIDATION_ERROR: "VALIDATION_ERROR",
  },
  createErrorResponse: vi.fn((code: string, msg: string, status: number) => {
    return new Response(JSON.stringify({ error: code, message: msg }), {
      status,
    });
  }),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import {
  createUser,
  emailExists,
  createSession,
  setSessionCookie,
  resolveIpCountry,
} from "@/lib/auth";
import { validateInviteCode, claimInviteCode } from "@/lib/db/invite-codes";
import { isCohortActive, resolveResearchGroup } from "@/lib/cohort/config";
import { enqueuePostRegistrationJob } from "@/lib/jobs/post-registration";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  const req = new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // NextRequest has a .cookies property — add a minimal shim
  Object.defineProperty(req, "cookies", {
    value: { get: () => undefined },
  });
  return req;
}

function allowGuard() {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user: null,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Rate limited", { status }),
  });
}

const validData = {
  name: "Test User",
  email: "test@example.com",
  password: "securePass123",
};

const mockUser = { id: "user-1", email: "test@example.com", name: "Test User" };
const mockSession = { id: "session-1" };
const originalAdminEmails = process.env.ADMIN_EMAILS;

/** Set up all mocks for a successful registration */
function setupHappyPath() {
  allowGuard();
  (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: validData,
  });
  (emailExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
  (createUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
  (createSession as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
  (setSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  (resolveIpCountry as ReturnType<typeof vi.fn>).mockResolvedValue(
    Promise.resolve(null),
  );
  (enqueuePostRegistrationJob as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "job-1",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_EMAILS;
});

afterEach(() => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }
});

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../register/route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 429 when guard blocks", async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it("returns error when parseBody fails", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: "VALIDATION_ERROR" }), {
        status: 400,
      }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 500 when emailExists throws", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (emailExists as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("db down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("DB_CONSTRAINT_FAILED");
  });

  it("returns 409 when email already exists", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (emailExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await handler(makeRequest());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error).toBe("CONFLICT");
  });

  it("returns 500 when createUser throws", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (emailExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (createUser as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("constraint"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });

  it("returns 500 when createSession throws", async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: validData,
    });
    (emailExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (createUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    (createSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("session fail"),
    );
    (resolveIpCountry as ReturnType<typeof vi.fn>).mockResolvedValue(
      Promise.resolve(null),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });

  it("registers user successfully (happy path)", async () => {
    setupHappyPath();

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      user: { id: "user-1", email: "test@example.com", name: "Test User" },
    });

    expect(createUser).toHaveBeenCalledWith(
      "test@example.com",
      "securePass123",
      "Test User",
      false,
      "unknown",
      undefined,
    );
    expect(createSession).toHaveBeenCalledWith("user-1");
    expect(setSessionCookie).toHaveBeenCalledWith("session-1");
    expect(enqueuePostRegistrationJob).toHaveBeenCalledWith(
      expect.objectContaining({
        user: mockUser,
        email: "test@example.com",
        clientIp: "unknown",
      }),
    );
  });

  it("creates env-allowlisted admin users as admin immediately", async () => {
    process.env.ADMIN_EMAILS = "admin@example.com, test@example.com";
    setupHappyPath();

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(createUser).toHaveBeenCalledWith(
      "test@example.com",
      "securePass123",
      "Test User",
      true,
      "unknown",
      undefined,
    );
  });

  it("processes invite code on registration", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "RESEARCH-123" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "research-2026",
      codeId: "code-1",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockReturnValue(
      "treatment",
    );
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(validateInviteCode).toHaveBeenCalledWith("RESEARCH-123");
    expect(claimInviteCode).toHaveBeenCalledWith("code-1", "user-1");
    expect(mockSql).toHaveBeenCalled();
  });

  it("rejects registration when invite code is invalid", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "BAD-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: false,
      reason: "Not found",
    });

    const res = await handler(makeRequest());
    // Invalid invite code now blocks registration with 400
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
    expect(claimInviteCode).not.toHaveBeenCalled();
  });

  it("still succeeds when setSessionCookie fails", async () => {
    setupHappyPath();
    (setSessionCookie as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("cookie fail"),
    );

    const res = await handler(makeRequest());
    // User is created, just cookie failed — still returns success
    expect(res.status).toBe(200);
  });

  it("still succeeds when post-registration enqueue fails", async () => {
    setupHappyPath();
    (enqueuePostRegistrationJob as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("queue down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
  });

  // ── Thesis locale gate (bug-log #002 follow-up) ───────────────
  // The consent instrument + Module B (DDVQ-21 / Schwartz PVQ) are only
  // professionally translated in en + zh. Any other locale would mean the
  // participant reads English text → invalid informed consent + invalid
  // psychometric data. Gate at registration.

  it("rejects thesis cohort enrolment when locale is not en or zh (bug-log #002)", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "TH26-X", locale: "nl" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
    // Crucial: no user creation and no invite claim — rejected at validation step.
    expect(createUser).not.toHaveBeenCalled();
    expect(claimInviteCode).not.toHaveBeenCalled();
  });

  it("allows thesis cohort enrolment when locale is en (bug-log #002)", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "TH26-X", locale: "en" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalled();
    expect(claimInviteCode).toHaveBeenCalled();
  });

  it("allows thesis cohort enrolment when locale is zh (bug-log #002)", async () => {
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "TH26-X", locale: "zh" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalled();
  });

  it("rejects thesis cohort enrolment when locale is missing (bug-log #002)", async () => {
    // Defensive: locale is optional in schema for back-compat with other flows,
    // but thesis cohort must have a known en/zh locale.
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "TH26-X" }, // no locale field
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("does not gate non-thesis cohorts on locale (bug-log #002)", async () => {
    // Locale gate is thesis-only. beta_2026 / other cohorts must NOT be locked out.
    setupHappyPath();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, inviteCode: "BETA-1", locale: "nl" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "beta_2026",
      codeId: "code-beta",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockReturnValue(null);
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(createUser).toHaveBeenCalled();
  });
});
