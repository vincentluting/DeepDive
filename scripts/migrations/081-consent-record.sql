-- ============================================================
-- Migration 081 — ConsentRecord
--
-- Creates an append-only audit table for informed-consent
-- acceptances. Each participant can have multiple rows (one per
-- consent text version) so a mid-study wording change leaves a
-- frozen record of which exact version each person agreed to.
--
-- Fields:
--   consentVersion   — manual tag bumped when RESEARCH_CONSENT
--                      is edited (format YYYY-MM-DD-vN)
--   consentTextHash  — SHA-256 of the full en+zh surface at POST
--                      time; catches silent edits
--   ipAddress / userAgent / sessionId — audit context
--   withdrawnAt      — set when participant requests withdrawal
--
-- User.researchConsentAt is preserved as a convenience column
-- ("first consent timestamp"); this table is source-of-truth.
--
-- Idempotent via IF NOT EXISTS — safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS "ConsentRecord" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "consentVersion"   TEXT NOT NULL,
  "consentTextHash"  TEXT NOT NULL,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "sessionId"        TEXT,
  "agreedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "withdrawnAt"      TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_consent_user_version"
  ON "ConsentRecord"("userId", "consentVersion");
CREATE INDEX IF NOT EXISTS "idx_consent_user"
  ON "ConsentRecord"("userId");

COMMENT ON TABLE "ConsentRecord" IS
  'Immutable audit log of informed-consent acceptances. One row per (user, version). See lib/cdse/consent-version.ts for version bump workflow.';
COMMENT ON COLUMN "ConsentRecord"."consentTextHash" IS
  'SHA-256 of the en+zh consent surface at POST time — detects silent edits even when version tag did not change.';
COMMENT ON COLUMN "ConsentRecord"."withdrawnAt" IS
  'Set when participant invokes their GDPR right-to-withdraw. Row is retained (not deleted) for audit completeness.';
