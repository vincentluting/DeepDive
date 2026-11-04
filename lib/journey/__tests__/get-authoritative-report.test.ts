// ============================================================
// Tests for resolveReportId — the stale-UserContext recovery helper
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/reports", () => ({
  checkReportOwnership: vi.fn(),
  getLatestReportIdForUser: vi.fn(),
}));

import {
  checkReportOwnership,
  getLatestReportIdForUser,
} from "@/lib/db/reports";
import { resolveReportId } from "../get-authoritative-report";

const ownership = vi.mocked(checkReportOwnership);
const latest = vi.mocked(getLatestReportIdForUser);

beforeEach(() => {
  ownership.mockReset();
  latest.mockReset();
});

describe("resolveReportId", () => {
  it("prefers URL param when ownership is verified", async () => {
    ownership.mockResolvedValue(true);
    const r = await resolveReportId({
      userId: "u1",
      reportIdParam: "rep-from-url",
      latestReportIdFromContext: "rep-from-ctx",
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-from-url", source: "url_param" });
    expect(ownership).toHaveBeenCalledWith("rep-from-url", "u1");
    expect(latest).not.toHaveBeenCalled();
  });

  it("falls through when URL param has invalid ownership (anti-enumeration)", async () => {
    // URL stolen-id → false, ctx rep-from-ctx → true (still owned).
    ownership.mockImplementation((reportId: string) =>
      Promise.resolve(reportId === "rep-from-ctx"),
    );
    const r = await resolveReportId({
      userId: "u1",
      reportIdParam: "stolen-id",
      latestReportIdFromContext: "rep-from-ctx",
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-from-ctx", source: "context" });
  });

  it("falls through when URL ownership check throws", async () => {
    ownership.mockResolvedValueOnce(false).mockResolvedValueOnce(true); // URL fails, ctx passes
    ownership.mockReset();
    ownership.mockImplementation((reportId: string) =>
      Promise.resolve(reportId === "rep-ctx"),
    );
    const r = await resolveReportId({
      userId: "u1",
      reportIdParam: "rep-x",
      latestReportIdFromContext: "rep-ctx",
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-ctx", source: "context" });
  });

  it("uses UserContext.latestReportId after verifying it still exists", async () => {
    ownership.mockResolvedValue(true);
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: "rep-from-ctx",
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-from-ctx", source: "context" });
    expect(ownership).toHaveBeenCalledWith("rep-from-ctx", "u1");
    expect(latest).not.toHaveBeenCalled();
  });

  it("falls through to DB recovery when ctx.latestReportId is stale", async () => {
    // Cache points at a row that's been deleted — ownership returns false.
    ownership.mockResolvedValue(false);
    latest.mockResolvedValue("rep-recovered");
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: "rep-deleted",
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-recovered", source: "db_recovery" });
  });

  it("recovers from stale UserContext when FSM says report exists", async () => {
    latest.mockResolvedValue("rep-from-db");
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: null,
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: "rep-from-db", source: "db_recovery" });
    expect(latest).toHaveBeenCalledWith("u1");
  });

  it("does NOT query DB when FSM says report doesn't exist (avoid waste)", async () => {
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: null,
      journeyState: "profile_generated", // hasn't reached report_generated
    });
    expect(r).toEqual({ reportId: null, source: "none" });
    expect(latest).not.toHaveBeenCalled();
  });

  it("returns none when DB recovery also yields null", async () => {
    latest.mockResolvedValue(null);
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: null,
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: null, source: "none" });
  });

  it("survives DB recovery errors (returns none, doesn't throw)", async () => {
    latest.mockRejectedValue(new Error("DB outage"));
    const r = await resolveReportId({
      userId: "u1",
      latestReportIdFromContext: null,
      journeyState: "report_generated",
    });
    expect(r).toEqual({ reportId: null, source: "none" });
  });
});
