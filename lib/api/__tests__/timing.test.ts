// ============================================================
// timing — Server-Timing header attribution tests
//
// These pin the baseline behavior so we can trust the header
// when reading P50/P95 from real users:
//   - marks aggregate inside a single request context
//   - marks from outside the context are ignored (not leaked to
//     the next request)
//   - total is always present even when no marks recorded
//   - labels with disallowed characters get sanitized so the
//     header doesn't break the HTTP response
// ============================================================

import { describe, expect, it } from "vitest";

import {
  formatServerTiming,
  getTimingMarks,
  recordTiming,
  runWithTimingContext,
  timed,
} from "../timing";

describe("timing", () => {
  it("captures marks inside runWithTimingContext", async () => {
    await runWithTimingContext(async () => {
      recordTiming("db", 12.3);
      recordTiming("llm", 800.5);
      const marks = getTimingMarks();
      expect(marks).toEqual([
        { label: "db", dur: 12.3 },
        { label: "llm", dur: 800.5 },
      ]);
    });
  });

  it("does not leak marks across contexts", async () => {
    await runWithTimingContext(async () => {
      recordTiming("db", 10);
    });
    await runWithTimingContext(async () => {
      expect(getTimingMarks()).toEqual([]);
    });
  });

  it("ignores recordTiming outside a context (no crash)", () => {
    expect(() => recordTiming("orphan", 5)).not.toThrow();
    expect(getTimingMarks()).toEqual([]);
  });

  it("timed() wraps async work and records duration", async () => {
    await runWithTimingContext(async () => {
      const result = await timed("db", async () => {
        await new Promise((r) => setTimeout(r, 5));
        return "ok";
      });
      expect(result).toBe("ok");
      const marks = getTimingMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].label).toBe("db");
      expect(marks[0].dur).toBeGreaterThanOrEqual(4);
    });
  });

  it("timed() records duration even when the inner fn throws", async () => {
    await runWithTimingContext(async () => {
      await expect(
        timed("db", async () => {
          throw new Error("boom");
        }),
      ).rejects.toThrow("boom");
      const marks = getTimingMarks();
      expect(marks).toHaveLength(1);
      expect(marks[0].label).toBe("db");
    });
  });

  it("formatServerTiming includes total even with no marks", () => {
    const header = formatServerTiming([], 123.45);
    expect(header).toBe("total;dur=123.5");
  });

  it("formatServerTiming sanitizes labels with disallowed characters", () => {
    const header = formatServerTiming([{ label: "db query 1", dur: 10 }], 50);
    expect(header).toContain("db-query-1;dur=10.0");
    expect(header).toContain("total;dur=50.0");
  });

  it("formatServerTiming joins multiple marks with comma-space", () => {
    const header = formatServerTiming(
      [
        { label: "db", dur: 10.1 },
        { label: "llm", dur: 800.4 },
      ],
      900.7,
    );
    expect(header).toBe("db;dur=10.1, llm;dur=800.4, total;dur=900.7");
  });
});
