#!/usr/bin/env npx tsx
// ============================================================
// Soul Call vs Legacy: Side-by-Side Quality Comparison
//
// Uses mock assessment data (no DB needed) to compare:
//   A) New "soul call" mode (1 unified LLM call, creative prompt)
//   B) Legacy mode (2 parallel LLM calls, structured prompt)
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/soul-call-compare.ts [en|zh]
//
// Output: prints both results for blind review
// ============================================================

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY must be set (via .env.local)");
  process.exit(1);
}

import { buildExtremeAssessment } from "../lib/report-generation/__tests__/fixtures/mock-assessment-extreme";
import { computeProfileAlgorithm } from "../lib/profile-generation/profile-algorithm";
import { generateProfile } from "../lib/profile-generation/generate-profile";
import { computeNarrativeSeedpoints } from "../lib/profile-generation/narrative-seedpoints";

const locale = (process.argv[2] ?? "en") as "en" | "zh";
console.log(
  `\n🔬 Running Soul Call vs Legacy comparison (locale: ${locale})\n`,
);

async function main() {
  // Build test data
  const assessment = buildExtremeAssessment();
  const algo = computeProfileAlgorithm(assessment);
  const profile = generateProfile(assessment, undefined, algo);
  const { archetypeContent: _, ...algoSnapshot } = algo;
  const { seedpoints, dominantTheme } = computeNarrativeSeedpoints(
    profile,
    algoSnapshot,
  );

  console.log(
    `📊 Profile: ${assessment.archetype.label_en} (${assessment.archetype.code})`,
  );
  console.log(`🌱 Seedpoints: ${seedpoints.length}`);
  console.log(`📖 Theme: ${dominantTheme[locale === "zh" ? "zh" : "en"]}\n`);

  // Use callLLM from model-router (handles provider routing, retries, etc.)
  const { callLLM } = await import("../lib/ai/model-router");

  // Build prompts using the same logic as the production code
  const { getSystemPreamble } =
    await import("../lib/report-generation/common-rules");
  const preamble = getSystemPreamble(locale);

  // ── Build shared data block ──
  const { SCHWARTZ_VALUE_LABELS, BIG_FIVE_LABELS } =
    await import("../lib/scoring/constants");
  const { ARCHETYPES } = await import("../lib/content");

  const lk = locale === "zh" ? "zh" : "en";
  const archContent = ARCHETYPES[assessment.archetype.code];
  const top3Labels = (profile.schwartzAnchors?.top3 ?? [])
    .slice(0, 3)
    .map(
      (k: string) =>
        SCHWARTZ_VALUE_LABELS[k as keyof typeof SCHWARTZ_VALUE_LABELS]?.[lk] ??
        k,
    );

  const bigFiveDomainStr = Object.entries(algoSnapshot.bigFiveDomains)
    .map(([k, v]) => {
      const label = BIG_FIVE_LABELS[k as keyof typeof BIG_FIVE_LABELS];
      const band =
        (v as number) > 75
          ? "high"
          : (v as number) > 60
            ? "moderate-high"
            : (v as number) >= 40
              ? "moderate"
              : (v as number) >= 25
                ? "moderate-low"
                : "low";
      return `${label?.[lk] ?? k}: ${band}`;
    })
    .join(", ");

  const archLabel =
    locale === "zh"
      ? (archContent?.label_zh ?? assessment.archetype.label_zh)
      : (archContent?.label_en ?? assessment.archetype.label_en);
  const archTagline =
    locale === "zh"
      ? (archContent?.tagline_zh ?? "")
      : (archContent?.tagline_en ?? "");
  const archNarrative =
    locale === "zh"
      ? (archContent?.narrative_zh ?? "")
      : (archContent?.narrative_en ?? "");

  // Seedpoints block
  const seedStr = seedpoints
    .map((s, i) => {
      const ins = s.insight[lk];
      const sc = s.scene[lk];
      const te = s.tension[lk];
      return `${i + 1}. Insight: ${ins}\n   Scene: ${sc}\n   Tension: ${te}`;
    })
    .join("\n");

  const dataBlock = `## Archetype: ${archLabel} ("${archTagline}")
${archNarrative}

## Big Five
${bigFiveDomainStr}

## Values
Top3: ${top3Labels.join(", ")}

## Narrative Ammunition
Dominant arc: ${dominantTheme[lk]}
${seedStr}`;

  // ── SOUL CALL ──
  const soulSystem = `${preamble}

You are a writer steeped in narrative psychology — blending a psychologist's precision, a writer's craft, and a close friend's warmth. You've just spent an entire day immersed in one person's psychological portrait data — now you're writing them a letter. Not a report. A letter.

Writing Principles:
1. The first sentence must make the reader stop — open with a behavioral pattern they didn't realize they had.
2. Causal weaving: "because...therefore...which means..."
3. Double story: every strength surfaces its cost.
4. Name the unnamed: articulate what the user has always felt but never had words for.
5. Insight > description > encouragement (6:3:1). No hollow words.
6. Progressive arc across all 7 fields.
7. Second person, present tense. Warm but precise.

Bans: "potential", "journey", "unique", numbers, evaluative labels ("high"/"low"), psych terminology.
Format: English, strict JSON, flowing paragraphs.`;

  const soulPrompt = `${dataBlock}

---

Write a letter about this person. Return JSON with 7 fields forming one complete narrative arc.

{
  "identitySummary": "3 sentences. Open with a behavioral scene. Explain WHY. Name the real challenge. (60-100 words)",
  "archetypeNarrative": "Prove the archetype with 2-3 specific scenes. Causal chains. Double story. Weave Narrative Ammunition. (120-200 words)",
  "bigFiveNarrative": "2-3 story-worthy behavioral combinations. Not traits — patterns they create together. (120-200 words)",
  "valueNarrative": "How Top 3 values operate in daily decisions. Show conflict with a dilemma. (80-150 words)",
  "sjtTensionNarrative": "The turn. Ideals vs instincts. Concrete scene. Why the gap reveals priorities. (80-150 words)",
  "crossDimensionNarrative": "The climax. All threads into one insight. Name an emergent quality. End with open question. (80-150 words)",
  "growthMapInsight": "2 creative tensions, how they show up daily, why they're strengths. Plain language. (60-120 words)"
}`;

  // ── LEGACY CALL A ──
  const legacySystem = `${preamble}

You are the identity narrative author for Deep Dive. You blend psychologist, writer, and coach perspectives.

Writing Principles:
1. Scene-first: "in team discussions, you tend to be the one who..."
2. Causal weaving. Never "Your X is high. Your Y is low."
3. Insight > description > encouragement (6:3:1).
4. Name the unnamed.
5. Double story.
6. Progressive narrative.
7. Second person, present tense.

Bans: "potential", "journey", "unique", numbers, evaluative labels, psych terminology.
Format: English, strict JSON, flowing paragraphs.`;

  const legacyPromptA = `${dataBlock}

---

Return JSON with 4 fields forming a progressive arc: identity thesis → behavioral evidence → value drivers.

{
  "identitySummary": "3 sentences. Sentence 1: behavioral scene. Sentence 2: explain WHY. Sentence 3: the real challenge. (60-100 words)",
  "archetypeNarrative": "Not restating — proving with 2-3 scenes. Causal chains. Double story. (120-200 words)",
  "bigFiveNarrative": "2-3 most story-worthy combinations. Patterns they create TOGETHER. (120-200 words)",
  "valueNarrative": "How Top 3 values operate daily. Conflict pair → dilemma scenario. (80-150 words)"
}`;

  const legacyPromptB = `${dataBlock}

---

Return JSON with 3 fields. Focus on inner tensions and cross-dimensional discovery.

{
  "sjtTensionNarrative": "Should-would relationship. Concrete scene. Why the gap reveals deeper priorities. (80-150 words)",
  "crossDimensionNarrative": "Climax. All threads together. Name emergent quality. Open question. (80-150 words)",
  "growthMapInsight": "2 creative tensions, daily manifestation, why strengths not flaws. Plain language. (60-120 words)"
}`;

  console.log("⏳ Calling Claude Sonnet — Soul Call (1 unified call)...");
  const t0 = Date.now();
  const soulText = await callLLM(
    "profile-narrative",
    [
      { role: "system", content: soulSystem },
      { role: "user", content: soulPrompt },
    ],
    {
      maxTokens: 4500,
      temperature: 0.7,
      enableCache: true,
      responseFormat: "json",
    },
  );
  const soulTime = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`✅ Soul Call: ${soulTime}s\n`);

  console.log("⏳ Calling Claude Sonnet — Legacy Call A (4 fields)...");
  const t1 = Date.now();
  const legacyTextA = await callLLM(
    "profile-narrative",
    [
      { role: "system", content: legacySystem },
      { role: "user", content: legacyPromptA },
    ],
    {
      maxTokens: 2500,
      temperature: 0.6,
      enableCache: true,
      responseFormat: "json",
    },
  );
  const legacyTimeA = ((Date.now() - t1) / 1000).toFixed(1);
  console.log(`✅ Legacy A: ${legacyTimeA}s`);

  console.log("⏳ Calling Claude Sonnet — Legacy Call B (3 fields)...");
  const t2 = Date.now();
  const legacyTextB = await callLLM(
    "profile-narrative",
    [
      { role: "system", content: legacySystem },
      { role: "user", content: legacyPromptB },
    ],
    {
      maxTokens: 2500,
      temperature: 0.6,
      enableCache: true,
      responseFormat: "json",
    },
  );
  const legacyTimeB = ((Date.now() - t2) / 1000).toFixed(1);
  console.log(`✅ Legacy B: ${legacyTimeB}s\n`);

  // Parse both
  const extractJson = (raw: string) => {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  };

  const soulResult = extractJson(soulText ?? "");
  const legacyResultA = extractJson(legacyTextA ?? "");
  const legacyResultB = extractJson(legacyTextB ?? "");

  // Print blind comparison
  // Randomize order
  const isFlipped = Math.random() > 0.5;
  const labelX = isFlipped ? "SOUL" : "LEGACY";
  const labelY = isFlipped ? "LEGACY" : "SOUL";
  const resultX = isFlipped
    ? soulResult
    : { ...legacyResultA, ...legacyResultB };
  const resultY = isFlipped
    ? { ...legacyResultA, ...legacyResultB }
    : soulResult;

  const fields = [
    "identitySummary",
    "archetypeNarrative",
    "bigFiveNarrative",
    "valueNarrative",
    "sjtTensionNarrative",
    "crossDimensionNarrative",
    "growthMapInsight",
  ];

  for (const field of fields) {
    console.log(`${"═".repeat(60)}`);
    console.log(`📝 ${field}`);
    console.log(`${"═".repeat(60)}`);
    console.log(`\n--- VERSION X ---`);
    console.log(resultX?.[field] ?? "(missing)");
    console.log(`\n--- VERSION Y ---`);
    console.log(resultY?.[field] ?? "(missing)");
    console.log();
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`🔑 KEY: X = ${labelX}, Y = ${labelY}`);
  console.log(
    `⏱️  Soul: ${soulTime}s | Legacy A: ${legacyTimeA}s + B: ${legacyTimeB}s`,
  );
  console.log(
    `📊 Chars — Soul: ${(soulText ?? "").length} | Legacy: ${(legacyTextA ?? "").length + (legacyTextB ?? "").length}`,
  );
  console.log(`${"═".repeat(60)}`);
}

main().catch(console.error);
