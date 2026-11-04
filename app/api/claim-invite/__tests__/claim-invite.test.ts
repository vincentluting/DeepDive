import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks (before imports) ──────────────────────────────────
const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

vi.mock("@/lib/db/invite-codes", () => ({
  validateInviteCode: vi.fn(),
  claimInviteCode: vi.fn(),
}));

vi.mock("@/lib/cohort/config", () => ({
  isCohortActive: vi.fn(),
  resolveResearchGroup: vi.fn(),
  canSwitchToCohort: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { validateInviteCode, claimInviteCode } from "@/lib/db/invite-codes";
import {
  canSwitchToCohort,
  isCohortActive,
  resolveResearchGroup,
} from "@/lib/cohort/config";
import { parseBody } from "@/lib/validation/parse-body";

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/claim-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function allowGuard(
  user: { id: string; cohort?: string | null } = { id: "user-1" },
) {
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

// ── Tests ───────────────────────────────────────────────────
describe("POST /api/claim-invite", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks (unauthenticated)", async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
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

  it("returns 409 with already_in_target when user re-claims their current cohort", async () => {
    allowGuard({ id: "user-1", cohort: "beta_2026" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "ABC123" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "beta_2026",
      codeId: "code-1",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: false,
      reason: "already_in_target",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.reason).toBe("already_in_target");
    expect(claimInviteCode).not.toHaveBeenCalled();
  });

  it("returns 409 with downgrade_forbidden when thesis user tries a non-research code", async () => {
    allowGuard({ id: "user-1", cohort: "thesis_2026" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "BETA-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "beta_2026",
      codeId: "code-2",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: false,
      reason: "downgrade_forbidden",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.reason).toBe("downgrade_forbidden");
    expect(claimInviteCode).not.toHaveBeenCalled();
  });

  it("upgrades beta_2026 user to thesis_2026 with switched: true (does NOT touch researchConsentAt)", async () => {
    allowGuard({ id: "user-1", cohort: "beta_2026" });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      // locale: "en" required for thesis cohort (bug-log #002 follow-up gate).
      data: { inviteCode: "THESIS-CODE", locale: "en" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-3",
      researchGroup: null,
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(
      "classic",
    );
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      cohort: "thesis_2026",
      researchGroup: "classic",
      switched: true,
    });

    expect(claimInviteCode).toHaveBeenCalledWith("code-3", "user-1");

    // The UPDATE statement must not assign researchConsentAt — re-consent
    // happens at the dashboard gate, not silently on the upgrade path.
    expect(mockSql).toHaveBeenCalled();
    const sqlCallStrings = mockSql.mock.calls
      .map((call) => {
        const tpl = call[0] as TemplateStringsArray | unknown;
        if (tpl && typeof tpl === "object" && "raw" in (tpl as object)) {
          return (tpl as TemplateStringsArray).join(" ");
        }
        return String(tpl);
      })
      .join(" ");
    expect(sqlCallStrings).not.toMatch(/researchConsentAt/);
  });

  it("returns 400 when invite code is invalid", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "BAD-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: false,
      reason: "Code not found",
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("Invalid invite code");
  });

  it("returns 400 when cohort is inactive", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "VALID-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "inactive-cohort",
      codeId: "code-1",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(false);

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toContain("inactive cohort");
  });

  it("claims invite code and enrolls user in cohort (happy path)", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "VALID-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "research-2026",
      codeId: "code-1",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(
      "treatment",
    );
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      cohort: "research-2026",
      researchGroup: "treatment",
      switched: false,
    });

    expect(claimInviteCode).toHaveBeenCalledWith("code-1", "user-1");
    expect(mockSql).toHaveBeenCalled();
  });

  it("returns 409 when the code is no longer claimable (bug-log #085)", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "FULL-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "research-2026",
      codeId: "code-1",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    // Atomic claim loses the capacity race (TOCTOU): the WHERE guard matched
    // zero rows because the code filled up, so claimInviteCode returns false.
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(
      "treatment",
    );
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.reason).toBe("code_unavailable");
    // The cohort UPDATE must not run once the claim fails.
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("handles beta cohort with null research group", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "BETA-CODE" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "beta-v1",
      codeId: "code-2",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({
      success: true,
      cohort: "beta-v1",
      researchGroup: null,
      switched: false,
    });
  });

  // ── Thesis locale gate (bug-log #002 follow-up) ───────────────
  // Mirrors /api/auth/register's gate so logged-in users cannot bypass the
  // language restriction by claiming the invite from Settings instead of
  // through registration. Consent + Module B are only en/zh.

  it("rejects thesis cohort claim when locale is not en or zh (bug-log #002)", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "TH26-X", locale: "nl" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const res = await handler(
      makeRequest({ inviteCode: "TH26-X", locale: "nl" }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.reason).toBe("thesis_locale_not_supported");
    // Crucial: no claim happens.
    expect(claimInviteCode).not.toHaveBeenCalled();
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("allows thesis cohort claim when locale is en (bug-log #002)", async () => {
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "TH26-X", locale: "en" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
      researchGroup: "immersive",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(
      "immersive",
    );
    mockSql.mockResolvedValue([]);

    const res = await handler(
      makeRequest({ inviteCode: "TH26-X", locale: "en" }),
    );
    expect(res.status).toBe(200);
    expect(claimInviteCode).toHaveBeenCalled();
  });

  it("rejects thesis cohort claim when locale is missing (bug-log #002)", async () => {
    // Defensive: locale optional in schema but thesis cohort requires explicit en/zh.
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "TH26-X" }, // no locale
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "thesis_2026",
      codeId: "code-th",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);

    const res = await handler(makeRequest({ inviteCode: "TH26-X" }));
    expect(res.status).toBe(400);
    expect(claimInviteCode).not.toHaveBeenCalled();
  });

  it("does not gate non-thesis cohorts on locale (bug-log #002)", async () => {
    // Locale gate is thesis-only. beta_2026 / others can still be claimed in any locale.
    allowGuard({ id: "user-1", cohort: null });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { inviteCode: "BETA-1", locale: "nl" },
    });
    (validateInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue({
      valid: true,
      cohortId: "beta_2026",
      codeId: "code-beta",
    });
    (isCohortActive as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (canSwitchToCohort as ReturnType<typeof vi.fn>).mockReturnValue({
      allowed: true,
    });
    (claimInviteCode as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (resolveResearchGroup as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockSql.mockResolvedValue([]);

    const res = await handler(
      makeRequest({ inviteCode: "BETA-1", locale: "nl" }),
    );
    expect(res.status).toBe(200);
    expect(claimInviteCode).toHaveBeenCalled();
  });
});
