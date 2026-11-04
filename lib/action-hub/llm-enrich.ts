// ============================================================
// LLM Enrichment — Personal Plan tier only
//
// Takes algorithm-ranked ActionItems + exercise context and asks
// an LLM to rewrite each title/description and next-step guidance in warm
// second-person prose that EXPLICITLY references the user's flow tag or
// non-negotiable. Output is strict JSON validated by Zod.
//
// Always returns null on any failure so the caller can fall back
// to the algorithmic copy. LLM enrichment is a "nice-to-have"
// polish layer, never a critical path.
//
// Budget:  ~800 input tokens + ~1500 output tokens per call
// Target:  < 8s latency / < $0.002 per call (gpt-4o-mini)
// ============================================================

// @language-guard-exempt: prompt hard-enforces locale via "Respond entirely in {{locale}}" and Zod schema validates output structure; there's no streaming delta to observe and enriched items are strictly rewritten from locale-consistent algorithm seeds.

import { z } from "zod/v4";
import { callLLMStructured } from "@/lib/ai/structured-output";
import { enforceOutputLocale } from "@/lib/report-generation/language-guard";
import type { RankedAction } from "./priority-ranker";
import type {
  FlowActivityTag,
  FlowSocialTag,
  FlowEnvironmentTag,
  FlowMomentEntry,
  NonNegotiablesResult,
} from "./guided-exercises";

// ── Output schema (strict) ─────────────────────────────────

const EnrichedItemSchema = z.object({
  id: z.string().min(1),
  rewrittenTitle: z.string().min(3).max(120),
  rewrittenDescription: z.string().min(10).max(320),
  rewrittenReason: z.string().min(10).max(240),
  rewrittenOutcome: z.string().min(10).max(240),
  referencedFlow: z.enum(["activity", "social", "environment"]).nullable(),
  referencedNonNeg: z.string().nullable(),
});

const EnrichOutputSchema = z.object({
  enrichedItems: z.array(EnrichedItemSchema).min(1).max(20),
  flowThemes: z.array(z.string().min(2).max(40)).max(5).default([]),
});

export type EnrichedItem = z.infer<typeof EnrichedItemSchema>;
export type EnrichOutput = z.infer<typeof EnrichOutputSchema>;
export type EnrichLocale = "en" | "zh" | "nl";

// ── Input type ─────────────────────────────────────────────

export interface EnrichInput {
  locale: EnrichLocale;
  archetype: string | null;
  flowMoments: FlowMomentEntry[];
  flowDominance: {
    activity: FlowActivityTag | null;
    social: FlowSocialTag | null;
    environment: FlowEnvironmentTag | null;
  };
  nonNegotiables: NonNegotiablesResult["selected"];
  /** Human-readable labels for each non-negotiable ID, already resolved for this locale */
  nonNegotiableLabels: Record<string, string>;
  /** Algorithm-ranked items, each with a stable id (generate upstream with crypto.randomUUID) */
  items: Array<
    Pick<
      RankedAction,
      | "title"
      | "description"
      | "category"
      | "matchedNonNegotiable"
      | "matchedFlowDimension"
    > & {
      id: string;
      recommendationReason: string;
      completionOutcome: string;
    }
  >;
}

// ── Main entry ─────────────────────────────────────────────

/**
 * Enrich a set of algorithm-ranked items with LLM-rewritten copy.
 * Returns null on any LLM failure — callers should fall back to the
 * untouched algorithmic copy.
 */
export async function enrichActionPlan(
  input: EnrichInput,
): Promise<EnrichOutput | null> {
  try {
    const messages = buildMessages(input);
    // @language-guard-exempt: language directive is hardcoded per-locale
    // inside buildMessages (see LANGUAGE_DIRECTIVE at line ~120), so the
    // prompt itself already constrains the output language.
    const result = await callLLMStructured(
      "action-plan-enrich",
      messages,
      EnrichOutputSchema,
    );
    let guardFailed = false;
    const guarded = await enforceOutputLocale(result, input.locale, {
      taskId: "action-plan-enrich",
      skipKeys: ["referencedFlow", "referencedNonNeg"],
      sanitize: (output) => {
        guardFailed = true;
        return output;
      },
    });
    return guardFailed ? null : guarded;
  } catch (err) {
    // Graceful degradation — never bubble LLM errors to the user
    console.warn(
      "[action-hub/llm-enrich] enrichment failed, falling back to algorithm:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ── Prompt construction ───────────────────────────────────

function buildMessages(input: EnrichInput): Array<{
  role: "system" | "user";
  content: string;
}> {
  const {
    locale,
    archetype,
    flowMoments,
    flowDominance,
    nonNegotiables,
    nonNegotiableLabels,
    items,
  } = input;

  // LLM-facing system directive — not user-facing copy, hardcoded by design.
  const LANGUAGE_DIRECTIVE: Record<EnrichLocale, string> = {
    en: "Respond entirely in English.",
    zh: "请完全用简体中文回复。",
    nl: "Antwoord volledig in het Nederlands. Vertaal alle gebruikersinput, flow-momenten en labels intern naar natuurlijk Nederlands; kopieer geen Engelse zinnen naar de uitvoervelden.",
  };
  const languageDirective = LANGUAGE_DIRECTIVE[locale];

  const systemPrompt = [
    `You are a senior career coach helping a user translate their personality profile into a concrete action plan.`,
    `Your job: rewrite each provided action item's title and description so it feels personally tailored.`,
    ``,
    `HARD RULES (violate any → task failed):`,
    `1. Every rewrittenDescription MUST reference at least one of the user's flow tags OR non-negotiables.`,
    `2. Do NOT invent new action items — only rewrite the provided ones. Preserve each item's 'id'.`,
    `3. Keep rewrittenTitle under 12 words; keep rewrittenDescription under 50 words.`,
    `4. rewrittenReason answers "why this is the next step now"; rewrittenOutcome answers "what changes after completing it".`,
    `5. Keep rewrittenReason and rewrittenOutcome concrete, calm, and under 28 words each.`,
    `6. Tone: warm, specific, second-person ("you"). No corporate jargon, no "leverage", "synergy", "unlock your potential".`,
    `7. ${languageDirective}`,
    `8. Output VALID JSON matching the schema exactly. No markdown, no commentary.`,
    ``,
    `SCHEMA:`,
    `{`,
    `  "enrichedItems": [{`,
    `    "id": "<original id>",`,
    `    "rewrittenTitle": "<under 12 words>",`,
    `    "rewrittenDescription": "<under 50 words, must reference at least one flow tag or non-neg label>",`,
    `    "rewrittenReason": "<why this should be the next step now>",`,
    `    "rewrittenOutcome": "<what the user gains after completing it>",`,
    `    "referencedFlow": "activity" | "social" | "environment" | null,`,
    `    "referencedNonNeg": "<non-neg id>" | null`,
    `  }],`,
    `  "flowThemes": ["<2-5 word theme>", ...]  // 2-3 themes across the 3 flow moments`,
    `}`,
  ].join("\n");

  const flowSummary = flowMoments
    .map(
      (m, i) =>
        `  ${i + 1}. "${m.description}" (activity: ${m.activity}, social: ${m.social}, env: ${m.environment})`,
    )
    .join("\n");

  const nonNegSummary = nonNegotiables
    .map((id, i) => `  #${i + 1} ${id} — ${nonNegotiableLabels[id] ?? id}`)
    .join("\n");

  const itemsSummary = items
    .map(
      (it) =>
        `  - id: ${it.id}\n    title: ${it.title}\n    category: ${it.category}\n    currentReason: ${it.recommendationReason}\n    currentOutcome: ${it.completionOutcome}${it.matchedNonNegotiable ? `\n    matchedNonNeg: ${it.matchedNonNegotiable}` : ""}${it.matchedFlowDimension && Object.keys(it.matchedFlowDimension).length > 0 ? `\n    matchedFlow: ${JSON.stringify(it.matchedFlowDimension)}` : ""}`,
    )
    .join("\n");

  const userPrompt = [
    `USER PROFILE`,
    archetype ? `Archetype: ${archetype}` : `Archetype: (not set)`,
    ``,
    `FLOW MOMENTS (user felt most engaged when):`,
    flowSummary,
    `Dominant flow signature: activity=${flowDominance.activity ?? "—"}, social=${flowDominance.social ?? "—"}, environment=${flowDominance.environment ?? "—"}`,
    ``,
    `NON-NEGOTIABLES (ranked; #1 = hardest deal-breaker):`,
    nonNegSummary,
    ``,
    `ITEMS TO REWRITE (keep ids intact):`,
    itemsSummary,
    ``,
    `Now produce the JSON.`,
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

// ── Apply enriched output to ranked items ─────────────────

/**
 * Merge LLM-enriched fields back onto the ranked items, matching by id.
 * Items whose id is not in the enrichment result keep their original
   * copy/guidance. Returns a new array; does not mutate inputs.
 */
export function applyEnrichment<
  T extends {
    id: string;
    title: string;
    description: string;
    recommendationReason?: string | null;
    completionOutcome?: string | null;
  },
>(items: T[], enrichment: EnrichOutput | null): T[] {
  if (!enrichment) return items;
  const byId = new Map(enrichment.enrichedItems.map((e) => [e.id, e]));
  return items.map((item) => {
    const enriched = byId.get(item.id);
    if (!enriched) return item;
    return {
      ...item,
      title: enriched.rewrittenTitle,
      description: enriched.rewrittenDescription,
      recommendationReason: enriched.rewrittenReason,
      completionOutcome: enriched.rewrittenOutcome,
    };
  });
}
