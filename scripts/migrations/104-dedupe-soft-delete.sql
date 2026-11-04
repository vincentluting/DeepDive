-- Migration 104: Soft-delete 12 duplicate career directions (2026-06 dedupe).
--
-- Why: career-library-duplicates-2026-06.md identified 9 high-confidence
-- duplicate groups. Duplicates amplify recommendation convergence — e.g. the
-- AI Product Manager triplet meant MBA-profile users could see the same role
-- occupy multiple top-8 slots. Soft delete (isActive=FALSE) keeps historical
-- report references intact (reports snapshot content; getCareerDirection(id)
-- still resolves) and is fully reversible.
--
-- Keeper per group chosen by objective completeness ranking (production data,
-- 2026-06-11): annotationConfidence (data-validated > expert-estimated)
-- → idealBigFive dimension count → marketOutlook canonical shape
-- → resilienceLevel presence. Verification query preserved below.
--
-- | Group                  | Keeper                  | Soft-deleted                              |
-- |------------------------|-------------------------|-------------------------------------------|
-- | AI Product Manager ×3  | emerging-ai-biz-033     | ai-001, emerging-ai-product-manager       |
-- | Prompt Engineer ×3     | emerging-ai-004         | ai-003, emerging-prompt-engineer          |
-- | AI Ethics ×3           | emerging-ai-biz-036     | ai-002, emerging-ai-ethics-officer        |
-- | AI Data Curator ×2     | emerging-ai-011         | emerging-ai-data-curator                  |
-- | AI Creative Director ×2| emerging-ai-creative-019| emerging-ai-creative-director             |
-- | Data Scientist ×2      | onet-15-2051.00         | tech-002 (onet row has aiExposureScore)   |
-- | Learning Exp Designer×2| emerging-edtech-099     | edu-001                                   |
-- | Game Designer ×2       | onet-15-1255.01         | ent-001 (onet row has aiExposureScore)    |
-- | MLOps / AI Infra ×2    | emerging-ai-018         | emerging-mlops-engineer                   |
--
-- Keeper-selection verification query (run against production 2026-06-11):
--   SELECT id, "annotationConfidence",
--          (SELECT count(*) FROM jsonb_object_keys("idealBigFive")) AS bf_dims,
--          ("marketOutlook" ? 'label_zh') AS outlook_canonical,
--          "resilienceLevel" IS NOT NULL AS has_resilience
--   FROM "CareerDirection"
--   WHERE id IN ('<group ids>') ORDER BY id;
--
-- Rollback:
--   UPDATE "CareerDirection" SET "isActive" = TRUE, "updatedAt" = NOW()
--   WHERE id IN (12 ids below);

BEGIN;

UPDATE "CareerDirection"
SET "isActive" = FALSE, "updatedAt" = NOW()
WHERE "isActive" = TRUE
  AND id IN (
    'ai-001',
    'emerging-ai-product-manager',
    'ai-003',
    'emerging-prompt-engineer',
    'ai-002',
    'emerging-ai-ethics-officer',
    'emerging-ai-data-curator',
    'emerging-ai-creative-director',
    'tech-002',
    'edu-001',
    'ent-001',
    'emerging-mlops-engineer'
  );

COMMIT;
