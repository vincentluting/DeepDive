-- ============================================================
-- Migration 070: Tighten timestamp columns to NOT NULL
-- ============================================================
--
-- Context: Several timestamp columns have `DEFAULT NOW()` but
-- are missing an explicit `NOT NULL` constraint. In practice the
-- application never writes NULL to these columns — the default
-- always fires — but the type system (and the codegen'd
-- lib/db/schema-generated.ts) had to treat them as nullable,
-- forcing every caller to null-check values that can never be
-- null in practice.
--
-- This migration tightens the constraint so the schema matches
-- reality. Discovered 2026-04-08 during Phase 2 of the schema
-- source-of-truth consolidation (scripts/generate-db-types.ts).
--
-- Safety: each statement first backfills any stray NULL values
-- with NOW() (there should be none, but the backfill is cheap
-- and makes the SET NOT NULL guaranteed to succeed). The
-- constraint is then added with a single DDL statement.
--
-- Rollback (DOWN) is provided at the bottom for completeness,
-- though reverting would reintroduce the nullability gap and
-- should be avoided.
-- ============================================================

BEGIN;

-- PageVisit.createdAt
UPDATE "PageVisit" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
ALTER TABLE "PageVisit" ALTER COLUMN "createdAt" SET NOT NULL;

-- ReportReaction.createdAt
UPDATE "ReportReaction" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
ALTER TABLE "ReportReaction" ALTER COLUMN "createdAt" SET NOT NULL;

-- User.createdAt + updatedAt
UPDATE "User" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "User" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- UserProfile.createdAt + lastUpdated
UPDATE "UserProfile" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
UPDATE "UserProfile" SET "lastUpdated" = NOW() WHERE "lastUpdated" IS NULL;
ALTER TABLE "UserProfile" ALTER COLUMN "createdAt" SET NOT NULL;
ALTER TABLE "UserProfile" ALTER COLUMN "lastUpdated" SET NOT NULL;

-- UserSession.createdAt
UPDATE "UserSession" SET "createdAt" = NOW() WHERE "createdAt" IS NULL;
ALTER TABLE "UserSession" ALTER COLUMN "createdAt" SET NOT NULL;

COMMIT;

-- ============================================================
-- DOWN (for reference only — do not run without reason)
-- ============================================================
-- BEGIN;
-- ALTER TABLE "PageVisit"     ALTER COLUMN "createdAt" DROP NOT NULL;
-- ALTER TABLE "ReportReaction" ALTER COLUMN "createdAt" DROP NOT NULL;
-- ALTER TABLE "User"          ALTER COLUMN "createdAt" DROP NOT NULL;
-- ALTER TABLE "User"          ALTER COLUMN "updatedAt" DROP NOT NULL;
-- ALTER TABLE "UserProfile"   ALTER COLUMN "createdAt" DROP NOT NULL;
-- ALTER TABLE "UserProfile"   ALTER COLUMN "lastUpdated" DROP NOT NULL;
-- ALTER TABLE "UserSession"   ALTER COLUMN "createdAt" DROP NOT NULL;
-- COMMIT;
