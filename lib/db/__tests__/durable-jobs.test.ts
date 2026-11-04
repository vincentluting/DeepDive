import { describe, expect, it } from "vitest";
import {
  durableJobBackoffSeconds,
  formatDurableJobError,
} from "@/lib/db/durable-jobs";

describe("durable job helpers", () => {
  it("uses capped exponential backoff", () => {
    expect(durableJobBackoffSeconds(0)).toBe(0);
    expect(durableJobBackoffSeconds(1)).toBe(30);
    expect(durableJobBackoffSeconds(2)).toBe(60);
    expect(durableJobBackoffSeconds(3)).toBe(120);
    expect(durableJobBackoffSeconds(20)).toBe(1800);
  });

  it("formats errors without throwing on unknown values", () => {
    expect(formatDurableJobError(new TypeError("bad payload"))).toBe(
      "TypeError: bad payload",
    );
    expect(formatDurableJobError("plain")).toBe("plain");
  });
});
