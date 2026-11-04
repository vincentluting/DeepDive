// ============================================================
// Backfill UserMemory.embedding for existing rows.
//
// Migration 106 added the embedding column nullable, so all pre-existing
// memories start with NULL embeddings and fall back to keyword retrieval until
// backfilled. This script generates embeddings for them in batches.
//
// Idempotent + resumable: only processes rows where embedding IS NULL. Safe to
// re-run after an interruption or a partial OpenAI outage.
//
// Usage:
//   npx tsx scripts/backfill-memory-embeddings.ts            # apply
//   npx tsx scripts/backfill-memory-embeddings.ts --dry-run  # count only
//   npx tsx scripts/backfill-memory-embeddings.ts --limit 200
// ============================================================

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { join } from "path";
import {
  getEmbeddingsBatch,
  isEmbeddingAvailable,
  toVectorLiteral,
  EMBEDDING_MODEL_ID,
} from "../lib/ai/embeddings";

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? Number(process.argv[LIMIT_IDX + 1]) : Infinity;
const BATCH_SIZE = 100;

const url =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error("Missing POSTGRES_URL / DATABASE_URL");
  process.exit(1);
}

const sql = neon(url);

// Keep in sync with buildMemoryEmbeddingText in lib/db/memory.ts — the write
// path and the backfill must embed identical text, or vectors won't be
// comparable across rows created before vs after migration 106.
function embeddingText(row: { keyword: string; insight: string }): string {
  return `${row.keyword}. ${row.insight}`;
}

async function main() {
  if (!isEmbeddingAvailable()) {
    console.error("OPENAI_API_KEY not set — cannot generate embeddings.");
    process.exit(1);
  }

  const countRows = (await sql`
    SELECT COUNT(*)::int AS count FROM "UserMemory"
    WHERE "embedding" IS NULL AND "isActive" = TRUE
  `) as { count: number }[];
  const pending = countRows[0]?.count ?? 0;
  console.log(`Pending (embedding IS NULL, active): ${pending}`);

  if (DRY_RUN) {
    console.log("--dry-run: no changes made.");
    return;
  }
  if (pending === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let processed = 0;
  let failed = 0;

  while (processed < LIMIT) {
    const take = Math.min(BATCH_SIZE, LIMIT - processed);
    const rows = (await sql`
      SELECT "id", "keyword", "insight" FROM "UserMemory"
      WHERE "embedding" IS NULL AND "isActive" = TRUE
      ORDER BY "createdAt" ASC
      LIMIT ${take}
    `) as { id: string; keyword: string; insight: string }[];

    if (rows.length === 0) break;

    let embeddings: number[][];
    try {
      embeddings = await getEmbeddingsBatch(rows.map(embeddingText));
    } catch (err) {
      console.error(
        "Batch embedding failed — stopping (re-run to resume from here):",
        err instanceof Error ? err.message : err,
      );
      break;
    }

    for (let i = 0; i < rows.length; i++) {
      const emb = embeddings[i];
      if (!emb) {
        failed++;
        continue;
      }
      await sql`
        UPDATE "UserMemory"
        SET "embedding" = ${toVectorLiteral(emb)}::vector,
            "embeddingModel" = ${EMBEDDING_MODEL_ID},
            "embeddedAt" = NOW()
        WHERE "id" = ${rows[i].id}
      `;
      processed++;
    }

    console.log(
      `Progress: ${processed} embedded${failed ? `, ${failed} failed` : ""}`,
    );
  }

  console.log(`Done. Embedded ${processed}, failed ${failed}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
