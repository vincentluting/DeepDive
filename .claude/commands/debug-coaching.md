---
disable-model-invocation: true
---

The AI coach has an issue: $ARGUMENTS

Debug following this flow:

## Step 1: System Prompt Structure
Read `lib/coaching/build-system-prompt.ts` — list the complete system prompt structure (modules, order, approximate length).

## Step 2: Diagnose by symptom

**If replies too long:**
- Check system prompt for length control instructions
- Check maxTokens in model-router coaching config

**If language mixing (Chinese/English bleed):**
- Check language instruction clarity in system prompt
- Check if locale parameter is correctly passed through the chain

**If not personalized enough:**
- Check `parseReportContext()` — is it correctly extracting user report data?
- Is the report context being injected into the system prompt?

**If ignoring report context:**
- Check if reportContext is null/undefined
- Check the system prompt section that references report data

## Step 3: Memory System
- Check `lib/memory/` memory generation logic
- Query UserMemory table for the user's memory entry count
- Verify memories are correctly injected into coaching system prompt

## Step 4: Model Config
- Check model-router coaching task: model, temperature, streaming timeout

## Output
Specific fix recommendation with code snippets where possible.
