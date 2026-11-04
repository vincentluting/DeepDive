// Temporary diagnostic: verify CareerDirection.id format across sources.
// Used to decide whether Phase 2.1 (O*NET official mapping) can directly
// key on `id` or needs a separate `socCode` column.
// Delete after Phase 2 is complete.

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

if (!url) {
  console.error("No POSTGRES_URL / DATABASE_URL found in environment");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  const counts = await sql`
    SELECT source, COUNT(*)::int AS count
    FROM "CareerDirection"
    GROUP BY source
    ORDER BY source
  `;
  console.log("=== Counts by source ===");
  console.table(counts);

  const onetSamples = await sql`
    SELECT id, "titleEn"
    FROM "CareerDirection"
    WHERE source = 'onet'
    ORDER BY id
    LIMIT 8
  `;
  console.log("\n=== O*NET source — id samples ===");
  console.table(onetSamples);

  const curatedSamples = await sql`
    SELECT id, "titleEn"
    FROM "CareerDirection"
    WHERE source = 'curated'
    ORDER BY id
    LIMIT 8
  `;
  console.log("\n=== curated source — id samples ===");
  console.table(curatedSamples);

  const emergingSamples = await sql`
    SELECT id, "titleEn"
    FROM "CareerDirection"
    WHERE source = 'emerging'
    ORDER BY id
    LIMIT 8
  `;
  console.log("\n=== emerging source — id samples ===");
  console.table(emergingSamples);

  // The 3 careers that triggered the user complaint
  const painPoints = await sql`
    SELECT id, source, "titleEn", "titleZh"
    FROM "CareerDirection"
    WHERE "titleZh" IN ('导游', '皮肤护理师', '餐厅服务助手', '餐厅服务员')
       OR "titleEn" ILIKE '%tour guide%'
       OR "titleEn" ILIKE '%skincare%'
       OR "titleEn" ILIKE '%waiter%'
       OR "titleEn" ILIKE '%dining room%'
    LIMIT 10
  `;
  console.log("\n=== Pain-point careers (user complaint) ===");
  console.table(painPoints);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
