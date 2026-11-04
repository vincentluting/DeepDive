# Deep Dive — Code Conventions & Patterns

> Quick reference for code generation. Follow these patterns to match the existing codebase.

---

## File Headers

Every non-trivial file should have a header comment:

```typescript
// ============================================================
// {Module Name} — {Brief description}
//
// {What this file does, its inputs/outputs, key design decisions}
// ============================================================
```

API route files must include method, path, input/output:
```typescript
// ============================================================
// POST /api/{name} — {Description}
//
// Input:  { field: type }
// Output: { field: type }
// ============================================================
```

---

## API Route Pattern

```typescript
import { NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { someSchema } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

export const maxDuration = 30; // Higher for LLM calls (120 for report generation)

export const POST = withLogging('/api/endpoint', async (request) => {
  try {
    const guard = await guardRoute(request, { tier: 'authenticated' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, someSchema);
    if ('error' in parsed) return parsed.error;
    const { field1 } = parsed.data;

    const result = await doSomething(field1);
    return NextResponse.json(result);
  } catch (err) {
    logApiError('/api/endpoint', err);
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR);
  }
});
```

Auth tiers: `'public'` | `'authenticated'` | `'ai'` (rate-limited) | `'admin'`

---

## Database (lib/db/) Pattern

```typescript
import { sql } from './connection';
import { randomUUID } from 'crypto';
import type { SomeType } from '@/lib/types';

export async function getSomething(id: string): Promise<SomeType | null> {
  const rows = await sql`SELECT * FROM table_name WHERE id = ${id}`;
  return rows.length > 0 ? rows[0] as SomeType : null;
}

export async function createSomething(data: Partial<SomeType>): Promise<string> {
  const id = randomUUID();
  await sql`
    INSERT INTO table_name (id, field1, created_at)
    VALUES (${id}, ${data.field1}, NOW())
  `;
  return id;
}
```

Rules:
- Use `sql` tagged template from `./connection` (Neon serverless)
- Always parameterized queries (no string interpolation)
- Return `null` for not-found
- Use `randomUUID()` for new IDs

---

## Component Pattern

```tsx
'use client'

import { type Dictionary } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

interface MyComponentProps {
  dict: Dictionary
  data: SomeType
  onAction?: () => void
}

export function MyComponent({ dict, data, onAction }: MyComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 lg:p-8"
    >
      <h2 className="text-lg sm:text-xl font-semibold">
        {dict.section.title}
      </h2>
    </motion.div>
  )
}
```

Rules:
- `'use client'` only when hooks/state/events are needed
- Always accept `dict: Dictionary` for i18n
- Mobile-first: base → `sm:` → `md:` → `lg:`
- Use shadcn/ui, Framer Motion, lucide-react
- PascalCase component, kebab-case file

---

## LLM Calls

**NEVER call OpenAI or Anthropic directly. Always use model-router:**

```typescript
import { callLLM } from '@/lib/ai/model-router';
const result = await callLLM('task-name', messages, { responseFormat: 'json' });
```

For streaming:
```typescript
import { streamLLM } from '@/lib/ai/model-router';
const response = await streamLLM('coaching', messages, { routeName: '/api/coaching-chat' });
```

---

## Zod Schema Pattern

```typescript
import { z } from 'zod/v4';

export const mySchema = z.object({
  requiredField: z.string().min(1),
  optionalField: z.string().optional(),
  locale: z.enum(['en', 'zh']).optional().default('en'),
});
```

---

## Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ModuleName', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should do something specific', () => {
    const result = functionUnderTest(input);
    expect(result).toEqual(expected);
  });
});
```

Location: `lib/{module}/__tests__/{name}.test.ts`

---

## Import Order

```typescript
// 1. Node built-ins
import { randomUUID } from 'crypto';
// 2. Next.js / React
import { NextResponse } from 'next/server';
// 3. Third-party
import { motion } from 'framer-motion';
// 4. Internal lib (@/ alias)
import { callLLM } from '@/lib/ai/model-router';
import type { CareerReport } from '@/lib/types';
// 5. Relative / components
import { Button } from '@/components/ui/button';
```

---

## SSR Safety (Browser-Only Code)

Next.js renders all pages on the server first. Browser-only APIs (`window`, `document`, `navigator`, Canvas, etc.) do not exist during SSR. Violations crash the page silently via Error Boundary.

**Rules:**

1. **Never import browser-only libraries at module level.** Use dynamic `await import()` inside event handlers or `useEffect`:
   ```typescript
   // ✗ WRONG — crashes SSR
   import { toPng } from 'html-to-image'

   // ✓ CORRECT — loads only when needed
   const handleShare = async () => {
     const { toPng } = await import('html-to-image')
     // ...
   }
   ```

2. **Guard all `window`/`document` access** with `typeof window !== 'undefined'` or place inside `useEffect`/`useCallback`.

3. **Known browser-only libraries** (enforced by ESLint `no-restricted-imports`): `html-to-image`, `html2canvas`, `canvas-confetti`.

4. When adding a new browser-only dependency, add it to the ESLint `no-restricted-imports` list in `eslint.config.mjs`.

---

## Common Gotchas

1. **Zod v4**: `import { z } from 'zod/v4'` (not `'zod'`)
2. **Tailwind v4**: No `tailwind.config.ts` — config in `app/globals.css`
3. **i18n dictionaries are JSON**: Edit `.json` files, not TypeScript
4. **model-router is THE entry point**: Never import openai-client or anthropic-client in business code
5. **RIASEC from Quick Dive**: Deep Dive inherits it, doesn't re-assess
6. **Panel 3 needs RealConditions**: Without them → placeholder
7. **Scoring pipeline is frozen**: `lib/scoring/` — discuss before changes
8. **Content is sacred**: `lib/content/` existing entries — only add, never modify
9. **SSR safety**: Never import browser-only libs at module level — see "SSR Safety" section above
