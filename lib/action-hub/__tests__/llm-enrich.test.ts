// ============================================================
// Tests for LLM Enrichment
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock callLLMStructured before importing llm-enrich
vi.mock("@/lib/ai/structured-output", () => ({
  callLLMStructured: vi.fn(),
}));

import { callLLMStructured } from "@/lib/ai/structured-output";
import {
  enrichActionPlan,
  applyEnrichment,
  type EnrichInput,
  type EnrichOutput,
} from "../llm-enrich";

const mockedCall = vi.mocked(callLLMStructured);

function makeInput(): EnrichInput {
  return {
    locale: "en",
    archetype: "R-enhancement",
    flowMoments: [
      {
        description: "Debugging a tricky bug late at night",
        activity: "analyzing",
        social: "alone",
        environment: "quiet",
      },
      {
        description: "Designing a poster for a friend",
        activity: "creating",
        social: "alone",
        environment: "quiet",
      },
      {
        description: "Teaching my cousin to code",
        activity: "teaching",
        social: "with_people",
        environment: "quiet",
      },
    ],
    flowDominance: {
      activity: null,
      social: "alone",
      environment: "quiet",
    },
    nonNegotiables: ["remote_work", "psych_safety", "learning_budget"],
    nonNegotiableLabels: {
      remote_work: "Remote or hybrid work",
      psych_safety: "Psychological safety",
      learning_budget: "Learning & development budget",
    },
    items: [
      {
        id: "item-1",
        title: "Apply for product roles",
        description: "Submit applications to 5 companies",
        category: "apply",
        matchedNonNegotiable: "remote_work",
        matchedFlowDimension: { social: "alone" },
        recommendationReason:
          "This respects your remote-work non-negotiable.",
        completionOutcome: "You will have a sharper application list.",
      },
      {
        id: "item-2",
        title: "Read about product discovery",
        description: "A book on research methods",
        category: "learn",
        matchedNonNegotiable: null,
        matchedFlowDimension: { social: "alone", environment: "quiet" },
        recommendationReason: "This fits your quiet solo focus.",
        completionOutcome: "You will close one learning gap.",
      },
    ],
  };
}

describe("enrichActionPlan", () => {
  beforeEach(() => {
    mockedCall.mockReset();
  });

  it("returns the LLM output when the call succeeds", async () => {
    const output: EnrichOutput = {
      enrichedItems: [
        {
          id: "item-1",
          rewrittenTitle: "Shortlist remote-first companies",
          rewrittenDescription:
            "Pick five remote product teams and apply where psychological safety is mentioned in their job descriptions.",
          rewrittenReason:
            "Remote-first companies respect the condition you ranked highest.",
          rewrittenOutcome:
            "You will have a sharper shortlist for real applications.",
          referencedFlow: null,
          referencedNonNeg: "remote_work",
        },
        {
          id: "item-2",
          rewrittenTitle: "Quiet-time discovery reading",
          rewrittenDescription:
            "Spend 30 quiet minutes alone with one research book each week — your flow signature rewards deep solo focus.",
          rewrittenReason:
            "This fits the quiet solo focus that showed up in your flow moments.",
          rewrittenOutcome:
            "You will close one knowledge gap without adding social pressure.",
          referencedFlow: "environment",
          referencedNonNeg: null,
        },
      ],
      flowThemes: ["deep solo focus", "teaching others"],
    };
    mockedCall.mockResolvedValueOnce(output);

    const result = await enrichActionPlan(makeInput());
    expect(result).toEqual(output);
  });

  it("returns null and swallows errors when the LLM fails", async () => {
    mockedCall.mockRejectedValueOnce(new Error("rate limit"));
    const result = await enrichActionPlan(makeInput());
    expect(result).toBeNull();
  });

  it("uses the action-plan-enrich task", async () => {
    mockedCall.mockResolvedValueOnce({
      enrichedItems: [
        {
          id: "item-1",
          rewrittenTitle: "t",
          rewrittenDescription: "d".repeat(15),
          rewrittenReason: "r".repeat(15),
          rewrittenOutcome: "o".repeat(15),
          referencedFlow: null,
          referencedNonNeg: null,
        },
      ],
      flowThemes: [],
    });
    await enrichActionPlan(makeInput());
    expect(mockedCall).toHaveBeenCalledOnce();
    expect(mockedCall.mock.calls[0][0]).toBe("action-plan-enrich");
  });

  it("instructs the LLM to respond in Chinese when locale is zh", async () => {
    mockedCall.mockResolvedValueOnce({
      enrichedItems: [
        {
          id: "item-1",
          rewrittenTitle: "测试",
          rewrittenDescription: "这是一个足够长的描述文案示例。",
          rewrittenReason: "这是一个足够长的推荐理由示例。",
          rewrittenOutcome: "这是一个足够长的完成收益示例。",
          referencedFlow: null,
          referencedNonNeg: null,
        },
      ],
      flowThemes: [],
    });
    const input = { ...makeInput(), locale: "zh" as const };
    await enrichActionPlan(input);
    const messages = mockedCall.mock.calls[0][1];
    const systemMsg = messages.find((m) => m.role === "system")!;
    expect(systemMsg.content).toContain("简体中文");
  });

  it("instructs the LLM to respond in Dutch when locale is nl", async () => {
    mockedCall.mockResolvedValueOnce({
      enrichedItems: [
        {
          id: "item-1",
          rewrittenTitle: "Kies remote teams",
          rewrittenDescription:
            "Kies vijf remote teams waar psychologische veiligheid zichtbaar is in de vacaturetekst.",
          rewrittenReason:
            "Deze stap respecteert je behoefte aan remote of hybride werk.",
          rewrittenOutcome:
            "Je hebt een gerichtere lijst met passende teams.",
          referencedFlow: null,
          referencedNonNeg: "remote_work",
        },
      ],
      flowThemes: ["rustige focus"],
    });
    const input = { ...makeInput(), locale: "nl" as const };
    await enrichActionPlan(input);
    const messages = mockedCall.mock.calls[0][1];
    const systemMsg = messages.find((m) => m.role === "system")!;
    expect(systemMsg.content).toContain("Nederlands");
    expect(systemMsg.content).toContain("kopieer geen Engelse zinnen");
  });

  it("drops Dutch enrich output when the structured result is English", async () => {
    mockedCall.mockResolvedValueOnce({
      enrichedItems: [
        {
          id: "item-1",
          rewrittenTitle: "Shortlist remote teams",
          rewrittenDescription:
            "We recommend that you explore this career direction because your values show autonomy and growth.",
          rewrittenReason: "This is English and should be rejected.",
          rewrittenOutcome: "This is also English and should be rejected.",
          referencedFlow: null,
          referencedNonNeg: "remote_work",
        },
      ],
      flowThemes: ["deep solo focus"],
    });
    const input = { ...makeInput(), locale: "nl" as const };
    const result = await enrichActionPlan(input);
    expect(result).toBeNull();
  });
});

describe("applyEnrichment", () => {
  it("returns the original items when enrichment is null", () => {
    const items = [
      { id: "a", title: "Original A", description: "desc A" },
      { id: "b", title: "Original B", description: "desc B" },
    ];
    expect(applyEnrichment(items, null)).toEqual(items);
  });

  it("merges enriched title/description by id", () => {
    const items = [
      {
        id: "a",
        title: "Original A",
        description: "desc A",
        recommendationReason: "reason A",
        completionOutcome: "outcome A",
      },
      {
        id: "b",
        title: "Original B",
        description: "desc B",
        recommendationReason: "reason B",
        completionOutcome: "outcome B",
      },
    ];
    const enrichment: EnrichOutput = {
      enrichedItems: [
        {
          id: "a",
          rewrittenTitle: "New A",
          rewrittenDescription: "new desc A",
          rewrittenReason: "new reason A",
          rewrittenOutcome: "new outcome A",
          referencedFlow: null,
          referencedNonNeg: null,
        },
      ],
      flowThemes: [],
    };
    const result = applyEnrichment(items, enrichment);
    expect(result[0].title).toBe("New A");
    expect(result[0].description).toBe("new desc A");
    expect(result[0].recommendationReason).toBe("new reason A");
    expect(result[0].completionOutcome).toBe("new outcome A");
    expect(result[1].title).toBe("Original B"); // untouched
    expect(result[1].recommendationReason).toBe("reason B");
  });

  it("preserves non-title fields on enriched items", () => {
    const items = [
      {
        id: "a",
        title: "Original",
        description: "desc",
        category: "learn",
        priority: 80,
      },
    ];
    const enrichment: EnrichOutput = {
      enrichedItems: [
        {
          id: "a",
          rewrittenTitle: "New",
          rewrittenDescription: "new desc with some content",
          rewrittenReason: "new reason with some content",
          rewrittenOutcome: "new outcome with some content",
          referencedFlow: null,
          referencedNonNeg: null,
        },
      ],
      flowThemes: [],
    };
    const result = applyEnrichment(items, enrichment);
    expect(result[0].category).toBe("learn");
    expect(result[0].priority).toBe(80);
  });
});
