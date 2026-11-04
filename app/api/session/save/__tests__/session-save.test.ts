import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (before imports) ──────────────────────────────────
const mockSql = vi.fn();
vi.mock('@/lib/db/connection', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

vi.mock('@/lib/db/sessions', () => ({
  saveSessionProgress: vi.fn(),
}));

vi.mock('@/lib/api/api-guard', () => ({
  guardRoute: vi.fn(),
}));

vi.mock('@/lib/api/api-errors', () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
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
import { saveSessionProgress } from '@/lib/db/sessions';
import { parseBody } from '@/lib/validation/parse-body';

// ── Helpers ─────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/session/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowGuard(user: { id: string } | null = null) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 429) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response('Rate limited', { status }),
  });
}

const validData = {
  sessionId: 'sess-1',
  answers: [{ questionId: 'q1', score: 3 }],
  currentModule: 'A',
  currentQuestionIndex: 5,
  language: 'en',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe('POST /api/session/save', () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('../route');
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it('returns 429 when guard blocks', async () => {
    blockGuard(429);
    const res = await handler(makeRequest());
    expect(res.status).toBe(429);
  });

  it('returns error when parseBody fails', async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'VALIDATION_ERROR' }), { status: 400 }),
    });

    const res = await handler(makeRequest());
    expect(res.status).toBe(400);
  });

  it('saves session for anonymous user (no existing session)', async () => {
    allowGuard(); // anonymous — no user
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({ data: validData });
    mockSql.mockResolvedValue([]); // no existing session

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(saveSessionProgress).toHaveBeenCalledWith(
      'sess-1',
      [{ questionId: 'q1', score: 3 }],
      'A',
      5,
      'en',
      undefined,
      undefined,
    );
  });

  it('saves session for authenticated user', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({ data: validData });
    mockSql.mockResolvedValue([]); // no existing session

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(saveSessionProgress).toHaveBeenCalledWith(
      'sess-1',
      expect.any(Array),
      'A',
      5,
      'en',
      undefined,
      'user-1',
    );
  });

  it('allows saving to own session', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({ data: validData });
    mockSql.mockResolvedValue([{ userId: 'user-1' }]); // session owned by same user

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);
  });

  it('returns 403 when session belongs to another user', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({ data: validData });
    mockSql.mockResolvedValue([{ userId: 'user-other' }]); // different owner

    const res = await handler(makeRequest());
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('maps currentPhase to module code when currentModule is absent', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { ...validData, currentModule: undefined, currentPhase: 2 },
    });
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    expect(saveSessionProgress).toHaveBeenCalledWith(
      'sess-1',
      expect.any(Array),
      'B', // phase 2 → module B
      5,
      'en',
      undefined,
      'user-1',
    );
  });

  it('returns 500 when saveSessionProgress throws', async () => {
    allowGuard({ id: 'user-1' });
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({ data: validData });
    mockSql.mockResolvedValue([]);
    (saveSessionProgress as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('db down'));

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe('INTERNAL_ERROR');
  });
});
