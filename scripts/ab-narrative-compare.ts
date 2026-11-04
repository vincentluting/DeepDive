#!/usr/bin/env npx tsx
// ============================================================
// A/B Narrative Quality Comparison: Sonnet vs Gemini 3.1 Pro
//
// Usage:
//   POSTGRES_URL=... ANTHROPIC_API_KEY=... GOOGLE_API_KEY=... npx tsx scripts/ab-narrative-compare.ts [userId]
//
// If no userId is provided, fetches the most recent profile.
// Outputs two files for blind comparison:
//   output/narrative-A.json  (randomized — could be either model)
//   output/narrative-B.json  (randomized — the other model)
//   output/narrative-key.json (reveals which is which — read LAST)
// ============================================================

import { sql } from "../lib/db/connection";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

if (!ANTHROPIC_API_KEY || !GOOGLE_API_KEY) {
  console.error(
    "❌ Both ANTHROPIC_API_KEY and GOOGLE_API_KEY must be set in env",
  );
  process.exit(1);
}

// ── Fetch a real profile from DB ────────────────────────────

async function fetchProfile(userId?: string) {
  const rows = userId
    ? await sql`
        SELECT "profileJson" FROM "PersonalProfile"
        WHERE "userId" = ${userId}
        ORDER BY "updatedAt" DESC LIMIT 1
      `
    : await sql`
        SELECT "profileJson" FROM "PersonalProfile"
        ORDER BY "updatedAt" DESC LIMIT 1
      `;

  if (!rows.length) {
    console.error("❌ No profile found");
    process.exit(1);
  }
  return rows[0].profileJson;
}

// ── Import narrative generation functions ────────────────────
// We dynamically import to get buildSystemMessage, buildDataBlock, buildCallBPrompt

async function _buildPrompts(
  _profile: Record<string, unknown>,
  _algo: Record<string, unknown>,
  _locale: "en" | "zh",
) {
  // We need to call the internal functions. Since they're not exported,
  // we reconstruct the Call B prompt directly using the same logic.
  const mod =
    await import("../lib/profile-generation/generate-identity-narratives");

  // generateIdentityNarratives calls buildSystemMessage + buildCallBPrompt internally
  // We can't access those directly, so we'll construct equivalent prompts here.
  // Instead, let's just call the full function with each provider override.
  return { generateIdentityNarratives: mod.generateIdentityNarratives };
}

// ── Direct LLM calls (bypass model-router to control provider) ──

async function callAnthropic(
  systemMsg: string,
  userMsg: string,
  maxTokens: number,
): Promise<{ text: string; latencyMs: number }> {
  const t0 = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6-20260320",
      max_tokens: maxTokens,
      temperature: 0.6,
      system: systemMsg,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return { text, latencyMs: Date.now() - t0 };
}

async function callGemini(
  systemMsg: string,
  userMsg: string,
  maxTokens: number,
): Promise<{ text: string; latencyMs: number }> {
  const t0 = Date.now();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userMsg }] }],
      systemInstruction: { parts: [{ text: systemMsg }] },
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text, latencyMs: Date.now() - t0 };
}

// ── Build prompts manually (same logic as generate-identity-narratives.ts) ──

function buildSystemMessage(locale: "en" | "zh"): string {
  if (locale === "zh") {
    return `你是 Deep Dive 职业探索平台的身份叙事作者。你融合心理学家、作家、教练三个视角，为用户写精炼而有穿透力的身份画像。

## 写作原则

1. **场景先行**。每段叙事用一个用户能立刻认出的行为场景开头——会议中、决策时、与人交流时。不是"你具有X特质"，而是"在团队讨论中，你往往是那个…"。
2. **因果编织**。用"因为…所以…而这又导致…"因果链连接维度。禁止"你的X是高的。你的Y是低的。"这种并列。
3. **洞察 > 描述 > 鼓励（6:3:1）**。60%具体洞察 + 30%行为描述 + 10%温和挑战。绝对禁止空洞鼓励（"你有很大潜力""你的旅程很独特"）。
4. **命名未命名的**。说出用户一直感受到但从未有语言描述的体验——维度交叉处涌现的品质。
5. **双重故事**。每个强项必须带出它的代价或阴影面。不回避张力。
6. **递进叙事**。各段之间有逻辑递进：身份认同 → 证据支撑 → 内在张力。不是独立的主题块。
7. **第二人称、现在时**。温暖但不煽情。精炼——一段 100 字的精准洞察 > 500 字的泛泛而谈。

## 禁止清单
- "潜力""旅程""独特""不断成长""值得期待"等鸡汤词
- "这意味着""这种组合""从某种意义上说"等填充语
- **任何数字和测量痕迹**
- **任何测量类描述词**
- **任何心理学术语、维度代码、构念名称**

## 格式
- 全程中文，返回严格 JSON
- 段落式，不用要点列表`;
  }

  return `You are the identity narrative author for Deep Dive. You blend psychologist, writer, and coach perspectives to write precise, penetrating identity portraits.

## Writing Principles

1. **Scene-first.** Open every narrative with a behavioral scene the user instantly recognizes.
2. **Causal weaving.** Connect dimensions with "because...therefore...which means..." chains.
3. **Insight > description > encouragement (6:3:1).**
4. **Name the unnamed.** Articulate experiences the user has always felt but never had words for.
5. **Double story.** Every strength must surface its cost or shadow side.
6. **Progressive narrative.** Sections build logically.
7. **Second person, present tense.** Warm but not sentimental.

## Banned list
- "potential," "journey," "unique," "ever-growing," "exciting" and similar hollow words
- Any numbers, scores, percentages, +/- signs
- Any evaluative labeling ("high," "low," "strong," "weak")
- Any psychological terminology or dimension codes

## Format
- English only, return strict JSON
- Flowing paragraphs, not bullet lists`;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  const userId = process.argv[2];
  console.log(
    userId
      ? `📋 Fetching profile for user: ${userId}`
      : "📋 Fetching most recent profile",
  );

  const profile = await fetchProfile(userId);
  const algo = profile.algoSnapshot;
  if (!algo) {
    console.error("❌ Profile has no algoSnapshot");
    process.exit(1);
  }

  // Detect locale from profile
  const locale: "en" | "zh" = "en";
  const systemMsg = buildSystemMessage(locale);

  // Reconstruct Call B data block + prompt from profile
  // (simplified — uses the profile data directly)
  const { generateIdentityNarratives: _generateIdentityNarratives } =
    await import("../lib/profile-generation/generate-identity-narratives");

  // We need to call each provider separately. Since generateIdentityNarratives
  // uses callLLM internally (which routes to Anthropic), we'll call the raw APIs
  // and pass the same prompt.

  // First, let's reconstruct the Call B prompt by importing the internals
  // Since buildCallBPrompt and buildDataBlock are not exported, we inline a version
  // that extracts the data block from the profile.

  // Actually, the cleanest approach: call generateIdentityNarratives twice,
  // once with each provider. But since it's hardcoded to 'profile-narrative' task...
  // Let's just call the raw APIs with equivalent prompts.

  const dataBlock = buildDataBlockFromProfile(profile, algo, locale);
  const callBPrompt = buildCallBPromptText(dataBlock, locale);

  console.log("\n⏱️  Calling Claude Sonnet 4.6...");
  const sonnetResult = await callAnthropic(systemMsg, callBPrompt, 1500);
  console.log(`   Done in ${sonnetResult.latencyMs}ms`);

  console.log("⏱️  Calling Gemini 3.1 Pro...");
  const geminiResult = await callGemini(systemMsg, callBPrompt, 1500);
  console.log(`   Done in ${geminiResult.latencyMs}ms`);

  // Parse JSON from both
  const sonnetJson = parseNarrativeJson(sonnetResult.text, "Sonnet");
  const geminiJson = parseNarrativeJson(geminiResult.text, "Gemini");

  // Randomize order for blind comparison
  const coinFlip = Math.random() > 0.5;
  const outputA = coinFlip ? sonnetJson : geminiJson;
  const outputB = coinFlip ? geminiJson : sonnetJson;
  const labelA = coinFlip ? "Claude Sonnet 4.6" : "Gemini 3.1 Pro";
  const labelB = coinFlip ? "Gemini 3.1 Pro" : "Claude Sonnet 4.6";
  const latencyA = coinFlip ? sonnetResult.latencyMs : geminiResult.latencyMs;
  const latencyB = coinFlip ? geminiResult.latencyMs : sonnetResult.latencyMs;

  // Write output
  const { mkdirSync, writeFileSync } = await import("fs");
  mkdirSync("output", { recursive: true });

  writeFileSync(
    "output/narrative-A.json",
    JSON.stringify(outputA, null, 2),
    "utf-8",
  );
  writeFileSync(
    "output/narrative-B.json",
    JSON.stringify(outputB, null, 2),
    "utf-8",
  );
  writeFileSync(
    "output/narrative-key.json",
    JSON.stringify(
      {
        WARNING: "先读 A 和 B，评分后再看这个文件！",
        A: { model: labelA, latencyMs: latencyA },
        B: { model: labelB, latencyMs: latencyB },
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log("\n✅ 输出完成！盲比流程：");
  console.log("   1. 读 output/narrative-A.json");
  console.log("   2. 读 output/narrative-B.json");
  console.log("   3. 对每个字段打分 (1-10): 场景感、穿透力、人话程度");
  console.log("   4. 最后读 output/narrative-key.json 揭晓");
  console.log(
    `\n⏱️  延迟: Sonnet ${sonnetResult.latencyMs}ms vs Gemini ${geminiResult.latencyMs}ms`,
  );

  process.exit(0);
}

// ── Helpers ──────────────────────────────────────────────────

function buildDataBlockFromProfile(
  profile: Record<string, unknown>,
  algo: Record<string, unknown>,
  locale: "en" | "zh",
): string {
  // Simplified data block reconstruction from profile object
  const archetype = profile.archetype as Record<string, unknown> | undefined;
  const archLabel =
    locale === "zh"
      ? (archetype?.label_zh ?? "探索者")
      : (archetype?.label_en ?? "Explorer");
  const archTagline =
    locale === "zh"
      ? (archetype?.tagline_zh ?? "")
      : (archetype?.tagline_en ?? "");

  const bigFiveDomains = algo.bigFiveDomains as
    | Record<string, number>
    | undefined;
  const bigFiveStr = bigFiveDomains
    ? Object.entries(bigFiveDomains)
        .map(
          ([k, v]) =>
            `${k}: ${v > 75 ? "high" : v > 60 ? "moderate-high" : v >= 40 ? "moderate" : v >= 25 ? "moderate-low" : "low"}`,
        )
        .join(", ")
    : "";

  const facetPairs =
    (algo.bigFiveFacetPairs as Array<{
      facet: string;
      deviationFromMean: number;
    }>) ?? [];
  const facetStr = facetPairs
    .filter((f) => Math.abs(f.deviationFromMean) > 0.2)
    .sort(
      (a, b) => Math.abs(b.deviationFromMean) - Math.abs(a.deviationFromMean),
    )
    .slice(0, 12)
    .map((f) => {
      const dev = f.deviationFromMean;
      const band =
        dev > 1.5
          ? "very pronounced"
          : dev > 0.8
            ? "pronounced"
            : dev > 0
              ? "moderately pronounced"
              : dev < -1.5
                ? "very low"
                : dev < -0.8
                  ? "notably low"
                  : "moderately low";
      return `${f.facet.replace(/^[A-Z]\d_/, "").replace(/_/g, " ")}: ${band}`;
    })
    .join("; ");

  const sjt = profile.sjtBehavioralConsistency as
    | Record<string, unknown>
    | undefined;
  const sjtConsistency = sjt?.overallConsistency as number | undefined;
  const sjtBand =
    sjtConsistency != null
      ? sjtConsistency >= 0.8
        ? "highly consistent"
        : sjtConsistency >= 0.6
          ? "moderately consistent"
          : sjtConsistency >= 0.4
            ? "notable gaps"
            : "significant gaps"
      : "no data";

  const schwartz = profile.schwartzAnchors as
    | Record<string, unknown>
    | undefined;
  const top3 = (schwartz?.top3 as string[]) ?? [];
  const conflict = schwartz?.conflictPair as string | undefined;

  const cogStyle = algo.cognitiveStyleCode as string | undefined;
  const collabMapping = profile.collabMapping as
    | Record<string, unknown>
    | undefined;
  const shadows = (profile.shadowInsights as Record<string, unknown>)
    ?.shadows as Array<Record<string, unknown>> | undefined;
  const shadowStr =
    shadows
      ?.map((s) => `${s.domain}${s.tensionWith ? ` ↔ ${s.tensionWith}` : ""}`)
      .join("; ") ?? "none";

  return `## Archetype: ${archLabel} ("${archTagline}")

## Big Five
${bigFiveStr}
Notable tendencies: ${facetStr || "none"}

## Values
Top3: ${top3.join(", ")}
${conflict ? `Conflict pair: ${conflict}` : ""}

## Behavioral Consistency
${sjtBand}

## Other
Cognitive: ${cogStyle ?? "unknown"}
Collaboration: ${collabMapping?.primary ?? "unknown"}${collabMapping?.secondary ? `/${collabMapping.secondary}` : ""}
Shadows: ${shadowStr}`;
}

function buildCallBPromptText(dataBlock: string, locale: "en" | "zh"): string {
  if (locale === "zh") {
    return `${dataBlock}

---

返回 JSON，3 个字段。这组叙事聚焦内在张力和跨维度发现。精炼、有穿透力。

{
  "sjtTensionNarrative": "直接进入叙事，不要加标题。基于should-would差距，讲'你认为自己会怎么做'和'你实际倾向怎么做'之间的关系。一致性高→这意味着什么。有差距→具体在哪些场景中出现错位？用一个用户可能经历过的具体场景展示。这不是缺点——解释为什么这个拉扯其实揭示了你更深层的优先级。（120-180字）",
  "crossDimensionNarrative": "整个叙事的高潮和收束。把前面所有维度的线索汇聚成一个洞察。命名一个涌现品质——用户一直感受到但从未有语言描述的东西。以一个开放性问题结尾。（120-180字）",
  "growthMapInsight": "为'内在拉扯'数据可视化提供解释层。不要用比喻——直接说人话。结构：1）你身上最显著的2个创造性张力是什么。2）每个张力在日常中如何表现。3）为什么这些张力其实是优势而非缺陷。4）需要注意什么。（100-150字）"
}`;
  }

  return `${dataBlock}

---

Return JSON with 3 fields. This group focuses on inner tensions and cross-dimensional discovery. Precise and penetrating.

{
  "sjtTensionNarrative": "Jump straight into the narrative — no heading or title. Based on should-would gaps, narrate the relationship between 'what you think you'd do' and 'what you actually tend to do.' High consistency → what this means. Gaps → in which specific scenarios does misalignment appear? Use a concrete scene. This isn't a flaw — explain why this pull actually reveals your deeper priorities. (80-150 words)",
  "crossDimensionNarrative": "The climax and synthesis. Pull all threads together: archetype pattern + behavioral style + value orientation + inner tensions — what do they reveal when combined? Name an emergent quality the user has always felt but never had words for. End with an open question that naturally leads to deeper exploration. (80-150 words)",
  "growthMapInsight": "Interpretive layer for the 'inner tensions' data visualization. No metaphors — speak plainly. Structure: 1) Your 2 most significant creative tensions. 2) How each tension shows up in daily life. 3) Why these tensions are actually strengths, not flaws. 4) What to watch out for. No motivational fluff. (60-120 words)"
}`;
}

function parseNarrativeJson(
  raw: string,
  label: string,
): Record<string, string> {
  try {
    // Try direct parse
    const parsed = JSON.parse(raw.trim());
    if (typeof parsed === "object" && parsed !== null) return parsed;
  } catch {
    // Try extracting JSON from response
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(raw.slice(first, last + 1));
      } catch {
        // fall through
      }
    }
  }
  console.warn(`⚠️  ${label}: Failed to parse JSON, returning raw text`);
  return { raw };
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
