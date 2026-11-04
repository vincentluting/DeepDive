import { describe, it, expect } from "vitest";
import { prePostAssessmentSchema } from "../api-schemas";

// Bug-log #007: CDC-5 (Career Direction Confidence) schema must enforce
// exactly the 5 fixed item keys with 1-5 Likert values. Previously
// `z.record(z.string(), z.number().int().min(1).max(5))` with only a
// max-10-keys cap accepted attacker payloads like `{"x": 1}` or partial
// submissions and the saving code would still compute a meaningless sum.
//
// These tests pin the strict contract so a future commit cannot weaken it.

const VALID_SCC = {
  scc1: 1,
  scc2: 2,
  scc3: 3,
  scc4: 4,
  scc5: 5,
  scc6: 1,
  scc7: 2,
  scc8: 3,
  scc9: 4,
  scc10: 5,
  scc11: 1,
  scc12: 2,
};

const VALID_CDC = {
  cdc1: 3,
  cdc2: 4,
  cdc3: 5,
  cdc4: 2,
  cdc5: 3,
};

describe("prePostAssessmentSchema — CDC-5 strict validation (bug-log #007)", () => {
  it("accepts a fully valid pre payload with all 5 CDC-5 keys", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: VALID_CDC,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload that omits cdcResponses entirely", () => {
    // CDC-5 is required at all 3 timepoints — schema-level required.
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
    });
    expect(result.success).toBe(false);
  });

  it("rejects cdcResponses with unknown keys (e.g. attacker payload {x:1})", () => {
    // .strict() rejects keys not in the cdc1..cdc5 contract.
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: { x: 1 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects cdcResponses missing required items (e.g. only cdc1)", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: { cdc1: 3 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects cdcResponses with extra unknown keys alongside valid items", () => {
    // Strict mode: all 5 valid + 1 extra unknown → reject.
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: { ...VALID_CDC, extra: 4 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects cdcResponses with values out of 1-5 range", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: { ...VALID_CDC, cdc3: 9 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects cdcResponses with non-integer values", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: { ...VALID_CDC, cdc1: 3.5 },
    });
    expect(result.success).toBe(false);
  });

  it("requires CDC-5 at post_immediate (T1) as well", () => {
    const validResult = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: VALID_SCC,
      cdcResponses: VALID_CDC,
    });
    expect(validResult.success).toBe(true);

    const missingResult = prePostAssessmentSchema.safeParse({
      assessmentType: "post_immediate",
      sccResponses: VALID_SCC,
    });
    expect(missingResult.success).toBe(false);
  });

  it("requires CDC-5 at post_1week (T2) as well", () => {
    const validResult = prePostAssessmentSchema.safeParse({
      assessmentType: "post_1week",
      sccResponses: VALID_SCC,
      cdcResponses: VALID_CDC,
    });
    expect(validResult.success).toBe(true);

    const missingResult = prePostAssessmentSchema.safeParse({
      assessmentType: "post_1week",
      sccResponses: VALID_SCC,
    });
    expect(missingResult.success).toBe(false);
  });

  it("rejects cdcResponses null", () => {
    const result = prePostAssessmentSchema.safeParse({
      assessmentType: "pre",
      sccResponses: VALID_SCC,
      cdcResponses: null,
    });
    expect(result.success).toBe(false);
  });
});
