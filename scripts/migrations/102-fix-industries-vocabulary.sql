-- Migration 102: Normalize CareerDirection.industries to the canonical
-- 40-id vocabulary in lib/constants/industries.ts.
--
-- Why: industry pre-filter (filterByIndustry, lib/types/report.ts) does exact
-- string matching against lowercase vocabulary ids. Production audit
-- (2026-06-11) found 197 distinct out-of-vocabulary values across 1,142/1,148
-- rows (O*NET rows use capitalized free text like 'Technology'; curated rows
-- use legacy short ids like 'tech'; migration 045 emerging rows use free text
-- like 'AI/ML'). These rows can never match a user's selected industry.
-- Must run BEFORE migration 103 (importing 48 lowercase-vocab rows would push
-- per-industry hit counts past the >=10 filter-activation threshold while the
-- legacy rows are still invisible, silently excluding all O*NET tech careers).
--
-- 187 values are mapped (one-to-many allowed); 10 values with no reasonable
-- vocabulary equivalent are kept as-is (documented below) pending a future
-- vocabulary extension decision:
--   Management, Office, Administrative, Business, Building, Operations,
--   Remote-First Companies, Corporate, Customer Service, Remote Work
--
-- Also fixes legacy marketOutlook shape ({demandTrend,estimatedOpenings,
-- salaryRange}) on the 2 surviving active rows from migration 045 (the other
-- 6 are soft-deleted by migration 104).
--
-- Rollback:
--   UPDATE "CareerDirection" d SET industries = b.industries
--   FROM "CareerDirectionIndustriesBackup202606" b WHERE d.id = b.id;
-- Backup table is dropped manually after a burn-in week.

BEGIN;

-- 1. Backup current values for rollback
CREATE TABLE IF NOT EXISTS "CareerDirectionIndustriesBackup202606" AS
SELECT id, industries, "marketOutlook" FROM "CareerDirection";

-- 2. Vocabulary normalization
WITH
  vocab(id) AS (VALUES ('technology'),('ai_ml'),('data_analytics'),('cybersecurity'),('fintech'),('finance'),('investment'),('insurance'),('accounting'),('consulting'),('legal'),('hr'),('marketing'),('pr'),('healthcare'),('biotech'),('pharma'),('education'),('design'),('media'),('entertainment'),('fashion'),('arts'),('publishing'),('engineering'),('automotive'),('aerospace'),('architecture'),('telecom'),('energy'),('environmental'),('government'),('nonprofit'),('international'),('retail'),('hospitality'),('agriculture'),('logistics'),('sports'),('freelance')),
  map(bad, good) AS (VALUES
    ('Manufacturing', ARRAY['engineering']),
    ('Production', ARRAY['engineering']),
    ('Healthcare', ARRAY['healthcare']),
    ('Technology', ARRAY['technology']),
    ('Finance', ARRAY['finance']),
    ('Education', ARRAY['education']),
    ('Research', ARRAY['education']),
    ('Construction', ARRAY['engineering']),
    ('Trades', ARRAY['engineering']),
    ('Science', ARRAY['education']),
    ('Architecture', ARRAY['architecture']),
    ('Maintenance', ARRAY['engineering']),
    ('Engineering', ARRAY['engineering']),
    ('Media', ARRAY['media']),
    ('Entertainment', ARRAY['entertainment']),
    ('Logistics', ARRAY['logistics']),
    ('Transportation', ARRAY['automotive']),
    ('Repair', ARRAY['engineering']),
    ('Arts', ARRAY['arts']),
    ('Computing', ARRAY['technology']),
    ('AI/ML', ARRAY['ai_ml']),
    ('Personal Care', ARRAY['hospitality']),
    ('Service', ARRAY['hospitality']),
    ('Protective Services', ARRAY['government']),
    ('Sales', ARRAY['retail']),
    ('Consulting', ARRAY['consulting']),
    ('Healthcare Support', ARRAY['healthcare']),
    ('Hospitality', ARRAY['hospitality']),
    ('Food Service', ARRAY['hospitality']),
    ('Agriculture', ARRAY['agriculture']),
    ('Enterprise Software', ARRAY['technology']),
    ('Marketing', ARRAY['marketing']),
    ('Community', ARRAY['nonprofit']),
    ('Social Services', ARRAY['nonprofit']),
    ('Government', ARRAY['government']),
    ('Fishing', ARRAY['agriculture']),
    ('Forestry', ARRAY['agriculture']),
    ('SaaS', ARRAY['technology']),
    ('Advertising', ARRAY['marketing']),
    ('E-Commerce', ARRAY['retail']),
    ('Enterprise', ARRAY['technology']),
    ('Gaming', ARRAY['entertainment']),
    ('Blockchain', ARRAY['fintech']),
    ('Cloud Computing', ARRAY['technology']),
    ('Legal', ARRAY['legal']),
    ('Cybersecurity', ARRAY['cybersecurity']),
    ('EdTech', ARRAY['education','technology']),
    ('Pharma', ARRAY['pharma']),
    ('Web3', ARRAY['fintech']),
    ('DeFi', ARRAY['fintech']),
    ('Social Media', ARRAY['media']),
    ('Consumer Tech', ARRAY['technology']),
    ('Crypto', ARRAY['fintech']),
    ('HR Tech', ARRAY['hr','technology']),
    ('Retail', ARRAY['retail']),
    ('Creator Economy', ARRAY['media']),
    ('E-commerce', ARRAY['retail']),
    ('Health Tech', ARRAY['healthcare','technology']),
    ('Sustainability', ARRAY['environmental']),
    ('Biotech', ARRAY['biotech']),
    ('XR/VR', ARRAY['technology']),
    ('Academic Research', ARRAY['education']),
    ('Climate Tech', ARRAY['environmental','technology']),
    ('Corporate Training', ARRAY['hr']),
    ('Defense', ARRAY['aerospace']),
    ('Design', ARRAY['design']),
    ('Energy', ARRAY['energy']),
    ('Film', ARRAY['entertainment']),
    ('FinTech', ARRAY['fintech']),
    ('IoT', ARRAY['technology']),
    ('Publishing', ARRAY['publishing']),
    ('Startups', ARRAY['freelance']),
    ('Aerospace', ARRAY['aerospace']),
    ('Automation', ARRAY['technology']),
    ('Autonomous Vehicles', ARRAY['automotive']),
    ('Beauty & Fashion', ARRAY['fashion']),
    ('Brand Strategy', ARRAY['marketing']),
    ('Clean Energy', ARRAY['energy']),
    ('Consumer Goods', ARRAY['retail']),
    ('Consumer Products', ARRAY['retail']),
    ('DAO', ARRAY['fintech']),
    ('E-Learning', ARRAY['education']),
    ('Higher Education', ARRAY['education']),
    ('Immigration Services', ARRAY['legal']),
    ('Insurance', ARRAY['insurance']),
    ('Medical Devices', ARRAY['healthcare']),
    ('Online Learning', ARRAY['education']),
    ('Robotics', ARRAY['engineering']),
    ('Smart Cities', ARRAY['technology']),
    ('Agriculture Tech', ARRAY['agriculture','technology']),
    ('Animation', ARRAY['entertainment']),
    ('Audiobooks', ARRAY['publishing']),
    ('Automotive', ARRAY['automotive']),
    ('Compliance', ARRAY['legal']),
    ('Consumer Electronics', ARRAY['technology']),
    ('Corporate Strategy', ARRAY['consulting']),
    ('Creative Agency', ARRAY['design']),
    ('Cryptography', ARRAY['cybersecurity']),
    ('Data Services', ARRAY['data_analytics']),
    ('Diagnostics', ARRAY['healthcare']),
    ('Digital Art', ARRAY['arts']),
    ('Digital Therapeutics', ARRAY['healthcare']),
    ('Entrepreneurship', ARRAY['freelance']),
    ('Fashion', ARRAY['fashion']),
    ('Fintech', ARRAY['fintech']),
    ('GameFi', ARRAY['fintech']),
    ('Genomics', ARRAY['biotech']),
    ('Global Employment', ARRAY['hr']),
    ('Governance', ARRAY['government']),
    ('Healthcare Tech', ARRAY['healthcare','technology']),
    ('Healthcare Training', ARRAY['healthcare','education']),
    ('Industrial Design', ARRAY['design']),
    ('Infrastructure', ARRAY['engineering']),
    ('Intelligence', ARRAY['government']),
    ('International Business', ARRAY['international']),
    ('International Trade', ARRAY['international']),
    ('K-12 Education', ARRAY['education']),
    ('Law Enforcement', ARRAY['government']),
    ('Localization', ARRAY['media']),
    ('Longevity', ARRAY['healthcare']),
    ('Luxury', ARRAY['fashion']),
    ('Luxury Brands', ARRAY['fashion']),
    ('MCN', ARRAY['media']),
    ('Management Consulting', ARRAY['consulting']),
    ('Materials Science', ARRAY['engineering']),
    ('Mental Health', ARRAY['healthcare']),
    ('Multinational Corporations', ARRAY['international']),
    ('Music', ARRAY['entertainment']),
    ('Non-Profit', ARRAY['nonprofit']),
    ('Open Source', ARRAY['technology']),
    ('People Operations', ARRAY['hr']),
    ('Photography', ARRAY['arts']),
    ('Privacy Tech', ARRAY['cybersecurity']),
    ('Procurement', ARRAY['logistics']),
    ('Product Design', ARRAY['design']),
    ('Professional Certification', ARRAY['education']),
    ('Quantum Computing', ARRAY['technology']),
    ('Real Estate', ARRAY['architecture']),
    ('Recruiting', ARRAY['hr']),
    ('Regulatory', ARRAY['legal']),
    ('Social Enterprise', ARRAY['nonprofit']),
    ('Staffing', ARRAY['hr']),
    ('Supply Chain', ARRAY['logistics']),
    ('Telemedicine', ARRAY['healthcare']),
    ('Television', ARRAY['media']),
    ('Training', ARRAY['education']),
    ('Travel Tech', ARRAY['hospitality','technology']),
    ('UX Research', ARRAY['design']),
    ('Utilities', ARRAY['energy']),
    ('Venture Capital', ARRAY['investment']),
    ('Wellness', ARRAY['healthcare']),
    ('tech', ARRAY['technology']),
    ('ecommerce', ARRAY['retail']),
    ('saas', ARRAY['technology']),
    ('non-profit', ARRAY['nonprofit']),
    ('manufacturing', ARRAY['engineering']),
    ('advertising', ARRAY['marketing']),
    ('ai', ARRAY['ai_ml']),
    ('consumer-goods', ARRAY['retail']),
    ('research', ARRAY['education']),
    ('design-agency', ARRAY['design']),
    ('gaming', ARRAY['entertainment']),
    ('luxury', ARRAY['fashion']),
    ('social-media', ARRAY['media']),
    ('sustainability', ARRAY['environmental']),
    ('cloud', ARRAY['technology']),
    ('construction', ARRAY['engineering']),
    ('health-tech', ARRAY['healthcare','technology']),
    ('real-estate', ARRAY['architecture']),
    ('academia', ARRAY['education']),
    ('autonomous-vehicles', ARRAY['automotive']),
    ('corporate-training', ARRAY['hr']),
    ('ed-tech', ARRAY['education','technology']),
    ('enterprise', ARRAY['technology']),
    ('food-beverage', ARRAY['agriculture']),
    ('furniture', ARRAY['design']),
    ('hedge-fund', ARRAY['investment']),
    ('international-org', ARRAY['international']),
    ('iot', ARRAY['technology']),
    ('private-equity', ARRAY['investment']),
    ('recruiting-agency', ARRAY['hr']),
    ('robotics', ARRAY['engineering']),
    ('social-enterprise', ARRAY['nonprofit']),
    ('startup', ARRAY['freelance']),
    ('trade', ARRAY['international']),
    ('trading', ARRAY['investment']),
    ('translation', ARRAY['media'])
  ),
  fixed AS (
    SELECT d.id, array_agg(DISTINCT x ORDER BY x) AS new_industries
    FROM "CareerDirection" d
    CROSS JOIN LATERAL unnest(d.industries) AS ind
    CROSS JOIN LATERAL unnest(
      CASE
        WHEN ind IN (SELECT v.id FROM vocab v) THEN ARRAY[ind]
        ELSE COALESCE((SELECT m.good FROM map m WHERE m.bad = ind), ARRAY[ind])
      END
    ) AS x
    GROUP BY d.id
  )
UPDATE "CareerDirection" d
SET industries = f.new_industries, "updatedAt" = NOW()
FROM fixed f
WHERE d.id = f.id
  AND d.industries IS DISTINCT FROM f.new_industries;

-- 3. Fix legacy marketOutlook shape on the 2 surviving migration-045 rows
UPDATE "CareerDirection"
SET "marketOutlook" = '{"trend":"growing","label_zh":"AI 工作流设计需求快速增长","label_en":"Fast-growing demand for AI workflow design","source":"Migration 045 estimate (2026-03), normalized 2026-06","lastUpdated":"2026-06"}'::jsonb,
    "updatedAt" = NOW()
WHERE id = 'emerging-ai-workflow-architect';

UPDATE "CareerDirection"
SET "marketOutlook" = '{"trend":"growing","label_zh":"人机体验设计岗位持续增长","label_en":"Sustained growth in human-AI experience design","source":"Migration 045 estimate (2026-03), normalized 2026-06","lastUpdated":"2026-06"}'::jsonb,
    "updatedAt" = NOW()
WHERE id = 'emerging-human-experience-designer';

COMMIT;
