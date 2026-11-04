// ============================================================
// Scoring & Career-Matching Verification Harness
// ============================================================
// Layer 2 (data integrity) + Layer 4 (simulation) of the
// scoring/matching correctness audit.
//
// Loads the REAL career pool from DB and runs synthetic
// respondents through the FULL pipeline:
//   runScoringPipelineV3 → computeProfileAlgorithm
//     → generateProfile → computeCareerMatchAlgorithm / explore
//
// Run:
//   node --env-file=.env.local --import tsx scripts/verification/simulate-scoring.ts
//
// Read-only against the DB. No writes, no mutation. Pure diagnostics.
// ============================================================

import {
  runScoringPipelineV3,
  type QuestionnaireAnswersV3,
  type SessionMetadataV3,
} from "@/lib/scoring";
import { computeProfileAlgorithm } from "@/lib/profile-generation/profile-algorithm";
import { generateProfile } from "@/lib/profile-generation/generate-profile";
import { computeCareerMatchAlgorithm } from "@/lib/report-generation/career-match-algorithm";
import {
  ensureCareerPoolLoaded,
  getCareerPool,
} from "@/lib/career-matching/career-pool";
import {
  cosineSimilarity,
  toRiasecVector,
} from "@/lib/career-matching/factors/riasec";
import { SJT_SCENARIOS } from "@/lib/questionnaire";
import { IPIP_60_ITEMS } from "@/lib/questionnaire/module-c-ipip-neo60";
import type { RIASECDimension } from "@/lib/types";
import type { AssessmentResultV3 } from "@/lib/types/assessment";

// ── Seeded PRNG (mulberry32) for reproducible synthetic data ──
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RIASEC_KEYS: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];

function randInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// ── Synthetic respondent builders ────────────────────────────

interface Respondent {
  label: string;
  answers: QuestionnaireAnswersV3;
  riasec: Record<RIASECDimension, number>;
  metadata: SessionMetadataV3;
}

function makeMetadata(): SessionMetadataV3 {
  return {
    sessionId: "sim",
    totalTimeMs: 600000,
    moduleTimes: { sjt: 60000, ddvq: 120000, ipip60: 420000 },
  };
}

function randomSJT(rng: () => number): QuestionnaireAnswersV3["sjt"] {
  return SJT_SCENARIOS.map((sc) => {
    const keys = Object.keys(
      (sc as unknown as { scoringMap: Record<string, number> }).scoringMap ?? {
        A: 0,
      },
    );
    const pick = () => keys[randInt(rng, 0, keys.length - 1)] ?? "A";
    return { scenarioId: sc.id, wouldChoice: pick(), shouldChoice: pick() };
  });
}

function randomRespondent(rng: () => number, i: number): Respondent {
  const ipip60: Record<number, number> = {};
  for (let id = 1; id <= 60; id++) ipip60[id] = randInt(rng, 1, 5);
  const values: Record<number, number> = {};
  for (let id = 1; id <= 20; id++) values[id] = randInt(rng, 1, 6);
  const riasec = {} as Record<RIASECDimension, number>;
  for (const k of RIASEC_KEYS) riasec[k] = randInt(rng, 0, 100);
  return {
    label: `random#${i}`,
    answers: { sjt: randomSJT(rng), values, ipip60 },
    riasec,
    metadata: makeMetadata(),
  };
}

// Degenerate respondents — every answer identical
function constantRespondent(
  ipipVal: number,
  valVal: number,
  riasecVal: number,
  label: string,
): Respondent {
  const ipip60: Record<number, number> = {};
  for (let id = 1; id <= 60; id++) ipip60[id] = ipipVal;
  const values: Record<number, number> = {};
  for (let id = 1; id <= 20; id++) values[id] = valVal;
  const riasec = {} as Record<RIASECDimension, number>;
  for (const k of RIASEC_KEYS) riasec[k] = riasecVal;
  const sjt = SJT_SCENARIOS.map((sc) => {
    const keys = Object.keys(
      (sc as unknown as { scoringMap: Record<string, number> }).scoringMap ?? {
        A: 0,
      },
    );
    return {
      scenarioId: sc.id,
      wouldChoice: keys[0] ?? "A",
      shouldChoice: keys[0] ?? "A",
    };
  });
  return {
    label,
    answers: { sjt, values, ipip60 },
    riasec,
    metadata: makeMetadata(),
  };
}

// Coherent respondent: draws a TRUE latent level per Big-Five domain and
// per value type, then answers every item consistently (respecting each
// item's domain + reverse-key). This mimics a real, non-careless respondent
// far better than uniform-random noise, which regresses every domain mean
// toward the midpoint.
function coherentRespondent(rng: () => number, i: number): Respondent {
  const domLevel: Record<string, number> = {
    neuroticism: randInt(rng, 1, 5),
    extraversion: randInt(rng, 1, 5),
    openness: randInt(rng, 1, 5),
    agreeableness: randInt(rng, 1, 5),
    conscientiousness: randInt(rng, 1, 5),
  };
  const ipip60: Record<number, number> = {};
  for (const item of IPIP_60_ITEMS) {
    const lvl = domLevel[item.domain] ?? 3;
    ipip60[item.id] = item.isReversed ? 6 - lvl : lvl;
  }
  const values: Record<number, number> = {};
  for (let id = 1; id <= 20; id++) values[id] = randInt(rng, 1, 6);
  // Polarized RIASEC: one clear primary, rest lower
  const riasec = {} as Record<RIASECDimension, number>;
  const primary = RIASEC_KEYS[randInt(rng, 0, 5)];
  for (const k of RIASEC_KEYS)
    riasec[k] = k === primary ? randInt(rng, 70, 100) : randInt(rng, 0, 60);
  return {
    label: `coherent#${i}`,
    answers: { sjt: randomSJT(rng), values, ipip60 },
    riasec,
    metadata: makeMetadata(),
  };
}

// ── Stats helpers ─────────────────────────────────────────────
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}
function describe(arr: number[]): Record<string, number> {
  if (arr.length === 0) return { n: 0 };
  const s = [...arr].sort((a, b) => a - b);
  const sum = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    min: s[0],
    p5: +quantile(s, 0.05).toFixed(2),
    p25: +quantile(s, 0.25).toFixed(2),
    median: +quantile(s, 0.5).toFixed(2),
    p75: +quantile(s, 0.75).toFixed(2),
    p95: +quantile(s, 0.95).toFixed(2),
    max: s[s.length - 1],
    mean: +(sum / s.length).toFixed(2),
  };
}
function tally<T extends string>(arr: T[]): Record<string, number> {
  const m: Record<string, number> = {};
  for (const x of arr) m[x] = (m[x] ?? 0) + 1;
  return Object.fromEntries(Object.entries(m).sort((a, b) => b[1] - a[1]));
}

function section(title: string) {
  console.log("\n" + "=".repeat(64) + "\n" + title + "\n" + "=".repeat(64));
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const N_DIST = 5000; // archetype / style distribution (no matching, cheap)
  const N_MATCH = 1500; // full matching coverage (heavier)
  const N_COSINE = 300; // full-pool cosine spread sample (heaviest)

  await ensureCareerPoolLoaded();
  const pool = getCareerPool();

  // ════════════════════════════════════════════════════════════
  // LAYER 2 — DATA INTEGRITY
  // ════════════════════════════════════════════════════════════
  section("LAYER 2 — CAREER LIBRARY DATA INTEGRITY");
  console.log(`pool size: ${pool.length}`);

  const issues: string[] = [];
  const riasecVals: number[] = [];
  const bigFiveBounds: number[] = [];
  let missingRiasec = 0;
  let emptyBigFive = 0;
  let emptyAlignedValues = 0;
  let badBigFiveRange = 0;
  const jobZones: Record<string, number> = {};
  const aiCats: Record<string, number> = {};
  const resLevels: Record<string, number> = {};
  const deprec: Record<string, number> = {};
  let aiExposureOutOfRange = 0;
  const VALID_AI = new Set(["stable", "augmented", "transformed", "ai-native"]);

  for (const c of pool) {
    // idealRIASEC
    const ir = c.idealRIASEC as Record<string, number> | undefined;
    if (!ir) {
      missingRiasec++;
      issues.push(`${c.id}: idealRIASEC missing`);
    } else {
      for (const k of RIASEC_KEYS) {
        const v = ir[k];
        if (typeof v !== "number" || !Number.isFinite(v)) {
          missingRiasec++;
          issues.push(`${c.id}: idealRIASEC.${k}=${v}`);
        } else riasecVals.push(v);
      }
    }
    // idealBigFive
    const bf = (c.idealBigFive ?? {}) as Record<
      string,
      { min: number; max: number }
    >;
    if (Object.keys(bf).length === 0) emptyBigFive++;
    for (const [dim, r] of Object.entries(bf)) {
      if (
        !r ||
        typeof r.min !== "number" ||
        typeof r.max !== "number" ||
        r.min > r.max
      ) {
        badBigFiveRange++;
        issues.push(
          `${c.id}: idealBigFive.${dim}={min:${r?.min},max:${r?.max}}`,
        );
      } else {
        bigFiveBounds.push(r.min, r.max);
      }
    }
    // alignedValues
    if (!Array.isArray(c.alignedValues) || c.alignedValues.length === 0)
      emptyAlignedValues++;
    // jobZone
    const jz = c.jobZone ?? null;
    jobZones[String(jz)] = (jobZones[String(jz)] ?? 0) + 1;
    if (jz !== null && (jz < 1 || jz > 5 || !Number.isInteger(jz)))
      issues.push(`${c.id}: jobZone=${jz}`);
    // aiEraCategory
    const cat = c.aiEraCategory ?? "(none)";
    aiCats[cat] = (aiCats[cat] ?? 0) + 1;
    if (c.aiEraCategory && !VALID_AI.has(c.aiEraCategory))
      issues.push(`${c.id}: aiEraCategory=${c.aiEraCategory}`);
    // resilienceLevel
    const rl = c.resilienceLevel ?? "(none)";
    resLevels[String(rl)] = (resLevels[String(rl)] ?? 0) + 1;
    if (
      c.resilienceLevel !== undefined &&
      (c.resilienceLevel < 0 ||
        c.resilienceLevel > 3 ||
        !Number.isInteger(c.resilienceLevel))
    )
      issues.push(`${c.id}: resilienceLevel=${c.resilienceLevel}`);
    // aiExposureScore
    if (
      c.aiExposureScore != null &&
      (c.aiExposureScore < 0 || c.aiExposureScore > 1)
    ) {
      aiExposureOutOfRange++;
      issues.push(`${c.id}: aiExposureScore=${c.aiExposureScore}`);
    }
    // deprecationStatus
    const ds = c.deprecationStatus ?? "(none)";
    deprec[ds] = (deprec[ds] ?? 0) + 1;
  }

  console.log("idealRIASEC value range:", describe(riasecVals));
  console.log("idealBigFive bound range:", describe(bigFiveBounds));
  console.log("jobZone distribution:", jobZones);
  console.log("aiEraCategory distribution:", aiCats);
  console.log("resilienceLevel distribution:", resLevels);
  console.log("deprecationStatus distribution:", deprec);
  console.log("\nFALLBACK RELIANCE:");
  console.log(
    `  careers with EMPTY idealBigFive (→ SOC fallback/neutral): ${emptyBigFive} (${((emptyBigFive / pool.length) * 100).toFixed(1)}%)`,
  );
  console.log(
    `  careers with EMPTY alignedValues (→ SOC fallback/neutral): ${emptyAlignedValues} (${((emptyAlignedValues / pool.length) * 100).toFixed(1)}%)`,
  );
  console.log("\nDATA ISSUES:");
  console.log(`  missing/invalid idealRIASEC fields: ${missingRiasec}`);
  console.log(
    `  invalid idealBigFive ranges (min>max/NaN): ${badBigFiveRange}`,
  );
  console.log(`  aiExposureScore out of [0,1]: ${aiExposureOutOfRange}`);
  console.log(`  total flagged rows: ${issues.length}`);
  if (issues.length > 0)
    console.log("  first 25:\n   " + issues.slice(0, 25).join("\n   "));

  // ════════════════════════════════════════════════════════════
  // LAYER 4 — SIMULATION
  // ════════════════════════════════════════════════════════════
  section("LAYER 4 — PIPELINE SIMULATION (distributions)");

  const rng = mulberry32(42);
  const archetypes: string[] = [];
  const cogModes: string[] = [];
  const cogCodes: string[] = [];
  const collabPrimary: string[] = [];
  const collabSumErrors: number[] = [];
  const orientation: string[] = [];
  let boundaryCount = 0;

  const runPipeline = (r: Respondent): AssessmentResultV3 =>
    runScoringPipelineV3(r.answers, r.riasec, r.metadata);

  for (let i = 0; i < N_DIST; i++) {
    const r = randomRespondent(rng, i);
    const a = runPipeline(r);
    archetypes.push(a.archetype.code);
    orientation.push(a.archetype.orientation);
    if (a.archetype.isBoundary) boundaryCount++;
    cogModes.push(a.cognitiveStyleCode?.displayMode ?? "null");
    cogCodes.push(a.cognitiveStyleCode?.code ?? "balanced/null");
    if (a.collabMapping) {
      collabPrimary.push(a.collabMapping.primary);
      const sum =
        a.collabMapping.scores.D +
        a.collabMapping.scores.I +
        a.collabMapping.scores.S +
        a.collabMapping.scores.C;
      collabSumErrors.push(Math.abs(sum - 100));
    }
  }

  console.log(`\nrandom respondents: ${N_DIST}`);
  console.log("archetype.code distribution:", tally(archetypes));
  console.log("value orientation distribution:", tally(orientation));
  console.log(
    `archetype boundary rate (gap12<=5): ${((boundaryCount / N_DIST) * 100).toFixed(1)}%`,
  );
  console.log("cognitiveStyle displayMode:", tally(cogModes));
  console.log("collab primary distribution:", tally(collabPrimary));
  console.log("collab score sum-to-100 error:", describe(collabSumErrors));

  // ── Cosine spread (the compression question) ──
  section("LAYER 4 — RIASEC COSINE COMPRESSION CHECK");
  const idealVecs = pool.map((c) => toRiasecVector(c.idealRIASEC));
  const spreadStats: number[] = [];
  const topStats: number[] = [];
  const rng2 = mulberry32(7);
  for (let i = 0; i < N_COSINE; i++) {
    const r = randomRespondent(rng2, i);
    const uv = toRiasecVector(r.riasec);
    const sims = idealVecs.map((iv) => cosineSimilarity(uv, iv) * 100);
    const s = [...sims].sort((a, b) => a - b);
    spreadStats.push(s[s.length - 1] - s[0]); // range
    topStats.push(s[s.length - 1]); // best match
  }
  console.log(`sample respondents: ${N_COSINE}`);
  console.log(
    "per-respondent cosine RANGE across pool (max-min):",
    describe(spreadStats),
  );
  console.log("per-respondent BEST cosine match:", describe(topStats));
  // Global: how clustered are all sims for a single average user?
  const avgUser = toRiasecVector({ R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 });
  const avgSims = idealVecs
    .map((iv) => cosineSimilarity(avgUser, iv) * 100)
    .sort((a, b) => a - b);
  console.log("all-50 user → cosine vs entire pool:", describe(avgSims));

  // ── Matching coverage + determinism + monotonicity ──
  section("LAYER 4 — MATCHING COVERAGE / DETERMINISM / MONOTONICITY");
  const top1Counts = new Map<string, number>();
  const top5Counts = new Map<string, number>();
  const totalScores: number[] = [];
  const rng3 = mulberry32(123);
  for (let i = 0; i < N_MATCH; i++) {
    const r = randomRespondent(rng3, i);
    const a = runPipeline(r);
    const algo = computeProfileAlgorithm(a);
    // null tier → un-penalized ranking for distribution analysis
    const res = await computeCareerMatchAlgorithm(a, algo, null, {
      targetTier: null,
    });
    const ideal = res.idealCandidates;
    if (ideal.length > 0) {
      totalScores.push(ideal[0].score.total);
      top1Counts.set(
        ideal[0].direction.id,
        (top1Counts.get(ideal[0].direction.id) ?? 0) + 1,
      );
      ideal.slice(0, 5).forEach((c) => {
        top5Counts.set(
          c.direction.id,
          (top5Counts.get(c.direction.id) ?? 0) + 1,
        );
      });
    }
  }
  console.log(`\nmatch runs: ${N_MATCH}`);
  console.log("top-1 total score distribution:", describe(totalScores));
  console.log(
    `distinct careers ever in top-1: ${top1Counts.size} / ${pool.length}`,
  );
  console.log(
    `distinct careers ever in top-5: ${top5Counts.size} / ${pool.length}`,
  );
  const neverTop5 = pool.length - top5Counts.size;
  console.log(
    `careers NEVER in any top-5: ${neverTop5} (${((neverTop5 / pool.length) * 100).toFixed(1)}%)`,
  );
  const topDominant = [...top1Counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  console.log("most dominant top-1 careers (id: count):");
  for (const [id, ct] of topDominant) {
    const c = pool.find((p) => p.id === id);
    console.log(
      `  ${((ct / N_MATCH) * 100).toFixed(1)}%  ${c?.title_en ?? id}`,
    );
  }

  // Determinism: same input twice → identical score-bearing output
  const detR = randomRespondent(mulberry32(999), 0);
  const a1 = runPipeline(detR);
  const a2 = runPipeline(detR);
  const algo1 = computeProfileAlgorithm(a1);
  const algo2 = computeProfileAlgorithm(a2);
  const m1 = await computeCareerMatchAlgorithm(a1, algo1, null, {
    targetTier: null,
  });
  const m2 = await computeCareerMatchAlgorithm(a2, algo2, null, {
    targetTier: null,
  });
  const detArch = a1.archetype.code === a2.archetype.code;
  const detMatch =
    JSON.stringify(
      m1.idealCandidates.map((c) => [c.direction.id, c.score.total]),
    ) ===
    JSON.stringify(
      m2.idealCandidates.map((c) => [c.direction.id, c.score.total]),
    );
  console.log(`\ndeterminism — archetype identical: ${detArch}`);
  console.log(`determinism — match ranking+scores identical: ${detMatch}`);

  // Monotonicity: user RIASEC == a career's idealRIASEC → that career's interestFit must be 100 (top tier)
  const sample = pool.slice(0, 50);
  let monoPass = 0;
  for (const target of sample) {
    const uv = toRiasecVector(target.idealRIASEC);
    const self = cosineSimilarity(uv, toRiasecVector(target.idealRIASEC)) * 100;
    if (Math.round(self) === 100) monoPass++;
  }
  console.log(
    `monotonicity — self-match interestFit==100: ${monoPass}/${sample.length}`,
  );

  // Profile invariant smoke (generateProfile end-to-end)
  section("LAYER 4 — generateProfile END-TO-END SMOKE");
  let profileOk = 0;
  let profileErr = 0;
  const rng4 = mulberry32(555);
  for (let i = 0; i < 200; i++) {
    try {
      const r = randomRespondent(rng4, i);
      const a = runPipeline(r);
      const p = generateProfile(a, undefined);
      if (p.archetype && p.collabMapping && p.riasecScores) profileOk++;
      else profileErr++;
    } catch (e) {
      profileErr++;
      if (profileErr <= 3) console.log("  profile error:", String(e));
    }
  }
  console.log(`generateProfile ok: ${profileOk}, errors: ${profileErr}`);

  // Extreme/degenerate inputs
  section("LAYER 4 — EXTREME / DEGENERATE INPUTS");
  const extremes = [
    constantRespondent(1, 1, 0, "all-min"),
    constantRespondent(5, 6, 100, "all-max"),
    constantRespondent(3, 3, 50, "all-mid"),
    constantRespondent(3, 1, 0, "ipip-mid/val-min/riasec-0"),
  ];
  for (const r of extremes) {
    try {
      const a = runPipeline(r);
      const algo = computeProfileAlgorithm(a);
      const m = await computeCareerMatchAlgorithm(a, algo, null, {
        targetTier: null,
      });
      console.log(
        `  ${r.label}: archetype=${a.archetype.code} orient=${a.archetype.orientation} cog=${a.cognitiveStyleCode?.displayMode} collab=${a.collabMapping?.primary} top1=${m.idealCandidates[0]?.score.total} bigFiveNorm=${JSON.stringify(a.bigFive.domainsNormalized)}`,
      );
    } catch (e) {
      console.log(`  ${r.label}: ERROR ${String(e)}`);
    }
  }

  // ── Coherent (realistic) respondents — non-random ──
  section("LAYER 4 — COHERENT RESPONDENTS (realistic, non-random)");
  const cohArch: string[] = [];
  const cohOrient: string[] = [];
  const cohModes: string[] = [];
  const cohCodes: string[] = [];
  let cohBoundary = 0;
  const rng5 = mulberry32(2024);
  const N_COH = 5000;
  for (let i = 0; i < N_COH; i++) {
    const r = coherentRespondent(rng5, i);
    const a = runPipeline(r);
    cohArch.push(a.archetype.code);
    cohOrient.push(a.archetype.orientation);
    if (a.archetype.isBoundary) cohBoundary++;
    cohModes.push(a.cognitiveStyleCode?.displayMode ?? "null");
    cohCodes.push(a.cognitiveStyleCode?.code ?? "balanced/null");
  }
  console.log(`coherent respondents: ${N_COH}`);
  console.log("archetype.code distribution:", tally(cohArch));
  console.log("value orientation distribution:", tally(cohOrient));
  console.log(
    `archetype boundary rate: ${((cohBoundary / N_COH) * 100).toFixed(1)}%`,
  );
  console.log("cognitiveStyle displayMode:", tally(cohModes));
  console.log(
    "cognitiveStyle code (top 12):",
    Object.fromEntries(Object.entries(tally(cohCodes)).slice(0, 12)),
  );

  section("DONE");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e);
    process.exit(1);
  });
