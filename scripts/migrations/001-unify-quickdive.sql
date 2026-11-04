-- ============================================================
-- Migration 001: Unify QuickExplore → QuickDive
--
-- Run manually in Neon Console (cannot be run via ORM).
-- This migration:
--   1. Adds missing exploreMode column to QuickExploreResult
--   2. Migrates data from QuickExploreResult → QuickDiveResult
--   3. Drops the old QuickExploreResult table
--   4. Renames quickexplore_* events in UserFunnel to quickdive_*
-- ============================================================

BEGIN;

-- 1. QuickExploreResult 缺少 exploreMode 列，先补上
ALTER TABLE "QuickExploreResult"
  ADD COLUMN IF NOT EXISTS "exploreMode" TEXT NOT NULL DEFAULT 'narrative';

-- 2. 将 QuickExploreResult 的数据迁移到 QuickDiveResult
--    使用 ON CONFLICT 防止 ID 冲突（虽然当前 QuickDiveResult 为空）
INSERT INTO "QuickDiveResult" ("id", "scoresJson", "archetypeCode", "archetypeLabel", "language", "userId", "resultDataJson", "exploreMode", "createdAt")
SELECT "id", "scoresJson", "archetypeCode", "archetypeLabel", "language", "userId", "resultDataJson", "exploreMode", "createdAt"
FROM "QuickExploreResult"
ON CONFLICT ("id") DO NOTHING;

-- 3. 删除旧表
DROP TABLE IF EXISTS "QuickExploreResult";

-- 4. 统一 UserFunnel 事件名
UPDATE "UserFunnel" SET "event" = 'quickdive_started'   WHERE "event" = 'quickexplore_started';
UPDATE "UserFunnel" SET "event" = 'quickdive_completed'  WHERE "event" = 'quickexplore_completed';

-- 5. 删除 QuickExploreResult 相关的残留索引（如果存在）
DROP INDEX IF EXISTS "idx_quickexplore_archetype";
DROP INDEX IF EXISTS "idx_quickexplore_user";
DROP INDEX IF EXISTS "idx_quick_explore_user";

COMMIT;
