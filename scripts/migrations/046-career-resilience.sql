-- Migration 046: Add CRS (Career Resilience Score) columns to CareerDirection
-- Source: CRS v2 Multi-Outcome Fusion model (798 O*NET → 1,140 DD directions)
-- External validation: r=-0.432 vs Frey & Osborne automation probability
--
-- resilienceScore: 0.0-1.0 continuous score from CRS model
-- resilienceLevel: 0-3 categorical (0=highly vulnerable, 1=vulnerable, 2=resilient, 3=highly resilient)
--
-- Usage in matching engine:
--   Level 0 → excluded from career pool (pre-filter)
--   Level 1 → -15 score penalty (post-scoring)
--   Level 2-3 → no modification

ALTER TABLE "CareerDirection" ADD COLUMN IF NOT EXISTS "resilienceScore" REAL;
ALTER TABLE "CareerDirection" ADD COLUMN IF NOT EXISTS "resilienceLevel" INTEGER CHECK ("resilienceLevel" >= 0 AND "resilienceLevel" <= 3);

CREATE INDEX IF NOT EXISTS idx_career_dir_resilience_level ON "CareerDirection"("resilienceLevel") WHERE "resilienceLevel" IS NOT NULL;
