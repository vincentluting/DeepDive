import { describe, expect, it } from "vitest";
import {
  buildEvalInputFromPayload,
  evaluateNarrative,
  extractNarrativeSegments,
} from "../narrative-eval";
import { NARRATIVE_EVAL_BASELINE_CASES } from "../narrative-eval-baseline";

describe("narrative-eval", () => {
  it("passes the shipped golden baseline cases", () => {
    for (const baselineCase of NARRATIVE_EVAL_BASELINE_CASES) {
      const result = evaluateNarrative(baselineCase);
      expect(result.passed).toBe(true);
    }
  });

  it("penalizes fluffy Barnum language", () => {
    const result = evaluateNarrative({
      id: "bad-profile",
      kind: "profile",
      locale: "en",
      title: "generic profile",
      segments: [
        {
          label: "identitySummary",
          text: "You have great potential and a unique journey. This means you are always growing, and this combination makes you exciting.",
        },
      ],
    });

    expect(result.passed).toBe(false);
    expect(result.metrics.antiBarnum?.score).toBeLessThan(50);
    expect(result.issues.some((issue) => issue.includes("antiBarnum"))).toBe(
      true,
    );
  });

  it("extracts report narrative segments from report JSON", () => {
    const segments = extractNarrativeSegments("report", {
      careerMatch: {
        summary: "Summary text",
        directions: [
          { whySuitable: "Why text", challenges: "Challenge text" },
          { whySuitable: "Second why", challenges: "" },
        ],
      },
      integration: {
        coreInsight: "Core insight",
        letterToUser: "Letter text",
      },
      careerPathway: {
        jobSearchStrategy: {
          positioning: "Positioning text",
          networkingTips: ["Tip one", "Tip two"],
        },
        actionPlan: {
          thrustNote: "Thrust note",
          week1: {
            tasks: [{ title: "Task title" }],
          },
        },
      },
    });

    expect(segments.map((segment) => segment.label)).toContain(
      "careerMatch.summary",
    );
    expect(segments.map((segment) => segment.label)).toContain(
      "integration.letterToUser",
    );
    expect(segments.map((segment) => segment.label)).toContain(
      "careerPathway.jobSearchStrategy.positioning",
    );
    expect(segments.map((segment) => segment.label)).toContain(
      "careerPathway.actionPlan.week1.tasks[0]",
    );
  });

  it("penalizes coercive coaching that offers no grounded contribution", () => {
    const input = buildEvalInputFromPayload({
      id: "coach-flat",
      kind: "coaching",
      title: "flat coaching",
      payload: [
        {
          role: "assistant",
          content:
            "You must accept this offer. The right answer is to optimize for security first.",
        },
      ],
      locale: "en",
    });

    const result = evaluateNarrative(input);
    expect(result.passed).toBe(false);
    expect(result.metrics.dialogic?.score).toBeLessThan(50);
  });

  it("accepts direct recommendations without forcing a question", () => {
    const input = buildEvalInputFromPayload({
      id: "coach-direct",
      kind: "coaching",
      title: "direct coaching",
      payload: [
        {
          role: "assistant",
          content:
            "My recommendation is to keep the offer open for one week because the visa constraint changes the risk. The next step is to ask HR for the sponsorship timeline, then compare it with your savings runway.",
        },
      ],
      locale: "en",
      expectations: {
        signalGroups: [],
        minMetricScores: { dialogic: 65 },
        minOverallScore: 0,
      },
    });

    const result = evaluateNarrative(input);
    expect(result.metrics.dialogic?.score).toBeGreaterThanOrEqual(65);
    expect(result.issues).not.toContain(
      "coaching output requires a question for this scenario",
    );
  });

  it("penalizes coaching responses with too many questions", () => {
    const input = buildEvalInputFromPayload({
      id: "coach-interrogation",
      kind: "coaching",
      title: "question-heavy coaching",
      payload: [
        {
          role: "assistant",
          content:
            "What feels hard? Which part matters? What would you choose? Where do you feel stuck? What happens next?",
        },
      ],
      locale: "en",
      expectations: {
        signalGroups: [],
        minMetricScores: { dialogic: 65 },
        minOverallScore: 0,
      },
    });

    const result = evaluateNarrative(input);
    expect(result.metrics.dialogic?.score).toBeLessThan(65);
  });
});
