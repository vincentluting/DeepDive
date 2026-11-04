-- Migration 089 — CompanionReport (Trust & Safety report queue)
--
-- Reports surface in /admin/companion-reports for human triage.
-- v1 has no automated moderation; the founder reviews manually.
--
-- reviewedBy uses ON DELETE SET NULL (not CASCADE) so an admin's
-- own account deletion does not erase the audit trail.

CREATE TABLE IF NOT EXISTS "CompanionReport" (
  "id"          TEXT PRIMARY KEY,
  "reporterId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reportedId"  TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason"      TEXT NOT NULL
                CHECK ("reason" IN ('harassment', 'inappropriate_content', 'spam', 'other')),
  "details"     TEXT,
  "status"      TEXT NOT NULL DEFAULT 'open'
                CHECK ("status" IN ('open', 'reviewed', 'dismissed')),
  "reviewedBy"  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "reviewedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "companion_report_no_self"
    CHECK ("reporterId" <> "reportedId"),
  CONSTRAINT "companion_report_details_length"
    CHECK (char_length("details") <= 1000)
);

CREATE INDEX IF NOT EXISTS "idx_companion_report_open"
  ON "CompanionReport"("createdAt")
  WHERE "status" = 'open';
CREATE INDEX IF NOT EXISTS "idx_companion_report_reported"
  ON "CompanionReport"("reportedId");
