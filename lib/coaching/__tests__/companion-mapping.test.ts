// ============================================================
// Tests for RIASEC ↔ Immersive companion mapping — used by the report
// portrait reveal and the coach system prompt. Guards the table's
// completeness/consistency and the defensive parsing of archetype codes.
// ============================================================

import { describe, it, expect } from "vitest";
import {
  COMPANION_BY_RIASEC,
  resolveDominantCompanion,
  type RiasecLetter,
} from "../companion-mapping";

const LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

describe("COMPANION_BY_RIASEC", () => {
  it("covers all six RIASEC letters with complete, unique companions", () => {
    const ids = new Set<string>();
    for (const letter of LETTERS) {
      const c = COMPANION_BY_RIASEC[letter];
      expect(c).toBeDefined();
      expect(c.id).toBeTruthy();
      expect(c.trait).toBeTruthy();
      expect(c.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      ids.add(c.id);
    }
    expect(ids.size).toBe(6); // no two letters share a companion
  });

  it("keeps portraitUrl consistent with the companion id", () => {
    // catches a typo where id and asset path drift apart
    for (const letter of LETTERS) {
      const c = COMPANION_BY_RIASEC[letter];
      expect(c.portraitUrl).toBe(`/immersive/characters/${c.id}.webp`);
    }
  });
});

describe("resolveDominantCompanion", () => {
  it("resolves the dominant letter of an archetype code", () => {
    expect(resolveDominantCompanion("RIA")?.id).toBe(COMPANION_BY_RIASEC.R.id);
    expect(resolveDominantCompanion("SEC")?.id).toBe(COMPANION_BY_RIASEC.S.id);
  });

  it("is case-insensitive on the leading letter", () => {
    expect(resolveDominantCompanion("ria")?.id).toBe(COMPANION_BY_RIASEC.R.id);
  });

  it("returns null for empty, nullish, or unparseable codes", () => {
    expect(resolveDominantCompanion(null)).toBeNull();
    expect(resolveDominantCompanion(undefined)).toBeNull();
    expect(resolveDominantCompanion("")).toBeNull();
    expect(resolveDominantCompanion("XYZ")).toBeNull(); // X is not a RIASEC letter
  });
});
