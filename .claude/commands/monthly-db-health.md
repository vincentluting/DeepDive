---
disable-model-invocation: true
---

Generate SQL queries for database health checks. Output a script I can paste directly into Neon SQL Editor.

**Do NOT execute these queries — generate the SQL only.**

## Table Volume
1. Query each table's row count and disk size (`pg_total_relation_size`).
   Focus: Are PageVisit and UserFunnel growing too fast?

## Data Integrity
2. QuestionnaireSession with status='completed' but no corresponding AssessmentResult (broken pipeline).
3. AssessmentResult exists but no corresponding CareerReport (report generation may have failed).
4. CareerReport exists but no ReportEngagement record (tracking may be dead).
5. PrePostAssessment with 'pre' timing but no matching 'post' for the same userId (user abandoned post-assessment).

## Performance
6. Index usage rates (`pg_stat_user_indexes`). Flag indexes that have never been used (wasting write performance).
7. Slow queries from last 7 days (if `pg_stat_statements` is available on Neon).

## Cleanup Candidates
8. Percentage of PageVisit records where isBot=true. If >30%, suggest periodic bot cleanup.
9. Count of QuestionnaireSession with status='abandoned' older than 30 days. These can be safely deleted.

## Output
Single SQL script with comments, ready to paste into Neon SQL Editor.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: monthly-db-health
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
