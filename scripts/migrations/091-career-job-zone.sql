-- Migration 091 — Add jobZone (O*NET Job Zone 1-5) to CareerDirection
--
-- Problem: Career matching algorithm has no concept of professional level.
-- Users with high RIASEC scores get matched to tour guides / waiters / etc.
-- because cosine similarity on social (S) dimension matches strongly,
-- regardless of socio-economic tier.
--
-- Solution: Adopt O*NET Job Zone (1-5), a public CC-BY 4.0 framework that
-- classifies occupations by required preparation (education + experience).
-- Default white-collar audience targets Job Zone 4-5; lower zones get a
-- post-scoring penalty so they sink to the "cross-tier exploration" section
-- rather than disappearing.
--
-- Job Zone semantics (O*NET 30.2):
--   1 = reserved (O*NET 30.2 merged zones 1+2 → only 2-5 occur in data)
--   2 = Job Zone 1-2: little / some preparation     (waiters, attendants)
--   3 = medium preparation                          (electricians, tour guides, skincare)
--   4 = considerable preparation (bachelor's typical) (managers, designers, engineers)
--   5 = extensive preparation (graduate degree typical) (lawyers, surgeons, executives)
--
-- jobZoneSource records provenance — 'onet-official' for ~923 rows from
-- O*NET Job Zones.txt (CC-BY 4.0), 'llm-batch' for ~225 curated/emerging
-- rows that have no SOC code and require LLM inference, 'manual' for human
-- overrides discovered during audit.

ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "jobZone" INTEGER
  CHECK ("jobZone" IS NULL OR ("jobZone" >= 1 AND "jobZone" <= 5));

ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "jobZoneSource" TEXT
  CHECK (
    "jobZoneSource" IS NULL OR
    "jobZoneSource" IN ('onet-official', 'llm-batch', 'manual')
  );

ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "jobZoneConfidence" REAL
  CHECK (
    "jobZoneConfidence" IS NULL OR
    ("jobZoneConfidence" >= 0 AND "jobZoneConfidence" <= 1)
  );

CREATE INDEX IF NOT EXISTS "idx_career_dir_job_zone"
  ON "CareerDirection"("jobZone")
  WHERE "jobZone" IS NOT NULL;
