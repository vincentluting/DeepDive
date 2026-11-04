// End-to-end verification: feed a Ace-archetype-like profile (high E + high S)
// through the career matching engine and confirm the painful low-tier careers
// are no longer in the Top 3.

import { config } from "dotenv";
import { join } from "path";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

import { explore } from "../lib/career-matching/engine";

// Mock Ace-archetype profile (E-enhancement): high E + S, mid-high others.
const ACE_PROFILE = {
  riasec: { R: 45, I: 50, A: 50, S: 70, E: 75, C: 55 },
  bigFive: {
    openness: 65,
    conscientiousness: 65,
    extraversion: 75,
    agreeableness: 60,
    neuroticism: 45,
  },
  schwartz: {
    top3: ["achievement", "power", "stimulation"],
    centered: {
      achievement: 1.5,
      power: 1.2,
      stimulation: 0.8,
      "self-direction": 0.4,
      hedonism: 0.2,
      benevolence: 0.0,
      universalism: -0.3,
      conformity: -0.6,
      tradition: -1.0,
      security: -1.2,
    },
  },
};

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Verification — Ace profile (high E + S)");
  console.log("═══════════════════════════════════════════════════════════");

  // 1. Default targetTier (4-5 white-collar)
  console.log("\n─── Default: targetTier {4, 5} (white-collar default) ───");
  const defaultResult = await explore(ACE_PROFILE, { count: 5 });
  console.log("\nTop 5 best-fit:");
  for (const c of defaultResult.composed["best-fit"]) {
    console.log(
      `  ${c.totalScore.toString().padStart(3)} | Zone ${c.jobZone ?? "?"} | ${c.inTargetTier ? "✓in-band" : "✗cross-tier"} | ${c.title_en}`,
    );
  }

  // Check pain points
  const painIds = [
    "onet-39-7011.00", // 导游
    "onet-35-3031.00", // 服务员
    "onet-39-5094.00", // 皮肤护理师
    "onet-35-9011.00", // 餐厅服务助手
  ];
  console.log("\n  Pain-point careers (should be far from top):");
  for (const id of painIds) {
    const idx = defaultResult.allScored.findIndex((c) => c.id === id);
    const score = defaultResult.allScored[idx];
    if (score) {
      console.log(
        `    rank ${(idx + 1).toString().padStart(4)} | score ${score.totalScore} | ${score.title_en}`,
      );
    }
  }

  // 2. Disabled (targetTier: null) — what would Top 5 look like without tier-aware ranking
  console.log("\n─── Disabled: targetTier null (pre-fix behavior) ───");
  const disabledResult = await explore(ACE_PROFILE, {
    count: 5,
    targetTier: null,
  });
  console.log("\nTop 5 best-fit:");
  for (const c of disabledResult.composed["best-fit"]) {
    console.log(
      `  ${c.totalScore.toString().padStart(3)} | Zone ${c.jobZone ?? "?"} | ${c.title_en}`,
    );
  }

  console.log("\n  Pain-point ranks (pre-fix):");
  for (const id of painIds) {
    const idx = disabledResult.allScored.findIndex((c) => c.id === id);
    const score = disabledResult.allScored[idx];
    if (score) {
      console.log(
        `    rank ${(idx + 1).toString().padStart(4)} | score ${score.totalScore} | ${score.title_en}`,
      );
    }
  }

  // 3. Blue-collar band (currentTier 2-3) — sanity check that algorithm respects user's tier
  console.log(
    "\n─── Blue-collar: targetTier {2, 3} (career-changer scenario) ───",
  );
  const blueCollarResult = await explore(ACE_PROFILE, {
    count: 5,
    targetTier: { min: 2, max: 3 },
  });
  console.log("\nTop 5 best-fit:");
  for (const c of blueCollarResult.composed["best-fit"]) {
    console.log(
      `  ${c.totalScore.toString().padStart(3)} | Zone ${c.jobZone ?? "?"} | ${c.inTargetTier ? "✓in-band" : "✗cross-tier"} | ${c.title_en}`,
    );
  }

  console.log("\n✓ End-to-end verification complete");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
