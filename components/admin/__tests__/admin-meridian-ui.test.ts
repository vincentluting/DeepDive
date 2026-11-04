// ============================================================
// Admin Meridian UI — structural regression tests
//
// The repo intentionally avoids a DOM test harness. These tests lock down
// the exported style contracts used by the admin redesign and verify the
// global CSS hooks that carry the light/dark Meridian treatment.
// ============================================================

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ADMIN_KPI_TONE_CLASSES } from "../shared/kpi-card";

describe("ADMIN_KPI_TONE_CLASSES", () => {
  it("keeps legacy KPI tone props on a Meridian-compatible palette", () => {
    expect(Object.keys(ADMIN_KPI_TONE_CLASSES)).toEqual([
      "primary",
      "green",
      "blue",
      "violet",
      "amber",
      "red",
    ]);

    expect(ADMIN_KPI_TONE_CLASSES.primary.accent).toContain(
      "dd-admin-kpi-accent--sea",
    );
    expect(ADMIN_KPI_TONE_CLASSES.violet.accent).toContain(
      "dd-admin-kpi-accent--gold",
    );
    expect(ADMIN_KPI_TONE_CLASSES.red.accent).toContain(
      "dd-admin-kpi-accent--alert",
    );
  });
});

describe("admin Meridian CSS hooks", () => {
  it("defines the shared light cockpit and dark bridge surfaces", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toContain(".dd-admin-shell");
    expect(css).toContain(".dd-admin-rail");
    expect(css).toContain(".dd-admin-panel");
    expect(css).toContain(".dd-admin-right-rail");
    expect(css).toContain(".dark .dd-admin-shell");
  });

  it("keeps dark admin text on foreground tokens, not background tokens", () => {
    const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toMatch(
      /\.dark \.dd-admin-nav-link\.is-active\s*\{[\s\S]*?color: var\(--md-ink\) !important;/,
    );
    expect(css).toMatch(
      /\.dark \.dd-admin-kpi-value\s*\{[\s\S]*?color: var\(--md-ink\) !important;/,
    );
  });
});
