-- Migration 094 — CareerReport per-section provider provenance + quality score
--
-- WHY: 99%+ quality plan (L2 + L3) needs to know which LLM provider wrote
-- each section of a report. Currently `degradedSections` only tells us a
-- section fell to algorithmic fallback. It does NOT tell us:
--   - whether the LLM was Claude vs Gemini fallback (silent degradation)
--   - whether the output passed quality gates (length / fields / language)
--
-- llmProviderMap: { "careerMatch": "anthropic", "careerPathway": "openai", ... }
-- qualityScore:   0.00–1.00 — share of LLM sections that hit primary AND passed gates
-- degradedSections: text[] (mirrors meta.degradedSections; promoted to a column
--                   so admin queries don't need to JSONB-walk reportJson)

ALTER TABLE "CareerReport"
  ADD COLUMN IF NOT EXISTS "llmProviderMap"   JSONB,
  ADD COLUMN IF NOT EXISTS "qualityScore"     NUMERIC(3,2) CHECK ("qualityScore" >= 0 AND "qualityScore" <= 1),
  ADD COLUMN IF NOT EXISTS "degradedSections" TEXT[] NOT NULL DEFAULT '{}';

-- Index for admin dashboard "show reports with degraded sections" query
CREATE INDEX IF NOT EXISTS "idx_report_quality_score"
  ON "CareerReport" ("qualityScore" ASC NULLS FIRST, "createdAt" DESC)
  WHERE "qualityScore" IS NOT NULL AND "qualityScore" < 1.0;
