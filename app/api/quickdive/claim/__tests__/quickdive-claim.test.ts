import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (before imports) ──────────────────────────────────
vi.mock('@/lib/db/platform', () => ({
  claimQuickDiveResult: vi.fn(),
  getQuickDiveReport: vi.fn(),
}));

vi.mock('@/lib/db/assessment-lifecycle', () => ({
  afterAssessmentComplete: vi.fn(),
}));

vi.mock('@/lib/api/api-guard', () => ({
  guardRoute: vi.fn(),
}));

vi.mock('@/lib/api/api-errors', () => ({
  ApiErrorCode: {
    DB_CONSTRAINT_FAILED: 'DB_CONSTRAINT_FAILED',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
  },
  createErrorResponse: vi.fn((code: string, msg: string, status: number) => {
    return new Response(JSON.stringify({ error: code, message: msg }), { status });
  }),
  logApiError: vi.fn(),
}));

vi.mock('@/lib/api/with-logging', () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) => handler,
}));

vi.mock('@/lib/validation/parse-body', () => ({
  parseBody: vi.fn(),
}));

import { guardRoute } from '@/lib/api/api-guard';
import { claimQuickDiveResult, getQuickDiveReport } from '@/lib/db/platform';
import { afterAssessmentComplete } from '@/lib/db/assessment-lifecycle';
import { parseBody } from '@/lib/validation/parse-body';

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request('http://localhost/api/quickdive/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

function allowGuard(user: { id: string }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response('Unauthorized', { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe('POST /api/quickdive/claim', () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('../route');
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it('returns 401 when guard blocks (unauthenticated)', async () => {
    blockGuard(401);
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns error when parseBody fails', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'VALIDATION_ERROR' }), { status: 400 }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it('claims result successfully (first claim)', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { resultId: 'qd-123' },
    });
    (claimQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue('claimed');
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      exploreMode: 'classic',
    });
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ success: true, claimed: true });

    expect(claimQuickDiveResult).toHaveBeenCalledWith('qd-123', 'user-1');
    expect(afterAssessmentComplete).toHaveBeenCalledWith({
      userId: 'user-1',
      assessmentType: 'quick_dive',
      resultId: 'qd-123',
    });
  });

  it('returns success for already_owned result', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { resultId: 'qd-123' },
    });
    (claimQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue('already_owned');
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue({
      exploreMode: 'immersive',
    });
    (afterAssessmentComplete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ success: true, claimed: false });
    expect(afterAssessmentComplete).toHaveBeenCalledWith({
      userId: 'user-1',
      assessmentType: 'immersive_dive',
      resultId: 'qd-123',
    });
  });

  it('returns 409 when result is owned by another user (conflict)', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { resultId: 'qd-other' },
    });
    (claimQuickDiveResult as ReturnType<typeof vi.fn>).mockResolvedValue('conflict');

    const res = await handler(makeRequest());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error).toBe('DB_CONSTRAINT_FAILED');
  });

  it('returns 500 when claimQuickDiveResult throws', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { resultId: 'qd-123' },
    });
    (claimQuickDiveResult as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('db down'));

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
