-- ============================================================
-- 002: Renumber migration tracking entries
--
-- Renames old non-sequential filenames in _migrations table
-- so they match the new sequential numbering (003, 004, 005).
-- On fresh databases, this is a no-op (no rows to update).
-- ============================================================

UPDATE "_migrations" SET "filename" = '003-audit-cleanup.sql'
  WHERE "filename" = '007-audit-cleanup.sql';

UPDATE "_migrations" SET "filename" = '004-research-participant.sql'
  WHERE "filename" = '008-research-participant.sql';

UPDATE "_migrations" SET "filename" = '005-exploration-progress.sql'
  WHERE "filename" = '009-exploration-progress.sql';
