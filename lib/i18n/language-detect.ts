// ============================================================
// Language Mismatch Detection
//
// Pure, zero-dependency utilities to detect whether a piece of text
// is written in a script that does not match the target locale.
//
// Used by report-generation/language-guard.ts to catch LLM outputs
// that leak user-input language (e.g., Chinese values flowing into
// an English prompt and resurfacing in the English report).
// ============================================================

import type { Locale } from "./config";

export interface ScriptCounts {
  latin: number;
  cjkHan: number;
  hiragana: number;
  katakana: number;
  hangul: number;
  cyrillic: number;
  /** Non-whitespace, non-punctuation, non-digit character count. */
  total: number;
}

/**
 * Count characters by Unicode script block.
 * Whitespace, punctuation, symbols, and digits are excluded from the total.
 */
export function countScripts(text: string): ScriptCounts {
  const counts: ScriptCounts = {
    latin: 0,
    cjkHan: 0,
    hiragana: 0,
    katakana: 0,
    hangul: 0,
    cyrillic: 0,
    total: 0,
  };
  if (!text) return counts;

  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    // Skip whitespace, punctuation, symbols, digits
    if (/\s/u.test(ch) || /[\p{P}\p{S}\p{N}]/u.test(ch)) continue;
    counts.total++;

    // Latin: A-Z, a-z, Latin-1 Supplement, Latin Extended-A/B, Latin Extended Additional
    if (
      (cp >= 0x0041 && cp <= 0x005a) ||
      (cp >= 0x0061 && cp <= 0x007a) ||
      (cp >= 0x00c0 && cp <= 0x024f) ||
      (cp >= 0x1e00 && cp <= 0x1eff)
    ) {
      counts.latin++;
    }
    // CJK Unified Ideographs (+ Ext A, Ext B, Compatibility)
    else if (
      (cp >= 0x3400 && cp <= 0x4dbf) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x20000 && cp <= 0x2a6df) ||
      (cp >= 0xf900 && cp <= 0xfaff)
    ) {
      counts.cjkHan++;
    }
    // Hiragana
    else if (cp >= 0x3040 && cp <= 0x309f) {
      counts.hiragana++;
    }
    // Katakana (+ Phonetic Extensions)
    else if ((cp >= 0x30a0 && cp <= 0x30ff) || (cp >= 0x31f0 && cp <= 0x31ff)) {
      counts.katakana++;
    }
    // Hangul Syllables + Jamo + Compatibility Jamo
    else if (
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0x1100 && cp <= 0x11ff) ||
      (cp >= 0x3130 && cp <= 0x318f)
    ) {
      counts.hangul++;
    }
    // Cyrillic + Cyrillic Supplement
    else if ((cp >= 0x0400 && cp <= 0x04ff) || (cp >= 0x0500 && cp <= 0x052f)) {
      counts.cyrillic++;
    }
  }
  return counts;
}

export type ForeignScript = "cjkHan" | "kana" | "hangul" | "cyrillic" | "latin";

export interface MismatchResult {
  isMismatch: boolean;
  /** Ratio (0-1) of characters that are considered foreign for the target locale. */
  foreignRatio: number;
  foreignScripts: ForeignScript[];
}

export interface DetectOptions {
  /**
   * Strings (proper nouns, brand names, cities) to strip from the text
   * before detection — prevents legitimate cross-language references
   * like "Beijing" or "LinkedIn" from triggering mismatch.
   */
  whitelistPhrases?: string[];
  /**
   * Skip enum-like identifier tokens such as `coaching_insight`, `LinkedIn`,
   * `exploring`, or `H1B`. These are common controlled-vocabulary / brand /
   * short-label values that should not trip locale mismatch on their own.
   * Defaults to true.
   */
  skipEnumLikeTokens?: boolean;
  /** Override the locale default threshold (0-1). */
  foreignRatioThreshold?: number;
  /**
   * Object keys ending with any of these suffixes are skipped during
   * `findMismatchedFields` — used to exempt intentionally bilingual fields
   * like `title_zh`, `title_en`, `linkedinTip_zh`, etc. Defaults to the
   * 11 supported Locale suffixes.
   */
  skipKeySuffixes?: string[];
  /**
   * Exact object-key names to skip during `findMismatchedFields`. Use for
   * enum-typed / controlled-vocabulary fields (e.g., `category`, `status`,
   * `newStatus`, `source`) whose values are fixed English tokens and would
   * otherwise trigger false mismatches in non-English locales.
   */
  skipKeys?: string[];
}

/** Locale suffixes that flag intentionally bilingual object keys (e.g. `title_zh`). */
const DEFAULT_LOCALE_SUFFIXES = [
  "_en",
  "_zh",
  "_nl",
  "_de",
  "_fr",
  "_es",
  "_pt",
  "_it",
  "_ru",
  "_ja",
  "_ko",
];

export const DEFAULT_SKIP_KEYS = [
  "createdAt",
  "updatedAt",
  "discoveredAt",
  "extractedAt",
  "generatedAt",
  "completedAt",
  "timestamp",
  "time",
  "category",
  "source",
  "status",
  "newStatus",
  "method",
  "type",
  "kind",
  "role",
  "provider",
  "model",
] as const;

const ENUM_LIKE_TOKEN_RE = /^[A-Za-z_][A-Za-z0-9_-]{0,29}$/;

const WORD_RE = /\p{L}+/gu;

const ENGLISH_MARKERS = new Set([
  "the",
  "a",
  "an",
  "and",
  "of",
  "to",
  "for",
  "with",
  "you",
  "your",
  "yours",
  "are",
  "be",
  "as",
  "that",
  "this",
  "these",
  "those",
  "not",
  "can",
  "should",
  "would",
  "could",
  "will",
  "if",
  "when",
  "what",
  "where",
  "why",
  "because",
  "but",
  "also",
  "from",
  "into",
  "about",
  "role",
  "career",
  "work",
  "user",
  "report",
  "values",
  "task",
  "insight",
  "explore",
  "direction",
  "worth",
  "based",
  "profile",
  "need",
  "needs",
  "help",
  "helps",
  "recommend",
]);

const DUTCH_MARKERS = new Set([
  "de",
  "het",
  "een",
  "en",
  "van",
  "voor",
  "met",
  "je",
  "jij",
  "jouw",
  "jou",
  "naar",
  "niet",
  "dat",
  "die",
  "zijn",
  "als",
  "op",
  "om",
  "te",
  "deze",
  "dit",
  "wat",
  "waar",
  "hoe",
  "waarom",
  "omdat",
  "maar",
  "ook",
  "aan",
  "bij",
  "door",
  "over",
  "uit",
  "meer",
  "minder",
  "werk",
  "rol",
  "richting",
  "loopbaan",
  "gebruiker",
  "rapport",
  "waarden",
  "taak",
  "inzicht",
  "verkennen",
  "ontdekken",
  "voelt",
  "kunt",
  "hebt",
  "wordt",
  "moet",
  "kan",
  "zal",
  "ben",
  "raden",
]);

function detectEnglishInDutch(text: string): number {
  const words = (text.toLowerCase().match(WORD_RE) ?? []).filter(
    (word) => word.length > 1,
  );
  if (words.length < 8) return 0;

  let english = 0;
  let dutch = 0;
  for (const word of words) {
    if (ENGLISH_MARKERS.has(word)) english++;
    if (DUTCH_MARKERS.has(word)) dutch++;
  }

  const englishRatio = english / words.length;
  const dutchRatio = dutch / words.length;
  if (englishRatio >= 0.22 && englishRatio >= dutchRatio * 2 && dutchRatio <= 0.1) {
    return englishRatio;
  }
  return 0;
}

/**
 * Detect whether `text` contains a significant proportion of characters
 * that do NOT belong to the target locale's expected script.
 *
 * Default thresholds:
 * - en: non-Latin scripts >= 5% -> mismatch (allows the occasional CJK proper noun)
 * - zh: Latin >= 40% AND cjkHan < 50% -> mismatch (allows brand names like LinkedIn)
 * - ja: no kana AND cjkHan > 10% -> mismatch (pure Han is likely Chinese leak)
 * - ko: hangul < 30% AND (latin > 50% OR cjkHan > 20%) -> mismatch
 * - ru: cyrillic < 40% AND latin > 50% -> mismatch
 * - Other Latin-script locales (nl/de/fr/es/pt/it): foreign scripts >= 3% -> mismatch
 */
export function detectLanguageMismatch(
  text: string,
  targetLocale: Locale | string,
  options: DetectOptions = {},
): MismatchResult {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) {
    return { isMismatch: false, foreignRatio: 0, foreignScripts: [] };
  }

  if (options.skipEnumLikeTokens !== false && ENUM_LIKE_TOKEN_RE.test(trimmed)) {
    return { isMismatch: false, foreignRatio: 0, foreignScripts: [] };
  }

  let cleaned = trimmed;
  for (const phrase of options.whitelistPhrases ?? []) {
    if (phrase && phrase.trim().length > 0) {
      cleaned = cleaned.split(phrase).join("");
    }
  }

  const c = countScripts(cleaned);
  if (c.total === 0) {
    return { isMismatch: false, foreignRatio: 0, foreignScripts: [] };
  }

  const cjkRatio = c.cjkHan / c.total;
  const kanaRatio = (c.hiragana + c.katakana) / c.total;
  const hangulRatio = c.hangul / c.total;
  const cyrRatio = c.cyrillic / c.total;
  const latinRatio = c.latin / c.total;

  const foreignScripts: ForeignScript[] = [];
  let isMismatch = false;
  let foreignRatio = 0;

  switch (targetLocale) {
    case "en": {
      const threshold = options.foreignRatioThreshold ?? 0.05;
      const foreign = cjkRatio + kanaRatio + hangulRatio + cyrRatio;
      foreignRatio = foreign;
      if (foreign >= threshold) {
        isMismatch = true;
        if (cjkRatio >= 0.02) foreignScripts.push("cjkHan");
        if (kanaRatio >= 0.02) foreignScripts.push("kana");
        if (hangulRatio >= 0.02) foreignScripts.push("hangul");
        if (cyrRatio >= 0.02) foreignScripts.push("cyrillic");
      }
      break;
    }
    case "zh": {
      const threshold = options.foreignRatioThreshold ?? 0.4;
      foreignRatio = latinRatio;
      if (latinRatio >= threshold && cjkRatio < 0.5) {
        isMismatch = true;
        foreignScripts.push("latin");
      }
      break;
    }
    case "ja": {
      // Japanese legitimately uses cjkHan; the signal is absence of kana.
      if (kanaRatio === 0 && cjkRatio > 0.1) {
        isMismatch = true;
        foreignRatio = cjkRatio;
        foreignScripts.push("cjkHan");
      } else {
        const threshold = options.foreignRatioThreshold ?? 0.4;
        if (latinRatio >= threshold && kanaRatio + cjkRatio < 0.3) {
          isMismatch = true;
          foreignRatio = latinRatio;
          foreignScripts.push("latin");
        }
      }
      break;
    }
    case "ko": {
      const threshold = options.foreignRatioThreshold ?? 0.3;
      if (hangulRatio < threshold && (latinRatio > 0.5 || cjkRatio > 0.2)) {
        isMismatch = true;
        foreignRatio = 1 - hangulRatio;
        if (latinRatio > 0.5) foreignScripts.push("latin");
        if (cjkRatio > 0.2) foreignScripts.push("cjkHan");
      }
      break;
    }
    case "ru": {
      const threshold = options.foreignRatioThreshold ?? 0.4;
      if (cyrRatio < threshold && latinRatio > 0.5) {
        isMismatch = true;
        foreignRatio = latinRatio;
        foreignScripts.push("latin");
      }
      break;
    }
    case "nl": {
      const threshold = options.foreignRatioThreshold ?? 0.03;
      const foreign = cjkRatio + kanaRatio + hangulRatio + cyrRatio;
      foreignRatio = foreign;
      if (foreign >= threshold) {
        isMismatch = true;
        if (cjkRatio >= 0.02) foreignScripts.push("cjkHan");
        if (kanaRatio >= 0.02) foreignScripts.push("kana");
        if (hangulRatio >= 0.02) foreignScripts.push("hangul");
        if (cyrRatio >= 0.02) foreignScripts.push("cyrillic");
      } else {
        const englishLeakRatio = detectEnglishInDutch(cleaned);
        if (englishLeakRatio > 0) {
          isMismatch = true;
          foreignRatio = englishLeakRatio;
          foreignScripts.push("latin");
        }
      }
      break;
    }
    default: {
      // Latin-script locales: de/fr/es/pt/it — reject any non-Latin script
      const threshold = options.foreignRatioThreshold ?? 0.03;
      const foreign = cjkRatio + kanaRatio + hangulRatio + cyrRatio;
      foreignRatio = foreign;
      if (foreign >= threshold) {
        isMismatch = true;
        if (cjkRatio >= 0.02) foreignScripts.push("cjkHan");
        if (kanaRatio >= 0.02) foreignScripts.push("kana");
        if (hangulRatio >= 0.02) foreignScripts.push("hangul");
        if (cyrRatio >= 0.02) foreignScripts.push("cyrillic");
      }
      break;
    }
  }

  return { isMismatch, foreignRatio, foreignScripts };
}

export interface MismatchedField {
  /** Dotted/bracketed path to the field (e.g., "jobSearchStrategy.constraintStrategies[0].constraint"). */
  path: string;
  value: string;
  foreignRatio: number;
}

/**
 * Recursively scan an object and return every string leaf whose language
 * does not match the target locale.
 *
 * Array items are reported with bracket notation (e.g., `tips[2]`).
 *
 * Object keys ending with a locale suffix (e.g., `title_zh`, `linkedinTip_en`)
 * are skipped by default — these fields are intentionally bilingual data, not
 * visible output the guard should police. Override via `options.skipKeySuffixes`.
 */
export function findMismatchedFields(
  obj: unknown,
  targetLocale: Locale | string,
  options: DetectOptions = {},
): MismatchedField[] {
  const results: MismatchedField[] = [];
  const skipSuffixes = options.skipKeySuffixes ?? DEFAULT_LOCALE_SUFFIXES;
  const skipKeys = new Set([...DEFAULT_SKIP_KEYS, ...(options.skipKeys ?? [])]);

  const visit = (node: unknown, path: string): void => {
    if (node === null || node === undefined) return;
    if (typeof node === "string") {
      const result = detectLanguageMismatch(node, targetLocale, options);
      if (result.isMismatch) {
        results.push({
          path,
          value: node,
          foreignRatio: result.foreignRatio,
        });
      }
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((item, idx) => visit(item, `${path}[${idx}]`));
      return;
    }
    if (typeof node === "object") {
      for (const [key, val] of Object.entries(node)) {
        if (skipKeys.has(key)) continue;
        if (skipSuffixes.some((s) => key.endsWith(s))) continue;
        const newPath = path ? `${path}.${key}` : key;
        visit(val, newPath);
      }
    }
  };

  visit(obj, "");
  return results;
}
