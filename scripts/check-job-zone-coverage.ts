// Phase 2.5 — Job Zone coverage assertion + manual spot-check samples.
// Delete after audit.

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { join } from "path";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

const url =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;
if (!url) throw new Error("Missing POSTGRES_URL");
const sql = neon(url);

async function main() {
  console.log("=== 1. Coverage assertion ===");
  const nullCount = await sql`
    SELECT COUNT(*)::int AS count FROM "CareerDirection" WHERE "jobZone" IS NULL
  `;
  console.log(
    `  jobZone IS NULL: ${(nullCount[0] as { count: number }).count}`,
  );

  console.log("\n=== 2. Distribution by source × jobZone ===");
  const dist = await sql`
    SELECT "jobZoneSource", "jobZone", COUNT(*)::int AS count
    FROM "CareerDirection"
    GROUP BY "jobZoneSource", "jobZone"
    ORDER BY "jobZoneSource", "jobZone"
  `;
  console.table(dist);

  console.log("\n=== 3. Pain-point careers (user complaint) ===");
  const painPoints = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneSource", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE id IN ('onet-39-7011.00', 'onet-35-3031.00', 'onet-39-5094.00', 'onet-35-9011.00')
  `;
  console.table(painPoints);

  console.log("\n=== 4. High-end controls (should be jobZone 5) ===");
  const highEnd = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneSource", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE "titleEn" ILIKE 'Chief Executives'
       OR "titleEn" ILIKE 'Lawyers'
       OR "titleEn" ILIKE 'Surgeons'
       OR "titleEn" ILIKE 'Physicians%'
    LIMIT 6
  `;
  console.table(highEnd);

  console.log("\n=== 5. LLM-inferred curated samples (8 random) ===");
  const curated = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE "jobZoneSource" = 'llm-batch' AND source = 'curated'
    ORDER BY random()
    LIMIT 8
  `;
  console.table(curated);

  console.log("\n=== 6. LLM-inferred emerging samples (8 random) ===");
  const emerging = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE "jobZoneSource" = 'llm-batch' AND source = 'emerging'
    ORDER BY random()
    LIMIT 8
  `;
  console.table(emerging);

  console.log(
    "\n=== 7. LLM-inferred Job Zone 3 (unexpected — investigate) ===",
  );
  const lowConfLlm = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE "jobZoneSource" = 'llm-batch' AND "jobZone" = 3
  `;
  console.table(lowConfLlm);

  console.log("\n=== 8. LLM-inferred Job Zone 5 ===");
  const llmZone5 = await sql`
    SELECT id, "titleZh", "titleEn", "jobZone", "jobZoneConfidence"
    FROM "CareerDirection"
    WHERE "jobZoneSource" = 'llm-batch' AND "jobZone" = 5
  `;
  console.table(llmZone5);

  console.log("\n=== 9. Total distribution ===");
  const total = await sql`
    SELECT "jobZone", COUNT(*)::int AS count,
           ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM "CareerDirection"), 1) AS pct
    FROM "CareerDirection"
    GROUP BY "jobZone"
    ORDER BY "jobZone"
  `;
  console.table(total);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
