---
disable-model-invocation: true
---

Review all uncommitted or recent changes using a fresh-context subagent (Writer/Reviewer pattern).

## Why a subagent

The same Claude that wrote the code has cognitive bias toward it. A subagent reviews in a clean context with no attachment to the implementation, catching issues the writer misses.

## Steps

1. Determine review scope:
   - If there are uncommitted changes: `git diff --stat` + `git diff`
   - If all committed: `git diff HEAD~3 --stat` + `git diff HEAD~3`

2. Launch a subagent (Explore type) with this prompt:

```
You are a senior code reviewer for a Next.js 16 + TypeScript + Neon Postgres project.

Review these changes with fresh eyes. You have NO context about why these changes were made — judge them purely on quality.

Check for:
1. **Correctness** — Logic errors, off-by-one, null/undefined risks, async race conditions
2. **Security** — Injection, XSS, auth bypass, data leaks, unvalidated input
3. **i18n** — Any user-visible string not going through i18n dictionary
4. **Type safety** — Any `as any`, missing null checks, loose types
5. **Performance** — N+1 queries, missing indexes, unnecessary re-renders, large bundle imports
6. **Edge cases** — Empty arrays, missing fields, concurrent access, timeout handling

Output format:
## Review Summary
[1-2 sentence overall assessment]

## Issues Found
### Critical (blocks merge)
- [file:line] description

### Should Fix
- [file:line] description

### Nitpick
- [file:line] description

## What Looks Good
[2-3 things done well — positive reinforcement matters]
```

3. Present the review results to the user.
