-- Migration 032: CareerDirection — unified career direction library
-- Replaces static TypeScript files with a database-managed career pool.
-- Source: career-directions-db.ts (82) + career-directions-emerging.ts (136) + career-directions-onet.ts (923)

CREATE TABLE IF NOT EXISTS "CareerDirection" (
  "id"                    TEXT PRIMARY KEY,
  "source"                TEXT NOT NULL CHECK ("source" IN ('curated', 'onet', 'emerging')),
  "titleEn"               TEXT NOT NULL,
  "titleZh"               TEXT NOT NULL,
  "subtitleZh"            TEXT,
  "idealRiasec"           JSONB NOT NULL,
  "alignedValues"         TEXT[] NOT NULL DEFAULT '{}',
  "idealBigFive"          JSONB DEFAULT '{}',
  "industries"            TEXT[] NOT NULL DEFAULT '{}',
  "crossCulturalFit"      TEXT[] NOT NULL DEFAULT '{}',
  "seniorityMin"          INTEGER NOT NULL DEFAULT 0,
  "seniorityMax"          INTEGER NOT NULL DEFAULT 20,
  "tags"                  TEXT[] NOT NULL DEFAULT '{}',
  "annotationSource"      TEXT NOT NULL CHECK ("annotationSource" IN ('expert-heuristic', 'empirical-data', 'ai-assisted')),
  "annotationConfidence"  TEXT NOT NULL CHECK ("annotationConfidence" IN ('expert-estimated', 'data-validated', 'community-verified')),
  "marketOutlook"         JSONB,
  "isActive"              BOOLEAN NOT NULL DEFAULT TRUE,
  "lastReviewedAt"        TIMESTAMPTZ,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_dir_source ON "CareerDirection"("source");
CREATE INDEX IF NOT EXISTS idx_career_dir_active ON "CareerDirection"("isActive") WHERE "isActive" = TRUE;
CREATE INDEX IF NOT EXISTS idx_career_dir_industries ON "CareerDirection" USING gin("industries");
CREATE INDEX IF NOT EXISTS idx_career_dir_tags ON "CareerDirection" USING gin("tags");
CREATE INDEX IF NOT EXISTS idx_career_dir_updated ON "CareerDirection"("updatedAt" DESC);
