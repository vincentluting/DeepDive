import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────
vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  isUserAdmin: vi.fn(),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

import { guardRoute } from '@/lib/api/api-guard';
import { getCurrentUser } from '@/lib/auth';
import { isUserAdmin } from '@/lib/auth/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';

// ── Helpers ──────────────────────────────────────────────────
function mockRequest(ip = '1.2.3.4'): Request {
  return {
    headers: new Headers({ 'x-forwarded-for': ip }),
    url: 'http://localhost/api/test',
  } as unknown as Request;
}

const authedUser = { id: 'u1', email: 'a@b.com', name: 'A' };

function allowRate() {
  (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
    allowed: true,
    remaining: 10,
    resetAt: Date.now() + 60_000,
  });
}

function blockRate() {
  (checkRateLimit as ReturnType<typeof vi.fn>).mockReturnValue({
    allowed: false,
    remaining: 0,
    resetAt: Date.now() + 60_000,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  allowRate();
});

// ── Tests ────────────────────────────────────────────────────

describe('guardRoute', () => {
  it('allows anonymous access on non-auth tiers', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await guardRoute(mockRequest() as any, { tier: 'read' });
    expect(result.blocked).toBe(false);
    if (!result.blocked) expect(result.user).toBeNull();
  });

  it('returns 401 when requireAuth is true and no user', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await guardRoute(mockRequest() as any, { tier: 'write', requireAuth: true });
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.response.status).toBe(401);
    }
  });

  it('passes authenticated user through', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(authedUser);
    const result = await guardRoute(mockRequest() as any, { tier: 'read' });
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      expect(result.user?.id).toBe('u1');
    }
  });

  it('returns 429 when rate limited', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    blockRate();
    const result = await guardRoute(mockRequest() as any, { tier: 'read' });
    expect(result.blocked).toBe(true);
    if (result.blocked) {
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get('Retry-After')).toBeTruthy();
    }
  });

  describe('admin tier', () => {
    it('requires authentication even without requireAuth flag', async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      const result = await guardRoute(mockRequest() as any, { tier: 'admin' });
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.response.status).toBe(401);
    });

    it('returns 403 for non-admin authenticated user', async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(authedUser);
      (isUserAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(false);
      const result = await guardRoute(mockRequest() as any, { tier: 'admin' });
      expect(result.blocked).toBe(true);
      if (result.blocked) expect(result.response.status).toBe(403);
    });

    it('passes through admin user with isAdmin flag', async () => {
      (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(authedUser);
      (isUserAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      const result = await guardRoute(mockRequest() as any, { tier: 'admin' });
      expect(result.blocked).toBe(false);
      if (!result.blocked) {
        expect(result.user?.isAdmin).toBe(true);
      }
    });
  });

  it('treats getCurrentUser throwing as anonymous', async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('no cookie'));
    const result = await guardRoute(mockRequest() as any, { tier: 'read' });
    expect(result.blocked).toBe(false);
    if (!result.blocked) expect(result.user).toBeNull();
  });
});
