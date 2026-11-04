---
disable-model-invocation: true
---

Review all uncommitted changes before committing.

## Step 1: List changes
Run `git diff --stat` and `git diff --cached --stat`.

For each modified/added/deleted file:
- One-line summary of what changed
- Flag any "unintended modifications" — files not mentioned as part of the current task

## Step 2: Per-file quality check
For each modified file, verify:
- Code style matches CONVENTIONS.md
- All user-facing strings use i18n (no hardcoded Chinese or English)
- New components use responsive classes (won't overflow at 375px)
- New API routes follow the `guardRoute` + `parseBody` pattern
- Non-trivial files have a file header comment

## Step 3: Commit suggestion
If everything looks clean:
→ Suggest a git commit message in conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`)

If issues found:
→ List them with `file:line` references, then suggest fixes before committing.

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: daily-diff
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
