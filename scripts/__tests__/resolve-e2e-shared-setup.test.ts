import { describe, expect, it } from "vitest";
import { resolveE2ESharedSetupMode } from "../resolve-e2e-shared-setup";

describe("resolveE2ESharedSetupMode", () => {
  it("skips the heavy shared user pipeline for smoke-only runs", () => {
    expect(resolveE2ESharedSetupMode(["--project=smoke"])).toBe("skip");
  });

  it("runs the shared user pipeline when selected projects need it", () => {
    expect(resolveE2ESharedSetupMode(["--project=analytics-pipeline"])).toBe(
      "full",
    );
  });

  it("runs the shared user pipeline when no explicit project filter is present", () => {
    expect(resolveE2ESharedSetupMode([])).toBe("full");
  });

  it("supports the split --project value form", () => {
    expect(resolveE2ESharedSetupMode(["--project", "mobile-smoke"])).toBe(
      "skip",
    );
  });
});
