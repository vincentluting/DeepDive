import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  authenticateUser: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock('@/lib/api/api-guard', () => ({
  guardRoute: vi.fn(),
}));

vi.mock('@/lib/api/api-errors', () => ({
  ApiErrorCode: { UNAUTHORIZED: 'UNAUTHORIZED', INTERNAL_ERROR: 'INTERNAL_ERROR', VALIDATION_ERROR: 'VALIDATION_ERROR' },
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
import { authenticateUser, createSession, setSessionCookie } from '@/lib/auth';
import { parseBody } from '@/lib/validation/parse-body';

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function allowGuard(user: Record<string, unknown> | null = null) {
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import('../login/route');
    handler = mod.POST as unknown as (req: Request) => Promise<Response>;
  });

  it('returns 429 when rate limited', async () => {
    blockGuard(429);
    const res = await handler(makeRequest({ email: 'a@b.com', password: 'pass' }));
    expect(res.status).toBe(429);
  });

  it('returns 400 on invalid body', async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: new Response(JSON.stringify({ error: 'VALIDATION_ERROR' }), { status: 400 }),
    });
    const res = await handler(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 401 on wrong credentials', async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: 'a@b.com', password: 'wrong' },
    });
    (authenticateUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await handler(makeRequest({ email: 'a@b.com', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('returns 200 with user data on success', async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: 'a@b.com', password: 'correct' },
    });
    (authenticateUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'Alice',
    });
    (createSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 's1' });
    (setSessionCookie as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const res = await handler(makeRequest({ email: 'a@b.com', password: 'correct' }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.user.id).toBe('u1');
  });

  it('returns 500 when session cookie fails', async () => {
    allowGuard();
    (parseBody as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { email: 'a@b.com', password: 'correct' },
    });
    (authenticateUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'u1', email: 'a@b.com', name: 'Alice',
    });
    (createSession as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 's1' });
    (setSessionCookie as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('cookie failure'));

    const res = await handler(makeRequest({ email: 'a@b.com', password: 'correct' }));
    expect(res.status).toBe(500);
  });
});
