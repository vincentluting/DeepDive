-- ============================================================
-- Migration 080 — QuickDiveResult.chibiGender
--
-- Adds a nullable column to persist the user-selected chibi
-- avatar gender (male|female) for 12-archetype visual profiles.
--
-- NULL = not selected → frontend falls back to a deterministic
-- hash of archetypeCode so the same archetype always renders
-- with the same chibi across share-links and cold-start Profile
-- visits.
--
-- Idempotent via IF NOT EXISTS — safe to re-run.
-- ============================================================

ALTER TABLE "QuickDiveResult"
  ADD COLUMN IF NOT EXISTS "chibiGender" VARCHAR(10) NULL;

COMMENT ON COLUMN "QuickDiveResult"."chibiGender" IS
  'User-selected chibi avatar gender (male|female). NULL = not selected; frontend uses archetypeCode hash fallback.';
