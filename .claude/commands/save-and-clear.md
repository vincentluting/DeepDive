---
disable-model-invocation: true
---

Save current session progress to a checkpoint file, then instruct to /clear.

## Steps

1. Run `git diff --name-only HEAD` and `git diff --name-only --cached` to capture uncommitted changes.

2. Create a session checkpoint file at `/tmp/claude-checkpoint-$(date +%Y%m%d-%H%M).md` with:

```markdown
# Session Checkpoint — [timestamp]

## What was being worked on

[Summarize the current task/feature in 1-2 sentences]

## Changes made so far

[List all files modified with 1-line description each]

## Uncommitted changes

[Output of git diff --name-only, grouped by staged/unstaged/untracked]

## Current status

- Done: [completed items]
- In progress: [current work]
- Blocked: [if any, with reason]

## Next steps

[Ordered list of remaining work, be specific]

## Key decisions made

[Any architectural or product decisions from this session]

## Gotchas discovered

[Error messages, patterns, or traps found — the stuff that saves 30 min next time]
```

3. After writing the file, output:

```
Checkpoint saved to: [file path]

To continue in a fresh session:
1. Run /clear
2. Then paste: "Read /tmp/claude-checkpoint-XXXXX.md and continue from where we left off"
```
