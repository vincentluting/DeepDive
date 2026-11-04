import { describe, it, expect } from "vitest";
import { isHighCostRoute } from "../rate-limit-redis";

describe("isHighCostRoute", () => {
  it("matches legacy prefix routes", () => {
    expect(isHighCostRoute("/api/coaching-chat")).toBe(true);
    expect(isHighCostRoute("/api/generate-report")).toBe(true);
    expect(isHighCostRoute("/api/generate-profile")).toBe(true);
    expect(isHighCostRoute("/api/action-hub")).toBe(true);
    expect(isHighCostRoute("/api/memory")).toBe(true);
  });

  it("matches regenerate-pathway via a wildcard id segment (#051)", () => {
    expect(
      isHighCostRoute(
        "/api/report/9d3468dd-1234-4abc-9999-abcdef012345/regenerate-pathway",
      ),
    ).toBe(true);
  });

  it("does not over-match cheap /api/report reads", () => {
    expect(isHighCostRoute("/api/report/9d3468dd-1234")).toBe(false);
    expect(isHighCostRoute("/api/report/abc/summary")).toBe(false);
  });

  it("returns false for non-high-cost routes", () => {
    expect(isHighCostRoute("/api/score")).toBe(false);
    expect(isHighCostRoute("/api/session/save")).toBe(false);
  });
});
