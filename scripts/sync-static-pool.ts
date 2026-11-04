#!/usr/bin/env npx tsx
// ============================================================
// Sync static-pool.json from database
//
// Exports all active career directions with RIASEC vectors
// and aiEraCategory for client-side Quick Dive matching.
//
// Usage: npx tsx scripts/sync-static-pool.ts
// ============================================================

import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(__dirname, '..', '.env.local') })
config({ path: join(__dirname, '..', '.env') })
import { writeFileSync } from 'fs'

async function main() {
  // Dynamic import to pick up env
  const { sql } = await import('../lib/db/connection')

  const rows = await sql`
    SELECT
      id,
      "titleZh",
      "titleEn",
      "idealRiasec",
      "aiEraCategory",
      "resilienceLevel"
    FROM "CareerDirection"
    WHERE "isActive" = TRUE
    ORDER BY id
  `

  const pool = rows.map((r) => ({
    id: r.id as string,
    zh: r.titleZh as string,
    en: r.titleEn as string,
    r: (r.idealRiasec as Record<string, number>).R,
    i: (r.idealRiasec as Record<string, number>).I,
    a: (r.idealRiasec as Record<string, number>).A,
    s: (r.idealRiasec as Record<string, number>).S,
    e: (r.idealRiasec as Record<string, number>).E,
    c: (r.idealRiasec as Record<string, number>).C,
    ai: (r.aiEraCategory as string) ?? null,
    rl: (r.resilienceLevel as number) ?? null,
  }))

  const outPath = join(__dirname, '..', 'lib', 'career-matching', 'static-pool.json')
  writeFileSync(outPath, JSON.stringify(pool))

  console.log(`✓ Wrote ${pool.length} careers to static-pool.json`)
  console.log(`  ai-native: ${pool.filter(p => p.ai === 'ai-native').length}`)
  console.log(`  augmented: ${pool.filter(p => p.ai === 'augmented').length}`)
  console.log(`  transformed: ${pool.filter(p => p.ai === 'transformed').length}`)
  console.log(`  stable: ${pool.filter(p => p.ai === 'stable').length}`)
  console.log(`  resilience L0: ${pool.filter(p => p.rl === 0).length}`)
  console.log(`  resilience L1: ${pool.filter(p => p.rl === 1).length}`)
  console.log(`  resilience L2: ${pool.filter(p => p.rl === 2).length}`)
  console.log(`  resilience L3: ${pool.filter(p => p.rl === 3).length}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
