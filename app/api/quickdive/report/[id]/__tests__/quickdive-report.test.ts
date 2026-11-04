import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (before imports) ──────────────────────────────────
vi.mock('@/lib/db/platform', () => ({
  getQuickDiveReport: vi.fn(),
  checkQuickDiveOwnership: vi.fn(),
  deleteQuickDiveReport: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUserWithAdmin: vi.fn(),
}));

vi.mock('@/lib/db/cached', () => ({
  invalidateUserCache: vi.fn(),
}));

vi.mock('@/lib/api/api-guard', () => ({
  guardRoute: vi.fn(),
}));

vi.mock('@/lib/api/api-errors', () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    ASSESSMENT_NOT_FOUND: 'ASSESSMENT_NOT_FOUND',
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

import { guardRoute } from '@/lib/api/api-guard';
import { getCurrentUserWithAdmin } from '@/lib/auth';
import { getQuickDiveReport, checkQuickDiveOwnership, deleteQuickDiveReport } from '@/lib/db/platform';
import { invalidateUserCache } from '@/lib/db/cached';

// ── Helpers ─────────────────────────────────────────────────
function makeGetRequest(): Request {
  return new Request('http://localhost/api/quickdive/report/qd-1', { method: 'GET' });
}

function makeDeleteRequest(): Request {
  return new Request('http://localhost/api/quickdive/report/qd-1', { method: 'DELETE' });
}

const mockContext = { params: Promise.resolve({ id: 'qd-1' }) };

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

const mockReport = {
  id: 'qd-1',
  archetypeCode: 'A',
  archetypeLabel: 'Creative',
  scoresJson: { R: 10, I: 15, A: 20, S: 12, E: 8, C: 5 },
  resultDataJson: { sortedScores: [] },
  language: 'en',
  createdAt: '2026-03-01',
  exploreMode: 'quick_dive',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET Tests ───────────────────────────────────────────────
describe('GET /api/quickdive/report/[id]', () => {
  let handler: (req: Request, ctx: typeof mockContext) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('../route');
    handler = mod.GET as unknown as (req: Request, ctx: typeof mockContext) => Promise<Response>;
  });

  it('returns report data (public, no auth required)', async () => {
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.id).toBe('qd-1');
    expect(json.archetypeCode).toBe('A');
    expect(json.archetypeLabel).toBe('Creative');
    expect(json.resultData).toEqual({ sortedScores: [] });
    expect(json.exploreMode).toBe('quick_dive');
  });

  it('returns 404 when report not found', async () => {
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it('returns 500 on DB error', async () => {
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('db down'));

    const res = await handler(makeGetRequest(), mockContext);
    expect(res.status).toBe(500);
  });
});

// ── DELETE Tests ─────────────────────────────────────────────
describe('DELETE /api/quickdive/report/[id]', () => {
  let handler: (req: Request, ctx: typeof mockContext) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('../route');
    handler = mod.DELETE as unknown as (req: Request, ctx: typeof mockContext) => Promise<Response>;
  });

  it('returns 401 when guard blocks', async () => {
    blockGuard(401);
    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it('returns 401 when user is not authenticated', async () => {
    allowGuard({ id: 'user-1' });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(401);
  });

  it('deletes report as owner', async () => {
    allowGuard({ id: 'user-1' });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', isAdmin: false });
    (checkQuickDiveOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    (deleteQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(invalidateUserCache).toHaveBeenCalledWith('user-1');
  });

  it('returns 404 when non-owner tries to delete', async () => {
    allowGuard({ id: 'user-1' });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'user-1', isAdmin: false });
    (checkQuickDiveOwnership as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(404);
  });

  it('admin can delete any report', async () => {
    allowGuard({ id: 'admin-1' });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'admin-1', isAdmin: true });
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(mockReport);
    (deleteQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(200);
    expect(checkQuickDiveOwnership).not.toHaveBeenCalled();
  });

  it('admin gets 404 when report does not exist', async () => {
    allowGuard({ id: 'admin-1' });
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'admin-1', isAdmin: true });
    (getQuickDiveReport as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await handler(makeDeleteRequest(), mockContext);
    expect(res.status).toBe(404);
  });
});
