import { describe, it, expect } from "vitest";
import enRoot from "../dictionaries/en.json";
import zhRoot from "../dictionaries/zh.json";
import enQd from "../dictionaries/en/quickdive.json";
import zhQd from "../dictionaries/zh/quickdive.json";
import jaQd from "../dictionaries/ja/quickdive.json";
import itQd from "../dictionaries/it/quickdive.json";
import ruQd from "../dictionaries/ru/quickdive.json";
import ptQd from "../dictionaries/pt/quickdive.json";
import nlQd from "../dictionaries/nl/quickdive.json";
import deQd from "../dictionaries/de/quickdive.json";
import koQd from "../dictionaries/ko/quickdive.json";
import frQd from "../dictionaries/fr/quickdive.json";
import esQd from "../dictionaries/es/quickdive.json";

// 2026-05-02 user testing surfaced a UX honesty bug:
// retakeConfirm copy said "This will clear your previous results"
// but /api/quickdive/reset only resets completion state — historical
// QuickDiveResult rows AND CareerReport rows are preserved.
// This test locks in the corrected copy so it cannot regress to the
// misleading version.

type WithRetake = {
  retakeConfirm?: string;
  retakeConfirmYes?: string;
};

function pluck(dict: unknown): WithRetake {
  // Root dictionaries embed the keys under a quickdive namespace; per-locale
  // quickdive.json files put them under a single top-level namespace too.
  // Walk the object once and grab the first retakeConfirm we find.
  const out: WithRetake = {};
  function walk(node: unknown): void {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;
    if (typeof obj.retakeConfirm === "string" && !out.retakeConfirm) {
      out.retakeConfirm = obj.retakeConfirm;
    }
    if (typeof obj.retakeConfirmYes === "string" && !out.retakeConfirmYes) {
      out.retakeConfirmYes = obj.retakeConfirmYes;
    }
    for (const v of Object.values(obj)) walk(v);
  }
  walk(dict);
  return out;
}

const localeDicts: Array<[string, unknown]> = [
  ["en (root)", enRoot],
  ["zh (root)", zhRoot],
  ["en/quickdive", enQd],
  ["zh/quickdive", zhQd],
  ["ja/quickdive", jaQd],
  ["it/quickdive", itQd],
  ["ru/quickdive", ruQd],
  ["pt/quickdive", ptQd],
  ["nl/quickdive", nlQd],
  ["de/quickdive", deQd],
  ["ko/quickdive", koQd],
  ["fr/quickdive", frQd],
  ["es/quickdive", esQd],
];

describe("destructive copy honesty: retakeConfirm", () => {
  it.each(localeDicts)(
    "%s defines retakeConfirm + retakeConfirmYes",
    (_label, dict) => {
      const { retakeConfirm, retakeConfirmYes } = pluck(dict);
      expect(retakeConfirm).toBeTruthy();
      expect(retakeConfirmYes).toBeTruthy();
    },
  );

  // Words that imply destruction of historical data. Reset only resets the
  // completion flag and client-side answer state — past CareerReport rows
  // and QuickDiveResult rows are preserved (intentionally, for research
  // longitudinal data and user history). Copy must not promise destruction.
  const forbiddenByLocale: Record<string, RegExp[]> = {
    en: [
      /\bclear\s+your\b/i,
      /\bdelete\b/i,
      /\berase\b/i,
      /\bwipe\b/i,
      /\bremove\s+your\s+results\b/i,
    ],
    zh: [/清除/, /删除/, /抹除/, /销毁/],
    ja: [/クリアされ/, /削除され/, /消去/],
    it: [/cancellerà\s+i?\s*[Ss]uoi\s+risultati/i, /eliminerà/i],
    ru: [/очистит\s+ваши\s+результаты/i, /удалит\s+ваши\s+результаты/i],
    pt: [/apagará\s+seus\s+resultados/i, /excluirá\s+seus\s+resultados/i],
    nl: [/wist\s+je\s+vorige\s+resultaten/i, /verwijdert\s+je\s+resultaten/i],
    de: [
      /löscht\s+Ihre\s+vorherigen\s+Ergebnisse/i,
      /entfernt\s+Ihre\s+Ergebnisse/i,
    ],
    ko: [/이전\s*결과가?\s*초기화/, /이전\s*결과를?\s*삭제/],
    fr: [/effacera\s+vos\s+résultats/i, /supprimera\s+vos\s+résultats/i],
    es: [/borrará\s+sus\s+resultados/i, /eliminará\s+sus\s+resultados/i],
  };

  function localeOf(label: string): string {
    if (label.startsWith("en")) return "en";
    if (label.startsWith("zh")) return "zh";
    if (label.startsWith("ja")) return "ja";
    if (label.startsWith("it")) return "it";
    if (label.startsWith("ru")) return "ru";
    if (label.startsWith("pt")) return "pt";
    if (label.startsWith("nl")) return "nl";
    if (label.startsWith("de")) return "de";
    if (label.startsWith("ko")) return "ko";
    if (label.startsWith("fr")) return "fr";
    if (label.startsWith("es")) return "es";
    return "en";
  }

  it.each(localeDicts)(
    "%s retakeConfirm contains no destructive promises",
    (label, dict) => {
      const { retakeConfirm } = pluck(dict);
      expect(retakeConfirm).toBeTruthy();
      const locale = localeOf(label);
      const patterns = forbiddenByLocale[locale] ?? [];
      for (const re of patterns) {
        expect(
          retakeConfirm,
          `[${label}] retakeConfirm "${retakeConfirm}" matches forbidden ${re}`,
        ).not.toMatch(re);
      }
    },
  );

  it("English retakeConfirm signals preservation of past reports", () => {
    const { retakeConfirm } = pluck(enRoot);
    // Soft assertion: copy should contain "history" or "stay" or "remain"
    // — words that signal the past report is kept, not destroyed.
    expect(retakeConfirm).toMatch(/history|stay|remain|kept|saved/i);
  });

  it("Chinese retakeConfirm signals preservation of past reports", () => {
    const { retakeConfirm } = pluck(zhRoot);
    expect(retakeConfirm).toMatch(/历史|保留|保存/);
  });
});
