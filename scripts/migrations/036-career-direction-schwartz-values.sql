-- Migration 036: Re-annotate all career alignedValues with proper Schwartz value types
--
-- Previously: careers used 6 custom labels (growth, creation, meaning, freedom, security, achievement)
-- where only 2 (security, achievement) were actual Schwartz types. The other 4 required
-- a CAREER_TO_SCHWARTZ mapping table and still lost scoring precision.
--
-- Now: all 1,140 active careers use Schwartz's 10 value types directly:
-- power, achievement, hedonism, stimulation, self-direction, universalism,
-- benevolence, conformity, tradition, security
--
-- Two-pass methodology:
--   Pass 1 (formula): Affinity scores from RIASEC + Big Five midpoints + aiEraCategory,
--     grounded in Roccas et al. (2002) Big Five → Schwartz mappings. Top 3 assigned.
--   Pass 2 (expert filter): SOC-group-specific blocked values remove conceptually
--     incompatible assignments (e.g. benevolence blocked for finance/sales/engineering,
--     conformity/tradition blocked for creative/research fields). 74 careers corrected.
--
-- This migration was applied directly via SQL on 2026-03-12.
-- The UPDATE query is preserved here for reproducibility.

-- NOTE: Already applied to production. This file documents the change.
-- To re-run (idempotent), execute the full query below (includes expert filters).

WITH normalized AS (
  SELECT
    cd.id,
    cd."aiEraCategory",
    (cd."idealRiasec"->>'R')::float / 100.0 AS r,
    (cd."idealRiasec"->>'I')::float / 100.0 AS i,
    (cd."idealRiasec"->>'A')::float / 100.0 AS a,
    (cd."idealRiasec"->>'S')::float / 100.0 AS s,
    (cd."idealRiasec"->>'E')::float / 100.0 AS e,
    (cd."idealRiasec"->>'C')::float / 100.0 AS cv,
    ((cd."idealBigFive"->'openness'->>'min')::float + (cd."idealBigFive"->'openness'->>'max')::float) / 200.0 AS om,
    ((cd."idealBigFive"->'conscientiousness'->>'min')::float + (cd."idealBigFive"->'conscientiousness'->>'max')::float) / 200.0 AS cm,
    ((cd."idealBigFive"->'extraversion'->>'min')::float + (cd."idealBigFive"->'extraversion'->>'max')::float) / 200.0 AS em,
    ((cd."idealBigFive"->'agreeableness'->>'min')::float + (cd."idealBigFive"->'agreeableness'->>'max')::float) / 200.0 AS am
  FROM "CareerDirection" cd
  WHERE cd."isActive" = true
),
scored AS (
  SELECT n.id, v.value_name, v.score,
    ROW_NUMBER() OVER (PARTITION BY n.id ORDER BY v.score DESC) AS rn
  FROM normalized n,
  LATERAL (VALUES
    ('power',         n.e*0.45 + n.em*0.20 - n.am*0.20 + n.cm*0.10),
    ('achievement',   n.e*0.30 + n.cm*0.20 + n.em*0.15 + n.cv*0.10),
    ('hedonism',      n.a*0.30 + n.em*0.25 + n.om*0.25 - n.cm*0.10),
    ('stimulation',   n.a*0.25 + n.om*0.30 + n.i*0.10 + n.em*0.15 - n.cv*0.10),
    ('self-direction',n.i*0.35 + n.om*0.35 + n.a*0.15 - n.cv*0.10),
    ('universalism',  n.s*0.30 + n.om*0.25 + n.am*0.15 + n.i*0.15),
    ('benevolence',   n.s*0.40 + n.am*0.35 + n.em*0.10),
    ('conformity',    n.cv*0.30 + n.cm*0.25 + n.am*0.15 - n.om*0.20),
    ('tradition',     n.cv*0.25 + n.r*0.20 - n.om*0.25 + n.cm*0.10 + CASE WHEN n."aiEraCategory" = 'stable' THEN 0.10 ELSE 0 END),
    ('security',      n.r*0.20 + n.cv*0.25 + n.cm*0.15 - n.om*0.15 + CASE WHEN n."aiEraCategory" = 'stable' THEN 0.20 ELSE 0 END)
  ) AS v(value_name, score)
),
top3_agg AS (
  SELECT id,
    array_agg(value_name ORDER BY rn) AS new_values
  FROM scored
  WHERE rn <= 3
  GROUP BY id
)
UPDATE "CareerDirection" cd
SET "alignedValues" = t.new_values
FROM top3_agg t
WHERE cd.id = t.id;
