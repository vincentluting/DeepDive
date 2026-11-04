// ============================================================
// Seed Script — Import career directions into DB (ARCHIVED)
//
// This script was used for initial data migration from static .ts files.
// Static source files have been deleted (data lives in DB now).
// Kept for reference only — do not run.
// ============================================================

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env.local') })
config({ path: join(__dirname, '..', '.env') })

import type { CareerDirectionTemplate } from '../lib/types/report'

// Static source files deleted — data is in DB
const CAREER_DIRECTIONS_DB: CareerDirectionTemplate[] = []
const CAREER_DIRECTIONS_EMERGING: CareerDirectionTemplate[] = []
const CAREER_DIRECTIONS_ONET: CareerDirectionTemplate[] = []

// Direct neon import for script context (not going through the app's connection wrapper)
import { neon } from '@neondatabase/serverless'

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING

if (!connectionString) {
  console.error('❌ No database connection string found. Set POSTGRES_URL or DATABASE_URL.')
  process.exit(1)
}

const sql = neon(connectionString)

// ── Source mapping ───────────────────────────────

type Source = 'curated' | 'onet' | 'emerging'

// ── Insert logic ─────────────────────────────────

async function insertBatch(
  directions: CareerDirectionTemplate[],
  source: Source,
  batchLabel: string,
): Promise<number> {
  let inserted = 0

  // Process in chunks of 50 to avoid query size limits
  const CHUNK_SIZE = 50
  for (let i = 0; i < directions.length; i += CHUNK_SIZE) {
    const chunk = directions.slice(i, i + CHUNK_SIZE)

    for (const d of chunk) {
      try {
        await sql`
          INSERT INTO "CareerDirection" (
            "id", "source", "titleEn", "titleZh", "subtitleZh",
            "idealRiasec", "alignedValues", "idealBigFive",
            "industries", "crossCulturalFit", "seniorityMin", "seniorityMax",
            "tags", "annotationSource", "annotationConfidence", "marketOutlook",
            "lastReviewedAt"
          ) VALUES (
            ${d.id},
            ${source},
            ${d.title_en},
            ${d.title_zh},
            ${d.subtitle_zh || null},
            ${JSON.stringify(d.idealRIASEC)},
            ${d.alignedValues},
            ${JSON.stringify(d.idealBigFive || {})},
            ${d.industries},
            ${d.crossCulturalFit},
            ${d.seniorityRange?.minYears ?? 0},
            ${d.seniorityRange?.maxYears ?? 99},
            ${d.tags},
            ${d.annotationSource},
            ${d.annotationConfidence},
            ${d.marketOutlook ? JSON.stringify(d.marketOutlook) : null},
            ${d.lastReviewedAt ? new Date(d.lastReviewedAt) : new Date()}
          )
          ON CONFLICT ("id") DO NOTHING
        `
        inserted++
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        console.error(`  ⚠️  Failed to insert ${d.id}: ${msg}`)
      }
    }

    // Progress log
    const processed = Math.min(i + CHUNK_SIZE, directions.length)
    process.stdout.write(`  ${batchLabel}: ${processed}/${directions.length}\r`)
  }

  console.log(`  ${batchLabel}: ${inserted}/${directions.length} inserted`)
  return inserted
}

// ── Main ─────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding CareerDirection table...\n')

  // Check if table exists
  try {
    const check = await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection"`
    const existing = check[0].count as number
    if (existing > 0) {
      console.log(`ℹ️  Table already has ${existing} rows. New entries will be added (duplicates skipped).\n`)
    }
  } catch {
    console.error('❌ CareerDirection table does not exist. Run migration 032 first.')
    console.error('   npx tsx scripts/run-migrations.ts')
    process.exit(1)
  }

  // 1. Curated (82)
  await insertBatch(CAREER_DIRECTIONS_DB, 'curated', '📘 Curated')

  // 2. Emerging (136)
  await insertBatch(CAREER_DIRECTIONS_EMERGING, 'emerging', '🚀 Emerging')

  // 3. O*NET (923)
  await insertBatch(CAREER_DIRECTIONS_ONET, 'onet', '🏛️  O*NET')

  // Final count
  const finalCount = await sql`SELECT COUNT(*)::int AS count FROM "CareerDirection"`
  console.log(`\n✅ Done! Total rows in CareerDirection: ${finalCount[0].count}`)

  // Stats
  const stats = await sql`
    SELECT "source", COUNT(*)::int AS count
    FROM "CareerDirection"
    GROUP BY "source"
    ORDER BY "source"
  `
  console.log('\n📊 By source:')
  for (const row of stats) {
    console.log(`   ${row.source}: ${row.count}`)
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
