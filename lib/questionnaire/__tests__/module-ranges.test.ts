// ============================================================
// Tests for Module Range Calculations
// ============================================================

import { describe, it, expect } from "vitest";
import {
  getModuleForIndex,
  getQuestionInfo,
  isModuleTransition,
  isChapterTransition,
  isBreathingMoment,
  getTotalQuestions,
} from "@/store/questionnaire-store";

describe("Module ranges (A + B + C)", () => {
  it("computes correct total questions", () => {
    expect(getTotalQuestions()).toBe(86); // 6 + 20 + 60
  });

  it("maps question indices to correct modules", () => {
    expect(getModuleForIndex(0)).toBe("A");
    expect(getModuleForIndex(5)).toBe("A");
    expect(getModuleForIndex(6)).toBe("B");
    expect(getModuleForIndex(25)).toBe("B");
    expect(getModuleForIndex(26)).toBe("C");
    expect(getModuleForIndex(85)).toBe("C");
  });

  it("detects module transitions at correct boundaries", () => {
    expect(isModuleTransition(4)).toBe(false);
    expect(isModuleTransition(5)).toBe(true); // A→B
    expect(isModuleTransition(6)).toBe(false);
    expect(isModuleTransition(25)).toBe(true); // B→C
    expect(isModuleTransition(26)).toBe(false);
  });

  it("chapter transitions disabled in v3.0 (IPIP-60 midpoint handled by micro-insight)", () => {
    // v3.0: chapter transitions are disabled — IPIP_CHAPTERS data was from IPIP-NEO-120.
    // The IPIP-60 midpoint is handled by the afterIPIP_ch2 micro-insight instead.
    expect(isChapterTransition(54)).toBe(false);
    expect(isChapterTransition(55)).toBe(false);
    expect(isChapterTransition(56)).toBe(false);
  });

  it("detects breathing moments at correct IPIP positions", () => {
    // 26 (C start) + 14 = 40, 26 + 44 = 70
    expect(isBreathingMoment(39)).toBe(false);
    expect(isBreathingMoment(40)).toBe(true); // 26 + 14
    expect(isBreathingMoment(70)).toBe(true); // 26 + 44
    expect(isBreathingMoment(41)).toBe(false);
  });

  it("returns Module A question info with correct item IDs", () => {
    const q0 = getQuestionInfo(0);
    expect(q0?.module).toBe("A");
    expect(q0?.itemId).toBe(1); // SJT scenario 1

    const q5 = getQuestionInfo(5);
    expect(q5?.module).toBe("A");
    expect(q5?.itemId).toBe(6); // SJT scenario 6
  });

  it("returns Module B question info with correct item IDs", () => {
    const q6 = getQuestionInfo(6);
    expect(q6?.module).toBe("B");

    const q25 = getQuestionInfo(25);
    expect(q25?.module).toBe("B");
  });

  it("returns Module C question info", () => {
    const q26 = getQuestionInfo(26);
    expect(q26?.module).toBe("C");

    const q85 = getQuestionInfo(85);
    expect(q85?.module).toBe("C");
  });
});
