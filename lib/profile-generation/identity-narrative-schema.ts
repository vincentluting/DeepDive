// ============================================================
// Identity Narrative Schema — Zod contract for LLM output
//
// Why this exists:
// Pre-2026-05 the generator validated LLM output with hand-rolled
// trim().length>=20 / >=10 thresholds (`generate-identity-narratives.ts`
// before the redesign). When LLM produced "(无)" or a 9-char placeholder,
// the gate triggered, the entire generation was tossed, and the cron
// retried the same prompt+data 5× before giving up. One user (assessment
// 377de626-..., 2026-05) was stuck for ~33h that way.
//
// This schema replaces the ad-hoc threshold with a single Zod contract:
//
//   - The shape (7 required string fields) is the API contract with the
//     LLM. OpenAI/Anthropic/Gemini all support structured output in
//     strict mode — the model is forced to emit valid JSON with all
//     keys (eliminates the "soul-parse-failed" failure mode entirely).
//
//   - The minimum length is enforced by Zod safeParse() AFTER the
//     provider returns. Providers don't enforce minLength on string
//     fields (it's a JSON Schema directive they ignore), so we still
//     gate at the application boundary.
//
// Pairs with:
//   - change C (field-level repair) — Zod's safeParse returns the
//     exact missingKeys, which the repair path uses to regenerate
//     only the failing fields instead of redoing all 7.
//   - change D (Sentry telemetry) — narrative-telemetry.ts consumes
//     the missingKeys list from Zod errors.
//
// Min-length rationale per field:
// Targets come from buildSoulCallPrompt's instructions to the LLM.
// The Zod min is set at ~60% of the lower target — strict enough that
// "(无)" or "TODO" get rejected, lenient enough that LLM variability
// within the prompted range still passes. Each field's target lives
// here as a code comment so we can tune without grepping prompt files.
// ============================================================

import { z } from "zod/v4";
import { REQUIRED_NARRATIVE_KEYS } from "./narrative-renderability";

/**
 * Per-field minimum acceptable length (after trim). String length in
 * chars — Chinese is roughly 1 char per "word" so this scales naturally
 * across locales without separate thresholds.
 *
 * If you raise these, also raise the matching length hint in
 * `buildSoulCallPrompt` / `buildCallAPrompt` / `buildCallBPrompt`
 * (the prompts request "N-X chars" or "N-X words") so the LLM is
 * asked for what we'll accept.
 */
export const FIELD_MIN_LENGTHS = {
  identitySummary: 60, // prompt target: 80-120字 / 60-100 words
  archetypeNarrative: 100, // prompt target: 150-250字 / 120-200 words
  bigFiveNarrative: 100, // prompt target: 150-250字 / 120-200 words
  valueNarrative: 40, // prompt target: 80-100字 / 60-80 words
  sjtTensionNarrative: 60, // prompt target: 120-180字 / 80-150 words
  crossDimensionNarrative: 60, // prompt target: 120-180字 / 80-150 words
  growthMapInsight: 50, // prompt target: 100-150字 / 60-120 words
} as const satisfies Record<(typeof REQUIRED_NARRATIVE_KEYS)[number], number>;

const narrativeField = (minLen: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(minLen, `must be at least ${minLen} chars`));

/**
 * Zod schema for the 7 required identity-narrative fields.
 * Use `IdentityNarrativesSchema.safeParse(llmOutput)` and inspect
 * `result.error.issues` for missingKeys when validation fails.
 */
export const IdentityNarrativesSchema = z.object({
  identitySummary: narrativeField(FIELD_MIN_LENGTHS.identitySummary),
  archetypeNarrative: narrativeField(FIELD_MIN_LENGTHS.archetypeNarrative),
  bigFiveNarrative: narrativeField(FIELD_MIN_LENGTHS.bigFiveNarrative),
  valueNarrative: narrativeField(FIELD_MIN_LENGTHS.valueNarrative),
  sjtTensionNarrative: narrativeField(FIELD_MIN_LENGTHS.sjtTensionNarrative),
  crossDimensionNarrative: narrativeField(
    FIELD_MIN_LENGTHS.crossDimensionNarrative,
  ),
  growthMapInsight: narrativeField(FIELD_MIN_LENGTHS.growthMapInsight),
});

export type IdentityNarrativesValid = z.infer<typeof IdentityNarrativesSchema>;

/**
 * JSON Schema for LLM structured-output enforcement (OpenAI/Gemini
 * `response_format: json_schema`, Anthropic tool-use input_schema).
 *
 * Important: providers honor the STRUCTURE (all 7 keys, each is a string)
 * in strict mode — but they DO NOT enforce `minLength`. We still need
 * Zod safeParse on the response to gate min-length. This schema's job
 * is to eliminate the "soul-parse-failed" / "key-missing-from-output"
 * failure modes by removing the LLM's freedom to omit fields entirely.
 */
export const IDENTITY_NARRATIVES_JSON_SCHEMA = {
  name: "identity_narratives_v1",
  schema: {
    type: "object",
    additionalProperties: false,
    required: [...REQUIRED_NARRATIVE_KEYS],
    properties: Object.fromEntries(
      REQUIRED_NARRATIVE_KEYS.map((key) => [
        key,
        {
          type: "string",
          // minLength is documented for human readers but providers ignore
          // it in strict mode (verified against OpenAI's json_schema spec,
          // 2026-04). Zod enforces this after parsing.
          minLength: FIELD_MIN_LENGTHS[key],
        },
      ]),
    ),
  },
} as const;

/**
 * Parse LLM output and return either the validated narratives or a
 * structured failure with the exact missingKeys (for telemetry + repair).
 *
 * Failure cases:
 *   - input is not an object → missingKeys = all 7 keys (treated as
 *     parse failure, same as old `extractJSON` returning null)
 *   - input is an object but ≥1 field fails min-length → missingKeys
 *     contains the failing keys
 */
export type ParseResult =
  | { kind: "ok"; value: IdentityNarrativesValid }
  | {
      kind: "incomplete";
      missingKeys: readonly (typeof REQUIRED_NARRATIVE_KEYS)[number][];
      fieldLengths: Record<string, number>;
    };

export function parseIdentityNarratives(input: unknown): ParseResult {
  if (!input || typeof input !== "object") {
    return {
      kind: "incomplete",
      missingKeys: [...REQUIRED_NARRATIVE_KEYS],
      fieldLengths: {},
    };
  }

  const fieldLengths: Record<string, number> = {};
  for (const key of REQUIRED_NARRATIVE_KEYS) {
    const v = (input as Record<string, unknown>)[key];
    fieldLengths[key] = typeof v === "string" ? v.trim().length : -1;
  }

  const result = IdentityNarrativesSchema.safeParse(input);
  if (result.success) {
    return { kind: "ok", value: result.data };
  }

  // Extract missingKeys from issues. Each issue.path[0] is the field key.
  const missingSet = new Set<string>();
  for (const issue of result.error.issues) {
    const key = issue.path[0];
    if (typeof key === "string") missingSet.add(key);
  }
  // If safeParse failed for reasons other than per-field (e.g. wrong type
  // at root), conservatively mark all keys missing.
  const missingKeys =
    missingSet.size > 0
      ? REQUIRED_NARRATIVE_KEYS.filter((k) => missingSet.has(k))
      : [...REQUIRED_NARRATIVE_KEYS];

  return { kind: "incomplete", missingKeys, fieldLengths };
}
