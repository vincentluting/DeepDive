#!/usr/bin/env npx tsx
// ============================================================
// QA: Standard vs Enhanced report side-by-side comparison
//
// Calls generateCareerReport() twice with identical inputs except one
// gets a resumeMatch row and one doesn't, then writes both outputs to
// /tmp and prints a short diff-focused summary.
//
// Real LLM calls (Anthropic Sonnet + OpenAI GPT-4o-mini). Expect ~2-5
// minutes and ~$1-2 per run.
//
// Usage:
//   npx tsx scripts/qa-resume-enhancement-compare.ts [locale]
// ============================================================

import { config } from "dotenv";
import { resolve } from "node:path";
import { writeFileSync, mkdirSync } from "node:fs";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

if (
  !process.env.POSTGRES_URL &&
  !process.env.DATABASE_URL &&
  !process.env.POSTGRES_PRISMA_URL
) {
  console.error("❌ No DB url in env (.env.local)");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
  console.error("❌ Need at least one LLM provider key in env");
  process.exit(1);
}

const locale = (process.argv[2] ?? "en") as "en" | "zh";

async function main() {
  const { generateCareerReport } = await import("../lib/report-generation");
  const { buildBalancedAssessment } =
    await import("../lib/report-generation/__tests__/fixtures/mock-assessment-balanced");

  const assessment = buildBalancedAssessment();

  // Resume fixture — 8-year finance analyst. Creates deliberate tension
  // against the balanced assessment (high I+C in resume vs mid RIASEC in
  // assessment, low A in resume vs moderate artistic hint in assessment).
  const resumeMatch = {
    id: "qa-resume-001",
    assessmentId: assessment.id,
    userId: null,
    sourceType: "resume" as const,
    fileName: "qa-fixture.pdf",
    fileType: "application/pdf",
    resumeData: {
      experience: [
        {
          title: "Senior Financial Analyst",
          company: "Global Bank",
          industry: "Finance",
          durationMonths: 48,
          responsibilities: [
            "Built discounted cashflow models for $500M+ M&A deals",
            "Presented quarterly earnings analyses to board",
          ],
        },
        {
          title: "Financial Analyst",
          company: "Consulting Firm",
          industry: "Consulting",
          durationMonths: 48,
          responsibilities: [
            "Modeled client financials across 20+ engagements",
          ],
        },
      ],
      skills: ["DCF modeling", "Excel", "SQL", "Python", "Bloomberg"],
      languages: [{ language: "English", proficiency: "fluent" as const }],
      industries: ["Finance", "Consulting"],
      education: [
        {
          degree: "MBA",
          field: "Finance",
          institution: "Top-tier business school",
        },
      ],
      yearsOfExperience: 8,
      seniority: "senior" as const,
    },
    matchResult: {
      alignedDimensions: [
        {
          dimension: "I",
          assessmentSignal: "Moderate analytical orientation",
          resumeEvidence: "8 years of financial modeling and analysis",
          confidenceBoost: 18,
        },
        {
          dimension: "C",
          assessmentSignal: "Moderate conscientiousness",
          resumeEvidence: "Senior analyst roles demanding structured rigor",
          confidenceBoost: 14,
        },
      ],
      conflictingDimensions: [
        {
          dimension: "A",
          assessmentSignal: "Moderate interest in artistic/creative work",
          resumeEvidence: "No creative roles; consistently analytical track",
          tensionInsight_en:
            "Your assessment shows a moderate creative pull, but your career so far has stayed in structured finance. This gap may be a signal — or a path untraveled worth naming.",
          tensionInsight_zh:
            "你的测评显示一定的创造性倾向,但职业轨迹一直停留在结构化金融领域。这个落差值得被命名——是尚未探索的方向,还是无需追随的干扰项?",
        },
        {
          dimension: "S",
          assessmentSignal: "Moderate interpersonal orientation",
          resumeEvidence:
            "Individual contributor roles, limited team leadership",
          tensionInsight_en:
            "The assessment hints at interest in people-centered work that your current trajectory hasn't given room to.",
          tensionInsight_zh:
            "测评暗示对以人为本的工作有兴趣,但当前路径还未给它空间。",
        },
      ],
      autoFillRealConditions: {},
      summary_en:
        "Your 8-year finance analyst trajectory strongly reinforces analytical and conscientious patterns, while the assessment surfaces latent interest in creative and interpersonal domains that your career has not yet exercised.",
      summary_zh:
        "你 8 年金融分析师的轨迹强化了分析型与责任感模式,测评同时显露出尚未被现实经历调动的创造性和人际倾向。",
    },
    flowVersion: "v2-dialog" as const,
    supersededAt: null,
    createdAt: new Date(),
  };

  console.log("⏳ Running Standard generation (no resumeMatch)...");
  const tStandard0 = Date.now();
  const standard = await generateCareerReport(
    assessment,
    null,
    locale,
    undefined,
    null,
    undefined,
    null,
  );
  const standardMs = Date.now() - tStandard0;
  console.log(
    `✅ Standard done in ${(standardMs / 1000).toFixed(1)}s (${standard.meta.llmCalls} LLM calls)`,
  );

  console.log("⏳ Running Enhanced generation (with resumeMatch)...");
  const tEnhanced0 = Date.now();
  const enhanced = await generateCareerReport(
    assessment,
    null,
    locale,
    undefined,
    null,
    undefined,
    resumeMatch,
  );
  const enhancedMs = Date.now() - tEnhanced0;
  console.log(
    `✅ Enhanced done in ${(enhancedMs / 1000).toFixed(1)}s (${enhanced.meta.llmCalls} LLM calls)`,
  );

  // ── Persist outputs ──
  mkdirSync("output", { recursive: true });
  writeFileSync(
    "output/qa-standard.json",
    JSON.stringify(standard, null, 2),
    "utf-8",
  );
  writeFileSync(
    "output/qa-enhanced.json",
    JSON.stringify(enhanced, null, 2),
    "utf-8",
  );

  // ── Summary ──
  console.log("\n============================================================");
  console.log(`  Comparison summary (locale=${locale})`);
  console.log("============================================================\n");

  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(pad("Field", 32) + pad("Standard", 24) + "Enhanced");
  console.log("-".repeat(88));
  console.log(
    pad("meta.resumeEnhanced", 32) +
      pad(String(standard.meta.resumeEnhanced ?? false), 24) +
      String(enhanced.meta.resumeEnhanced ?? false),
  );
  console.log(
    pad("meta.resumeMatchId", 32) +
      pad(String(standard.meta.resumeMatchId ?? "—"), 24) +
      String(enhanced.meta.resumeMatchId ?? "—"),
  );
  console.log(
    pad("has resumeEvidence", 32) +
      pad(String(!!standard.resumeEvidence), 24) +
      String(!!enhanced.resumeEvidence),
  );
  console.log(
    pad("letterToUser length", 32) +
      pad(String(standard.integration?.letterToUser?.length ?? 0), 24) +
      String(enhanced.integration?.letterToUser?.length ?? 0),
  );
  console.log(
    pad("coreInsight length", 32) +
      pad(String(standard.integration?.coreInsight?.length ?? 0), 24) +
      String(enhanced.integration?.coreInsight?.length ?? 0),
  );
  console.log(
    pad("llmCalls", 32) +
      pad(String(standard.meta.llmCalls), 24) +
      String(enhanced.meta.llmCalls),
  );
  console.log(
    pad("generationMs", 32) + pad(String(standardMs), 24) + String(enhancedMs),
  );

  // ── Letter excerpts ──
  console.log("\n── Standard letterToUser (first 400 chars) ──\n");
  console.log(standard.integration?.letterToUser?.slice(0, 400) ?? "(empty)");
  console.log("\n── Enhanced letterToUser (first 400 chars) ──\n");
  console.log(enhanced.integration?.letterToUser?.slice(0, 400) ?? "(empty)");

  // ── Heuristic: does Enhanced reference resume-specific vocabulary? ──
  const enhancedLetter = enhanced.integration?.letterToUser ?? "";
  const resumeVocab =
    locale === "zh"
      ? /金融|分析师|建模|DCF|MBA|现实经历|简历|8 ?年|八年|创造性|人际/
      : /finance|analyst|model|DCF|MBA|resume|8 ?years|creative|interpersonal|analytical/i;
  const matchesVocab = resumeVocab.test(enhancedLetter);

  console.log("\n── Content-difference heuristic ──");
  console.log(
    `Enhanced letter references resume-specific vocabulary: ${matchesVocab ? "✅ YES" : "⚠️  NO"}`,
  );

  // ── Bail-out checks: these must ALL be true for the feature to work ──
  const checks = [
    ["Standard has no resumeEnhanced flag", !standard.meta.resumeEnhanced],
    ["Standard has no resumeEvidence payload", !standard.resumeEvidence],
    [
      "Enhanced meta.resumeEnhanced === true",
      enhanced.meta.resumeEnhanced === true,
    ],
    ["Enhanced has resumeEvidence payload", !!enhanced.resumeEvidence],
    [
      "Enhanced resumeEvidence has conflictingDimensions",
      (enhanced.resumeEvidence?.conflictingDimensions?.length ?? 0) > 0,
    ],
    ["Enhanced letterToUser references resume vocabulary", matchesVocab],
    [
      "Enhanced letterToUser differs from Standard",
      (standard.integration?.letterToUser ?? "") !==
        (enhanced.integration?.letterToUser ?? ""),
    ],
  ] as const;

  console.log("\n── Pass/fail ──");
  let allPass = true;
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? "✅" : "❌"} ${name}`);
    if (!ok) allPass = false;
  }

  console.log(
    `\n${allPass ? "✅" : "❌"} Overall: ${allPass ? "PASS" : "FAIL"}`,
  );
  console.log("\nFull outputs saved to:");
  console.log("  output/qa-standard.json");
  console.log("  output/qa-enhanced.json");

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("❌ QA script failed:", err);
  process.exit(2);
});
