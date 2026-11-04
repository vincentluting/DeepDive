-- Migration 068: Drop CDSEResponse table
-- CDSE-SF removed in questionnaire v4.3 (replaced by CDC-5).
-- No research users have submitted CDSE data; table is empty.

DROP TABLE IF EXISTS "CDSEResponse" CASCADE;
