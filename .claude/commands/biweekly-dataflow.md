---
disable-model-invocation: true
---

---
disable-model-invocation: true
---

Audit the 4 critical data pipelines end-to-end from a data engineering perspective.

## Pipeline 1: Quick Dive
Frontend trigger → API call → DB write
- `components/quickdive/` submit logic → `POST /api/quickdive/save` → `QuickDiveResult` table
- Check: Is userId correctly associated? Can anonymous user data be backfilled after login?

## Pipeline 2: Deep Dive Questionnaire → Scoring → Report
- `store/questionnaire-store.ts` submit logic → `POST /api/session/save` (intermediate) → `POST /api/score` (scoring) → `POST /api/generate-report` (report generation)
- Check: Where does sessionId originate? Is it correctly passed at every step?
- Check: If user refreshes mid-questionnaire, does session recovery logic work?

## Pipeline 3: Report View → Feedback Collection
- User opens report page → `ReportEngagement` (passive, sendBeacon) → `ReportReaction` (active, user click) → `ReportNPS` (active, user score)
- Check: Are reportId and userId correct in every write?

## Pipeline 4: Thesis Pre/Post Assessment
- `/deepdive/pre-assessment` → `POST /api/pre-post-assessment` (timing: 'pre')
- [User completes Deep Dive + views report]
- `/deepdive/post-assessment` → `POST /api/pre-post-assessment` (timing: 'post')
- Check: Can Pre and Post be correctly paired via userId?

## Output per pipeline
`✅ Complete` / `⚠️ At risk` / `❌ Broken` — with specific break point and cause if not complete.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: biweekly-dataflow
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
