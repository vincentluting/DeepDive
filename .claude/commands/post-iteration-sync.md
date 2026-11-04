---
disable-model-invocation: true
---

This iteration is complete: $ARGUMENTS

Run the full post-iteration sync checklist:

## 1. Build & Test Health

```bash
npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n
```

Report: PASS/FAIL for each. If any fail, fix before proceeding.

## 2. New Files Audit

Check `git diff --name-status` for newly added files:

- API route files → Does each follow `guardRoute` + `parseBody` + `withLogging` pattern?
- Component files → All text in i18n? Responsive at 375px? Has `dict: Dictionary` prop?
- lib/ files → Has file header comment? Types defined (no `any`)?
- Test files → Actually testing meaningful behavior?

## 3. DB Sync Check (if any DB changes)

- [ ] `scripts/schema.sql` updated with new tables/columns?
- [ ] New migration file created in `scripts/migrations/` with correct sequence number?
- [ ] Paste-ready SQL prepared for Windson to run in Neon Console?

## 4. i18n Completeness

- Run `npm run lint:i18n`
- For any new user-facing text: confirm both `en.json` and `zh.json` have the key
- Spot-check: are the Chinese translations natural (not machine-translated)?

## 5. Documentation Updates

Update these files as needed:

**CLAUDE.md** — check and update:

- [ ] API endpoint count (currently listed as how many?)
- [ ] Component/file counts if significantly changed
- [ ] "最近焦点" section — add this iteration's work
- [ ] "已知技术债" — add any new debt introduced, remove any resolved
- [ ] "当前状态" — update test count, lint status

**memory.md** — add entries if:

- [ ] We hit a non-obvious bug during this iteration
- [ ] We discovered a new gotcha about the codebase
- [ ] A workaround was needed that future sessions should know about

**CONVENTIONS.md** — update if:

- [ ] A new code pattern was established
- [ ] An existing pattern was modified

## 6. Commit Summary

Generate a conventional commit message:

```
feat|fix|refactor|chore: [concise description]

- [file1]: [what changed]
- [file2]: [what changed]
...

Impact: [which pipelines/systems were affected]
```

## 7. Final Output

```
✅ Build: PASS/FAIL
✅ Tests: X passed / X total
✅ Lint: X warnings
✅ i18n: SYNCED / X missing keys
✅ DB sync: N/A / SYNCED / NEEDS MIGRATION
✅ Docs: UPDATED / NO CHANGES NEEDED
📝 Commit message: [suggested message]
🔧 Manual steps for Windson: [any SQL to run, env vars to set, etc.]
```
