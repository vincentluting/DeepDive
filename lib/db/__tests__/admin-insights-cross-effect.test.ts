// ============================================================
// getPrePostEffectSummary — T0→T1 and T0→T2 are SEPARATE tests
//
// Locks the headline-statistics fix: the old code pooled
// post_immediate and post_1week rows into ONE paired t-test, which
// double-counted users and conflated the two windows. The summary
// must now compute each window independently.
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("@/lib/db/admin-insights", () => ({
  getPrePostPairedData: vi.fn(),
}));

import { getPrePostEffectSummary } from "@/lib/db/admin-insights-cross";
import { getPrePostPairedData } from "@/lib/db/admin-insights";

beforeEach(() => vi.clearAllMocks());

function pairedRows() {
  // 6 users with T1, 5 of them also have T2. Deltas differ per window.
  const rows: {
    userId: string;
    sccPre: number;
    sccPost: number;
    postType: string;
  }[] = [];
  for (let i = 1; i <= 6; i++) {
    rows.push({
      userId: `u${i}`,
      sccPre: 20,
      sccPost: 25 + i, // T1 delta ≈ +5..+11
      postType: "post_immediate",
    });
  }
  for (let i = 1; i <= 5; i++) {
    rows.push({
      userId: `u${i}`,
      sccPre: 20,
      sccPost: 22 + i, // T2 delta ≈ +2..+7
      postType: "post_1week",
    });
  }
  return rows;
}

describe("getPrePostEffectSummary", () => {
  it("computes T1 and T2 effects on disjoint windows with correct n", async () => {
    vi.mocked(getPrePostPairedData).mockResolvedValue(pairedRows());

    const result = await getPrePostEffectSummary();
    expect(result).not.toBeNull();
    // n must reflect each window's own pair count — NOT the pooled 11
    expect(result!.sccImmediate?.n).toBe(6);
    expect(result!.scc1Week?.n).toBe(5);
    // Both windows improved
    expect(result!.sccImmediate!.meanDelta).toBeGreaterThan(0);
    expect(result!.scc1Week!.meanDelta).toBeGreaterThan(0);
    // T1 mean delta (avg +8.5) > T2 mean delta (avg +5)
    expect(result!.sccImmediate!.meanDelta).toBeGreaterThan(
      result!.scc1Week!.meanDelta,
    );
    // Summary mentions both windows
    expect(result!.summary.en).toContain("T0→T1");
    expect(result!.summary.en).toContain("T0→T2");
  });

  it("returns a T1-only summary when T2 has too few pairs (<5)", async () => {
    const rows = pairedRows().filter(
      (r) => r.postType === "post_immediate" || r.userId === "u1",
    ); // 6× T1, 1× T2
    vi.mocked(getPrePostPairedData).mockResolvedValue(rows);

    const result = await getPrePostEffectSummary();
    expect(result).not.toBeNull();
    expect(result!.sccImmediate?.n).toBe(6);
    expect(result!.scc1Week).toBeNull();
    expect(result!.summary.en).toContain("T0→T1");
    expect(result!.summary.en).not.toContain("T0→T2");
  });

  it("returns null when no window reaches the minimum pair count", async () => {
    vi.mocked(getPrePostPairedData).mockResolvedValue([
      { userId: "u1", sccPre: 20, sccPost: 25, postType: "post_immediate" },
      { userId: "u2", sccPre: 20, sccPost: 26, postType: "post_immediate" },
    ]);
    const result = await getPrePostEffectSummary();
    expect(result).toBeNull();
  });

  it("returns null when there is no paired data at all", async () => {
    vi.mocked(getPrePostPairedData).mockResolvedValue([]);
    const result = await getPrePostEffectSummary();
    expect(result).toBeNull();
  });
});
