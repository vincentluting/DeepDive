// ============================================================
// Language Guard for Report Generation LLM Outputs
//
// Wraps LLM outputs with a detect → regenerate → sanitize flow to
// enforce locale consistency. Prevents user-input language (e.g.,
// Chinese values flowing into an English prompt) from bleeding
// through as Chinese text in the final report.
//
// Emergency disable: set env LANGUAGE_GUARD_DISABLED=1.
// ============================================================

import * as Sentry from "@sentry/nextjs";
import {
  findMismatchedFields,
  type MismatchedField,
} from "@/lib/i18n/language-detect";
import type { Locale } from "@/lib/i18n/config";
import type { RealConditions } from "@/lib/types";

const __DEV__ = process.env.NODE_ENV === "development";

function isGuardDisabled(): boolean {
  return process.env.LANGUAGE_GUARD_DISABLED === "1";
}

export interface GuardOptions<T> {
  /** Task identifier for Sentry tags (e.g., "career-pathway"). */
  taskId: string;
  /** Proper nouns stripped before detection — typically user's cities, industries. */
  whitelistPhrases?: string[];
  /**
   * Exact object-key names to skip during mismatch detection. Use for enum /
   * controlled-vocabulary fields (e.g., `category`, `status`, `source`) whose
   * values are fixed English tokens and would otherwise trigger false mismatches
   * when the target locale is non-English.
   */
  skipKeys?: string[];
  /** Override locale-suffixed keys skipped by the shared mismatch detector. */
  skipKeySuffixes?: string[];
  /**
   * Called when pass-1 detects mismatch. Receives the list of mismatched
   * field paths. Should return a regenerated output or null on failure.
   * If omitted, guard goes straight to sanitize.
   */
  regenerate?: (foundMismatchFields: string[]) => Promise<T | null>;
  /**
   * Called when sanitization is needed (no regenerate or both passes failed).
   * Should return a cleaned output with mismatched fields removed/replaced.
   */
  sanitize?: (output: T, mismatchedPaths: string[]) => T;
}

/**
 * Enforce that an LLM output matches the target locale.
 *
 * Flow:
 *   1. Pass 1: detect mismatched fields. If none → return as-is.
 *   2. If regenerate hook provided: call it with mismatch paths.
 *      Pass 2: re-detect on regenerated output.
 *      - Clean → return regenerated
 *      - Still dirty → sanitize the regenerated output
 *   3. No regenerate hook → sanitize original output.
 *
 * All mismatches are reported to Sentry with task/locale/phase tags.
 */
export async function enforceOutputLocale<T extends object>(
  output: T,
  targetLocale: Locale | string,
  opts: GuardOptions<T>,
): Promise<T> {
  if (isGuardDisabled()) return output;

  const scanOpts = {
    whitelistPhrases: opts.whitelistPhrases,
    skipKeys: opts.skipKeys,
    skipKeySuffixes: opts.skipKeySuffixes,
  };
  const pass1 = findMismatchedFields(output, targetLocale, scanOpts);
  if (pass1.length === 0) return output;

  captureMismatch(opts.taskId, String(targetLocale), pass1, "pass1");

  if (opts.regenerate) {
    const regenerated = await opts.regenerate(pass1.map((m) => m.path));
    if (regenerated) {
      const pass2 = findMismatchedFields(regenerated, targetLocale, scanOpts);
      if (pass2.length === 0) {
        if (__DEV__) {
          console.warn(
            `[language-guard] ${opts.taskId} recovered after regenerate`,
          );
        }
        return regenerated;
      }
      captureMismatch(opts.taskId, String(targetLocale), pass2, "pass2");
      return opts.sanitize
        ? opts.sanitize(
            regenerated,
            pass2.map((m) => m.path),
          )
        : regenerated;
    }
    // Regenerate returned null — fall through to sanitize original
  }

  return opts.sanitize
    ? opts.sanitize(
        output,
        pass1.map((m) => m.path),
      )
    : output;
}

function captureMismatch(
  taskId: string,
  targetLocale: string,
  mismatches: MismatchedField[],
  guardPhase: "pass1" | "pass2",
): void {
  const level: "error" | "warning" =
    guardPhase === "pass2" ? "error" : "warning";
  try {
    Sentry.captureMessage(`[language-guard] ${taskId} ${guardPhase} mismatch`, {
      level,
      tags: {
        feature: "report-generation",
        task: taskId,
        targetLocale,
        guardPhase,
      },
      extra: {
        mismatchCount: mismatches.length,
        mismatchedPaths: mismatches.slice(0, 10).map((m) => m.path),
        samples: mismatches.slice(0, 3).map((m) => ({
          path: m.path,
          preview: m.value.slice(0, 80),
          foreignRatio: Number(m.foreignRatio.toFixed(3)),
        })),
      },
    });
  } catch {
    // Sentry failure must never break the guard
  }
  if (__DEV__) {
    console.warn(
      `[language-guard] ${taskId} ${guardPhase} mismatch on ${mismatches.length} field(s):`,
      mismatches
        .slice(0, 3)
        .map((m) => `${m.path}="${m.value.slice(0, 40)}..."`),
    );
  }
}

/**
 * Build a strict retry prompt that explicitly calls out the previous
 * language mismatch and demands target-locale output.
 */
export function buildRegeneratePrompt(args: {
  originalPrompt: string;
  langName: string;
  foundMismatchFields: string[];
}): string {
  const { originalPrompt, langName, foundMismatchFields } = args;
  const fieldList = foundMismatchFields.slice(0, 8).join(", ");
  return `${originalPrompt}

## CRITICAL LANGUAGE RETRY CONTEXT
Your previous response contained text in the wrong language in these JSON fields: ${fieldList}.
Regenerate the ENTIRE JSON. Every string field value MUST be written in ${langName} ONLY.
If the user's Real-World Conditions are in another language, translate them to ${langName} before quoting or referencing them.
Do NOT copy non-${langName} user input verbatim into any output field.`;
}

/**
 * Extract locale-independent proper nouns from a user's RealConditions.
 * Used as `whitelistPhrases` so that legitimate references like "Beijing"
 * (in an English report) or "LinkedIn" (in a Chinese report) do not
 * falsely trigger the language guard.
 */
export function extractProperNouns(
  realConditions: RealConditions | null | undefined,
): string[] {
  if (!realConditions) return [];
  const nouns: string[] = [];
  if (realConditions.currentCity) nouns.push(realConditions.currentCity);
  if (Array.isArray(realConditions.targetCities)) {
    nouns.push(...realConditions.targetCities);
  }
  if (Array.isArray(realConditions.pastIndustries)) {
    nouns.push(...realConditions.pastIndustries);
  }
  if (Array.isArray(realConditions.interestedIndustries)) {
    nouns.push(...realConditions.interestedIndustries);
  }
  if (realConditions.education?.field) {
    nouns.push(realConditions.education.field);
  }
  if (realConditions.visaType) {
    nouns.push(realConditions.visaType);
  }
  return nouns
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim());
}
