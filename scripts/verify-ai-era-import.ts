// Verification: 2026-06 AI-era career library expansion (migrations 102-104)
// + diversity quota in career-match candidate selection.
//
// Checks against the REAL career pool (production DB via DATABASE_URL):
//   1. Pool size = expected active count; all 48 new ids present;
//      all 12 soft-deleted duplicate ids absent.
//   2. An MBA-style profile (high E+I, achievement/self-direction/stimulation)
//      run through computeCareerMatchAlgorithm yields:
//      - at least one emerging-* career in the top-8 ideal candidates
//      - no RIASEC family occupying >2 of the 5 main slots
//      - AI-era section ≤3 items, no family >2
//
// Usage: npx tsx scripts/verify-ai-era-import.ts

import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

import {
  ensureCareerPoolLoaded,
  getCareerPool,
} from "../lib/career-matching/career-pool";
import { computeCareerMatchAlgorithm } from "../lib/report-generation/career-match-algorithm";
import { riasecPairKey } from "../lib/report-generation/diversity-quota";
import { computeProfileAlgorithm } from "../lib/profile-generation/profile-algorithm";
import { buildBalancedAssessment } from "../lib/report-generation/__tests__/fixtures/mock-assessment-balanced";

const NEW_IDS = [
  "emerging-ai-transformation-director",
  "emerging-ai-enablement-lead",
  "emerging-ai-agent-manager",
  "emerging-ai-workforce-planner",
  "emerging-ai-finops-manager",
  "emerging-ai-investment-analyst",
  "emerging-ai-risk-manager",
  "emerging-ai-compliance-auditor",
  "emerging-ai-product-marketing-manager",
  "emerging-ai-customer-success",
  "emerging-ai-partnerships-manager",
  "emerging-ai-pricing-strategist",
  "emerging-ai-change-consultant",
  "emerging-ai-portfolio-manager",
  "emerging-ai-supply-chain-manager",
  "emerging-ai-knowledge-manager",
  "emerging-ai-revops-manager",
  "emerging-ai-data-licensing-manager",
  "emerging-legal-ai-specialist",
  "emerging-ai-policy-advisor",
  "emerging-clinical-ai-specialist",
  "emerging-healthcare-ai-implementation",
  "emerging-financial-model-validator",
  "emerging-ai-underwriting-specialist",
  "emerging-ai-fraud-analyst",
  "emerging-people-analytics-ai",
  "emerging-industrial-ai-engineer",
  "emerging-precision-agriculture-ai",
  "emerging-energy-ai-specialist",
  "emerging-retail-ai-personalization",
  "emerging-ai-news-verification",
  "emerging-conversational-experience-designer",
  "emerging-ai-for-science-researcher",
  "emerging-ai-sustainability-analyst",
  "emerging-genai-system-tester",
  "emerging-ai-animation-producer",
  "emerging-agent-orchestration-specialist",
  "emerging-agentops-engineer",
  "emerging-model-customization-engineer",
  "emerging-ai-evaluation-engineer",
  "emerging-ai-interpretability-researcher",
  "emerging-ai-alignment-researcher",
  "emerging-human-ai-interaction-researcher",
  "emerging-embodied-ai-engineer",
  "emerging-humanoid-robot-trainer",
  "emerging-ai-character-designer",
  "emerging-geo-specialist",
  "emerging-world-model-engineer",
];

const SOFT_DELETED_IDS = [
  "ai-001",
  "emerging-ai-product-manager",
  "ai-003",
  "emerging-prompt-engineer",
  "ai-002",
  "emerging-ai-ethics-officer",
  "emerging-ai-data-curator",
  "emerging-ai-creative-director",
  "tech-002",
  "edu-001",
  "ent-001",
  "emerging-mlops-engineer",
];

const EXPECTED_ACTIVE = 1184;
const MAX_PER_FAMILY = 2;

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function main() {
  // ── 1. Pool integrity ──────────────────────────────────────
  await ensureCareerPoolLoaded();
  const pool = getCareerPool();
  const poolIds = new Set(pool.map((d) => d.id));

  check(
    `pool size = ${EXPECTED_ACTIVE}`,
    pool.length === EXPECTED_ACTIVE,
    `actual ${pool.length}`,
  );

  const missingNew = NEW_IDS.filter((id) => !poolIds.has(id));
  check(
    `all ${NEW_IDS.length} new AI-era ids present`,
    missingNew.length === 0,
    missingNew.length ? `missing: ${missingNew.join(", ")}` : "",
  );

  const lingering = SOFT_DELETED_IDS.filter((id) => poolIds.has(id));
  check(
    `all ${SOFT_DELETED_IDS.length} soft-deleted duplicates absent`,
    lingering.length === 0,
    lingering.length ? `still active: ${lingering.join(", ")}` : "",
  );

  // ── 2. MBA-style profile match ─────────────────────────────
  const assessment = buildBalancedAssessment();
  assessment.riasecNormalized = { R: 25, I: 70, A: 40, S: 45, E: 85, C: 50 };

  const algo = computeProfileAlgorithm(assessment);
  algo.schwartz.top3 = ["achievement", "self-direction", "stimulation"];
  algo.schwartz.centered = {
    achievement: 1.6,
    "self-direction": 1.3,
    stimulation: 0.9,
    power: 0.5,
    hedonism: 0.1,
    universalism: -0.2,
    benevolence: -0.4,
    conformity: -0.8,
    tradition: -1.4,
    security: -1.6,
  };

  const output = await computeCareerMatchAlgorithm(assessment, algo, null);

  const familyOf = (id: string): string => {
    const t = pool.find((d) => d.id === id);
    return t ? riasecPairKey(t.idealRIASEC) : `solo:${id}`;
  };

  const top8 = output.idealCandidates.map((c) => c.direction.id);
  check(
    "top-8 ideal candidates include ≥1 emerging-* career",
    top8.some((id) => id.startsWith("emerging-")),
    top8.join(", "),
  );

  const mainSlots = [...output.candidates, ...output.exploratoryCandidates];
  check(
    "main slots = 3 primary + 2 exploratory",
    output.candidates.length === 3 && output.exploratoryCandidates.length === 2,
  );

  const familyCounts = new Map<string, number>();
  for (const c of mainSlots) {
    const f = familyOf(c.direction.id);
    familyCounts.set(f, (familyCounts.get(f) ?? 0) + 1);
  }
  const overMain = [...familyCounts].filter(([, n]) => n > MAX_PER_FAMILY);
  check(
    `no RIASEC family >${MAX_PER_FAMILY} across 5 main slots`,
    overMain.length === 0,
    overMain.map(([f, n]) => `${f}:${n}`).join(", "),
  );

  const aiFamilies = new Map<string, number>();
  for (const c of output.aiEraCandidates) {
    const f = familyOf(c.direction.id);
    aiFamilies.set(f, (aiFamilies.get(f) ?? 0) + 1);
  }
  const overAi = [...aiFamilies].filter(([, n]) => n > MAX_PER_FAMILY);
  check(
    `AI-era section ≤3 items, no family >${MAX_PER_FAMILY}`,
    output.aiEraCandidates.length <= 3 && overAi.length === 0,
  );

  // ── 3. Human-readable dump ─────────────────────────────────
  console.log(
    "\nMBA profile (R25 I70 A40 S45 E85 C50) — recommendation slots:",
  );
  console.table([
    ...output.candidates.map((c, i) => ({
      slot: `primary-${i + 1}`,
      ...row(c),
    })),
    ...output.exploratoryCandidates.map((c, i) => ({
      slot: `explore-${i + 1}`,
      ...row(c),
    })),
    ...output.aiEraCandidates.map((c, i) => ({
      slot: `ai-era-${i + 1}`,
      ...row(c),
    })),
  ]);

  function row(c: (typeof output.candidates)[number]) {
    return {
      id: c.direction.id,
      title: c.direction.title_en,
      score: c.score.total,
      family: familyOf(c.direction.id),
      aiEra: c.direction.aiEraCategory ?? "-",
    };
  }

  console.log(
    failures === 0
      ? "\nAll checks passed ✓"
      : `\n${failures} check(s) FAILED ✗`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
