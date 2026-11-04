import type { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod/v4';
import { ApiErrorCode, createErrorResponse } from '@/lib/api/api-errors';

export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      error: createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        'Invalid JSON body',
        400,
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    // Build a human-readable summary from the Zod issues
    const summary = result.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `Field "${issue.path.join('.')}"` : 'Input';
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    return {
      error: createErrorResponse(
        ApiErrorCode.VALIDATION_ERROR,
        `Validation failed: ${summary}`,
        400,
      ),
    };
  }

  return { data: result.data };
}
