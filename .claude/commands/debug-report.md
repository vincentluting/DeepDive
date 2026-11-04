---
disable-model-invocation: true
---

The report generation pipeline has an issue: $ARGUMENTS

Debug following this flow:

## Step 1: Understand the pipeline
Read `lib/report-generation/index.ts` — list the complete report generation steps and which model each step uses.

## Step 2: Diagnose the failing step
For the problematic step, check:
- Input data completeness (is the assessment result structure correct?)
- Prompt building logic (any null/undefined risks?)
- LLM call timeout handling and error recovery
- JSON parsing wrapped in try-catch?

## Step 3: Model configuration
Check `lib/ai/model-router.ts` for the corresponding task:
- Correct model selected?
- Temperature and maxTokens reasonable?
- Anthropic → OpenAI fallback logic working?

## Step 4: Specific issue patterns

**If Panel 3 is empty:**
- Check RealConditions is correctly linked to sessionId
- Check generatePanel3() placeholder branch logic

**If timeout:**
- Check maxDuration setting (generate-report route needs 120s on Vercel)
- Check if steps can be parallelized but are running sequentially

**If content quality is poor:**
- Check the prompt template for the failing panel
- Check if assessment data is fully populated (no missing RIASEC/Big Five/Values scores)

## Output
Diagnosis + specific fix recommendation (preferably with code snippets).
