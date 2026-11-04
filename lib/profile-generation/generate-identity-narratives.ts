// ============================================================
// Identity Narratives Generator v3
//
// 2 PARALLEL LLM calls at profile creation time:
//
// Call A — Identity Portrait (4 fields):
//   identitySummary, archetypeNarrative, bigFiveNarrative, valueNarrative
// Call B — Growth & Synthesis (3 fields):
//   sjtTensionNarrative, crossDimensionNarrative, growthMapInsight
//
// v3 changes from v2:
// - Split 1×5000 tokens → 2×1500 tokens (parallel) = 55s → ~15s
// - Word counts halved: 精炼但有深度, 击穿灵魂而非堆砌字数
// - Tier 1 friendly: total output ~3000 tokens (within 8000 OTPM limit)
//
// Narrative psychology foundations preserved:
// - McAdams Narrative Identity (coherence, agency, communion)
// - Savickas Career Construction (life portrait, temporal arc)
// - White & Epston Narrative Therapy (double story, thickening)
// - Anti-Barnum specificity (behavior-anchored, not trait-labeled)
// ============================================================

import type { PersonalProfileData } from "../types";
import type { ProfileAlgorithmOutput } from "../types/report";

/** algoSnapshot excludes archetypeContent (static, looked up from content library) */
type AlgoSnapshot = Omit<ProfileAlgorithmOutput, "archetypeContent">;

import { callLLM } from "../ai/model-router";
import { extractJSON as sharedExtractJSON } from "../ai/structured-output";
import { logLLMQualityCheck } from "../db/llm-usage";
import { checkQuality } from "../ai/quality-gate";
import { SCHWARTZ_VALUE_LABELS, BIG_FIVE_LABELS } from "../scoring/constants";
import { ARCHETYPES } from "../content";
import {
  enforceOutputLocale,
  buildRegeneratePrompt,
} from "../report-generation/language-guard";
import { localeLanguageNames, type Locale as AppLocale } from "../i18n/config";
import {
  computeNarrativeSeedpoints,
  type NarrativeSeedpoint,
} from "./narrative-seedpoints";
import { REQUIRED_NARRATIVE_KEYS } from "./narrative-renderability";
import {
  addNarrativeBreadcrumb,
  fieldLengthMap,
  reportNarrativeFailure,
} from "./narrative-telemetry";
import {
  IDENTITY_NARRATIVES_JSON_SCHEMA,
  parseIdentityNarratives,
} from "./identity-narrative-schema";

type Locale = string;

/** Map locale to a valid label key — "zh" stays "zh", everything else falls back to "en" */
function labelKey(locale: Locale): "en" | "zh" {
  return locale === "zh" ? "zh" : "en";
}

function targetLanguageName(locale: Locale): string {
  return localeLanguageNames[locale as AppLocale] ?? "English";
}

function targetLanguageLock(locale: Locale): string {
  if (locale === "zh") {
    return "全程中文，返回严格 JSON，段落式";
  }
  if (locale === "en") {
    return "English only, return strict JSON, flowing paragraphs";
  }
  const langName = targetLanguageName(locale);
  return `${langName} only, return strict JSON, flowing paragraphs. Translate all English/Chinese source labels internally and write every JSON string in ${langName}.`;
}

function targetPromptHeader(locale: Locale): string {
  if (locale === "zh" || locale === "en") return "";
  const langName = targetLanguageName(locale);
  return `\n\n## Output Language Lock\nEvery JSON string value MUST be written entirely in ${langName}. User data, archetype labels, and narrative ammunition may appear in English or Chinese; understand them internally, then rewrite them in natural ${langName}. Never mirror the user's input language when it differs from ${langName}.`;
}

const __DEV__ = process.env.NODE_ENV === "development";

/**
 * Shape of the narrative segments we generate.
 *
 * The first 7 fields are required for a complete profile (gate the page
 * entrance via narrative-renderability). meaningCompassNarrative is
 * generated lazily — when the user actually scrolls to Ch3, the route
 * triggers a single-field regeneration. Ch3 traffic is <5%, so generating
 * it eagerly wastes ~30% of the soul call's output budget.
 */
export interface IdentityNarratives {
  identitySummary: string;
  archetypeNarrative: string;
  bigFiveNarrative: string;
  valueNarrative: string;
  sjtTensionNarrative: string;
  crossDimensionNarrative: string;
  growthMapInsight: string;
  meaningCompassNarrative?: string;
}

// Fields for each parallel call (legacy 2-call fallback path).
// meaningCompassNarrative is intentionally NOT in either — only soul call generates it.
type CallAFields = Pick<
  IdentityNarratives,
  | "identitySummary"
  | "archetypeNarrative"
  | "bigFiveNarrative"
  | "valueNarrative"
>;
type CallBFields = Pick<
  IdentityNarratives,
  "sjtTensionNarrative" | "crossDimensionNarrative" | "growthMapInsight"
>;

const CALL_A_KEYS: (keyof CallAFields)[] = [
  "identitySummary",
  "archetypeNarrative",
  "bigFiveNarrative",
  "valueNarrative",
];
const CALL_B_KEYS: (keyof CallBFields)[] = [
  "sjtTensionNarrative",
  "crossDimensionNarrative",
  "growthMapInsight",
];
const REQUIRED_IDENTITY_NARRATIVE_KEYS: (keyof IdentityNarratives)[] = [
  ...REQUIRED_NARRATIVE_KEYS,
];

function missingRequiredNarrativeKeys(
  narratives: Partial<IdentityNarratives>,
): (keyof IdentityNarratives)[] {
  return REQUIRED_IDENTITY_NARRATIVE_KEYS.filter(
    (key) => !narratives[key]?.trim(),
  );
}

function hasAllRequiredNarratives(
  narratives: Partial<IdentityNarratives> | null | undefined,
): narratives is IdentityNarratives {
  if (!narratives) return false;
  return missingRequiredNarrativeKeys(narratives).length === 0;
}

// ── Layer 1: Score-to-band converters (input sanitization) ───
// LLM never sees raw numbers. It receives qualitative intensity bands only.

function deviationToBand(dev: number, locale: Locale): string {
  const abs = Math.abs(dev);
  if (locale === "zh") {
    if (dev > 0) {
      if (abs > 1.5) return "极强";
      if (abs > 0.8) return "很强";
      return "偏强";
    }
    if (abs > 1.5) return "极弱";
    if (abs > 0.8) return "很弱";
    return "偏弱";
  }
  if (dev > 0) {
    if (abs > 1.5) return "very pronounced";
    if (abs > 0.8) return "pronounced";
    return "moderately pronounced";
  }
  if (abs > 1.5) return "very low";
  if (abs > 0.8) return "notably low";
  return "moderately low";
}

function domainToBand(score: number, locale: Locale): string {
  if (locale === "zh") {
    if (score > 75) return "偏高";
    if (score > 60) return "中偏高";
    if (score >= 40) return "中等";
    if (score >= 25) return "中偏低";
    return "偏低";
  }
  if (score > 75) return "high";
  if (score > 60) return "moderate-high";
  if (score >= 40) return "moderate";
  if (score >= 25) return "moderate-low";
  return "low";
}

function consistencyToBand(pct: number, locale: Locale): string {
  if (locale === "zh") {
    if (pct >= 80) return "高度一致";
    if (pct >= 60) return "较为一致";
    if (pct >= 40) return "有明显差距";
    return "差距显著";
  }
  if (pct >= 80) return "highly consistent";
  if (pct >= 60) return "moderately consistent";
  if (pct >= 40) return "notable gaps";
  return "significant gaps";
}

function gapToBand(gap: number, locale: Locale): string {
  const abs = Math.abs(gap);
  if (locale === "zh") {
    if (abs > 0.8) return "差距显著";
    if (abs > 0.4) return "有差距";
    return "轻微差距";
  }
  if (abs > 0.8) return "significant gap";
  if (abs > 0.4) return "moderate gap";
  return "minor gap";
}

// ── Layer 3: Output sanitization (safety net) ────────────────
// Catches any residual numerical patterns the LLM may produce.

function sanitizeNarrativeOutput(text: string): string {
  let s = text;

  // ── Strip markdown formatting (LLM sometimes adds headings/bold/lists) ──
  // Markdown headings: ## Title, ### Title, etc.
  s = s.replace(/^#{1,6}\s+.+$/gm, "");
  // Chinese-style headings injected by prompt: 标题：...\n
  s = s.replace(/^标题[：:].+$/gm, "");
  // English-style headings injected by prompt: Heading: ...\n
  s = s.replace(/^Heading[：:].+$/gm, "");
  // Bold/italic markers: **text**, *text*, __text__, _text_
  s = s.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
  s = s.replace(/_{1,2}([^_]+)_{1,2}/g, "$1");
  // Ordered list prefixes: 1. , 2. , etc.
  s = s.replace(/^\d+\.\s+/gm, "");
  // Unordered list prefixes: - , * (at line start)
  s = s.replace(/^[-*]\s+/gm, "");

  // ── Strip leaked numeric scores ──
  // Parenthetical scores: （+2.17）, (-1.83), (45.8)
  s = s.replace(/[（(]\s*[+-]?\d+\.?\d*\s*[）)]/g, "");
  // Signed decimals: +2.17, -1.83
  s = s.replace(/[+-]\d+\.\d+/g, "");
  // Score/100 patterns: 35.4/100, 78/100
  s = s.replace(/\d+\.?\d*\s*\/\s*100/g, "");
  // Percentages: 17%, 89.5%
  s = s.replace(/\d+\.?\d*\s*%/g, "");
  // Standalone decimals in measurement context: 35.4, 0.83
  s = s.replace(/\b\d+\.\d+\b/g, "");
  // gap=N patterns
  s = s.replace(/gap\s*[=:]\s*[+-]?\d+\.?\d*/gi, "");

  // ── Cleanup ──
  s = s.replace(/[（(]\s*[）)]/g, "");
  s = s.replace(/【\s*】/g, "");
  // Collapse multiple newlines into one
  s = s.replace(/\n{2,}/g, "\n");
  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ");
  return s.trim();
}

function sanitizeAllNarratives(
  narratives: IdentityNarratives,
): IdentityNarratives {
  const result = { ...narratives };
  for (const key of Object.keys(result) as (keyof IdentityNarratives)[]) {
    if (typeof result[key] === "string") {
      result[key] = sanitizeNarrativeOutput(result[key]);
    }
  }
  return result;
}

/**
 * Generate all 7 identity narratives via 2 parallel LLM calls.
 * Returns structured narratives, or null if all providers fail.
 */
export async function generateIdentityNarratives(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
  locale: Locale,
): Promise<IdentityNarratives | null> {
  // Phase 2 quality gate observability — snapshot before any LLM call so
  // the post-call UPDATE on LLMUsageLog targets only this generation's rows.
  const qualityWindowStart = Date.now();
  const systemMsg = await buildSoulSystemMessage(locale);

  // Compute narrative seedpoints — pre-analyzed psychological patterns
  // that give the LLM precise "ammunition" for writing penetrating narratives.
  // Pure algorithm, <5ms, zero LLM cost.
  const { seedpoints, dominantTheme } = computeNarrativeSeedpoints(
    profile,
    algo,
  );
  const dataBlock = buildDataBlock(
    profile,
    algo,
    locale,
    seedpoints,
    dominantTheme,
  );

  // ── Strategy: Soul Call (1 unified call) → Legacy Fallback (2 parallel) ──
  // The soul call produces all 7 fields in one coherent narrative pass,
  // giving the LLM full creative space (~4500 tokens) instead of filling
  // isolated fields (~2000 tokens each). If it fails, fall back to the
  // proven 2-call approach.

  const assessmentId = profile.assessmentId;

  const soulResult = await attemptSoulCall(
    systemMsg,
    dataBlock,
    locale,
    assessmentId,
  );
  if (soulResult) {
    if (__DEV__) console.log("[identity-narratives] Soul call succeeded");
    const sanitized = sanitizeAllNarratives(soulResult);
    const missingSoulKeys = missingRequiredNarrativeKeys(sanitized);

    if (missingSoulKeys.length > 0) {
      // Intermediate: soul incomplete but we still try legacy. Breadcrumb,
      // not captureMessage, so the Sentry alert at 24h ≥ 3 doesn't trigger
      // on a single user whose generator went soul → legacy.
      addNarrativeBreadcrumb({
        mode: "soul-fields-short",
        locale,
        assessmentId,
        missingKeys: missingSoulKeys,
        fieldLengths: fieldLengthMap(sanitized, REQUIRED_NARRATIVE_KEYS),
        detail: "soul returned but post-sanitize missing required keys",
      });
    } else {
      // Language guard: detect -> regenerate -> fallback-to-legacy
      const langName = localeLanguageNames[locale as AppLocale] ?? "English";
      let guardFailed = false;
      const guarded = await enforceOutputLocale(sanitized, locale, {
        taskId: "profile-narrative",
        regenerate: async (foundMismatchFields) => {
          const originalPrompt = buildSoulCallPrompt(dataBlock, locale);
          const retryPrompt = buildRegeneratePrompt({
            originalPrompt,
            langName,
            foundMismatchFields,
          });
          const retry = await attemptSoulCall(
            systemMsg,
            dataBlock,
            locale,
            assessmentId,
            retryPrompt,
          );
          return retry ? sanitizeAllNarratives(retry) : null;
        },
        sanitize: (output) => {
          guardFailed = true;
          return output;
        },
      });

      if (!guardFailed && hasAllRequiredNarratives(guarded)) {
        // Phase 2 quality gate — soul call path. Field completeness already
        // verified by hasAllRequiredNarratives; mark the LLMUsageLog row as
        // pass for downstream monitoring.
        const qualityOutcome = checkQuality(guarded, {
          requiredFields:
            REQUIRED_NARRATIVE_KEYS as readonly string[] as string[],
        });
        logLLMQualityCheck({
          taskName: "profile-narrative",
          qualityCheckResult: qualityOutcome.result,
          createdAfter: qualityWindowStart,
        });
        return guarded;
      }
      // Intermediate: language guard rejected or made output incomplete.
      // We still fall through to legacy 2-call mode, so this is a breadcrumb,
      // not a terminal failure.
      if (!guardFailed) {
        const missingAfterGuard = missingRequiredNarrativeKeys(guarded);
        addNarrativeBreadcrumb({
          mode: "soul-fields-short",
          locale,
          assessmentId,
          missingKeys: missingAfterGuard,
          fieldLengths: fieldLengthMap(guarded, REQUIRED_NARRATIVE_KEYS),
          detail: "soul became incomplete after language-guard regenerate",
        });
      } else {
        addNarrativeBreadcrumb({
          mode: "soul-language-guard",
          locale,
          assessmentId,
          detail: "soul call output leaked target locale; falling to legacy",
        });
      }
    }
  }

  // Soul call failed (or leaked language) — fall back to legacy 2-call mode
  if (__DEV__)
    console.log(
      "[identity-narratives] Soul call failed, falling back to legacy 2-call mode",
    );
  const legacyResult = await legacyTwoCallMode(dataBlock, locale, assessmentId);
  if (!legacyResult) {
    reportNarrativeFailure({
      mode: "generator-returned-null",
      locale,
      assessmentId,
      level: "error",
      detail: "legacy two-call mode returned null (both calls failed)",
    });
    return null;
  }
  if (!hasAllRequiredNarratives(legacyResult)) {
    reportNarrativeFailure({
      mode: "legacy-fields-missing",
      locale,
      assessmentId,
      missingKeys: missingRequiredNarrativeKeys(legacyResult),
      fieldLengths: fieldLengthMap(legacyResult, REQUIRED_NARRATIVE_KEYS),
      level: "error",
    });
    return null;
  }

  // Guard legacy output too (no regenerate — if legacy leaks, return null and let pipeline retry)
  let legacyGuardFailed = false;
  const guardedLegacy = await enforceOutputLocale(legacyResult, locale, {
    taskId: "profile-narrative",
    sanitize: (output) => {
      legacyGuardFailed = true;
      return output;
    },
  });
  if (legacyGuardFailed) {
    reportNarrativeFailure({
      mode: "legacy-language-guard",
      locale,
      assessmentId,
      level: "error",
      detail: "legacy output leaked target locale and was sanitized away",
    });
    return null;
  }
  if (!hasAllRequiredNarratives(guardedLegacy)) {
    reportNarrativeFailure({
      mode: "legacy-fields-missing",
      locale,
      assessmentId,
      missingKeys: missingRequiredNarrativeKeys(guardedLegacy),
      fieldLengths: fieldLengthMap(guardedLegacy, REQUIRED_NARRATIVE_KEYS),
      level: "error",
      detail: "legacy output became incomplete after language guard",
    });
    return null;
  }
  // Phase 2 quality gate — legacy two-call path.
  const legacyQualityOutcome = checkQuality(guardedLegacy, {
    requiredFields: REQUIRED_NARRATIVE_KEYS as readonly string[] as string[],
  });
  logLLMQualityCheck({
    taskName: "profile-narrative",
    qualityCheckResult: legacyQualityOutcome.result,
    createdAfter: qualityWindowStart,
  });
  return guardedLegacy;
}

// ── Soul Call: Single unified LLM call for all 7 required fields ─────

const SOUL_CALL_TIMEOUT_MS = 60_000; // 60s — single call, generous budget
const SOUL_REQUIRED_KEYS: (keyof IdentityNarratives)[] = [
  ...REQUIRED_IDENTITY_NARRATIVE_KEYS,
];
/**
 * Maximum number of missing fields that the field-level repair path will
 * attempt to regenerate before giving up and falling through to legacy
 * 2-call mode. Set to 2 because:
 *   - 1-2 missing is plausible LLM sampling variance (single field too
 *     short); a slim repair call has high success rate.
 *   - ≥3 missing usually indicates a systemic issue with this user's
 *     data block (e.g. unusual archetype + sparse Big Five) — repair
 *     unlikely to do better than legacy A/B parallel mode.
 * See codex 2026-05-12 review and plan parallel-shimmying-dragonfly.md.
 */
const MAX_REPAIR_MISSING = 2;
const REPAIR_TIMEOUT_MS = 30_000;

async function attemptSoulCall(
  systemMsg: string,
  dataBlock: string,
  locale: Locale,
  assessmentId: string | undefined,
  promptOverride?: string,
): Promise<IdentityNarratives | null> {
  const prompt = promptOverride ?? buildSoulCallPrompt(dataBlock, locale);

  try {
    const content = await callLLM(
      "profile-narrative",
      [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt },
      ],
      {
        maxTokens: locale === "zh" ? 2400 : 3000,
        temperature: 0.7, // slightly higher for creative mode
        enableCache: true,
        responseFormat: "json",
        timeoutMs: SOUL_CALL_TIMEOUT_MS,
        // Structured-output strict mode (OpenAI/Gemini) or tool-use schema
        // (Anthropic) — eliminates "soul-parse-failed" / missing-key failure
        // modes by forcing the provider to emit all 7 required string fields.
        // minLength still enforced by Zod after parsing (providers ignore it).
        _jsonSchema: IDENTITY_NARRATIVES_JSON_SCHEMA,
      } as Parameters<typeof callLLM>[2],
    );

    if (!content || content.trim().length < 200) {
      // Soul call producing a short response is intermediate — the caller
      // will fall through to legacy 2-call. Breadcrumb, not captureMessage.
      addNarrativeBreadcrumb({
        mode: "soul-too-short",
        locale,
        assessmentId,
        detail: `response length=${content?.length ?? 0}`,
      });
      return null;
    }

    // Extract JSON object from the LLM response. With strict-mode structured
    // output the response IS already valid JSON, but providers occasionally
    // wrap in code fences (Anthropic) so we still go through sharedExtractJSON.
    const raw = sharedExtractJSON(content);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      addNarrativeBreadcrumb({
        mode: "soul-parse-failed",
        locale,
        assessmentId,
        detail: `raw starts with: ${content.slice(0, 120)}`,
      });
      return null;
    }

    // Zod-based validation: structural + min-length in one safeParse.
    // Replaces the previous hand-rolled `parsePartialResponse + shortKeys`
    // dance. The schema and min-lengths are now declared in
    // identity-narrative-schema.ts (single source of truth).
    const parseResult = parseIdentityNarratives(raw);
    if (parseResult.kind === "ok") {
      return parseResult.value;
    }

    addNarrativeBreadcrumb({
      mode: "soul-fields-short",
      locale,
      assessmentId,
      missingKeys: parseResult.missingKeys,
      fieldLengths: parseResult.fieldLengths,
      detail: `schema rejected ${parseResult.missingKeys.length}/${SOUL_REQUIRED_KEYS.length} fields`,
    });

    // ── Field-level repair (change C) ─────────────────────────
    // If only 1-2 fields fall short, regenerate just those instead of
    // tossing the entire output. The other 5-6 fields are perfectly valid
    // narratives — wasting them on a full retry is expensive AND degrades
    // coherence (the soul call's strength is its unified narrative arc).
    //
    // Cap at MAX_REPAIR_MISSING=2: more missing means the LLM is having a
    // systemic problem with this user's data, and the proven 2-call legacy
    // mode is more likely to recover than another single-shot.
    if (
      parseResult.missingKeys.length > 0 &&
      parseResult.missingKeys.length <= MAX_REPAIR_MISSING &&
      !promptOverride // Don't repair-on-repair; only on the first soul call.
    ) {
      const repaired = await repairSoulCall(
        raw as Record<string, unknown>,
        parseResult.missingKeys,
        systemMsg,
        dataBlock,
        locale,
        assessmentId,
      );
      if (repaired) return repaired;
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__)
      console.error("[identity-narratives] Soul call failed:", message);
    // Soul exception is recoverable via legacy fallback — breadcrumb only.
    addNarrativeBreadcrumb({
      mode: "soul-parse-failed",
      locale,
      assessmentId,
      detail: `exception: ${message}`,
    });
    return null;
  }
}

// ── Field-level repair (change C, 2026-05-12) ───────────────
//
// When the soul call returns narratives where 1-2 fields fall short of
// the Zod min-length gate, regenerate ONLY those fields instead of
// throwing the whole result away. The other 5-6 fields are already
// good narratives — the soul call's strength is its unified arc, and
// blowing it up to retry from scratch wastes that work.
//
// Strategy:
//   1. Build a slim JSON schema containing only the missing keys.
//   2. Send the original soul prompt (cached system message) + a
//      "regenerate only these keys" addendum.
//   3. Provider's strict-mode structured output guarantees we get
//      exactly the missing keys back.
//   4. Merge the new keys into the previous partial output and
//      re-validate against the full schema.
//
// Single call (not N parallel) because:
//   - We're constrained to ≤2 missing keys; parallel is overkill.
//   - Combined call preserves narrative coherence between the two
//     missing fields (they may reference each other).
//   - Cost: one extra LLM call vs N. Latency: same (parallel doesn't
//     help when N is small and we cap below it).

function buildRepairSchema(missingKeys: readonly (keyof IdentityNarratives)[]) {
  return {
    name: "identity_narratives_repair_v1",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [...missingKeys],
      properties: Object.fromEntries(
        missingKeys.map((key) => {
          const minLen =
            IDENTITY_NARRATIVES_JSON_SCHEMA.schema.properties[
              key as keyof typeof IDENTITY_NARRATIVES_JSON_SCHEMA.schema.properties
            ]?.minLength ?? 20;
          return [key, { type: "string", minLength: minLen }];
        }),
      ),
    },
  };
}

const REPAIR_LIST_SEPARATOR_BY_LOCALE: Record<Locale, string> = {
  en: ", ",
  zh: "、",
  nl: ", ",
  de: ", ",
  fr: ", ",
  es: ", ",
  pt: ", ",
  it: ", ",
  ru: ", ",
  ja: ", ",
  ko: ", ",
};

function buildRepairAddendum(
  missingKeys: readonly (keyof IdentityNarratives)[],
  locale: Locale,
): string {
  const list = [...missingKeys].join(REPAIR_LIST_SEPARATOR_BY_LOCALE[locale]);
  if (locale === "zh") {
    return `\n\n---\n\n请仅重新生成以下字段（其他字段保持上一次的输出，本次不要返回它们）：${list}\n\n沿用上面同样的写作原则、长度、第二人称现在时。返回 JSON，仅包含这些 keys。`;
  }
  return `\n\n---\n\nRegenerate ONLY the following fields (keep your previous output for the others; do NOT return them this time): ${list}\n\nUse the same writing principles, length, and second-person present tense as before. Return JSON containing ONLY these keys.`;
}

async function repairSoulCall(
  partial: Record<string, unknown>,
  missingKeys: readonly (keyof IdentityNarratives)[],
  systemMsg: string,
  dataBlock: string,
  locale: Locale,
  assessmentId: string | undefined,
): Promise<IdentityNarratives | null> {
  const slimSchema = buildRepairSchema(missingKeys);
  const promptWithRepair =
    buildSoulCallPrompt(dataBlock, locale) +
    buildRepairAddendum(missingKeys, locale);

  try {
    const content = await callLLM(
      "profile-narrative",
      [
        { role: "system", content: systemMsg },
        { role: "user", content: promptWithRepair },
      ],
      {
        // Smaller token budget — only 1-2 fields to write.
        maxTokens: locale === "zh" ? 1200 : 1500,
        temperature: 0.7,
        enableCache: true,
        responseFormat: "json",
        timeoutMs: REPAIR_TIMEOUT_MS,
        _jsonSchema: slimSchema,
      } as Parameters<typeof callLLM>[2],
    );

    if (!content || content.trim().length < 50) {
      addNarrativeBreadcrumb({
        mode: "soul-too-short",
        locale,
        assessmentId,
        detail: `repair response too short (${content?.length ?? 0} chars, missing=${missingKeys.join(",")})`,
      });
      return null;
    }

    const repaired = sharedExtractJSON(content);
    if (!repaired || typeof repaired !== "object" || Array.isArray(repaired)) {
      addNarrativeBreadcrumb({
        mode: "soul-parse-failed",
        locale,
        assessmentId,
        detail: `repair returned non-object JSON`,
      });
      return null;
    }

    // Merge: keep prior valid fields, overlay newly-repaired missing fields.
    const merged: Record<string, unknown> = { ...partial };
    for (const key of missingKeys) {
      const v = (repaired as Record<string, unknown>)[key];
      if (typeof v === "string") merged[key] = v;
    }

    const validation = parseIdentityNarratives(merged);
    if (validation.kind === "ok") {
      addNarrativeBreadcrumb({
        mode: "soul-fields-short",
        locale,
        assessmentId,
        missingKeys,
        detail: `repair succeeded for ${missingKeys.length} field(s)`,
      });
      return validation.value;
    }

    // Repair still didn't produce a complete result — fall through to legacy.
    addNarrativeBreadcrumb({
      mode: "soul-fields-short",
      locale,
      assessmentId,
      missingKeys: validation.missingKeys,
      fieldLengths: validation.fieldLengths,
      detail: `repair attempted but still incomplete (originally missing ${missingKeys.join(",")})`,
    });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__)
      console.error("[identity-narratives] Repair call failed:", message);
    addNarrativeBreadcrumb({
      mode: "soul-parse-failed",
      locale,
      assessmentId,
      detail: `repair exception: ${message}`,
    });
    return null;
  }
}

// ── Legacy 2-call mode (proven fallback) ────────────────────

async function legacyTwoCallMode(
  dataBlock: string,
  locale: Locale,
  assessmentId: string | undefined,
): Promise<IdentityNarratives | null> {
  const systemMsg = await buildSystemMessage(locale);

  const [settledA, settledB] = await Promise.allSettled([
    callWithRetry(
      systemMsg,
      buildCallAPrompt(dataBlock, locale),
      CALL_A_KEYS,
      locale,
      assessmentId,
    ),
    callWithRetry(
      systemMsg,
      buildCallBPrompt(dataBlock, locale),
      CALL_B_KEYS,
      locale,
      assessmentId,
    ),
  ]);

  const resultA = settledA.status === "fulfilled" ? settledA.value : null;
  const resultB = settledB.status === "fulfilled" ? settledB.value : null;

  if (settledA.status === "rejected") {
    const reason =
      settledA.reason instanceof Error
        ? settledA.reason.message
        : String(settledA.reason);
    if (__DEV__)
      console.error("[identity-narratives] Legacy Call A rejected:", reason);
    // Single-call rejection is recoverable if B succeeded. Breadcrumb only.
    addNarrativeBreadcrumb({
      mode: "legacy-call-rejected",
      locale,
      assessmentId,
      detail: `call A rejected: ${reason}`,
    });
  }
  if (settledB.status === "rejected") {
    const reason =
      settledB.reason instanceof Error
        ? settledB.reason.message
        : String(settledB.reason);
    if (__DEV__)
      console.error("[identity-narratives] Legacy Call B rejected:", reason);
    addNarrativeBreadcrumb({
      mode: "legacy-call-rejected",
      locale,
      assessmentId,
      detail: `call B rejected: ${reason}`,
    });
  }

  if (!resultA && !resultB) {
    // Both legacy calls null — the top-level orchestrator will emit
    // generator-returned-null as the terminal event. Breadcrumb here keeps
    // the trail without producing a second Sentry message for the same
    // user-visible failure.
    addNarrativeBreadcrumb({
      mode: "legacy-both-failed",
      locale,
      assessmentId,
      detail: "both legacy calls returned null",
    });
    return null;
  }

  const emptyA: Pick<IdentityNarratives, (typeof CALL_A_KEYS)[number]> = {
    identitySummary: "",
    archetypeNarrative: "",
    bigFiveNarrative: "",
    valueNarrative: "",
  };
  const emptyB: Pick<IdentityNarratives, (typeof CALL_B_KEYS)[number]> = {
    sjtTensionNarrative: "",
    crossDimensionNarrative: "",
    growthMapInsight: "",
  };

  // Legacy fallback does not generate meaningCompassNarrative; the lazy
  // path on Ch3 visit handles it. We MUST omit the key entirely (rather
  // than write "") because updateProfileNarratives uses jsonb `||` merge —
  // an empty string would overwrite a concurrently-written lazy narrative.
  return sanitizeAllNarratives({
    ...(resultA ?? emptyA),
    ...(resultB ?? emptyB),
  });
}

// ── Retry wrapper for a single call ────────��────────────────

/** Per-call timeout to prevent runaway LLM calls from exhausting after() budget.
 *  model-router's callWithTimeout handles the deadline internally and releases
 *  the semaphore slot promptly, avoiding zombie promises that hold slots.
 *  Raised from 30s→45s: prod data (2026-04-13) showed P95 latency at 29.9s,
 *  causing 9/11 failures to be timeout false-kills. 45s × 4 calls = 180s max,
 *  well within Vercel 300s maxDuration. */
const PER_CALL_TIMEOUT_MS = 45_000;

async function callWithRetry<K extends keyof IdentityNarratives>(
  systemMsg: string,
  prompt: string,
  expectedKeys: K[],
  locale: Locale,
  assessmentId: string | undefined,
): Promise<Pick<IdentityNarratives, K> | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const content = await callLLM(
        "profile-narrative",
        [
          { role: "system", content: systemMsg },
          { role: "user", content: prompt },
        ],
        {
          maxTokens: locale === "zh" ? 2000 : 2500,
          temperature: 0.6,
          enableCache: true,
          responseFormat: "json",
          timeoutMs: PER_CALL_TIMEOUT_MS,
        },
      );

      if (!content || content.trim().length < 100) {
        if (__DEV__)
          console.warn(
            `[identity-narratives] Attempt ${attempt + 1}: response too short (${content?.length ?? 0} chars)`,
          );
        continue;
      }

      const parsed = parsePartialResponse(content, expectedKeys);
      if (parsed) return parsed;

      // Already logged by parsePartialResponse — just continue
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (__DEV__)
        console.error(
          `[identity-narratives] Attempt ${attempt + 1} LLM call failed:`,
          message,
        );
      // Final attempt failure is reported by caller via legacy-call-rejected /
      // legacy-both-failed; here we just record it as a breadcrumb-style note.
      if (attempt === 1) {
        addNarrativeBreadcrumb({
          mode: "legacy-call-rejected",
          locale,
          assessmentId,
          detail: `callWithRetry attempt 2 exception: ${message}`,
        });
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

// ── JSON parser (robust — extracts JSON from LLM responses) ─

function parsePartialResponse<K extends keyof IdentityNarratives>(
  raw: string,
  expectedKeys: K[],
): Pick<IdentityNarratives, K> | null {
  const obj = extractJSON(raw);
  if (!obj) {
    console.warn(
      "[identity-narratives] JSON extraction failed, raw starts with:",
      raw.slice(0, 120),
    );
    return null;
  }

  const result = {} as Pick<IdentityNarratives, K>;
  let validCount = 0;
  for (const f of expectedKeys) {
    if (typeof obj[f] === "string" && obj[f].trim().length >= 10) {
      result[f] = obj[f].trim();
      validCount++;
    } else {
      console.warn(
        `[identity-narratives] Field "${String(f)}" invalid: type=${typeof obj[f]}, len=${typeof obj[f] === "string" ? obj[f].trim().length : "N/A"} — using empty placeholder`,
      );
      result[f] = "" as IdentityNarratives[K];
    }
  }

  // Accept if at least half the fields are valid; reject if mostly empty
  if (validCount === 0) {
    console.warn(
      `[identity-narratives] All ${expectedKeys.length} fields invalid, rejecting response`,
    );
    return null;
  }
  if (validCount < expectedKeys.length) {
    console.warn(
      `[identity-narratives] Partial result: ${validCount}/${expectedKeys.length} fields valid`,
    );
  }
  return result;
}

/** Extract a JSON object from an LLM response (delegates to shared extractJSON). */
function extractJSON(raw: string): Record<string, unknown> | null {
  try {
    const parsed = sharedExtractJSON(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

// ── Soul Call: System message + Prompt ─────────────────────
// The soul call gives the LLM creative freedom to write a unified
// narrative instead of filling isolated JSON fields. The system message
// positions the LLM as a narrative writer, not a form-filler.

async function buildSoulSystemMessage(locale: Locale): Promise<string> {
  const { getSystemPreamble } =
    await import("@/lib/report-generation/common-rules");
  const preamble = getSystemPreamble(locale);

  if (locale === "zh") {
    return `${preamble}

你是一位深谙叙事心理学的写作者，融合心理学家的精确、作家的笔力、挚友的温度。你刚刚花了一整天沉浸在一个人的心理画像数据中——现在你要给这个人写一封信。不是报告，是信。

## 你的写作哲学

你相信每个人都有一个"从未被说出口的自我认知"——他们一直感受到但找不到语言描述的东西。你的工作是说出它。

## 写作原则

1. **第一句话必须让读者停下来**。用一个他们自己都没意识到的行为模式开头——让他们想"它怎么知道的"。
2. **因果编织**。不是"你有X特质"，而是"因为你的内心同时渴望A和B，所以在C场景中你总是..."。维度之间必须有因果链。
3. **双重故事**。每个强项必须带出它的代价。不回避张力。这才是真实。
4. **命名未命名的**。说出用户一直感受到但从未有语言描述的体验。
5. **洞察 > 描述 > 鼓励（6:3:1）**。绝对禁止空洞鼓励。
6. **递进叙事弧线**。7 段叙事构成一条完整弧线：身份认同 → 行为证据 → 价值驱动 → 内在拉扯 → 跨维度综合 → 成长地图。不是独立的主题块。
7. **第二人称、现在时**。温暖但精确。像一个聪明的老朋友。

## 绝对禁止
- "潜力""旅程""独特""成长""值得期待"等鸡汤词
- 任何数字、百分比、+/- 符号、括号注释
- 任何"高""低""强""弱"等评估性标签——用行为场景让读者自己得出结论
- 任何心理学术语或维度代码
- "这意味着""这种组合""从某种意义上说"等填充语

## 关键要求
- 叙事弹药（Narrative Ammunition）中的洞察是你的精确弹药——不要照抄，用你自己的笔力重新编织
- 每个字段之间有逻辑递进和呼应，读起来像一篇连贯的长文
- 全程中文，返回严格 JSON，段落式`;
  }

  return `${preamble}

You are a writer steeped in narrative psychology — blending a psychologist's precision, a writer's craft, and a close friend's warmth. You've just spent an entire day immersed in one person's psychological portrait data — now you're writing them a letter. Not a report. A letter.

## Your Writing Philosophy

You believe everyone carries an "unspoken self-knowledge" — something they've always felt but never had words for. Your job is to say it.

## Writing Principles

1. **The first sentence must make the reader stop.** Open with a behavioral pattern they didn't realize they had — make them think "how does it know that?"
2. **Causal weaving.** Not "you have trait X" but "because your inner world simultaneously craves A and B, in situation C you always..." Dimensions must connect through causal chains.
3. **Double story.** Every strength must surface its cost. Don't avoid tension. This is what makes it real.
4. **Name the unnamed.** Articulate experiences the user has always felt but never had words for.
5. **Insight > description > encouragement (6:3:1).** Absolutely no hollow encouragement.
6. **Progressive narrative arc.** The 7 narrative fields form one complete arc: identity thesis → behavioral evidence → value drivers → inner tensions → cross-dimensional synthesis → growth map. Not independent theme blocks.
7. **Second person, present tense.** Warm but precise. Like a smart close friend.

## Absolute Bans
- "potential," "journey," "unique," "growth," "exciting" and similar hollow words
- Any numbers, percentages, +/- signs, parenthetical annotations
- Any evaluative labels like "high," "low," "strong," "weak" — show through behavior so the reader draws their own conclusion
- Any psychological terminology or dimension codes
- "this means," "this combination," "in a sense" and similar filler

## Key Requirements
- Narrative Ammunition insights are your precise ammunition — don't copy them verbatim, reweave with your own craft
- Each field must logically progress from and echo the previous one, reading like one coherent essay
- ${targetLanguageLock(locale)}`;
}

function buildSoulCallPrompt(dataBlock: string, locale: Locale): string {
  if (locale === "zh") {
    return `${dataBlock}

---

写一封关于这个人的信。返回 JSON，7 个字段，构成一条完整的叙事弧线。

每个字段是一个自然段落——它们之间有呼应、有递进，读起来像一篇连贯的长文。后面的段落可以回引前面的发现。

字段职责：
- valueNarrative 聚焦"价值如何在 daily 行动中显形"，**不写两难**
- 两难、人生意义、想留下什么 → 不在本次输出，由后续单独的意义指南针段落负责
- archetypeNarrative 写 WHAT（你做什么）

{
  "identitySummary": "开场白。严格 3 句话。第 1 句用一个具体行为场景让读者立刻'对，这就是我'。第 2 句解释为什么——原型×人格×价值观的交叉因果。第 3 句点出真正的课题。不要用'你的原型是XX'开头。（80-120字）",
  "archetypeNarrative": "直接进入叙事。不是重述原型描述——而是用 2-3 个具体行为场景证明这个用户独特的'版本'。因果链连接。必须包含双重故事——这个模式的代价是什么？从叙事弹药中选取最贴合的洞察编织进来。（150-250字）",
  "bigFiveNarrative": "找 2-3 个最有故事性的行为倾向组合。不是逐个描述，而是讲它们交织时产生的行为模式。用场景落地。读完后用户应感觉'你比我的朋友更懂我'。回引前一段的原型发现。（150-250字）",
  "valueNarrative": "Top3 价值观如何在 daily 行动中显形。不写'你重视成就'，而是用一两个具体的小决策说明这种价值如何在普通时刻浮现——'当...时，你不会先问能赚多少，而是先问...'。聚焦表现，不写两难。（80-100字）",
  "sjtTensionNarrative": "转折段。'你认为自己会怎么做'和'你实际倾向怎么做'之间的关系。用一个具体场景展示这种拉扯。解释为什么这个差距其实揭示了更深层的优先级。（120-180字）",
  "crossDimensionNarrative": "高潮段。汇聚所有线索成一个洞察。命名一个涌现品质——用户一直感受到但从未有语言描述的东西。以一个开放性问题收束。（120-180字）",
  "growthMapInsight": "收尾。为内在拉扯提供解释。你身上最显著的 2 个创造性张力是什么，日常如何表现，为什么是优势而非缺陷，需要注意什么。直接说人话，不要比喻。（100-150字）"
}`;
  }

  return `${dataBlock}${targetPromptHeader(locale)}

---

Write a letter about this person. Return JSON with 7 fields forming one complete narrative arc.

Each field is a natural paragraph — they echo and build on each other, reading like one coherent essay. Later paragraphs can reference earlier discoveries.

Field roles:
- valueNarrative focuses on "how values show up in daily action" — NO dilemmas
- Dilemmas, life meaning, what-you'd-leave-behind → not in this output; a separate meaning-compass paragraph handles them later
- archetypeNarrative speaks WHAT (what you do)

{
  "identitySummary": "Opening. Exactly 3 sentences. Sentence 1: open with a specific behavioral scene for instant recognition. Sentence 2: explain WHY — the causal intersection of archetype × personality × values. Sentence 3: name the real challenge. Don't start with 'Your archetype is X.' (60-100 words)",
  "archetypeNarrative": "Jump straight in. Not restating the archetype — proving it with 2-3 specific behavioral scenes showing THIS user's unique version. Causal chains. Must include double story — what does this pattern cost? Weave in the most fitting insights from Narrative Ammunition. (120-200 words)",
  "bigFiveNarrative": "Find 2-3 most story-worthy behavioral tendency combinations. Don't describe each — narrate the behavioral patterns they create TOGETHER. Ground in scenes. Reader should feel 'you understand me better than my friends.' Reference back to the archetype discovery above. (120-200 words)",
  "valueNarrative": "How Top 3 values show up in daily action. Not 'you value achievement' but one or two concrete small decisions revealing how this value surfaces in ordinary moments — 'when X, you don't first ask how much, you ask whether...'. Focus on visible behavior; do NOT write dilemmas. (60-80 words)",
  "sjtTensionNarrative": "The turn. The relationship between 'what you think you'd do' and 'what you actually tend to do.' Use a concrete scene to show this pull. Explain why this gap reveals deeper priorities. (80-150 words)",
  "crossDimensionNarrative": "The climax. Pull ALL threads together into one insight. Name an emergent quality the user has always felt but never had words for. End with an open question. (80-150 words)",
  "growthMapInsight": "The close. Your 2 most significant creative tensions, how they show up daily, why they're strengths not flaws, what to watch for. Speak plainly, no metaphors. (60-120 words)"
}`;
}

// ── Legacy system message (shared by both calls, cached) ─────

async function buildSystemMessage(locale: Locale): Promise<string> {
  // Dynamic import of the shared preamble to push system message above Anthropic's
  // 1024-token prompt caching minimum. This is critical for profile-narrative
  // because it makes 2 parallel calls — the second call gets a cache hit
  // on the shared system prefix, saving ~90% of input token cost.
  // (Dynamic import avoids circular dependency with common-rules.)
  const { getSystemPreamble } =
    await import("@/lib/report-generation/common-rules");
  const preamble = getSystemPreamble(locale);

  if (locale === "zh") {
    return `${preamble}

你是 Deep Dive 职业探索平台的身份叙事作者。你融合心理学家、作家、教练三个视角，为用户写精炼而有穿透力的身份画像。

## 写作原则

1. **场景先行**。每段叙事用一个用户能立刻认出的行为场景开头——会议中、决策时、与人交流时。不是"你具有X特质"，而是"在团队讨论中，你往往是那个…"。
2. **因果编织**。用"因为…所以…而这又导致…"因果链连接维度。禁止"你的X是高的。你的Y是低的。"这种并列。
3. **洞察 > 描述 > 鼓励（6:3:1）**。60%具体洞察 + 30%行为描述 + 10%温和挑战。绝对禁止空洞鼓励（"你有很大潜力""你的旅程很独特"）。
4. **命名未命名的**。说出用户一直感受到但从未有语言描述的体验——维度交叉处涌现的品质。
5. **双重故事**。每个强项必须带出它的代价或阴影面。不回避张力。
6. **递进叙事**。各段之间有逻辑递进：身份认同 → 证据支撑 → 内在张力。不是独立的主题块。
7. **第二人称、现在时**。温暖但不煽情。精炼——一段 100 字的精准洞察 > 500 字的泛泛而谈。

## 禁止清单
- "潜力""旅程""独特""不断成长""值得期待"等鸡汤词
- "这意味着""这种组合""从某种意义上说"等填充语
- **任何数字和测量痕迹**：不得出现分数、百分比、+/- 符号、括号注释。错误示范："成就驱动+1.25""低自信（-2.25）""宜人性（45.8）"。数据中的数值仅供你判断强弱，叙事中必须转化为具体的行为场景，让读者通过故事感受到强弱，而不是被告知强弱
- **任何测量类描述词**：不要用"高""低""强""弱""偏高""偏低""显著""中等"等评估性词语直接标注特质。错误示范："你的自信心很低""你有很强的成就驱动"。正确做法：用行为场景让读者自己得出结论——"你很少主动争取机会，即使你知道自己完全能胜任"比"你的自信心很低"更有穿透力
- **任何心理学术语、维度代码、构念名称**：不要出现 O4、C1 等代码，也不要出现 Openness、Extraversion、Conscientiousness、Neuroticism、Agreeableness、facet 等学术概念。你是教练，不是教授——用用户能立即理解的日常语言描述行为

## 格式
- 全程中文，返回严格 JSON
- 段落式，不用要点列表`;
  }

  return `${preamble}

You are the identity narrative author for Deep Dive. You blend psychologist, writer, and coach perspectives to write precise, penetrating identity portraits.

## Writing Principles

1. **Scene-first.** Open every narrative with a behavioral scene the user instantly recognizes — in a meeting, making a decision, talking with someone. Not "you possess X trait" but "in team discussions, you tend to be the one who..."
2. **Causal weaving.** Connect dimensions with "because...therefore...which means..." chains. Never "Your X is high. Your Y is low."
3. **Insight > description > encouragement (6:3:1).** 60% specific insight + 30% behavioral description + 10% gentle challenge. Absolutely no empty encouragement ("you have great potential," "your journey is unique").
4. **Name the unnamed.** Articulate experiences the user has always felt but never had words for — emergent qualities at dimension intersections.
5. **Double story.** Every strength must surface its cost or shadow side. Don't avoid tension.
6. **Progressive narrative.** Sections build on each other logically: identity → evidence → tension. Not independent theme blocks.
7. **Second person, present tense.** Warm but not sentimental. Precise — one 50-word insight > 200 words of generic commentary.

## Banned list
- "potential," "journey," "unique," "ever-growing," "exciting" and similar hollow words
- "this means," "this combination," "in a sense" and similar filler
- **Any numbers or measurement traces**: no scores, percentages, +/- signs, or parenthetical annotations. Bad examples: "achievement drive +1.25", "low self-confidence (-2.25)", "agreeableness (45.8)". Numbers in the data are only for you to gauge intensity — narratives must translate intensity into concrete behavioral scenes so the reader FEELS the strength or absence, rather than being TOLD about it
- **Any evaluative labeling of traits**: never use "high," "low," "strong," "weak," "moderate," "above average," or similar assessment words to directly label a trait. Bad: "your self-confidence is very low," "you have a strong achievement drive." Instead, show it through behavior so the reader draws their own conclusion — "you rarely step forward for opportunities, even when you know you're fully capable" penetrates deeper than "your self-confidence is low"
- **Any psychological terminology, dimension codes, or construct names**: no O4, C1, etc., and no Openness, Extraversion, Conscientiousness, Neuroticism, Agreeableness, facet, or similar academic concepts. You are a coach, not a professor — describe behavior in everyday language the user instantly understands

## Format
- ${targetLanguageLock(locale)}
- Flowing paragraphs, not bullet lists`;
}

// ── Shared data block (used by both prompts) ────────────────

function buildDataBlock(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
  locale: Locale,
  seedpoints?: NarrativeSeedpoint[],
  dominantTheme?: { en: string; zh: string },
): string {
  const archCode = profile.archetype?.code;
  const archContent = archCode ? ARCHETYPES[archCode] : null;
  const archProfile = profile.archetype;

  const top3Labels = (profile.schwartzAnchors?.top3 ?? [])
    .slice(0, 3)
    .map((k) => {
      const label =
        SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS];
      return label ? label[labelKey(locale)] : k;
    });
  const allValuesRanked = (algo.schwartz?.ranking ?? [])
    .map((k: string, i: number) => {
      const label =
        SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS];
      return `${i + 1}. ${label ? label[labelKey(locale)] : k}`;
    })
    .join(", ");
  const conflict = profile.schwartzAnchors?.conflictPair;

  const bigFiveDomainStr = algo.bigFiveDomains
    ? Object.entries(algo.bigFiveDomains)
        .map(([k, v]) => {
          const label = BIG_FIVE_LABELS[k as keyof typeof BIG_FIVE_LABELS];
          return `${label ? label[labelKey(locale)] : k}: ${domainToBand(v as number, locale)}`;
        })
        .join(", ")
    : "";

  // Translate facet keys to everyday behavioral language — a therapist never says "Adventurousness",
  // they say "novelty-seeking". This prevents the LLM from leaking construct names into narratives.
  const FACET_EVERYDAY: Record<string, { en: string; zh: string }> = {
    Imagination: { en: "imaginative richness", zh: "想象丰富度" },
    "Artistic Interests": { en: "aesthetic sensitivity", zh: "审美敏感" },
    Emotionality: { en: "emotional depth", zh: "情感深度" },
    Adventurousness: { en: "novelty-seeking", zh: "求新倾向" },
    Intellect: { en: "intellectual curiosity", zh: "思辨热情" },
    Liberalism: { en: "questioning convention", zh: "对常规的质疑" },
    Anxiety: { en: "worry tendency", zh: "担忧倾向" },
    Anger: { en: "frustration intensity", zh: "受挫反应" },
    Depression: { en: "mood recovery speed", zh: "情绪恢复力" },
    "Self-Consciousness": {
      en: "sensitivity to others' gaze",
      zh: "他人目光敏感度",
    },
    Immoderation: { en: "impulse control", zh: "冲动控制" },
    Vulnerability: { en: "stress resilience", zh: "抗压韧性" },
    Friendliness: { en: "interpersonal warmth", zh: "待人热度" },
    Gregariousness: { en: "social energy preference", zh: "独处vs社交偏好" },
    Assertiveness: { en: "taking charge", zh: "主导倾向" },
    "Activity Level": { en: "energy & pace", zh: "精力与节奏" },
    "Excitement-Seeking": { en: "thrill-seeking", zh: "刺激追求" },
    Cheerfulness: { en: "positive energy", zh: "积极外放度" },
    Trust: { en: "trust in others", zh: "对人信任度" },
    Morality: { en: "moral directness", zh: "道德直觉" },
    Altruism: { en: "care for others", zh: "关心他人" },
    Cooperation: { en: "harmony preference", zh: "和谐偏好" },
    Modesty: { en: "self-effacement", zh: "低调倾向" },
    Sympathy: { en: "compassion", zh: "共情力" },
    "Self-Efficacy": { en: "self-confidence", zh: "自信心" },
    Orderliness: { en: "need for structure", zh: "秩序需求" },
    Dutifulness: { en: "sense of duty", zh: "责任感" },
    "Achievement-Striving": { en: "achievement drive", zh: "成就驱动" },
    "Self-Discipline": { en: "follow-through", zh: "坚持力" },
    Cautiousness: { en: "deliberateness", zh: "谨慎程度" },
  };
  const getEverydayLabel = (facetKey: string, loc: Locale): string => {
    const stripped = facetKey.replace(/^[A-Z]\d_/, "").replace(/_/g, " ");
    return FACET_EVERYDAY[stripped]?.[labelKey(loc)] ?? stripped;
  };

  const facetStr = (algo.bigFiveFacetPairs ?? [])
    .filter((f) => Math.abs(f.deviationFromMean) > 0.2)
    .sort(
      (a, b) => Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean),
    )
    .slice(0, 12)
    .map(
      (f) =>
        `${getEverydayLabel(f.facet, locale)}: ${deviationToBand(f.deviationFromMean, locale)}`,
    )
    .join("; ");

  const sjt = profile.sjtBehavioralConsistency;
  const sjtBand = sjt
    ? consistencyToBand(Math.round(sjt.overallConsistency * 100), locale)
    : null;
  const sjtTensions = sjt?.notableTensions ?? [];
  const sjtScenarios = algo.sjtTensions?.scenarios ?? [];
  const sjtScenarioStr = sjtScenarios
    .map((s) => `${s.domain}: ${gapToBand(s.gap, locale)}`)
    .join("; ");

  const cogStyle = algo.cognitiveStyleCode;
  const cogMode = algo.cognitiveStyleDisplayMode;
  const collabPrimary = profile.collabMapping?.primary;
  const collabSecondary = profile.collabMapping?.secondary;

  const shadows = profile.shadowInsights?.shadows ?? [];
  const shadowStr = shadows
    .map((s) => `${s.domain}${s.tensionWith ? ` ↔ ${s.tensionWith}` : ""}`)
    .join("; ");

  const polarity = algo.polarityContext;

  const intraTensions = (algo.bigFiveFacetPairs ?? [])
    .filter((f) => Math.abs(f.deviationFromMean) > 0.5)
    .map(
      (f) =>
        `${getEverydayLabel(f.facet, locale)}: ${deviationToBand(f.deviationFromMean, locale)}`,
    )
    .join("; ");

  if (locale === "zh") {
    const archLabel =
      archContent?.label_zh ?? archProfile?.label_zh ?? "探索者";
    const archTagline =
      archContent?.tagline_zh ?? archProfile?.tagline_zh ?? "";
    const archNarrative = archContent?.narrative_zh ?? "";

    return `## 原型：${archLabel}（"${archTagline}"）
${archNarrative}

## 大五人格
${bigFiveDomainStr}
显著行为倾向：${facetStr || "无"}
同一维度内的反差：${intraTensions || "无"}

## 价值观
排序：${allValuesRanked}
Top3：${top3Labels.join("、")}
${conflict ? `冲突对：${conflict}` : ""}
${polarity ? `极性：${polarity.polarity === "explore" ? "开放变革" : "保守稳定"}` : ""}

## 行为一致性
${sjtBand ?? "无数据"}${sjtTensions.length > 0 ? ` 张力：${sjtTensions.join("、")}` : ""}
${sjtScenarioStr ? `场景：${sjtScenarioStr}` : ""}

## 其他
认知：${cogMode === "balanced" ? "均衡型" : cogStyle}
协作：${collabPrimary ?? "未知"}${collabSecondary ? `/${collabSecondary}` : ""}
阴影：${shadowStr || "无"}${formatMeaningCompassBlock(profile.meaningCompass, "zh")}${formatSeedpointsBlock(seedpoints, dominantTheme, "zh")}`;
  }

  const archLabel =
    archContent?.label_en ?? archProfile?.label_en ?? "Explorer";
  const archTagline = archContent?.tagline_en ?? archProfile?.tagline_en ?? "";
  const archNarrative = archContent?.narrative_en ?? "";

  return `## Archetype: ${archLabel} ("${archTagline}")
${archNarrative}

## Big Five
${bigFiveDomainStr}
Notable tendencies: ${facetStr || "none"}
Within-dimension contradictions: ${intraTensions || "none"}

## Values
Ranking: ${allValuesRanked}
Top3: ${top3Labels.join(", ")}
${conflict ? `Conflict pair: ${conflict}` : ""}
${polarity ? `Polarity: ${polarity.polarity === "explore" ? "openness-to-change" : "conservation"}` : ""}

## Behavioral Consistency
${sjtBand ?? "no data"}${sjtTensions.length > 0 ? ` tensions: ${sjtTensions.join(", ")}` : ""}
${sjtScenarioStr ? `Scenarios: ${sjtScenarioStr}` : ""}

## Other
Cognitive: ${cogMode === "balanced" ? "balanced" : cogStyle}
Collaboration: ${collabPrimary ?? "unknown"}${collabSecondary ? `/${collabSecondary}` : ""}
Shadows: ${shadowStr || "none"}${formatMeaningCompassBlock(profile.meaningCompass, "en")}${formatSeedpointsBlock(seedpoints, dominantTheme, "en")}`;
}

// ── Meaning Compass data block ──────────────────────────────
// Translates structured MeaningCompass into qualitative prompt language.
// LLM never sees raw numbers — only bands, axis labels, and merged item lists.

function strengthBand(s: number, locale: "zh" | "en"): string {
  if (locale === "zh") {
    if (s > 0.7) return "清晰";
    if (s > 0.3) return "明显";
    return "微妙";
  }
  if (s > 0.7) return "decisive";
  if (s > 0.3) return "clear";
  return "subtle";
}

function describeColoring(tag: string, locale: "zh" | "en"): string {
  if (locale === "zh") {
    switch (tag) {
      case "high_extraversion":
        return "外向能量充沛";
      case "high_agreeableness":
        return "关系导向温和";
      case "high_openness":
        return "想象与思辨开放";
      case "high_conscientiousness":
        return "责任与坚持";
      case "high_stability":
        return "情绪稳定";
      case "balanced":
        return "维度均衡";
      default:
        return tag;
    }
  }
  switch (tag) {
    case "high_extraversion":
      return "externally energized";
    case "high_agreeableness":
      return "relational and warm";
    case "high_openness":
      return "imaginative and questioning";
    case "high_conscientiousness":
      return "responsible and steady";
    case "high_stability":
      return "emotionally even-keeled";
    case "balanced":
      return "evenly distributed";
    default:
      return tag;
  }
}

function describeTension(
  surfacedAs: "creative_vs_experiential" | "agency_vs_acceptance" | null,
  locale: "zh" | "en",
): string {
  if (!surfacedAs) {
    if (locale === "zh") return "无显著张力";
    return "no significant tension";
  }
  if (locale === "zh") {
    if (surfacedAs === "creative_vs_experiential") {
      return "为我成就 vs 为众贡献的拉扯";
    }
    return "主动追求 vs 接受既定的张力";
  }
  if (surfacedAs === "creative_vs_experiential") {
    return "tension between self-driven achievement and other-directed care";
  }
  return "tension between active pursuit and acceptance of the given";
}

function formatMeaningCompassBlock(
  compass: PersonalProfileData["meaningCompass"],
  locale: "en" | "zh",
): string {
  if (!compass) return "";
  const coloring = compass.keystones[0]?.bigFiveColoring ?? "balanced";
  const tensionStr = describeTension(compass.meaningTension.surfacedAs, locale);
  const strengthStr = strengthBand(compass.pole.strength, locale);
  const coloringStr = describeColoring(coloring, locale);

  if (locale === "zh") {
    let poleZh: string;
    if (compass.pole.axis === "transcendence") {
      poleZh = "超越自我";
    } else {
      poleZh = "自我增强";
    }
    const sep = "、";
    const keystoneLabels = compass.keystones.map((k) => k.label_zh).join(sep);
    const overlapLabels = compass.ikigai.overlap
      .map((i) => i.label_zh)
      .join(sep);
    return `\n\n## 意义指南针 (用于撰写 meaningCompassNarrative)
极性: 偏向${poleZh}（${strengthStr}）
top-3 锚点: ${keystoneLabels || "（无）"}（性格底色: ${coloringStr}）
真正的 ikigai 区（≥2 圆重合）: ${overlapLabels || "（重视与擅长尚未交汇）"}
意义张力: ${tensionStr}`;
  }

  let poleEn: string;
  if (compass.pole.axis === "transcendence") {
    poleEn = "self-transcendence";
  } else {
    poleEn = "self-enhancement";
  }
  const keystoneLabelsEn = compass.keystones.map((k) => k.label_en).join(", ");
  const overlapLabelsEn = compass.ikigai.overlap
    .map((i) => i.label_en)
    .join(", ");
  return `\n\n## Meaning Compass (for writing meaningCompassNarrative)
Pole: leans toward ${poleEn} (${strengthStr})
Top-3 keystones: ${keystoneLabelsEn || "(none)"} (personality coloring: ${coloringStr})
Ikigai zone (themes spanning >=2 circles): ${overlapLabelsEn || "(values and aptitudes have not yet converged)"}
Meaning tension: ${tensionStr}`;
}

/**
 * Format narrative seedpoints as a prompt section.
 * These are pre-analyzed psychological patterns that give the LLM
 * precise narrative "ammunition" — specific insights, scenes, and tensions
 * it can weave into prose rather than having to discover them from raw data.
 */
function formatSeedpointsBlock(
  seedpoints?: NarrativeSeedpoint[],
  dominantTheme?: { en: string; zh: string },
  locale: "en" | "zh" = "en",
): string {
  if (!seedpoints || seedpoints.length === 0) return "";

  const isZh = locale === "zh";
  const header = isZh
    ? "\n\n## 叙事弹药（已预分析的心理洞察——直接编织进叙事中）"
    : "\n\n## Narrative Ammunition (pre-analyzed insights — weave directly into your narrative)";

  const themeStr = dominantTheme?.[locale]
    ? isZh
      ? `\n主导叙事线：${dominantTheme.zh}`
      : `\nDominant narrative arc: ${dominantTheme.en}`
    : "";

  const seedStr = seedpoints
    .map((s, i) => {
      const insight = s.insight[locale];
      const scene = s.scene[locale];
      const tension = s.tension[locale];
      if (isZh) {
        return `\n${i + 1}. 洞察：${insight}\n   场景：${scene}\n   张力/转化：${tension}`;
      }
      return `\n${i + 1}. Insight: ${insight}\n   Scene: ${scene}\n   Tension/reframe: ${tension}`;
    })
    .join("");

  return `${header}${themeStr}${seedStr}`;
}

// ── Call A: Identity Portrait (4 fields) ────────────────────

function buildCallAPrompt(dataBlock: string, locale: Locale): string {
  if (locale === "zh") {
    return `${dataBlock}

---

返回 JSON，4 个字段。整体形成一条递进叙事线：身份认同 → 行为证据 → 价值驱动。

{
  "identitySummary": "严格3句话，构成'身份总论'：第1句——用一个具体行为场景开头（'当你面对…时，你总是…'），让用户立刻'对，这就是我'。第2句——解释为什么（原型×人格×价值观的交叉因果）。第3句——所以你真正的课题/聚焦点是什么。不要用'你的原型是XX'开头。不要空洞。每句话都必须有信息量。（80-120字）",
  "archetypeNarrative": "直接进入叙事，不要加标题。这不是重述原型描述——而是用证据证明。用2-3个具体行为场景展示这个用户独特的'版本'：ta的行为倾向如何让ta与同原型的其他人不同？因果链连接。必须包含双重故事——这个模式的代价是什么？（150-250字）",
  "bigFiveNarrative": "直接进入叙事，不要加标题。找2-3个最有故事性的行为倾向组合，不是逐个描述，而是讲它们交织时产生的行为模式——为什么你在某些场景中的反应和别人不同？同一维度内的反差、跨维度的叠加效应、认知和协作方式的性格根源。用场景落地。读完后用户应感觉'你比我的朋友更懂我'。（150-250字）",
  "valueNarrative": "直接进入叙事，不要加标题。讲Top3价值观在日常决策中如何具体运作——不是'你重视成就'，而是'当你评估一个机会时，你首先问的不是能赚多少，而是能不能真正做出东西'。如有冲突对——这是高潮——用一个你可能经历过的两难场景展示拉扯。回引前面的原型和行为模式。（120-180字）"
}`;
  }

  return `${dataBlock}${targetPromptHeader(locale)}

---

Return JSON with 4 fields. Together they form a progressive narrative arc: identity thesis → behavioral evidence → value drivers.

{
  "identitySummary": "Exactly 3 sentences forming an 'Identity Thesis': Sentence 1 — open with a specific behavioral scene ('When you face... you tend to...') for instant recognition. Sentence 2 — explain WHY (the causal intersection of archetype×personality×values). Sentence 3 — therefore, your real focus/challenge is... Don't start with 'Your archetype is X.' No empty words. Every sentence must carry information. (60-100 words)",
  "archetypeNarrative": "Jump straight into the narrative — no heading or title. Not restating the archetype — proving it with evidence. Use 2-3 specific behavioral scenes to show THIS user's unique version: how do their behavioral tendencies make them different from others with the same archetype? Causal chains. Must include double story — what does this pattern cost you? (120-200 words)",
  "bigFiveNarrative": "Jump straight into the narrative — no heading or title. Find 2-3 most story-worthy behavioral tendency combinations. Don't describe each tendency — narrate the behavioral patterns they create TOGETHER. Why do you react differently from others in certain situations? Within-dimension contradictions, cross-dimension amplification, personality roots of cognitive/collaboration style. Ground in scenes. Reader should feel 'you understand me better than my friends.' (120-200 words)",
  "valueNarrative": "Jump straight into the narrative — no heading or title. How Top 3 values concretely operate in daily decisions — not 'you value achievement' but 'when evaluating an opportunity, you don't first ask how much it pays, but whether you can truly build something.' If conflict pair exists — this is the climax — show the pull with a specific dilemma scenario you may have experienced. Reference back to archetype and behavioral patterns above. (80-150 words)"
}`;
}

// ── Call B: Growth & Synthesis (3 fields) ────────────────────

function buildCallBPrompt(dataBlock: string, locale: Locale): string {
  if (locale === "zh") {
    return `${dataBlock}

---

返回 JSON，3 个字段。这组叙事聚焦内在张力和跨维度发现。精炼、有穿透力。

{
  "sjtTensionNarrative": "直接进入叙事，不要加标题。基于should-would差距，讲'你认为自己会怎么做'和'你实际倾向怎么做'之间的关系。一致性高→这意味着什么（自我认知清晰，但也可能意味着舒适区太稳固）。有差距→具体在哪些场景中出现错位？用一个用户可能经历过的具体场景展示：'当你面对X时，你心里觉得应该A，但你的身体/本能会拉着你走向B。' 这不是缺点——解释为什么这个拉扯其实揭示了你更深层的优先级。（120-180字）",
  "crossDimensionNarrative": "整个叙事的高潮和收束。把前面所有维度的线索汇聚成一个洞察：原型模式 + 行为风格 + 价值取向 + 内在拉扯，交汇在一起，揭示出什么？命名一个涌现品质——用户一直感受到但从未有语言描述的东西（比如'你不是在追求完美，你是在追求对得起自己标准的完整感'）。以一个开放性问题结尾，自然引向深度探索。（120-180字）",
  "growthMapInsight": "为'内在拉扯'数据可视化提供解释层。不要用比喻——直接说人话。结构：1）你身上最显著的2个创造性张力是什么。2）每个张力在日常中如何表现（具体场景）。3）为什么这些张力其实是优势而非缺陷。4）需要注意什么。不要写鸡汤，不要用'旅程''潜力'等空洞词。（100-150字）"
}`;
  }

  return `${dataBlock}${targetPromptHeader(locale)}

---

Return JSON with 3 fields. This group focuses on inner tensions and cross-dimensional discovery. Precise and penetrating.

{
  "sjtTensionNarrative": "Jump straight into the narrative — no heading or title. Based on should-would gaps, narrate the relationship between 'what you think you'd do' and 'what you actually tend to do.' High consistency → what this means (clear self-knowledge, but may also mean a comfort zone that's too stable). Gaps → in which specific scenarios does misalignment appear? Use a concrete scene: 'When you face X, your mind says do A, but your instinct pulls you toward B.' This isn't a flaw — explain why this pull actually reveals your deeper priorities. (80-150 words)",
  "crossDimensionNarrative": "The climax and synthesis. Pull all threads together: archetype pattern + behavioral style + value orientation + inner tensions — what do they reveal when combined? Name an emergent quality the user has always felt but never had words for (e.g., 'You're not chasing perfection — you're chasing the sense of wholeness that comes from meeting your own standards'). End with an open question that naturally leads to deeper exploration. (80-150 words)",
  "growthMapInsight": "Interpretive layer for the 'inner tensions' data visualization. No metaphors — speak plainly. Structure: 1) Your 2 most significant creative tensions. 2) How each tension shows up in daily life (concrete scenes). 3) Why these tensions are actually strengths, not flaws. 4) What to watch out for. No motivational fluff. No 'journey,' 'potential,' or hollow words. (60-120 words)"
}`;
}

// ── Lazy meaning-compass narrative (single-field) ────────────
// Generated only when the user actually scrolls to Ch3, not at profile
// creation time. Reuses the same systemMsg + dataBlock as the soul call
// so prompt cache stays warm.

const MEANING_COMPASS_TIMEOUT_MS = 30_000;

export async function generateMeaningCompassNarrative(
  profile: PersonalProfileData,
  algo: AlgoSnapshot,
  locale: Locale,
): Promise<string | null> {
  const systemMsg = await buildSoulSystemMessage(locale);
  const { seedpoints, dominantTheme } = computeNarrativeSeedpoints(
    profile,
    algo,
  );
  const dataBlock = buildDataBlock(
    profile,
    algo,
    locale,
    seedpoints,
    dominantTheme,
  );
  const prompt = buildMeaningCompassPrompt(dataBlock, locale);

  try {
    const content = await callLLM(
      "profile-narrative",
      [
        { role: "system", content: systemMsg },
        { role: "user", content: prompt },
      ],
      {
        maxTokens: 700,
        temperature: 0.7,
        enableCache: true,
        responseFormat: "json",
        timeoutMs: MEANING_COMPASS_TIMEOUT_MS,
      },
    );
    if (!content || content.trim().length < 50) return null;

    const parsed = parsePartialResponse(content, [
      "meaningCompassNarrative" as const,
    ]);
    const raw = parsed?.meaningCompassNarrative?.trim();
    if (!raw || raw.length < 20) return null;
    return sanitizeNarrativeOutput(raw);
  } catch (error) {
    console.error(
      "[meaning-compass-narrative] generation failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function buildMeaningCompassPrompt(dataBlock: string, locale: Locale): string {
  if (locale === "zh") {
    return `${dataBlock}

---

只写一段：意义指南针叙事（meaningCompassNarrative）。返回 JSON 单字段。

{
  "meaningCompassNarrative": "你为什么活成这型——基于 Meaning Compass 数据（极性 + top-3 锚点 + Big Five 上色），分四个层次写：①当你做重要决定时，指针倾向落在哪里——用画面，禁用'自我增强/自我超越'等学术词；②你的'为什么'通常出现在哪一类时刻——创造、遇见、还是承受？用具体场景；③如果存在意义张力，写一个具体两难，否则写两个锚点如何互相补足；④前瞻一句：'你将来最可能后悔的不是 X，而是 Y'，开放式收尾不给答案。⛔ 只讲 WHY，不讲 WHAT，不重复其他段落。（150-200字）"
}`;
  }
  return `${dataBlock}${targetPromptHeader(locale)}

---

Write only one paragraph: the meaning-compass narrative. Return JSON with a single field.

{
  "meaningCompassNarrative": "Why you live this way — based on Meaning Compass data (pole + top-3 keystones + Big Five coloring), in four moves: ① When you face a major decision, where does your needle tend to land — use imagery, NEVER use academic terms like 'self-enhancement/self-transcendence'; ② Your 'why' tends to surface in which kind of moment — creating, encountering, or enduring? Use concrete scenes; ③ If meaning tension exists, write a specific dilemma; otherwise show how two keystones complete each other; ④ One forward-looking line: 'What you'll likely regret isn't X — it's Y.' Open-ended close, no answer. ⛔ Speak ONLY in WHY, not WHAT; do NOT restate other paragraphs. (100-150 words)"
}`;
}
