// ============================================================
// Funnel query SQL invariants — identity stitching & admin exclusion
//
// Locks two precision fixes (2026-06):
//   1. Anonymous→registered identity stitching via IdentityLink:
//      COALESCE(uf."userId", il."userId", uf."clientId") so one person
//      who registers mid-funnel counts as ONE unique identity.
//   2. Admin double-gate: row-level isAdmin flag AND User.isAdmin
//      NOT EXISTS (catches events stamped before the flag existed).
//
// Pattern: capture sql template strings (see research-consent-gate.test.ts).
// ============================================================

import { describe, expect, it, beforeEach, vi } from "vitest";

const capturedTemplates: string[][] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray, ..._values: unknown[]) => {
    capturedTemplates.push([...strings]);
    return Promise.resolve([] as unknown[]);
  }),
}));

import {
  getFunnelStats,
  getConversionRates,
  getFilteredConversionRates,
} from "@/lib/analytics/funnel-queries";

beforeEach(() => {
  capturedTemplates.length = 0;
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

function expectIdentityStitching(sql: string): void {
  expect(sql).toContain('"IdentityLink"');
  // Stitched identity key: userId → linked userId → clientId
  expect(sql).toContain('COALESCE(uf."userId", il."userId", uf."clientId")');
  // LATERAL must be capped to one link per clientId to avoid row multiplication
  expect(sql).toContain("LIMIT 1");
}

function expectAdminDoubleGate(sql: string): void {
  expect(sql).toContain('uf."isAdmin" = FALSE');
  expect(sql).toContain("NOT EXISTS");
  expect(sql).toContain('au."isAdmin" = TRUE');
}

describe("getFunnelStats — identity stitching + admin gate", () => {
  it("stitches anonymous events through IdentityLink", async () => {
    await getFunnelStats(30);
    expectIdentityStitching(joinedSql());
  });

  it("excludes admin users via both row flag and User.isAdmin", async () => {
    await getFunnelStats(30);
    expectAdminDoubleGate(joinedSql());
  });
});

describe("getConversionRates — identity stitching + admin gate", () => {
  it("stitches anonymous events through IdentityLink", async () => {
    await getConversionRates(30);
    expectIdentityStitching(joinedSql());
  });

  it("excludes admin users via both row flag and User.isAdmin", async () => {
    await getConversionRates(30);
    expectAdminDoubleGate(joinedSql());
  });
});

describe("getFilteredConversionRates — admin gate on User join", () => {
  it("delegates to getConversionRates when no filters (stitching applies)", async () => {
    await getFilteredConversionRates(30, {});
    expectIdentityStitching(joinedSql());
  });

  it("filters out admin accounts in the segmented query", async () => {
    await getFilteredConversionRates(30, { language: "en" });
    expect(joinedSql()).toContain('u."isAdmin" = FALSE');
  });
});
