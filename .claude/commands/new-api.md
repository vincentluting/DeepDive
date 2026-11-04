I want to create a new API endpoint. Here's what I need: $ARGUMENTS

**1. Plan the endpoint**
- Determine HTTP method (GET/POST/PUT/DELETE)
- Define the Zod schema in `lib/validation/api-schemas.ts`
- Determine auth tier: 'public' | 'authenticated' | 'ai' | 'admin' (see `lib/api/api-guard.ts`)

**2. Create the route file**
Location: `app/api/{endpoint-name}/route.ts`

Follow this exact pattern (reference `app/api/generate-report/route.ts`):
```typescript
// ============================================================
// METHOD /api/{endpoint-name} — {Description}
//
// Input:  { field: type }
// Output: { field: type }
// ============================================================

import { NextResponse } from 'next/server';
import { guardRoute } from '@/lib/api/api-guard';
import { parseBody } from '@/lib/validation/parse-body';
import { schemaName } from '@/lib/validation/api-schemas';
import { ApiErrorCode, createErrorResponse, logApiError } from '@/lib/api/api-errors';
import { withLogging } from '@/lib/api/with-logging';

export const POST = withLogging('/api/{endpoint-name}', async (request) => {
  try {
    const guard = await guardRoute(request, { tier: '{tier}' });
    if (guard.blocked) return guard.response;

    const parsed = await parseBody(request, schemaName);
    if ('error' in parsed) return parsed.error;

    // ... business logic ...

    return NextResponse.json({ /* response */ });
  } catch (err) {
    logApiError('/api/{endpoint-name}', err);
    return createErrorResponse(ApiErrorCode.INTERNAL_ERROR);
  }
});
```

**3. Update CLAUDE.md** — add the new endpoint to the `app/api/` listing.
**4. Write test** if business logic is non-trivial.
