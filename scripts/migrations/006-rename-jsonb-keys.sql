-- ============================================================
-- 006: Rename legacy JSONB keys
--
-- 1. AssessmentResult.resultJson: rename moduleTimes keys for v3.0
--    pvq → ddvq, ipip → ipip30 (only for pipelineVersion='3.0')
--    Also rename itemResponseTimes keys.
--
-- 2. AssessmentResult.resultJson: rename discMapping → collabMapping
--    (all versions)
--
-- 3. CareerReport.headerJson: rename discMapping → collabMapping
--
-- 4. PersonalProfile.profileJson: rename discMapping → collabMapping
-- ============================================================

BEGIN;

-- ── 1a. Rename moduleTimes keys in v3.0 AssessmentResults ──

UPDATE "AssessmentResult"
SET "resultJson" = jsonb_set(
  "resultJson",
  '{meta,moduleTimes}',
  jsonb_build_object(
    'sjt',    "resultJson"->'meta'->'moduleTimes'->'sjt',
    'ddvq',   "resultJson"->'meta'->'moduleTimes'->'pvq',
    'ipip30', "resultJson"->'meta'->'moduleTimes'->'ipip'
  )
)
WHERE "resultJson"->>'pipelineVersion' = 'v3.0'
  AND "resultJson"->'meta'->'moduleTimes'->'pvq' IS NOT NULL;

-- ── 1b. Rename itemResponseTimes keys in v3.0 AssessmentResults ──

UPDATE "AssessmentResult"
SET "resultJson" = jsonb_set(
  "resultJson",
  '{meta,itemResponseTimes}',
  jsonb_build_object(
    'sjt',    COALESCE("resultJson"->'meta'->'itemResponseTimes'->'sjt', '{}'::jsonb),
    'ddvq',   COALESCE("resultJson"->'meta'->'itemResponseTimes'->'pvq', '{}'::jsonb),
    'ipip30', COALESCE("resultJson"->'meta'->'itemResponseTimes'->'ipip', '{}'::jsonb)
  )
)
WHERE "resultJson"->>'pipelineVersion' = 'v3.0'
  AND "resultJson"->'meta'->'itemResponseTimes' IS NOT NULL
  AND "resultJson"->'meta'->'itemResponseTimes'->'pvq' IS NOT NULL;

-- ── 2. Rename discMapping → collabMapping in AssessmentResult ──

UPDATE "AssessmentResult"
SET "resultJson" = ("resultJson" - 'discMapping')
  || jsonb_build_object('collabMapping', "resultJson"->'discMapping')
WHERE "resultJson" ? 'discMapping';

-- ── 3. Rename discMapping → collabMapping in CareerReport.headerJson ──

UPDATE "CareerReport"
SET "headerJson" = ("headerJson" - 'discMapping')
  || jsonb_build_object('collabMapping', "headerJson"->'discMapping')
WHERE "headerJson" ? 'discMapping';

-- ── 4. Rename discMapping → collabMapping in PersonalProfile.profileJson ──

UPDATE "PersonalProfile"
SET "profileJson" = ("profileJson" - 'discMapping')
  || jsonb_build_object('collabMapping', "profileJson"->'discMapping')
WHERE "profileJson" ? 'discMapping';

COMMIT;
