// ============================================================
// admin-overview — partial-failure tolerance & KPI composition
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/connection", () => ({ sql: vi.fn() }));
vi.mock("@/lib/db/admin-insights", () => ({ getAdminOverview: vi.fn() }));
vi.mock("@/lib/analytics/funnel-queries", () => ({
  getConversionRates: vi.fn(),
}));
vi.mock("@/lib/db/durable-jobs", () => ({ getDurableJobHealth: vi.fn() }));
vi.mock("@/lib/db/llm-usage", () => ({ getLLMUsageByModel: vi.fn() }));
vi.mock("@/lib/db/companions", () => ({ countOpenReports: vi.fn() }));
vi.mock("@/lib/db/research-data-quality", () => ({
  getResearchChainRows: vi.fn(),
}));

import { sql } from "@/lib/db/connection";
import { getAdminOverview } from "@/lib/db/admin-insights";
import { getConversionRates } from "@/lib/analytics/funnel-queries";
import { getDurableJobHealth } from "@/lib/db/durable-jobs";
import { getLLMUsageByModel } from "@/lib/db/llm-usage";
import { countOpenReports } from "@/lib/db/companions";
import { getResearchChainRows } from "@/lib/db/research-data-quality";
import { getAdminOverviewData } from "@/lib/db/admin-overview";

function mockHappyPath() {
  // sql is used by: active7d, degraded rate, trend, recent users
  vi.mocked(sql).mockImplementation(((strings: TemplateStringsArray) => {
    const text = strings.join(" ");
    if (text.includes('"UserFunnel"')) {
      return Promise.resolve([{ active: 12 }]);
    }
    if (text.includes('"LLMUsageLog"')) {
      return Promise.resolve([{ total: 100, degraded: 3 }]);
    }
    if (text.includes("TO_CHAR")) {
      return Promise.resolve([{ date: "2026-06-01", count: 2 }]);
    }
    return Promise.resolve([
      {
        id: "u1",
        email: "new@example.com",
        name: null,
        createdAt: "2026-06-10T00:00:00Z",
      },
    ]);
  }) as unknown as typeof sql);

  vi.mocked(getAdminOverview).mockResolvedValue({
    totalUsers: 40,
    totalReports: 10,
    totalQuickDives: 30,
    newUsersInPeriod: 5,
    newReportsInPeriod: 2,
  });
  vi.mocked(getConversionRates).mockResolvedValue({
    registered: 40,
    quickdive_started: 20,
    quickdive_completed: 18,
    immersive_explore_started: 5,
    immersive_explore_completed: 4,
    deepdive_started: 12,
    deepdive_completed: 10,
    report_viewed: 8,
    report_reacted: 5,
    coaching_started: 4,
  });
  vi.mocked(getLLMUsageByModel).mockResolvedValue([
    {
      model: "claude-sonnet-4-6",
      provider: "anthropic",
      totalCalls: 50,
      successCount: 50,
      failureCount: 0,
      avgLatencyMs: 1200,
      totalInputTokens: 1000,
      totalOutputTokens: 2000,
      degradedCount: 0,
      totalCacheReadTokens: 0,
      totalCacheWriteTokens: 0,
      cacheHitCount: 0,
      estimatedCostUsd: 1.25,
      cacheHitRate: 0,
    },
  ] as unknown as Awaited<ReturnType<typeof getLLMUsageByModel>>);
  vi.mocked(getDurableJobHealth).mockResolvedValue({
    pending: 1,
    running: 0,
    succeededLast24h: 9,
    failedLast24h: 2,
    oldestPendingAt: null,
  } as unknown as Awaited<ReturnType<typeof getDurableJobHealth>>);
  vi.mocked(countOpenReports).mockResolvedValue(3);
  vi.mocked(getResearchChainRows).mockResolvedValue([
    {
      userId: "r1",
      email: "p1@example.com",
      researchGroup: "classic",
      researchConsentAt: "2026-05-01T00:00:00.000Z",
      hasConsentRecord: true,
      hasActiveConsentRecord: true,
      isAdmin: false,
      t0At: "2026-05-01T01:00:00.000Z",
      t1At: "2026-05-02T00:00:00.000Z",
      t2At: "2026-05-10T00:00:00.000Z",
      coachingSessionCount: 1,
      reminderLogStatus: "none",
    },
  ]);
}

beforeEach(() => vi.clearAllMocks());

describe("getAdminOverviewData", () => {
  it("composes all segments on the happy path", async () => {
    mockHappyPath();
    const data = await getAdminOverviewData();

    expect(data.kpis).toEqual({
      totalUsers: 40,
      newUsers7d: 5,
      active7d: 12,
      qdToReportRate30d: 40, // 8 / 20
      llmCost7dUsd: 1.25,
      llmCalls7d: 50,
    });
    expect(data.research).toMatchObject({
      consented: 1,
      target: 50,
      t0: 1,
      t1: 1,
      t2: 1,
      fullChain: 1,
      classic: 1,
      immersive: 0,
    });
    expect(data.alerts).toMatchObject({
      durableJobsFailed24h: 2,
      openModerationReports: 3,
      llmDegradedRate7dPct: 3, // 3/100
      thesisDataErrors: 0,
    });
    expect(data.registrationTrend).toHaveLength(1);
    expect(data.recentUsers).toHaveLength(1);
  });

  it("excludes admin and withdrawn-consent users from recruitment counts (#087)", async () => {
    mockHappyPath();
    const baseRow = {
      email: "x@example.com",
      researchGroup: "classic" as string | null,
      researchConsentAt: "2026-05-01T00:00:00.000Z" as string | null,
      hasConsentRecord: true,
      hasActiveConsentRecord: true,
      isAdmin: false,
      t0At: "2026-05-01T01:00:00.000Z" as string | null,
      t1At: "2026-05-02T00:00:00.000Z" as string | null,
      t2At: "2026-05-10T00:00:00.000Z" as string | null,
      coachingSessionCount: 0,
      reminderLogStatus: "none" as const,
    };
    vi.mocked(getResearchChainRows).mockResolvedValue([
      { ...baseRow, userId: "real" },
      { ...baseRow, userId: "admin", isAdmin: true },
      { ...baseRow, userId: "withdrawn", hasActiveConsentRecord: false },
    ]);

    const data = await getAdminOverviewData();
    // Only the one canonical participant counts; admin + withdrawn excluded (#087).
    expect(data.research).toMatchObject({
      consented: 1,
      t0: 1,
      t1: 1,
      t2: 1,
      fullChain: 1,
      classic: 1,
      immersive: 0,
    });
  });

  it("a failed segment nulls only that segment (partial-failure tolerance)", async () => {
    mockHappyPath();
    vi.mocked(getAdminOverview).mockRejectedValue(new Error("db down"));

    const data = await getAdminOverviewData();
    expect(data.kpis).toBeNull(); // KPI segment failed
    expect(data.research).not.toBeNull(); // others survive
    expect(data.alerts).not.toBeNull();
    expect(data.recentUsers).not.toBeNull();
  });

  it("qdToReportRate30d is null when nobody started Quick Dive", async () => {
    mockHappyPath();
    vi.mocked(getConversionRates).mockResolvedValue({
      registered: 0,
      quickdive_started: 0,
      quickdive_completed: 0,
      immersive_explore_started: 0,
      immersive_explore_completed: 0,
      deepdive_started: 0,
      deepdive_completed: 0,
      report_viewed: 0,
      report_reacted: 0,
      coaching_started: 0,
    });

    const data = await getAdminOverviewData();
    expect(data.kpis?.qdToReportRate30d).toBeNull();
  });
});
