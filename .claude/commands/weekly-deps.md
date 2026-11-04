---
disable-model-invocation: true
---

Check project dependency health. Report only — do not execute updates.

## Security
1. Run `npm audit` — report vulnerability count and severity levels.
2. Distinguish direct dependencies (we control) vs transitive dependencies (wait for upstream fix).

## Staleness
3. Check `package.json` for obviously outdated core dependencies. Focus on: `next`, `react`, `@neondatabase/serverless`, `zod`, `ai` (Vercel AI SDK).

## Unused / Missing
4. Check for packages declared in `package.json` but never imported in code.
5. Check for packages imported in code but not declared in `package.json`.

## Output
```
🔒 Security: [X vulnerabilities — Y critical, Z high]
📦 Outdated: [list with current → latest]
🗑️ Unused deps: [list]
❓ Missing deps: [list]
```

## Log Update

Update `.claude/maintenance-log.json` for this task:

```bash
# Task key: weekly-deps
# last_run: today's date (YYYY-MM-DD)
# last_status: "pass" / "fail" / "partial"
```
