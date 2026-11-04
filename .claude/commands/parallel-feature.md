---
disable-model-invocation: true
---

Orchestrate parallel development of a large feature using worktree isolation.

## When to use

Features that touch 4+ files across different domains (frontend + backend + DB + tests) benefit from parallel development. Each subagent works in an isolated git worktree — no merge conflicts, full codebase access.

## Process

1. Read the feature spec from $ARGUMENTS (or ask the user to describe the feature)

2. Analyze and split into parallel tracks. Common splits:
   - **Backend**: API routes + lib modules + DB changes
   - **Frontend**: Components + store + pages
   - **Tests**: Unit tests + integration tests

3. For each track, launch a subagent with `isolation: "worktree"`:

   **Backend agent prompt**:
   ```
   You are implementing the backend for: [feature description]

   Your scope: app/api/ routes, lib/ modules, scripts/schema.sql changes.
   Do NOT touch components/ or store/ — another agent handles frontend.

   Follow the project's patterns: guardRoute(), withLogging, Zod validation, model-router for LLM.
   Run tsc --noEmit and tests after changes.
   ```

   **Frontend agent prompt**:
   ```
   You are implementing the frontend for: [feature description]

   Your scope: components/, store/, app/[locale]/ pages, i18n dictionaries.
   Do NOT touch lib/ or app/api/ — another agent handles backend.
   Assume the API endpoints exist as specified in the spec.

   Follow design spec in .claude/skills/deepdive-design/SKILL.md.
   Ensure responsive to 375px. Update both en/ and zh/ dictionaries.
   ```

4. When agents complete, report:
   - Each agent's worktree branch name
   - Summary of changes per track
   - Any conflicts between tracks
   - Suggested merge order (usually: DB → Backend → Frontend)

5. User reviews and merges branches manually, or asks Claude to merge them.
