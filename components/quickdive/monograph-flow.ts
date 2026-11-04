export type MonographPhase =
  | "intro"
  | "playing"
  | "values-intro"
  | "values-playing"
  | "avatar"
  | "generating"
  | "reveal";

export interface MonographChapter {
  id:
    | "overture"
    | "work-signals"
    | "values-compass"
    | "avatar-lens"
    | "meaning-making"
    | "first-map";
  number: "01" | "02" | "03" | "04" | "05" | "06";
  labelKey: string;
  shortLabelKey: string;
}

export const MONOGRAPH_CHAPTERS: readonly MonographChapter[] = [
  {
    id: "overture",
    number: "01",
    labelKey: "monographChapterOverture",
    shortLabelKey: "monographChapterOvertureShort",
  },
  {
    id: "work-signals",
    number: "02",
    labelKey: "monographChapterWorkSignals",
    shortLabelKey: "monographChapterWorkSignalsShort",
  },
  {
    id: "values-compass",
    number: "03",
    labelKey: "monographChapterValuesCompass",
    shortLabelKey: "monographChapterValuesCompassShort",
  },
  {
    id: "avatar-lens",
    number: "04",
    labelKey: "monographChapterAvatarLens",
    shortLabelKey: "monographChapterAvatarLensShort",
  },
  {
    id: "meaning-making",
    number: "05",
    labelKey: "monographChapterMeaningMaking",
    shortLabelKey: "monographChapterMeaningMakingShort",
  },
  {
    id: "first-map",
    number: "06",
    labelKey: "monographChapterFirstMap",
    shortLabelKey: "monographChapterFirstMapShort",
  },
];

const PHASE_TO_CHAPTER: Record<MonographPhase, MonographChapter["id"]> = {
  intro: "overture",
  playing: "work-signals",
  "values-intro": "values-compass",
  "values-playing": "values-compass",
  avatar: "avatar-lens",
  generating: "meaning-making",
  reveal: "first-map",
};

export function getMonographChapterForPhase(
  phase: MonographPhase,
): MonographChapter {
  const chapterId = PHASE_TO_CHAPTER[phase];
  return (
    MONOGRAPH_CHAPTERS.find((chapter) => chapter.id === chapterId) ??
    MONOGRAPH_CHAPTERS[0]
  );
}

export function getMonographProgress({
  phase,
  questionIndex = 0,
  totalQuestions = 1,
}: {
  phase: MonographPhase;
  questionIndex?: number;
  totalQuestions?: number;
}) {
  const safeTotal = Math.max(1, totalQuestions);
  const current =
    phase === "intro" || phase === "values-intro" || phase === "avatar"
      ? 0
      : Math.min(Math.max(questionIndex + 1, 1), safeTotal);
  const percent =
    current === 0 ? 0 : Math.round(Math.min(100, (current / safeTotal) * 100));

  return {
    current,
    total: safeTotal,
    percent,
    label: current === 0 ? `0 / ${safeTotal}` : `${current} / ${safeTotal}`,
  };
}
