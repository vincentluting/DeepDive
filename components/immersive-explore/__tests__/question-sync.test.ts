// ============================================================
// Immersive Explore — Question Text Sync Tests
// ============================================================
// Guards against drift between Quick Dive source-of-truth and
// Immersive Dive narrative-embedded question text.
//
// - Ch.1-6 questions (id 1-30) must match MINI_IP_ITEMS verbatim
// - Ch.7 questions (twiviItemId) must match DDVQ21_ITEMS verbatim
//
// Verbatim = byte-exact (including hyphens, punctuation, case).
// If this test fails, either:
//   (a) Sync the immersive question text to the source, OR
//   (b) If the source was updated, sync the immersive prose too.
// DO NOT loosen this test (e.g., normalize hyphens) — the whole
// point is to catch silent drift.
// ============================================================

import { describe, it, expect } from "vitest";
import { IMMERSIVE_QUESTIONS } from "../data";
import { MINI_IP_ITEMS } from "@/lib/assessment/mini-ip/items";
import { DDVQ21_ITEMS } from "@/lib/questionnaire/module-b-ddvq21";

describe("Immersive Dive ↔ Quick Dive question text sync", () => {
  describe("Ch.1-6: Mini-IP RIASEC items (30 questions)", () => {
    const riasecQuestions = IMMERSIVE_QUESTIONS.filter((q) => q.riasec);

    it("covers all 30 Mini-IP items", () => {
      expect(riasecQuestions).toHaveLength(30);
      expect(MINI_IP_ITEMS).toHaveLength(30);
    });

    // miniIpCode ("R3", "C4", etc.) → (dimension, sub-index 1-5)
    // MINI_IP_ITEMS are interleaved R-I-A-S-E-C; filter by scale and take (n-1)th.
    it.each(
      IMMERSIVE_QUESTIONS.filter((q) => q.riasec).map((q) => [q.miniIpCode, q]),
    )("miniIpCode=%s text matches MINI_IP_ITEMS verbatim", (code, question) => {
      const match = /^([RIASEC])(\d+)$/.exec(code as string);
      expect(match, `invalid miniIpCode: ${code}`).not.toBeNull();
      const [, scale, numStr] = match!;
      const subIndex = Number(numStr) - 1;
      const sameScale = MINI_IP_ITEMS.filter((it) => it.riasecScale === scale);
      const source = sameScale[subIndex];
      expect(source, `Mini-IP ${code} not found`).toBeDefined();
      expect(question.miniIpItem).toBe(source!.textEn);
    });
  });

  describe("Ch.7: TwIVI value items (8 questions)", () => {
    const valueQuestions = IMMERSIVE_QUESTIONS.filter(
      (q) => q.twiviItemId !== undefined,
    );

    it("covers exactly 8 TwIVI items", () => {
      expect(valueQuestions).toHaveLength(8);
    });

    it.each(
      IMMERSIVE_QUESTIONS.filter((q) => q.twiviItemId !== undefined).map(
        (q) => [q.twiviItemId, q],
      ),
    )(
      "TwIVI item id=%i miniIpItem matches DDVQ21_ITEMS verbatim",
      (twiviId, question) => {
        const source = DDVQ21_ITEMS.find((it) => it.id === twiviId);
        expect(source, `DDVQ21 item id=${twiviId} not found`).toBeDefined();
        expect(question.miniIpItem).toBe(source!.text.en);
      },
    );
  });
});
