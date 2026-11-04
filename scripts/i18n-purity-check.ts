#!/usr/bin/env tsx
/**
 * i18n Language Purity Check
 *
 * Scans the codebase for "language bleeding" — situations where non-English text
 * could appear in the wrong locale's UI, or where locale-specific code bypasses
 * the i18n dictionary system.
 *
 * Severity levels:
 *   S1: Hardcoded CJK/Cyrillic text in string literals outside bilingual data definitions
 *   S2: Direct access to locale-suffixed fields (*_zh, *_nl, etc.) without locale guard
 *   S3: Fallback patterns that leak wrong locale (e.g. label_en || label_zh)
 *   S4: Locale ternary anti-pattern with inline text (should use dictionary)
 *
 * Supported locales: en, zh, nl, de, fr, es, pt, it, ru, ja, ko
 *
 * Usage: npx tsx scripts/i18n-purity-check.ts
 */

import fs from "fs";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "..");

/** Directories to scan */
const SCAN_DIRS = ["app", "components", "lib"];

/** File extensions to scan */
const EXTENSIONS = [".ts", ".tsx"];

/** Files/directories to skip entirely */
const SKIP_PATTERNS = [
  "lib/i18n/dictionaries/",
  "lib/content/archetypes-12.ts", // bilingual data source — OK
  "lib/content/types.ts", // type definitions — OK
  "scripts/",
  "node_modules/",
  "__tests__/",
  ".test.",
  ".spec.",
  // ── Intentionally bilingual backend content (LLM prompts / assessment data) ──
  "lib/questionnaire/", // bilingual questionnaire items (TwIVI, IPIP-120, etc.)
  "lib/assessment/", // bilingual assessment items
  "lib/content/", // all content files (famous-types, career-directions, etc.)
  "lib/cdse/", // multilingual research survey question banks
  "lib/evals/", // offline eval fixtures and bilingual rubric terms
  "lib/coaching/evals/", // offline coaching eval fixtures and Chinese golden conversations
  "lib/report-generation/", // LLM report generation prompts
  "lib/coaching/build-system-prompt.ts", // LLM coaching system prompt
  "lib/coaching/session-summary.ts", // LLM session-summary prompt (Phase 4)
  "lib/coaching/curated-career-knowledge.ts", // bilingual internal LLM evidence guidance
  "lib/coaching/conversation-router.ts", // bilingual routing patterns + LLM turn instructions
  "lib/coaching/eval-cases.ts", // bilingual offline golden scenarios
  "lib/coaching/phase-protocol.ts", // LLM Socratic phase protocol (bilingual prompt strings)
  "lib/coaching/resume-evidence-context.ts", // bilingual internal LLM resume evidence block
  "lib/memory/", // memory generation prompts
  "lib/data/", // static reference data (cities, etc.)
  "lib/db/admin-insights", // admin SQL insight queries (labels in queries)
  "app/[locale]/(app)/admin/", // admin panel — founder-only, uses label() with inline bilingual fallbacks
  "components/immersive-explore/data/", // immersive story chapter data
  // ── API routes that are pure LLM prompt builders ──
  "app/api/coaching-chat/",
  "app/api/coaching-summary/",
  "app/api/memory/",
  // ── Backend lib files: frozen code or intentionally bilingual data/logic ──
  "lib/scoring/behavior-insights.ts", // FROZEN — scoring pipeline
  "lib/scoring/constants.ts", // bilingual archetype label data (ARCHETYPE_MAP)
  "lib/email/", // email templates (locale-aware by design)
  "lib/i18n/config.ts", // i18n config (locale display names)
  "lib/analytics/notable-detection.ts", // analytics with bilingual detection patterns
  "lib/profile-generation/shadow-algorithm.ts", // profile generation algorithm
  "lib/resume/match-resume.ts", // resume matching logic
  "lib/data-export/json-resume-mapper.ts", // data export mapping
  "lib/action-hub/seed-extractor.ts", // seed data extraction
  // ── Immersive explore: story engine reads bilingual chapter data ──
  "components/immersive-explore/use-immersive-engine.ts",
  "components/immersive-explore/immersive-explore-intro.tsx",
  "components/immersive-explore/immersive-explore-shell.tsx",
  // ── Components with bilingual inline data structures ──
  "components/quickdive/quickdive-data.ts", // bilingual RIASEC data ({ text, textEn })
  "components/quickdive/archetype-identity-card.tsx", // bilingual archetype labels
  "components/share/share-button.tsx", // bilingual archetype labels in locale-guarded ternaries
  "components/share/explorer-certificate.tsx", // bilingual archetype labels
  "components/features/coaching-chat.tsx", // bilingual coaching UI with locale guards
  "components/profile-panels/value-anchors.tsx", // bilingual value labels
  "components/reality-conditions/constants.ts", // bilingual country/city data
  "components/reality-conditions/country-combobox.tsx", // bilingual country picker
  "components/report/methodology-section.tsx", // bilingual methodology text
  "components/admin/invite-codes-tab.tsx", // admin bilingual labels
  "app/[locale]/(report)/report/[id]/page.tsx", // report page with locale-guarded ternaries
  "app/[locale]/(report)/report/[id]/report-client.tsx", // report client with bilingual data
  "lib/career-matching/client-engine.ts", // bilingual career matching data
  "app/[locale]/(public)/share/[code]/page.tsx", // SSR share page with locale-guarded ternaries
  "components/profile-panels/collab-style-section.tsx", // bilingual collaboration style labels ({ zh, en })
  "components/features/depth-gauge/depth-journey.tsx", // bilingual depth journey milestones ({ en, zh })
  // ── Legal content (locale-specific pages, not UI strings) ──
  "app/[locale]/(public)/legal/",
  // ── Additional API routes with LLM prompt / locale-aware output ──
  "app/api/action-hub/", // LLM prompt builder with locale instructions
  "app/api/og/", // OG image generation (locale-aware text)
];

// ─── Regex patterns ──────────────────────────────────────────────────

/** Non-EN locale codes for field suffix detection */
const NON_EN_LOCALES = [
  "zh",
  "nl",
  "de",
  "fr",
  "es",
  "pt",
  "it",
  "ru",
  "ja",
  "ko",
] as const;

/** CJK Unified Ideographs (Chinese/Japanese Kanji characters) */
const _CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

/** Japanese Hiragana + Katakana */
const _JA_KANA_RE = /[\u3040-\u309F\u30A0-\u30FF]/;

/** Korean Hangul */
const _KO_HANGUL_RE = /[\uAC00-\uD7AF\u1100-\u11FF]/;

/** Cyrillic (Russian) */
const _CYRILLIC_RE = /[\u0400-\u04FF]/;

/** Chinese-specific full-width punctuation (excluding common curly quotes) */
const _CN_PUNCT_RE = /[，。！？；：（）【】《》、]/;

/** Direct locale-suffixed field access without locale guard (S2) */
const LOCALE_FIELD_NAMES = [
  "label",
  "tagline",
  "narrative",
  "collaborationStyle",
  "description",
  "name",
  "term",
  "body",
  "watchout",
  "approximationNote",
];
const LOCALE_FIELD_RE = new RegExp(
  `\\.\\b(${LOCALE_FIELD_NAMES.map((f) => NON_EN_LOCALES.map((l) => `${f}_${l}`).join("|")).join("|")})\\b`,
);

/** Fallback pattern: en || {locale}  (S3 — non-EN can leak to EN) */
const FALLBACK_LEAK_RE = new RegExp(
  `\\.(\\w+_en)\\s*\\|\\|\\s*\\w+\\.\\w*_(${NON_EN_LOCALES.join("|")})`,
);

/** Locale ternary with inline string (S4) — matches isZh, locale === 'zh', locale === 'nl', etc. */
const LOCALE_TERNARY_RE = new RegExp(
  `is[Zz]h\\s*\\?\\s*['"\`]|locale\\s*===\\s*['"](?:${NON_EN_LOCALES.join("|")})['"]\\s*\\?\\s*['"\`]`,
);

const LOCALE_CODE_ONLY_TERNARY_RE = new RegExp(
  `\\?\\s*['"](?:en|${NON_EN_LOCALES.join("|")})['"]\\s*:\\s*['"](?:en|${NON_EN_LOCALES.join("|")})['"]`,
);

// ─── Types ──────────────────────────────────────────────────────────

type Severity = "S1" | "S2" | "S3" | "S4";

interface Finding {
  severity: Severity;
  file: string;
  line: number;
  snippet: string;
  reason: string;
}

// ─── Scanning Logic ──────────────────────────────────────────────────

function shouldSkip(relPath: string): boolean {
  return SKIP_PATTERNS.some((p) => relPath.includes(p));
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);
    if (shouldSkip(rel)) continue;
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function isInComment(line: string, col: number): boolean {
  const commentIdx = line.indexOf("//");
  if (commentIdx >= 0 && commentIdx < col) return true;
  const blockStart = line.indexOf("/*");
  const blockEnd = line.indexOf("*/");
  if (blockStart >= 0 && blockStart < col && (blockEnd < 0 || blockEnd > col))
    return true;
  return false;
}

function isInImportOrType(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("import ") ||
    trimmed.startsWith("export type") ||
    trimmed.startsWith("export interface") ||
    trimmed.startsWith("type ") ||
    trimmed.startsWith("interface ")
  );
}

/** Locale suffixes for data property detection */
const LOCALE_SUFFIX_RE = /_(en|zh|nl|de|fr|es|pt|it|ru|ja|ko)\b/;
const LOCALE_KEY_RE = /^['"]?(en|zh|nl|de|fr|es|pt|it|ru|ja|ko)['"]?\s*:/;

function isDataPropertyLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    LOCALE_SUFFIX_RE.test(trimmed.split(/\s*[:=]/)[0] || "") ||
    /{\s*(en|zh|nl|de|fr|es|pt|it|ru|ja|ko)\s*:/.test(trimmed) ||
    LOCALE_KEY_RE.test(trimmed) ||
    // CamelCase bilingual property keys: `labelZh:`, `archetypeLabelEn:`
    /^\w+(Zh|En|Nl|De|Fr|Es|Pt|It|Ru|Ja|Ko)\s*[:=]/.test(trimmed)
  );
}

/** Non-Latin script pattern: CJK + Japanese Kana + Korean Hangul + Cyrillic */
const NON_LATIN_RE =
  /[\u3400-\u9FFF\uF900-\uFAFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u1100-\u11FF\u0400-\u04FF]/;

/** Check if a string literal on this line contains non-Latin characters (CJK, Kana, Hangul, Cyrillic) */
function findNonLatinInStrings(
  line: string,
): { index: number; text: string } | null {
  // Match string literals: 'text', "text", `text`
  const stringRe = new RegExp(
    `(['"\`])([^'"\`]*${NON_LATIN_RE.source}[^'"\`]*)\\1`,
    "g",
  );
  let match;
  while ((match = stringRe.exec(line)) !== null) {
    return { index: match.index, text: match[2] };
  }
  // Also match JSX text content (between > and <)
  const jsxTextRe = new RegExp(`>([^<]*${NON_LATIN_RE.source}[^<]*)&lt;`, "g");
  while ((match = jsxTextRe.exec(line)) !== null) {
    return { index: match.index, text: match[1] };
  }
  return null;
}

function findChinesePunctInStrings(
  line: string,
): { index: number; text: string } | null {
  const stringRe = /(['"`])([^'"`]*[，。！？；：（）【】《》、][^'"`]*)\1/g;
  let match;
  while ((match = stringRe.exec(line)) !== null) {
    return { index: match.index, text: match[2] };
  }
  return null;
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const relPath = path.relative(ROOT, filePath);

  // Track whether we're inside a bilingual data definition block
  let inDataBlock = false;
  let braceDepth = 0;

  // Track whether we're inside a locale-guarded block (e.g. `if (locale === 'zh') { ... }`)
  let inLocaleGuardBlock = false;
  let localeGuardBraceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (isInImportOrType(line)) continue;

    // Track locale guard blocks: if (locale === 'zh') { or if (isZh) { or if (locale !== 'en') {
    const localeGuardMatch =
      /if\s*\(\s*(locale\s*===\s*['"][a-z]{2}['"]|locale\s*!==\s*['"]en['"]|isZh)\s*\)/.test(
        line,
      );
    if (localeGuardMatch && line.includes("{")) {
      inLocaleGuardBlock = true;
      localeGuardBraceDepth = 0;
    }
    if (inLocaleGuardBlock) {
      for (const ch of line) {
        if (ch === "{") localeGuardBraceDepth++;
        if (ch === "}") localeGuardBraceDepth--;
      }
      if (localeGuardBraceDepth <= 0) inLocaleGuardBlock = false;
    }

    // Track data definition blocks (objects and arrays with bilingual fields)
    const isConstDecl = /^(export\s+)?const\s+\w+.*[:=]\s*[{[]/.test(
      line.trim(),
    );
    if (isConstDecl) {
      const nextLines = lines
        .slice(i, Math.min(i + 5, lines.length))
        .join("\n");
      if (
        /(_zh|_en)\s*[:=]/.test(nextLines) ||
        /\{\s*(zh|en)\s*:/.test(nextLines)
      ) {
        inDataBlock = true;
        braceDepth = 0;
      }
    }
    if (inDataBlock) {
      for (const ch of line) {
        if (ch === "{" || ch === "[") braceDepth++;
        if (ch === "}" || ch === "]") braceDepth--;
      }
      if (braceDepth <= 0) inDataBlock = false;
    }

    // ── S1: Chinese text in string literals (outside data definitions) ──
    // Skip lines with explicit locale guards — these are intentional locale switches, not leaks
    // Also check the previous line for multi-line ternaries (e.g. `locale === "zh"\n  ? "中文"`)
    const prevLine = i > 0 ? lines[i - 1] : "";
    const guardContext = line + " " + prevLine;
    const hasLocaleGuardS1 =
      guardContext.includes("isZh") ||
      guardContext.includes("locale ===") ||
      guardContext.includes("locale === '") ||
      guardContext.includes('locale === "') ||
      guardContext.includes("loc ===") ||
      // label() helper passes (key, en, zh) — locale-aware by design
      /\blabel\s*\(/.test(line);

    if (
      !inDataBlock &&
      !isDataPropertyLine(line) &&
      !hasLocaleGuardS1 &&
      !inLocaleGuardBlock
    ) {
      const nonLatinInString = findNonLatinInStrings(line);
      if (nonLatinInString && !isInComment(line, nonLatinInString.index)) {
        findings.push({
          severity: "S1",
          file: relPath,
          line: lineNum,
          snippet: line.trim().substring(0, 120),
          reason: "Non-Latin text in string literal (CJK/Kana/Hangul/Cyrillic)",
        });
      }

      const punctInString = findChinesePunctInStrings(line);
      if (punctInString && !isInComment(line, punctInString.index)) {
        // Don't double-report if we already reported non-Latin on this line
        if (!nonLatinInString) {
          findings.push({
            severity: "S1",
            file: relPath,
            line: lineNum,
            snippet: line.trim().substring(0, 120),
            reason: "Chinese punctuation in string literal",
          });
        }
      }
    }

    // ── S2: Direct locale-suffixed field access without locale guard ──
    const localeFieldMatch = LOCALE_FIELD_RE.exec(line);
    if (localeFieldMatch && !isInComment(line, localeFieldMatch.index)) {
      const hasLocaleGuard =
        line.includes("isZh") ||
        line.includes("locale") ||
        line.includes("loc ===") ||
        line.includes("language ===") ||
        line.includes("getLocalizedField") ||
        line.includes("pickLocaleText") ||
        line.includes("toBilingualLocale");
      if (
        !hasLocaleGuard &&
        !isDataPropertyLine(line) &&
        !inDataBlock &&
        !inLocaleGuardBlock
      ) {
        findings.push({
          severity: "S2",
          file: relPath,
          line: lineNum,
          snippet: line.trim().substring(0, 120),
          reason: `Direct access to ${localeFieldMatch[1]} without locale check`,
        });
      }
    }

    // ── S3: Fallback pattern that leaks Chinese ──
    const fallbackMatch = FALLBACK_LEAK_RE.exec(line);
    if (fallbackMatch && !isInComment(line, fallbackMatch.index)) {
      findings.push({
        severity: "S3",
        file: relPath,
        line: lineNum,
        snippet: line.trim().substring(0, 120),
        reason: "Fallback from _en to _zh can leak Chinese into English UI",
      });
    }

    // ── S4: Locale ternary with inline text ──
    const ternaryMatch = LOCALE_TERNARY_RE.exec(line);
    if (ternaryMatch && !isInComment(line, ternaryMatch.index)) {
      const localeCodeOnly = LOCALE_CODE_ONLY_TERNARY_RE.test(line);
      if (!inDataBlock && !isDataPropertyLine(line) && !localeCodeOnly) {
        findings.push({
          severity: "S4",
          file: relPath,
          line: lineNum,
          snippet: line.trim().substring(0, 120),
          reason: "Inline isZh/locale ternary — should use dictionary key",
        });
      }
    }
  }

  return findings;
}

// ─── Main ────────────────────────────────────────────────────────────

console.log("🔍 i18n Language Purity Check");
console.log("=".repeat(60));

const allFiles: string[] = [];
for (const dir of SCAN_DIRS) {
  const dirPath = path.join(ROOT, dir);
  if (fs.existsSync(dirPath)) {
    allFiles.push(...collectFiles(dirPath));
  }
}

console.log(`Scanning ${allFiles.length} files...\n`);

const allFindings: Finding[] = [];
for (const file of allFiles) {
  allFindings.push(...scanFile(file));
}

// Deduplicate: same file+line can only have one finding per severity
const seen = new Set<string>();
const deduped = allFindings.filter((f) => {
  const key = `${f.severity}:${f.file}:${f.line}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Sort by severity, then file, then line
deduped.sort((a, b) => {
  if (a.severity !== b.severity) return a.severity.localeCompare(b.severity);
  if (a.file !== b.file) return a.file.localeCompare(b.file);
  return a.line - b.line;
});

// Group by severity
const bySeverity: Record<Severity, Finding[]> = {
  S1: [],
  S2: [],
  S3: [],
  S4: [],
};
for (const f of deduped) {
  bySeverity[f.severity].push(f);
}

const SEVERITY_LABELS: Record<Severity, string> = {
  S1: "🔴 S1 — Hardcoded non-Latin text in string literals",
  S2: "🟠 S2 — Direct locale-suffixed field access without locale guard",
  S3: "🟡 S3 — Fallback pattern leaking wrong locale",
  S4: "🔵 S4 — Inline locale ternary (should use dictionary)",
};

let hasHighSeverity = false;

for (const sev of ["S1", "S2", "S3", "S4"] as Severity[]) {
  const items = bySeverity[sev];
  if (items.length === 0) {
    console.log(`${SEVERITY_LABELS[sev]}: ✅ 0 issues`);
    continue;
  }

  if (sev === "S1" || sev === "S2" || sev === "S3") hasHighSeverity = true;

  console.log(`\n${SEVERITY_LABELS[sev]}: ${items.length} issues`);
  console.log("-".repeat(50));

  // Group by file
  const byFile = new Map<string, Finding[]>();
  for (const item of items) {
    if (!byFile.has(item.file)) byFile.set(item.file, []);
    byFile.get(item.file)!.push(item);
  }

  for (const [file, findings] of byFile) {
    console.log(`  📄 ${file}`);
    for (const f of findings) {
      console.log(`     L${f.line}: ${f.reason}`);
      console.log(`         ${f.snippet.substring(0, 100)}`);
    }
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log(
  `Total: ${deduped.length} findings (S1:${bySeverity.S1.length} S2:${bySeverity.S2.length} S3:${bySeverity.S3.length} S4:${bySeverity.S4.length})`,
);

if (hasHighSeverity) {
  console.log(
    "❌ High-severity issues found (S1/S2/S3). Please fix before merging.",
  );
  process.exit(1);
} else if (bySeverity.S4.length > 0) {
  console.log(
    "⚠️  S4 warnings found. Consider migrating inline text to dictionaries.",
  );
  process.exit(0);
} else {
  console.log("✅ All i18n purity checks passed!");
  process.exit(0);
}
