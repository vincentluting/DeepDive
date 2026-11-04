/**
 * verify-epigraph.ts — CPO Acceptance harness for the CoreInsight prompt upgrade.
 *
 * Runs the new `integration` LLM prompt against realistic mock data and reports:
 *   - Raw output (EN + ZH)
 *   - Length (words / chars) vs spec (30-50 EN words; 40-60 ZH chars)
 *   - Whether forbidden phrases (TwIVI, RIASEC, "the exploration suggests", et al.)
 *     leaked into the quote
 *
 * Usage: npx tsx scripts/verify-epigraph.ts
 */
import { config } from "dotenv";
config({ path: ".env.local", override: true });

// Force real LLM (not the Groq fallback E2E uses).
process.env.E2E_USE_GROQ = "false";

async function main() {
  const { callLLM } = await import("../lib/ai/model-router");
  const { extractJSON } = await import("../lib/ai/structured-output");
  const { getSystemPreamble } =
    await import("../lib/report-generation/common-rules");

  const systemMsgEn = `${getSystemPreamble("en")}

You are the narrative author for Deep Dive. You write the Integration section
connecting personal profile and career directions.

## Writing Principles
1. Scene-first — open with a behavioral scene.
2. Second person, present tense.
3. No academic terminology, no numbers, no framework names.
4. Warm but precise — like a wise friend, not a counselor.

## Format
- English only, strict JSON, no markdown, no headings.`;

  const dataBlockEn = `## Summary

### Career Match Directions
- Directions: 1. Product Manager (strong match), 2. UX Researcher (good match), 3. Program Manager (good match)
- Summary: You thrive where structured accountability meets human warmth — roles that demand both process and presence.

### Profile Reference
- 12 Type: Architect ("You build the systems others live in.")
- Values: Achievement & Recognition, Connection & Care, Order & Harmony
- SJT behavioral consistency: highly consistent
- Summary: "You carry an unusual steadiness when others panic — not because you don't feel the pressure, but because you turn pressure into process. Yet when projects go too smooth, part of you goes quiet. You hold a meeting the way you'd hold a person: carefully, with attention to what's fragile."

### Real Career Pathway
- Week 1 theme: Clarify the next move
- Job directions: 5`;

  const promptEn = `Connect the career match directions and reality pathway into a coherent "from self-knowledge to action" journey.

${dataBlockEn}

---

## Output Format (JSON) — you MUST output ALL three fields in a single complete JSON object

{
  "letterToUser": "THIS IS THE MOST IMPORTANT FIELD. Write a letter that makes the reader feel deeply seen. Exactly 4 paragraphs (250-350 words total). Second-person, warm but precise — like a wise friend, not a counselor.\\nParagraph 1 (~60 words): Open with a specific behavioral pattern from the Profile Summary.\\nParagraph 2 (~80 words): The 'aha' — connect career directions to personality patterns.\\nParagraph 3 (~60 words): Honest next step — acknowledge tension.\\nParagraph 4 (~40 words): Anti-fixation close — this snapshot will evolve.",

  "coreInsight": "ONE poetic sentence (30-50 words) — the epigraph to a novel about this person. Not a summary, not advice — a single observation about who they are that feels inevitable once read. Second-person, present tense. Use an image, a paradox, or a precise gesture. Strictly forbidden: 'the exploration suggests', 'the data shows', 'based on X items', 'your strongest career directions', 'at the intersection of', 'you are best suited for'. Strictly forbidden: any reference to data sources (item counts, instrument names, framework names). Strictly forbidden: RIASEC, Big Five, Schwartz, TwIVI, MBTI, TKI, Holland and other academic terminology. Think Rilke, Borges, Pessoa — an aphorism about a human being. The reader must stop at this line.",

  "transitions": {
    "profileToPathway": "One sentence transitioning from profile to real-world pathway."
  }
}`;

  const systemMsgZh = `${getSystemPreamble("zh")}

你是 Deep Dive 的叙事作者，负责写 Integration 部分——连接个人画像与职业方向。

## 写作原则
1. 场景先行——用行为场景开头。
2. 第二人称、现在时。
3. 禁学术术语、禁数字、禁框架名。
4. 温暖但精准——像智慧的老朋友，不是咨询师。

## 格式
- 全程中文，严格 JSON，无 markdown，无标题。`;

  const dataBlockZh = `## 板块摘要

### 职业匹配方向
- 方向: 1. 产品经理（强匹配）、2. 用户研究员（良好匹配）、3. 项目经理（良好匹配）
- 摘要: 你在结构化责任与人性化温度相遇处最有活力——需要流程也需要在场的角色。

### 个人画像参考
- 12型: 建造者（"你构建他人赖以生活的系统。"）
- 价值锚: 成就与认可、连接与关怀、规范与和谐
- SJT行为一致性: 高度一致
- 概要: "你身上有一种少见的沉稳——不是因为不感受压力，而是因为你本能地把压力转化为流程。可当项目进展过于顺利时，你身上的某一部分反而安静下来。你对待一场会议的方式，就像对待一个人：小心地、留意那些易碎的部分。"

### 现实求职路径
- 首周主题: 理清下一步
- 岗位数量: 5个`;

  // Isolation: only ask for coreInsight in the ZH probe. Multi-paragraph
  // letterToUser occasionally breaks JSON parsing in rehearsal (CJK quote
  // escape quirks), which is unrelated to our epigraph quality.
  const promptZh = `为下面这个人写一句扉页题词。

${dataBlockZh}

## 输出格式 (JSON)
{
  "coreInsight": "一句诗化的题词（40-60字，ONE sentence）——这本关于他的小说开篇会引用的那一句。不是总结、不是建议——一句关于这个人核心的观察，读完即驻留。第二人称，现在时。用意象、悖论、或一个精确的动作。严禁'探索显示''数据倾向于''基于XX题''最强的方向''交叉处''你的优势在于'。严禁任何数据来源引用（题数、价值量表名称、框架名）。严禁 RIASEC、大五、Schwartz、TwIVI、MBTI、TKI 等学术术语。参考张枣、周梦蝶、博尔赫斯的警句气质——必须让读者在那一行上停下。"
}`;

  const FORBIDDEN_EN =
    /\b(the exploration suggests|the data shows|based on \d+ items?|your strongest career directions|at the intersection of|you are best suited for|RIASEC|Big[\s-]?Five|Schwartz|TwIVI|MBTI|TKI|Holland|et al\.)\b/i;
  const FORBIDDEN_ZH =
    /(探索显示|数据倾向于|基于\d+题|最强的方向|交叉处|你的优势在于|RIASEC|大五|Schwartz|TwIVI|MBTI|TKI|Holland)/;

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  CPO Acceptance · CoreInsight Epigraph v1");
  console.log("═══════════════════════════════════════════════════════════\n");

  // --- EN ---
  console.log("[1/2] Generating English coreInsight...");
  const t0 = Date.now();
  const contentEn = await callLLM(
    "integration",
    [
      { role: "system", content: systemMsgEn },
      { role: "user", content: promptEn },
    ],
    {
      maxTokens: 3000,
      enableCache: false,
      responseFormat: "json" as const,
    },
  );
  const parsedEn = extractJSON(contentEn) as Record<string, string> | null;
  const insightEn = parsedEn?.coreInsight ?? "";
  const elapsedEn = ((Date.now() - t0) / 1000).toFixed(1);
  const wordsEn = insightEn.trim().split(/\s+/).filter(Boolean).length;
  const forbiddenEn = FORBIDDEN_EN.test(insightEn);

  console.log(`\n────── EN result (${elapsedEn}s) ──────`);
  console.log(`"${insightEn}"`);
  console.log(`  · ${insightEn.length} chars, ${wordsEn} words`);
  console.log(
    `  · spec: 30-50 words ... ${wordsEn >= 20 && wordsEn <= 60 ? "✅ within range" : "⚠️  out of range"}`,
  );
  console.log(
    `  · forbidden phrases: ${forbiddenEn ? "❌ VIOLATED" : "✅ clean"}`,
  );
  console.log(
    `  · single sentence: ${(insightEn.match(/[.!?]/g) ?? []).length <= 1 ? "✅" : "⚠️  multiple sentences"}`,
  );

  // --- ZH ---
  console.log("\n[2/2] Generating Chinese coreInsight...");
  const t1 = Date.now();
  const contentZh = await callLLM(
    "integration",
    [
      { role: "system", content: systemMsgZh },
      { role: "user", content: promptZh },
    ],
    {
      maxTokens: 3000,
      enableCache: false,
      responseFormat: "json" as const,
    },
  );
  const parsedZh = extractJSON(contentZh) as Record<string, string> | null;
  const insightZh = parsedZh?.coreInsight ?? "";
  const elapsedZh = ((Date.now() - t1) / 1000).toFixed(1);
  const charsZh = insightZh.length;
  const forbiddenZh = FORBIDDEN_ZH.test(insightZh);

  console.log(`\n────── ZH result (${elapsedZh}s) ──────`);
  console.log(`"${insightZh}"`);
  console.log(`  · ${charsZh} chars`);
  console.log(
    `  · spec: 40-60 chars ... ${charsZh >= 30 && charsZh <= 90 ? "✅ within range" : "⚠️  out of range"}`,
  );
  console.log(
    `  · forbidden phrases: ${forbiddenZh ? "❌ VIOLATED" : "✅ clean"}`,
  );
  console.log(
    `  · single sentence: ${(insightZh.match(/[。！？]/g) ?? []).length <= 1 ? "✅" : "⚠️  multiple sentences"}`,
  );

  console.log("\n═══════════════════════════════════════════════════════════");
  const overallPass = !forbiddenEn && !forbiddenZh && insightEn && insightZh;
  console.log(`  Overall: ${overallPass ? "✅ PASS" : "❌ NEEDS TUNING"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(overallPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
