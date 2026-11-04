Interview the user to produce a complete feature spec before any code is written.

## Purpose

For large features, Claude should interview the user FIRST using AskUserQuestion to surface:
- Edge cases the user hasn't considered
- Technical constraints they may not know about
- UX decisions that affect implementation
- Scope boundaries to prevent feature creep

## Process

1. Read the feature description from $ARGUMENTS

2. Analyze the codebase to understand:
   - Which existing modules are affected
   - What patterns are already established
   - What constraints exist (frozen zones, DB schema, entitlements)

3. Interview the user with 5-8 targeted questions using AskUserQuestion. Focus on:
   - **Scope**: "Should this feature work for users without invite codes too, or only entitled users?"
   - **Edge cases**: "What happens if the user closes the browser mid-way through X?"
   - **UX decisions**: "Should this be a modal, a new page, or inline in the existing view?"
   - **Data model**: "Do we need to persist X, or is it session-only?"
   - **i18n**: "Any culture-specific considerations for the Chinese vs English version?"

   Do NOT ask obvious questions. Dig into the hard parts.

4. After the interview, generate a spec file at `docs/specs/SPEC-[feature-name].md`:

```markdown
# Feature Spec: [name]

## Summary
[2-3 sentences]

## User Story
As a [persona], I want [capability] so that [benefit].

## Scope
### In scope
- ...
### Out of scope
- ...

## Technical Design
### Files to modify
| File | Change |
|------|--------|
| ... | ... |

### New files needed
- ...

### Database changes
- ...

### Frozen zone impact
- None / [describe if any]

## Edge Cases
- ...

## i18n Requirements
- ...

## Test Plan
- ...

## Open Questions
- ...
```

5. After writing the spec, tell the user:
   "Spec saved. To implement in a clean session: `/clear` then `Read docs/specs/SPEC-[name].md and implement Phase 1`"
