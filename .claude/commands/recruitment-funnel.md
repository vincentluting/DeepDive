Show the **recruitment funnel** — invite link → register → consent → QD → DD → report → coaching — and surface the biggest drop-off.

Use the Neon MCP (`mcp__neon__run_sql`) against the production Deep Dive DB. Read-only — no migrations, no mutations.

## Step 1 — Run the funnel query

Aggregate `UserFunnel` events across three windows: last 24h, last 7 days, lifetime. Cross-tabulate by `event` to get counts per stage.

```sql
WITH windows AS (
  SELECT
    NOW() - INTERVAL '24 hours' AS d1,
    NOW() - INTERVAL '7 days'   AS d7
)
SELECT
  event,
  COUNT(*) FILTER (WHERE "createdAt" >= (SELECT d1 FROM windows)) AS h24,
  COUNT(*) FILTER (WHERE "createdAt" >= (SELECT d7 FROM windows)) AS d7,
  COUNT(*) AS lifetime,
  COUNT(DISTINCT COALESCE("userId", "clientId")) FILTER (
    WHERE "createdAt" >= (SELECT d7 FROM windows)
  ) AS unique_d7
FROM "UserFunnel"
WHERE event IN (
  'recruitment_landing_viewed',
  'registered',
  'consent_submitted',
  'quickdive_started',
  'quickdive_completed',
  'deepdive_started',
  'deepdive_completed',
  'report_generated',
  'coaching_started'
)
GROUP BY event
ORDER BY
  CASE event
    WHEN 'recruitment_landing_viewed' THEN 1
    WHEN 'registered'                 THEN 2
    WHEN 'consent_submitted'          THEN 3
    WHEN 'quickdive_started'          THEN 4
    WHEN 'quickdive_completed'        THEN 5
    WHEN 'deepdive_started'           THEN 6
    WHEN 'deepdive_completed'         THEN 7
    WHEN 'report_generated'           THEN 8
    WHEN 'coaching_started'           THEN 9
  END;
```

## Step 2 — Channel breakdown (last 7d landing views)

```sql
SELECT
  COALESCE(metadata->>'source', 'direct') AS source,
  COUNT(*) AS views_7d,
  COUNT(*) FILTER (WHERE (metadata->>'hasInvite')::boolean = true) AS with_invite_7d
FROM "UserFunnel"
WHERE event = 'recruitment_landing_viewed'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY source
ORDER BY views_7d DESC;
```

## Step 3 — Thesis cohort progress (research participants only)

```sql
SELECT
  COUNT(*) FILTER (WHERE "researchConsentAt" IS NOT NULL)            AS consented,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM "QuestionnaireSession" qs
    WHERE qs."userId" = u."id" AND qs.status = 'completed'
  )) AS finished_questionnaire,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM "CareerReport" cr WHERE cr."userId" = u."id"
  )) AS has_report
FROM "User" u
WHERE u."cohort" LIKE 'thesis%'
  AND u."researchGroup" IS NOT NULL;
```

## Step 4 — Output

Render a single readable table (terminal-friendly, no markdown tables):

```
RECRUITMENT FUNNEL — last 24h / last 7d / lifetime
────────────────────────────────────────────────────────
  Stage                       24h    7d   life   conv
  landing_viewed              ___    ___  ____   100%
  registered                  ___    ___  ____   __%   ← gap
  consent_submitted           ___    ___  ____   __%
  quickdive_started           ___    ___  ____   __%
  quickdive_completed         ___    ___  ____   __%
  deepdive_started            ___    ___  ____   __%
  deepdive_completed          ___    ___  ____   __%
  report_generated            ___    ___  ____   __%
  coaching_started            ___    ___  ____   __%

CHANNELS (7d landing views)
  source           views    with_invite
  linkedin         ___      ___
  xiaohongshu      ___      ___
  uva              ___      ___
  referral         ___      ___
  direct           ___      ___

THESIS COHORT
  consented              ___
  finished QD/DD         ___
  has report             ___
```

End with: **biggest drop-off** (max % gap between consecutive stages) and **one-line recommendation** for the week (e.g. "register→consent dropping 60% — rewrite consent CTA copy").

## Rules

- READ-ONLY only. Do not propose schema changes from this command.
- If a stage shows 0 across all windows, mark it `(no events yet — check埋点)`.
- If lifetime registered = 0, this is "no users yet" — say so plainly, don't fake percentages.
- Output language: 中文 (per CLAUDE.md output rule). Keep table headers English.
