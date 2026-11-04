import { describe, expect, it } from "vitest";
import {
  FIELD_MIN_LENGTHS,
  IDENTITY_NARRATIVES_JSON_SCHEMA,
  IdentityNarrativesSchema,
  parseIdentityNarratives,
} from "../identity-narrative-schema";
import { REQUIRED_NARRATIVE_KEYS } from "../narrative-renderability";

function makeValidPayload(
  overrides: Partial<
    Record<(typeof REQUIRED_NARRATIVE_KEYS)[number], string>
  > = {},
): Record<string, string> {
  return {
    identitySummary: "a".repeat(FIELD_MIN_LENGTHS.identitySummary + 5),
    archetypeNarrative: "b".repeat(FIELD_MIN_LENGTHS.archetypeNarrative + 5),
    bigFiveNarrative: "c".repeat(FIELD_MIN_LENGTHS.bigFiveNarrative + 5),
    valueNarrative: "d".repeat(FIELD_MIN_LENGTHS.valueNarrative + 5),
    sjtTensionNarrative: "e".repeat(FIELD_MIN_LENGTHS.sjtTensionNarrative + 5),
    crossDimensionNarrative: "f".repeat(
      FIELD_MIN_LENGTHS.crossDimensionNarrative + 5,
    ),
    growthMapInsight: "g".repeat(FIELD_MIN_LENGTHS.growthMapInsight + 5),
    ...overrides,
  };
}

describe("IdentityNarrativesSchema", () => {
  it("accepts a payload that meets every min-length", () => {
    const result = IdentityNarrativesSchema.safeParse(makeValidPayload());
    expect(result.success).toBe(true);
  });

  it("rejects when a single field is below min-length", () => {
    const result = IdentityNarrativesSchema.safeParse(
      makeValidPayload({
        valueNarrative: "短",
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const failedPaths = result.error.issues.map((i) => i.path[0]);
      expect(failedPaths).toContain("valueNarrative");
    }
  });

  it("rejects when a field is missing entirely (typed as undefined)", () => {
    const partial = makeValidPayload();
    // Remove a key by deletion
    delete (partial as Record<string, unknown>).growthMapInsight;
    const result = IdentityNarrativesSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it("trims whitespace before checking length (placeholder leak detection)", () => {
    // " (无) " is exactly the kind of leak the old hand-rolled gate
    // would silently let through if we didn't trim consistently.
    const payload = makeValidPayload({ valueNarrative: "   (无)   " });
    const result = IdentityNarrativesSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("ignores extra keys (LLM may emit meaningCompassNarrative which is lazy)", () => {
    const payload = {
      ...makeValidPayload(),
      meaningCompassNarrative: "this is a lazy field, schema should not block",
    };
    const result = IdentityNarrativesSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

describe("parseIdentityNarratives", () => {
  it("returns ok for a valid payload", () => {
    const result = parseIdentityNarratives(makeValidPayload());
    expect(result.kind).toBe("ok");
  });

  it("returns incomplete with the failing key and per-field lengths", () => {
    const payload = makeValidPayload({ valueNarrative: "x" });
    const result = parseIdentityNarratives(payload);
    expect(result.kind).toBe("incomplete");
    if (result.kind === "incomplete") {
      expect(result.missingKeys).toEqual(["valueNarrative"]);
      // All 7 fields measured (including the failing one at length 1).
      expect(Object.keys(result.fieldLengths).sort()).toEqual(
        [...REQUIRED_NARRATIVE_KEYS].sort(),
      );
      expect(result.fieldLengths.valueNarrative).toBe(1);
    }
  });

  it("returns incomplete with multiple keys when several fields fail", () => {
    const payload = makeValidPayload({
      identitySummary: "no",
      growthMapInsight: "no",
    });
    const result = parseIdentityNarratives(payload);
    expect(result.kind).toBe("incomplete");
    if (result.kind === "incomplete") {
      expect([...result.missingKeys].sort()).toEqual(
        ["growthMapInsight", "identitySummary"].sort(),
      );
    }
  });

  it("treats non-object input as fully incomplete (missing all keys)", () => {
    const result = parseIdentityNarratives("not an object");
    expect(result.kind).toBe("incomplete");
    if (result.kind === "incomplete") {
      expect([...result.missingKeys].sort()).toEqual(
        [...REQUIRED_NARRATIVE_KEYS].sort(),
      );
    }
  });

  it("treats null as fully incomplete", () => {
    expect(parseIdentityNarratives(null).kind).toBe("incomplete");
    expect(parseIdentityNarratives(undefined).kind).toBe("incomplete");
  });
});

describe("IDENTITY_NARRATIVES_JSON_SCHEMA", () => {
  it("includes every REQUIRED_NARRATIVE_KEYS field as required + string", () => {
    const props = IDENTITY_NARRATIVES_JSON_SCHEMA.schema.properties as Record<
      string,
      { type: string; minLength: number }
    >;
    for (const key of REQUIRED_NARRATIVE_KEYS) {
      expect(props[key]).toBeDefined();
      expect(props[key]?.type).toBe("string");
      expect(props[key]?.minLength).toBe(FIELD_MIN_LENGTHS[key]);
    }
    expect(IDENTITY_NARRATIVES_JSON_SCHEMA.schema.required.length).toBe(
      REQUIRED_NARRATIVE_KEYS.length,
    );
  });

  it("uses strict shape (no additional properties allowed)", () => {
    expect(IDENTITY_NARRATIVES_JSON_SCHEMA.schema.additionalProperties).toBe(
      false,
    );
  });
});
