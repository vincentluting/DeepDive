import { describe, expect, test } from "vitest";

import {
  getMonographChapterForPhase,
  getMonographProgress,
  MONOGRAPH_CHAPTERS,
} from "../monograph-flow";

describe("Quick Dive monograph flow", () => {
  test("defines the six pre-result chapters in order", () => {
    expect(MONOGRAPH_CHAPTERS.map((chapter) => chapter.id)).toEqual([
      "overture",
      "work-signals",
      "values-compass",
      "avatar-lens",
      "meaning-making",
      "first-map",
    ]);
  });

  test("maps each classic phase to the correct monograph chapter", () => {
    expect(getMonographChapterForPhase("intro").id).toBe("overture");
    expect(getMonographChapterForPhase("playing").id).toBe("work-signals");
    expect(getMonographChapterForPhase("values-intro").id).toBe(
      "values-compass",
    );
    expect(getMonographChapterForPhase("values-playing").id).toBe(
      "values-compass",
    );
    expect(getMonographChapterForPhase("avatar").id).toBe("avatar-lens");
    expect(getMonographChapterForPhase("generating").id).toBe(
      "meaning-making",
    );
    expect(getMonographChapterForPhase("reveal").id).toBe("first-map");
  });

  test("formats bounded question progress for work-signal and values phases", () => {
    expect(
      getMonographProgress({
        phase: "playing",
        questionIndex: 11,
        totalQuestions: 30,
      }),
    ).toEqual({
      current: 12,
      total: 30,
      percent: 40,
      label: "12 / 30",
    });

    expect(
      getMonographProgress({
        phase: "values-playing",
        questionIndex: 12,
        totalQuestions: 8,
      }),
    ).toEqual({
      current: 8,
      total: 8,
      percent: 100,
      label: "8 / 8",
    });
  });
});
