import { describe, it, expect } from 'vitest';
import { z } from 'zod/v4';
import { parseBody } from '@/lib/validation/parse-body';

// ── Helpers ──────────────────────────────────────────────────
function mockRequest(body: unknown): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function badJsonRequest(): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ invalid json',
  });
}

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(0),
});

// ── Tests ────────────────────────────────────────────────────

describe('parseBody', () => {
  it('returns parsed data for valid input', async () => {
    const result = await parseBody(mockRequest({ name: 'Alice', age: 30 }), testSchema);
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
    }
  });

  it('returns error for invalid JSON', async () => {
    const result = await parseBody(badJsonRequest(), testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const body = await result.error.json();
      expect(body.error.message).toContain('Invalid JSON');
    }
  });

  it('returns error for schema validation failure', async () => {
    const result = await parseBody(mockRequest({ name: '', age: -5 }), testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.status).toBe(400);
      const body = await result.error.json();
      expect(body.error.message).toContain('Validation failed');
    }
  });

  it('returns error when required fields are missing', async () => {
    const result = await parseBody(mockRequest({}), testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      const body = await result.error.json();
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('includes field path in validation error message', async () => {
    const result = await parseBody(mockRequest({ name: 123, age: 'not a number' }), testSchema);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      const body = await result.error.json();
      expect(body.error.message).toMatch(/name|age/);
    }
  });
});
