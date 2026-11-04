import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSql = vi.fn();

vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

vi.mock("@/lib/report-generation", () => ({
  generateCareerReport: vi.fn(),
}));

vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/access/check-access", () => ({
  canAccessFeature: vi.fn(),
}));

vi.mock("@/lib/db/assessments", () => ({
  getEffectiveAssessment: vi.fn(),
  verifyAssessmentOwnership: vi.fn(),
}));

vi.mock("@/lib/db/conditions", () => ({
  getRealConditions: vi.fn(),
  getRealConditionsByUserId: vi.fn(),
}));

vi.mock("@/lib/db/profiles", () => ({
  getProfileByAssessment: vi.fn(),
}));

vi.mock("@/lib/db/reports", () => ({
  saveReportTransactional: vi.fn(),
  getReportByAssessment: vi.fn(),
  getReportIdByAssessment: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/validation/parse-body", () => ({
  parseBody: vi.fn(),
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
  },
  logApiError: vi.fn(),
}));

vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/report/prerequisites", () => ({
  computeInputHash: vi.fn().mockReturnValue("hash-abc"),
}));

vi.mock("@/lib/db/assessment-lifecycle", () => ({
  afterReportGenerated: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/report-generation-lock", () => ({
  acquireReportLock: vi.fn(),
  releaseReportLock: vi.fn().mockResolvedValue(undefined),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { canAccessFeature } from "@/lib/access/check-access";
import { parseBody } from "@/lib/validation/parse-body";
import { generateCareerReport } from "@/lib/report-generation";
import { verifyAssessmentOwnership } from "@/lib/db/assessments";
import {
  getReportByAssessment,
  getReportIdByAssessment,
} from "@/lib/db/reports";
import { acquireReportLock } from "@/lib/db/report-generation-lock";

function makeRequest(): Request {
  return new Request("http://localhost/api/generate-report/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
}

function allowGuard(user: { id: string; cohort?: string } = { id: "user-1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/generate-report/stream", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.POST as (req: Request) => Promise<Response>;
    (verifyAssessmentOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(
      "owner",
    );
  });

  it("returns JSON immediately when a report already exists", async () => {
    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "assess-1", locale: "en" },
    });
    (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "existing-rpt",
    });

    const res = await handler(makeRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    await expect(res.json()).resolves.toEqual({ reportId: "existing-rpt" });
    expect(acquireReportLock).not.toHaveBeenCalled();
    expect(generateCareerReport).not.toHaveBeenCalled();
  });

  it("waits for the in-progress generation and streams the finished reportId", async () => {
    vi.useFakeTimers();

    allowGuard({ id: "user-1", cohort: "research-2026" });
    (canAccessFeature as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { assessmentId: "assess-1", locale: "en" },
    });
    (getReportByAssessment as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (acquireReportLock as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (getReportIdByAssessment as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce("existing-rpt");

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");

    const bodyPromise = res.text();
    await vi.advanceTimersByTimeAsync(1500);
    const body = await bodyPromise;

    expect(body).toContain('data: {"stage":"preparing"}');
    expect(body).toContain(
      'data: {"stage":"complete","reportId":"existing-rpt"}',
    );
    expect(generateCareerReport).not.toHaveBeenCalled();
  });
});
