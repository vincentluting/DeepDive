-- ============================================================
-- 008: Standardize timestamp columns to TIMESTAMPTZ
--
-- Converts four TIMESTAMP WITHOUT TIME ZONE columns to TIMESTAMPTZ
-- (TIMESTAMP WITH TIME ZONE) for consistency with the rest of the
-- schema and to ensure correct UTC-aware storage:
--
--   User.createdAt     TIMESTAMP WITHOUT TIME ZONE → TIMESTAMPTZ
--   User.updatedAt     TIMESTAMP WITHOUT TIME ZONE → TIMESTAMPTZ
--   UserSession.expiresAt  TIMESTAMP WITHOUT TIME ZONE → TIMESTAMPTZ
--   UserSession.createdAt  TIMESTAMP WITHOUT TIME ZONE → TIMESTAMPTZ
--
-- Existing values are reinterpreted as UTC (AT TIME ZONE 'UTC'),
-- which is correct because all timestamps were written by NOW()
-- running in a UTC-configured Neon Postgres instance.
--
-- Idempotency: The USING clause is a no-op if the column is already
-- TIMESTAMPTZ; PostgreSQL will simply skip the rewrite if the types
-- are already compatible.  Running this migration twice is safe.
-- ============================================================

BEGIN;

-- User.createdAt
ALTER TABLE "User"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ
  USING "createdAt" AT TIME ZONE 'UTC';

-- User.updatedAt
ALTER TABLE "User"
  ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ
  USING "updatedAt" AT TIME ZONE 'UTC';

-- UserSession.expiresAt
ALTER TABLE "UserSession"
  ALTER COLUMN "expiresAt" TYPE TIMESTAMPTZ
  USING "expiresAt" AT TIME ZONE 'UTC';

-- UserSession.createdAt
ALTER TABLE "UserSession"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ
  USING "createdAt" AT TIME ZONE 'UTC';

COMMIT;
