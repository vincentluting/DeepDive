// ============================================================
// Tests for funnel-event metadata schemas — the validation gate for every
// analytics/research event. The load-bearing invariant: every FUNNEL_EVENTS
// name must have an EventSchemas entry, otherwise validateEventMetadata does
// `EventSchemas[event].safeParse` on `undefined` and throws at runtime,
// silently dropping (or crashing) research-critical funnel writes.
// ============================================================

import { describe, it, expect } from "vitest";
import { FUNNEL_EVENTS } from "../funnel-events";
import { EventSchemas, validateEventMetadata } from "../events";

describe("EventSchemas completeness", () => {
  it("has a schema for every FUNNEL_EVENTS name (no event can crash the validator)", () => {
    const missing = FUNNEL_EVENTS.filter((e) => !(e in EventSchemas));
    expect(missing).toEqual([]);
  });

  it("has no orphan schemas without a matching funnel event", () => {
    const known = new Set<string>(FUNNEL_EVENTS);
    const orphans = Object.keys(EventSchemas).filter((k) => !known.has(k));
    expect(orphans).toEqual([]);
  });

  it("validateEventMetadata never throws for any known event (returns null on bad data)", () => {
    for (const event of FUNNEL_EVENTS) {
      // garbage metadata must yield null, not an exception
      expect(() => validateEventMetadata(event, { junk: true })).not.toThrow();
    }
  });
});

describe("validateEventMetadata", () => {
  it("returns parsed data for valid metadata", () => {
    const out = validateEventMetadata("quickdive_started", {
      exploreMode: "classic",
      language: "en",
    });
    expect(out).toMatchObject({ exploreMode: "classic", language: "en" });
  });

  it("returns null when a required field is missing", () => {
    // quickdive_started requires `language`
    expect(
      validateEventMetadata("quickdive_started", { exploreMode: "classic" }),
    ).toBeNull();
  });

  it("returns null when an enum value is invalid", () => {
    expect(
      validateEventMetadata("quickdive_started", {
        exploreMode: "not-a-mode",
        language: "en",
      }),
    ).toBeNull();
  });

  it("strips unknown keys but keeps the validated shape", () => {
    const out = validateEventMetadata("quickdive_completed", {
      exploreMode: "immersive",
      archetypeCode: "RIA",
      language: "zh",
      sneaky: "should-be-stripped",
    });
    expect(out).toMatchObject({
      exploreMode: "immersive",
      archetypeCode: "RIA",
      language: "zh",
    });
    expect(out as Record<string, unknown>).not.toHaveProperty("sneaky");
  });
});
