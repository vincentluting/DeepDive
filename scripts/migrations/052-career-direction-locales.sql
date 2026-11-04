-- Migration 052: Add multi-locale title support to CareerDirection
-- Stores translations as JSONB: {"nl": "...", "de": "...", "fr": "...", ...}
-- Fallback chain: titleLocales[locale] → titleEn

ALTER TABLE "CareerDirection"
  ADD COLUMN IF NOT EXISTS "titleLocales" JSONB NOT NULL DEFAULT '{}';

-- Populate initial translations from titleEn for common job titles
-- This uses titleEn as the source since most are standard international titles
-- A follow-up data script will provide proper translations
