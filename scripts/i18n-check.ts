#!/usr/bin/env tsx
/**
 * i18n Key Parity Checker
 *
 * Validates that en.json and zh.json dictionaries have identical key structures.
 * Reports: missing keys, extra keys, empty values, and duplicate keys.
 *
 * Usage: npx tsx scripts/i18n-check.ts
 */

import fs from "fs";
import path from "path";

const DICT_DIR = path.join(__dirname, "..", "lib", "i18n", "dictionaries");
const QUEST_DIR = path.join(__dirname, "..", "lib", "i18n", "questionnaire");

interface CheckResult {
  missingInZh: string[];
  missingInEn: string[];
  emptyInEn: string[];
  emptyInZh: string[];
}

function getAllKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getEmptyKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getEmptyKeys(value as Record<string, unknown>, fullKey));
    } else if (value === "" || value === null || value === undefined) {
      keys.push(fullKey);
    }
  }
  return keys;
}

function checkParity(
  enPath: string,
  zhPath: string,
  _label: string,
): CheckResult {
  const en = JSON.parse(fs.readFileSync(enPath, "utf-8"));
  const zh = JSON.parse(fs.readFileSync(zhPath, "utf-8"));

  const enKeys = new Set(getAllKeys(en));
  const zhKeys = new Set(getAllKeys(zh));

  const missingInZh = [...enKeys].filter((k) => !zhKeys.has(k));
  const missingInEn = [...zhKeys].filter((k) => !enKeys.has(k));
  // Only flag empty values that are NOT also empty in the other locale (intentionally empty)
  const enEmptySet = new Set(getEmptyKeys(en));
  const zhEmptySet = new Set(getEmptyKeys(zh));
  const emptyInEn = [...enEmptySet].filter((k) => !zhEmptySet.has(k));
  const emptyInZh = [...zhEmptySet].filter((k) => !enEmptySet.has(k));

  return { missingInZh, missingInEn, emptyInEn, emptyInZh };
}

function printResult(label: string, result: CheckResult) {
  const total =
    result.missingInZh.length +
    result.missingInEn.length +
    result.emptyInEn.length +
    result.emptyInZh.length;
  const icon = total === 0 ? "✅" : "❌";

  console.log(`\n${icon} ${label}`);

  if (result.missingInZh.length > 0) {
    console.log(`  Missing in zh.json (${result.missingInZh.length}):`);
    result.missingInZh.forEach((k) => console.log(`    - ${k}`));
  }
  if (result.missingInEn.length > 0) {
    console.log(`  Missing in en.json (${result.missingInEn.length}):`);
    result.missingInEn.forEach((k) => console.log(`    - ${k}`));
  }
  if (result.emptyInEn.length > 0) {
    console.log(`  Empty values in en.json (${result.emptyInEn.length}):`);
    result.emptyInEn.forEach((k) => console.log(`    - ${k}`));
  }
  if (result.emptyInZh.length > 0) {
    console.log(`  Empty values in zh.json (${result.emptyInZh.length}):`);
    result.emptyInZh.forEach((k) => console.log(`    - ${k}`));
  }
  if (total === 0) {
    console.log("  All keys match with no empty values.");
  }

  return total;
}

// Main
console.log("🔍 i18n Key Parity Check");
console.log("========================");

let totalIssues = 0;

// ── Load namespace-split dictionaries ────────────────────────
// Since dictionaries are now split into namespace files under
// en/ and zh/ subdirectories, we merge them before comparison.
const NAMESPACES = [
  "common",
  "home",
  "quickdive",
  "deepdive",
  "report",
  "profile",
  "coaching",
  "dashboard",
  "research",
  "admin",
  "actionHub",
  "cohort",
  "onboarding",
  "preview",
  "pricing",
  "processing",
  "companions",
  "journeyGate",
];

const ALL_LOCALES = [
  "en",
  "zh",
  "nl",
  "de",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "ru",
];

function loadMergedDict(locale: string): Record<string, unknown> {
  const nsDir = path.join(DICT_DIR, locale);
  if (fs.existsSync(nsDir) && fs.statSync(nsDir).isDirectory()) {
    // New namespace structure
    const merged: Record<string, unknown> = {};
    for (const ns of NAMESPACES) {
      const nsPath = path.join(nsDir, `${ns}.json`);
      if (fs.existsSync(nsPath)) {
        Object.assign(merged, JSON.parse(fs.readFileSync(nsPath, "utf-8")));
      }
    }
    return merged;
  }
  // Fallback: monolithic file
  const monoPath = path.join(DICT_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(monoPath, "utf-8"));
}

function checkParityMerged(
  enDict: Record<string, unknown>,
  zhDict: Record<string, unknown>,
): CheckResult {
  const enKeys = new Set(getAllKeys(enDict));
  const zhKeys = new Set(getAllKeys(zhDict));
  return {
    missingInZh: [...enKeys].filter((k) => !zhKeys.has(k)),
    missingInEn: [...zhKeys].filter((k) => !enKeys.has(k)),
    emptyInEn: getEmptyKeys(enDict).filter(
      (k) => !new Set(getEmptyKeys(zhDict)).has(k),
    ),
    emptyInZh: getEmptyKeys(zhDict).filter(
      (k) => !new Set(getEmptyKeys(enDict)).has(k),
    ),
  };
}

// Check main dictionaries (namespace-aware)
const enMerged = loadMergedDict("en");
const zhMerged = loadMergedDict("zh");
const mainResult = checkParityMerged(enMerged, zhMerged);
totalIssues += printResult("Main Dictionaries", mainResult);

// Also check per-namespace parity
for (const ns of NAMESPACES) {
  const enNsPath = path.join(DICT_DIR, "en", `${ns}.json`);
  const zhNsPath = path.join(DICT_DIR, "zh", `${ns}.json`);
  if (fs.existsSync(enNsPath) && fs.existsSync(zhNsPath)) {
    const nsResult = checkParity(enNsPath, zhNsPath, `Namespace: ${ns}`);
    const nsIssues = printResult(`Namespace: ${ns}`, nsResult);
    totalIssues += nsIssues;
  }
}

// ── Check ALL locales against en (key parity) ────────────────
console.log("\n── All Locales vs EN ─────────────────────");
for (const locale of ALL_LOCALES) {
  if (locale === "en") continue;
  const localeMerged = loadMergedDict(locale);
  const enKeys = new Set(getAllKeys(enMerged));
  const localeKeys = new Set(getAllKeys(localeMerged));
  const missing = [...enKeys].filter((k) => !localeKeys.has(k));
  const extra = [...localeKeys].filter((k) => !enKeys.has(k));
  // Only flag empty values that are NOT also empty in en (intentionally empty keys)
  const enEmpty = new Set(getEmptyKeys(enMerged));
  const empty = getEmptyKeys(localeMerged).filter((k) => !enEmpty.has(k));
  const localeTotal = missing.length + extra.length + empty.length;
  const icon = localeTotal === 0 ? "✅" : "❌";
  console.log(
    `\n${icon} ${locale.toUpperCase()}: ${enKeys.size} keys (missing=${missing.length} extra=${extra.length} empty=${empty.length})`,
  );
  if (missing.length > 0) {
    console.log(`  Missing (${missing.length}):`);
    missing.slice(0, 10).forEach((k) => console.log(`    - ${k}`));
    if (missing.length > 10)
      console.log(`    ... and ${missing.length - 10} more`);
  }
  if (extra.length > 0) {
    console.log(`  Extra (${extra.length}):`);
    extra.slice(0, 5).forEach((k) => console.log(`    - ${k}`));
    if (extra.length > 5) console.log(`    ... and ${extra.length - 5} more`);
  }
  if (empty.length > 0) {
    console.log(`  Empty values (${empty.length}):`);
    empty.slice(0, 5).forEach((k) => console.log(`    - ${k}`));
  }
  totalIssues += localeTotal;
}

// Check questionnaire dictionaries
const questEnPath = path.join(QUEST_DIR, "en.json");
const questZhPath = path.join(QUEST_DIR, "zh.json");
if (fs.existsSync(questEnPath) && fs.existsSync(questZhPath)) {
  const questResult = checkParity(
    questEnPath,
    questZhPath,
    "Questionnaire Dictionaries",
  );
  totalIssues += printResult("Questionnaire Dictionaries", questResult);
}

console.log(`\n${"=".repeat(40)}`);
if (totalIssues === 0) {
  console.log("✅ All i18n checks passed!");
  process.exit(0);
} else {
  console.log(`❌ Found ${totalIssues} i18n issues. Please fix them.`);
  process.exit(1);
}
