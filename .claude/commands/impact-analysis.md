I want to implement the following feature or change: $ARGUMENTS

**STOP. Do not write any code yet.** Perform a read-only impact analysis first.

## Step 1: Understand the requirement

Restate what needs to be done in one paragraph. If anything is ambiguous, list the questions you need answered before proceeding.

## Step 2: File impact scan

List ALL files that will need to be created, modified, or deleted. Organize by layer:

```
📁 Frontend (components/, app/[locale]/)
  - [file] — [what changes]

📁 API Routes (app/api/)
  - [file] — [what changes]

📁 Business Logic (lib/)
  - [file] — [what changes]

📁 Database (lib/db/, scripts/)
  - [file] — [what changes]
  - ⚠️ New migration needed? [YES/NO + description]
  - ⚠️ schema.sql update needed? [YES/NO]

📁 i18n (lib/i18n/dictionaries/)
  - New keys needed? [list them]

📁 Types (lib/types/)
  - [file] — [what changes]

📁 Tests (lib/*/__tests__/)
  - [file] — [what changes]
```

## Step 3: Critical pipeline check

For EACH pipeline below, answer YES or NO. If YES, explain the specific impact:

- [ ] **Scoring pipeline** (lib/scoring/) — Does this change input/output of scoring?
- [ ] **Report generation** (lib/report-generation/) — Does this affect report content or structure?
- [ ] **AI Coach context** (lib/coaching/) — Does this change what the coach knows about the user?
- [ ] **Profile generation** (lib/profile-generation/) — Does this affect personal profile?
- [ ] **Quick Dive → Deep Dive data link** — Does this touch the RIASEC inheritance path?
- [ ] **Auth/security** — Does this need a new guard tier or change permissions?
- [ ] **Analytics tracking** — Does this need a new funnel event?
- [ ] **LLM calls** — Does this add/modify any callLLM/streamLLM usage?

## Step 4: Frozen zone check

Does this change touch any file in the frozen zones? List them:

- `lib/scoring/` — ⛔ or ✅
- `lib/content/archetypes-12.ts` — ⛔ or ✅
- `lib/content/career-directions-db.ts` — ⛔ or ✅
- `lib/content/shadow-content.ts` — ⛔ or ✅
- `lib/report-generation/career-drain-content.ts` — ⛔ or ✅
- `lib/ai/model-router.ts` — ⛔ or ✅

If any are ⛔, STOP and flag for discussion.

## Step 5: Risk assessment & task breakdown

**Change size**: S (1 file, <50 lines) / M (2-3 files, 50-150 lines) / L (4+ files, 150+ lines)

**Recommended model**: Sonnet 4.6 (mechanical/surgical) / Opus 4.6 (complex multi-file reasoning)

**Suggested task split** (for M/L changes):

```
Task 1: [scope] — [which files] — [Sonnet/Opus]
Task 2: [scope] — [which files] — [Sonnet/Opus]
...
```

**Decision points for Windson**:

- [List anything that needs human judgment before coding starts]

## Step 6: DB operations (if any)

If database changes are needed, prepare paste-ready SQL for Neon Console:

```sql
-- Migration: [description]
-- Run in: Neon Console
[SQL here]
```

---

**Output this analysis and WAIT for confirmation before writing any code.**
