-- Migration 030: Add missing FK constraints to feedback/measurement tables
-- Fixes data integrity gaps: orphan records after report/session deletion
-- Also adds admin event filtering to UserFunnel
--
-- Uses DO blocks for idempotency (constraints may partially exist from prior manual fixes)

-- ── 1. ReportReaction → CareerReport FK ──────────────────────
DELETE FROM "ReportReaction"
WHERE "reportId" NOT IN (SELECT "id" FROM "CareerReport");

DO $$ BEGIN
  ALTER TABLE "ReportReaction"
    ADD CONSTRAINT "fk_reportreaction_report"
    FOREIGN KEY ("reportId") REFERENCES "CareerReport"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. ReportNPS → CareerReport FK ───────────────────────────
DELETE FROM "ReportNPS"
WHERE "reportId" NOT IN (SELECT "id" FROM "CareerReport");

DO $$ BEGIN
  ALTER TABLE "ReportNPS"
    ADD CONSTRAINT "fk_reportnps_report"
    FOREIGN KEY ("reportId") REFERENCES "CareerReport"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 3. CoachingFeedback → CoachingSession FK ─────────────────
DELETE FROM "CoachingFeedback"
WHERE "sessionId" NOT IN (SELECT "id" FROM "CoachingSession");

DO $$ BEGIN
  ALTER TABLE "CoachingFeedback"
    ADD CONSTRAINT "fk_coachingfeedback_session"
    FOREIGN KEY ("sessionId") REFERENCES "CoachingSession"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. CDSEResponse → CoachingSession FK ─────────────────────
DELETE FROM "CDSEResponse"
WHERE "sessionId" IS NOT NULL
  AND "sessionId" NOT IN (SELECT "id" FROM "CoachingSession");

DO $$ BEGIN
  ALTER TABLE "CDSEResponse"
    ADD CONSTRAINT "fk_cdseresponse_session"
    FOREIGN KEY ("sessionId") REFERENCES "CoachingSession"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. CDSEResponse → User FK ────────────────────────────────
DELETE FROM "CDSEResponse"
WHERE "userId" IS NOT NULL
  AND "userId" NOT IN (SELECT "id" FROM "User");

DO $$ BEGIN
  ALTER TABLE "CDSEResponse"
    ADD CONSTRAINT "fk_cdseresponse_user"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. Add isAdmin column to UserFunnel for admin event filtering ──
ALTER TABLE "UserFunnel" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN DEFAULT FALSE;

-- Backfill existing admin events
UPDATE "UserFunnel" uf
SET "isAdmin" = TRUE
FROM "User" u
WHERE uf."userId" = u."id" AND u."isAdmin" = TRUE;

-- Index for filtering out admin events in analytics queries
CREATE INDEX IF NOT EXISTS "idx_userfunnel_isadmin"
  ON "UserFunnel"("isAdmin") WHERE "isAdmin" = TRUE;
