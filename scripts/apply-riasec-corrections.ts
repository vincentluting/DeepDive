// ============================================================
// Apply RIASEC Corrections — batch update career directions
//
// Usage: npx tsx scripts/apply-riasec-corrections.ts
// ============================================================

import { config } from 'dotenv'
import { join } from 'path'

config({ path: join(__dirname, '..', '.env.local') })
config({ path: join(__dirname, '..', '.env') })

import { neon } from '@neondatabase/serverless'

const connStr = process.env.POSTGRES_URL || ''
const sql = neon(connStr)

interface Correction {
  id: string
  titleEn: string
  idealRiasec: { R: number; I: number; A: number; S: number; E: number; C: number }
  reasoning: string
  alignedValues?: string[]
  idealBigFive?: Record<string, { min: number; max: number }>
}

// ── Curated Corrections (56 entries) ─────────────────────────

const CURATED_CORRECTIONS: Correction[] = [
  { id: "design-001", titleEn: "UX/UI Designer", idealRiasec: { R: 40, I: 60, A: 85, S: 45, E: 20, C: 50 }, reasoning: "O*NET 15-1255.00" },
  { id: "design-003", titleEn: "Brand & Visual Designer", idealRiasec: { R: 40, I: 35, A: 95, S: 25, E: 35, C: 40 }, reasoning: "O*NET 27-1024.00" },
  { id: "design-005", titleEn: "Motion Designer", idealRiasec: { R: 55, I: 35, A: 90, S: 15, E: 15, C: 45 }, reasoning: "O*NET 27-1014.00" },
  { id: "design-006", titleEn: "Industrial / Product Design", idealRiasec: { R: 80, I: 55, A: 80, S: 20, E: 25, C: 50 }, reasoning: "O*NET 27-1021.00" },
  { id: "edu-002", titleEn: "Career Counselor / Coach", idealRiasec: { R: 10, I: 50, A: 35, S: 90, E: 45, C: 35 }, reasoning: "O*NET 21-1012.00" },
  { id: "edu-004", titleEn: "Social Innovation / Social Entrepreneur", idealRiasec: { R: 25, I: 45, A: 40, S: 70, E: 80, C: 35 }, reasoning: "O*NET 11-9151.00" },
  { id: "edu-005", titleEn: "ESG / Sustainability Consultant", idealRiasec: { R: 20, I: 65, A: 25, S: 50, E: 60, C: 60 }, reasoning: "O*NET 13-1199.05" },
  { id: "ent-001", titleEn: "Game Designer", idealRiasec: { R: 45, I: 55, A: 85, S: 30, E: 40, C: 45 }, reasoning: "O*NET 15-1255.01" },
  { id: "ent-002", titleEn: "Film / Video Producer", idealRiasec: { R: 35, I: 30, A: 80, S: 45, E: 70, C: 40 }, reasoning: "O*NET 27-2012.00" },
  { id: "entre-003", titleEn: "Content Creator / Independent Media", idealRiasec: { R: 30, I: 30, A: 85, S: 50, E: 55, C: 25 }, reasoning: "O*NET 27-3043.00 + 27-2012.00" },
  { id: "entre-004", titleEn: "E-commerce / DTC Brand Builder", idealRiasec: { R: 35, I: 40, A: 45, S: 30, E: 80, C: 55 }, reasoning: "O*NET 11-2022.00" },
  { id: "fin-001", titleEn: "Investment Analyst", idealRiasec: { R: 15, I: 80, A: 10, S: 20, E: 55, C: 80 }, reasoning: "O*NET 13-2051.00" },
  { id: "fin-002", titleEn: "Risk Analyst / Risk Manager", idealRiasec: { R: 15, I: 75, A: 10, S: 25, E: 45, C: 85 }, reasoning: "O*NET 13-2054.00" },
  { id: "fin-003", titleEn: "Financial Planning & Analysis", idealRiasec: { R: 15, I: 65, A: 10, S: 25, E: 55, C: 85 }, reasoning: "O*NET 13-2051.00" },
  { id: "fin-004", titleEn: "Quantitative Researcher / Developer", idealRiasec: { R: 40, I: 95, A: 10, S: 10, E: 25, C: 75 }, reasoning: "O*NET 13-2099.01" },
  { id: "health-002", titleEn: "Psychologist / Therapist", idealRiasec: { R: 10, I: 70, A: 35, S: 95, E: 20, C: 35 }, reasoning: "O*NET 19-3033.00" },
  { id: "health-003", titleEn: "Bioinformatics / Computational Biology", idealRiasec: { R: 50, I: 95, A: 15, S: 15, E: 10, C: 75 }, reasoning: "O*NET 15-2099.01 + 19-1029.01" },
  { id: "hr-001", titleEn: "HR Business Partner", idealRiasec: { R: 10, I: 35, A: 15, S: 75, E: 65, C: 55 }, reasoning: "O*NET 11-3121.00" },
  { id: "hr-002", titleEn: "Talent Acquisition / Recruiter", idealRiasec: { R: 10, I: 30, A: 15, S: 65, E: 75, C: 50 }, reasoning: "O*NET 13-1071.00" },
  { id: "hr-003", titleEn: "Organization Development / L&D", idealRiasec: { R: 15, I: 55, A: 35, S: 75, E: 55, C: 50 }, reasoning: "O*NET 11-3131.00 + 13-1151.00" },
  { id: "intl-003", titleEn: "International Organization / NGO Officer", idealRiasec: { R: 15, I: 50, A: 20, S: 70, E: 65, C: 55 }, reasoning: "O*NET 11-9151.00" },
  { id: "legal-001", titleEn: "Corporate Counsel / Compliance Manager", idealRiasec: { R: 10, I: 65, A: 10, S: 35, E: 55, C: 85 }, reasoning: "O*NET 11-9199.02 + 23-1011.00" },
  { id: "legal-002", titleEn: "IP / Technology Law", idealRiasec: { R: 15, I: 70, A: 15, S: 30, E: 55, C: 75 }, reasoning: "O*NET 23-1011.00" },
  { id: "lifestyle-001", titleEn: "Sustainable Fashion / Green Brand", idealRiasec: { R: 45, I: 30, A: 75, S: 40, E: 55, C: 35 }, reasoning: "O*NET 27-1022.00" },
  { id: "lifestyle-002", titleEn: "Food & Beverage Entrepreneur", idealRiasec: { R: 65, I: 25, A: 45, S: 50, E: 70, C: 40 }, reasoning: "O*NET 11-9051.00 + 35-1011.00" },
  { id: "misc-003", titleEn: "QA / Test Engineer", idealRiasec: { R: 55, I: 65, A: 10, S: 20, E: 15, C: 85 }, reasoning: "O*NET 15-1253.00" },
  { id: "misc-005", titleEn: "Corporate Trainer / Facilitator", idealRiasec: { R: 15, I: 45, A: 40, S: 80, E: 60, C: 35 }, reasoning: "O*NET 13-1151.00" },
  { id: "misc-006", titleEn: "Accountant / Auditor", idealRiasec: { R: 15, I: 50, A: 5, S: 25, E: 40, C: 95 }, reasoning: "O*NET 13-2011.00" },
  { id: "misc-007", titleEn: "Event Planner / Conference Manager", idealRiasec: { R: 30, I: 20, A: 40, S: 60, E: 70, C: 60 }, reasoning: "O*NET 13-1121.00" },
  { id: "misc-008", titleEn: "Environmental Engineer / Renewable Energy", idealRiasec: { R: 80, I: 75, A: 15, S: 30, E: 30, C: 60 }, reasoning: "O*NET 17-2081.00 + 17-2199.03" },
  { id: "misc-010", titleEn: "Clinical Trial Project Manager", idealRiasec: { R: 25, I: 60, A: 10, S: 45, E: 50, C: 80 }, reasoning: "O*NET 15-2051.02 + 11-9121.01" },
  { id: "mktg-001", titleEn: "Content Strategist", idealRiasec: { R: 15, I: 50, A: 70, S: 40, E: 55, C: 45 }, reasoning: "O*NET 13-1161.01 + 13-1161.00" },
  { id: "mktg-003", titleEn: "Brand Manager", idealRiasec: { R: 15, I: 45, A: 55, S: 35, E: 80, C: 50 }, reasoning: "O*NET 11-2021.00" },
  { id: "mktg-004", titleEn: "Public Relations / Corporate Communications", idealRiasec: { R: 10, I: 35, A: 55, S: 55, E: 75, C: 45 }, reasoning: "O*NET 27-3031.00 + 11-2032.00" },
  { id: "mktg-005", titleEn: "Social Media / Influencer Manager", idealRiasec: { R: 20, I: 35, A: 65, S: 55, E: 65, C: 35 }, reasoning: "O*NET 11-2021.00 + 27-3031.00" },
  { id: "ops-001", titleEn: "Operations Manager", idealRiasec: { R: 45, I: 40, A: 10, S: 40, E: 70, C: 80 }, reasoning: "O*NET 11-1021.00" },
  { id: "ops-002", titleEn: "Project Manager", idealRiasec: { R: 25, I: 40, A: 15, S: 45, E: 70, C: 75 }, reasoning: "O*NET 13-1082.00 + 15-1299.09" },
  { id: "ops-003", titleEn: "Supply Chain / Logistics Manager", idealRiasec: { R: 50, I: 45, A: 10, S: 30, E: 60, C: 80 }, reasoning: "O*NET 11-3071.04 + 13-1081.00" },
  { id: "product-002", titleEn: "Growth Manager", idealRiasec: { R: 25, I: 60, A: 25, S: 35, E: 75, C: 55 }, reasoning: "O*NET 11-2021.00" },
  { id: "realestate-001", titleEn: "Architect", idealRiasec: { R: 75, I: 55, A: 70, S: 30, E: 35, C: 60 }, reasoning: "O*NET 17-1011.00" },
  { id: "realestate-002", titleEn: "Real Estate Investment / Asset Management", idealRiasec: { R: 30, I: 50, A: 10, S: 30, E: 80, C: 75 }, reasoning: "O*NET 11-9141.00 + 41-9021.00" },
  { id: "research-001", titleEn: "Academic Researcher / Postdoc", idealRiasec: { R: 35, I: 95, A: 30, S: 35, E: 20, C: 55 }, reasoning: "O*NET 19-3022.00" },
  { id: "research-002", titleEn: "Industry Research Analyst", idealRiasec: { R: 15, I: 80, A: 20, S: 25, E: 50, C: 70 }, reasoning: "O*NET 13-1161.00 + 15-2031.00" },
  { id: "research-003", titleEn: "Think Tank Researcher / Policy Analyst", idealRiasec: { R: 10, I: 85, A: 30, S: 45, E: 45, C: 55 }, reasoning: "O*NET 19-2041.01 + 19-3094.00" },
  { id: "sales-001", titleEn: "Enterprise Sales / Key Account Manager", idealRiasec: { R: 15, I: 30, A: 15, S: 50, E: 90, C: 50 }, reasoning: "O*NET 11-2022.00 + 41-4011.00" },
  { id: "sales-003", titleEn: "Pre-Sales / Solutions Consultant", idealRiasec: { R: 35, I: 55, A: 20, S: 50, E: 65, C: 55 }, reasoning: "O*NET 41-4011.00" },
  { id: "tech-001", titleEn: "Full-Stack Software Engineer", idealRiasec: { R: 60, I: 75, A: 30, S: 20, E: 20, C: 70 }, reasoning: "O*NET 15-1252.00 + 15-1254.00" },
  { id: "tech-002", titleEn: "Data Scientist", idealRiasec: { R: 35, I: 90, A: 25, S: 20, E: 25, C: 75 }, reasoning: "O*NET 15-2051.00" },
  { id: "tech-003", titleEn: "AI / Machine Learning Engineer", idealRiasec: { R: 55, I: 85, A: 20, S: 15, E: 20, C: 65 }, reasoning: "O*NET 15-1252.00 + 15-1221.00" },
  { id: "tech-004", titleEn: "DevOps / Platform Engineer", idealRiasec: { R: 70, I: 65, A: 10, S: 20, E: 15, C: 85 }, reasoning: "O*NET 15-1244.00" },
  { id: "tech-005", titleEn: "Cybersecurity Analyst", idealRiasec: { R: 55, I: 80, A: 10, S: 20, E: 25, C: 80 }, reasoning: "O*NET 15-1212.00 + 15-1299.04" },
  { id: "tech-006", titleEn: "Mobile App Developer", idealRiasec: { R: 55, I: 70, A: 40, S: 25, E: 20, C: 65 }, reasoning: "O*NET 15-1252.00 + 15-1254.00" },
  { id: "tech-008", titleEn: "Embedded Systems Engineer", idealRiasec: { R: 80, I: 80, A: 10, S: 10, E: 15, C: 70 }, reasoning: "O*NET 17-2199.06" },
  { id: "write-001", titleEn: "Technical Writer / Documentation Engineer", idealRiasec: { R: 30, I: 55, A: 60, S: 30, E: 20, C: 70 }, reasoning: "O*NET 27-3042.00" },
  { id: "write-002", titleEn: "Translator / Interpreter", idealRiasec: { R: 15, I: 50, A: 60, S: 50, E: 25, C: 60 }, reasoning: "O*NET 27-3091.00" },
  { id: "write-003", titleEn: "Editor / Publishing Strategist", idealRiasec: { R: 10, I: 45, A: 75, S: 35, E: 45, C: 55 }, reasoning: "O*NET 27-3041.00" },
]

// ── Apply corrections ────────────────────────────────────────

async function main() {
  console.log('🔬 Applying RIASEC corrections...\n')

  const corrections = [...CURATED_CORRECTIONS]

  // Emerging corrections were a one-time import from /tmp; no longer needed.
  // Curated corrections above are the complete set.

  console.log(`  Total corrections to apply: ${corrections.length}\n`)

  let applied = 0
  let failed = 0

  for (const c of corrections) {
    try {
      await sql`
        UPDATE "CareerDirection"
        SET
          "idealRiasec" = ${JSON.stringify(c.idealRiasec)},
          "annotationConfidence" = 'data-validated',
          "updatedAt" = NOW(),
          "lastReviewedAt" = NOW()
        WHERE "id" = ${c.id}
      `
      applied++
      if (applied % 20 === 0) process.stdout.write(`  Applied: ${applied}/${corrections.length}\r`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  ❌ Failed: ${c.id} — ${msg}`)
      failed++
    }
  }

  console.log(`\n✅ Done! Applied: ${applied}, Failed: ${failed}`)

  // Verify
  const stats = await sql`
    SELECT
      "annotationConfidence",
      COUNT(*)::int AS count
    FROM "CareerDirection"
    WHERE "source" IN ('curated', 'emerging')
    GROUP BY "annotationConfidence"
    ORDER BY "annotationConfidence"
  `
  console.log('\n📊 Confidence levels after update:')
  for (const row of stats) {
    console.log(`   ${row.annotationConfidence}: ${row.count}`)
  }
}

main().catch((err) => {
  console.error('❌ Script failed:', err)
  process.exit(1)
})
