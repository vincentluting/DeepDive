// ============================================================
// Tests for Admin Check Logic
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the DB connection module (what admin.ts actually imports from)
const mockSql = vi.fn();
vi.mock('@/lib/db/connection', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { isUserAdmin } from '../admin';

describe('isUserAdmin', () => {
  const originalEnv = process.env.ADMIN_EMAILS;

  beforeEach(() => {
    mockSql.mockReset();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ADMIN_EMAILS = originalEnv;
    } else {
      delete process.env.ADMIN_EMAILS;
    }
  });

  // ============================================================
  // Happy path: env-based admin check
  // ============================================================

  it('returns true if email is in ADMIN_EMAILS env var', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com, super@example.com';
    const result = await isUserAdmin('user-1', 'admin@example.com');
    expect(result).toBe(true);
    // Should not query DB when env match is found
    expect(mockSql).not.toHaveBeenCalled();
  });

  it('is case-insensitive for email matching', async () => {
    process.env.ADMIN_EMAILS = 'Admin@Example.COM';
    const result = await isUserAdmin('user-1', 'admin@example.com');
    expect(result).toBe(true);
  });

  it('trims whitespace from ADMIN_EMAILS entries', async () => {
    process.env.ADMIN_EMAILS = '  admin@test.com , other@test.com  ';
    const result = await isUserAdmin('user-1', 'admin@test.com');
    expect(result).toBe(true);
  });

  // ============================================================
  // DB fallback
  // ============================================================

  it('falls back to DB when email is not in env', async () => {
    process.env.ADMIN_EMAILS = 'other@example.com';
    mockSql.mockResolvedValue([{ isAdmin: true }]);
    const result = await isUserAdmin('user-1', 'notadmin@example.com');
    expect(result).toBe(true);
    expect(mockSql).toHaveBeenCalled();
  });

  it('falls back to DB when no email is provided', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    mockSql.mockResolvedValue([{ isAdmin: true }]);
    const result = await isUserAdmin('user-1');
    expect(result).toBe(true);
  });

  it('returns false if DB says user is not admin', async () => {
    delete process.env.ADMIN_EMAILS;
    mockSql.mockResolvedValue([{ isAdmin: false }]);
    const result = await isUserAdmin('user-1', 'user@example.com');
    expect(result).toBe(false);
  });

  it('returns false if user not found in DB', async () => {
    delete process.env.ADMIN_EMAILS;
    mockSql.mockResolvedValue([]);
    const result = await isUserAdmin('nonexistent');
    expect(result).toBe(false);
  });

  // ============================================================
  // Edge cases
  // ============================================================

  it('returns false when DB query throws (isAdmin column missing)', async () => {
    delete process.env.ADMIN_EMAILS;
    mockSql.mockRejectedValue(new Error('column "isAdmin" does not exist'));
    const result = await isUserAdmin('user-1');
    expect(result).toBe(false);
  });

  it('returns false when ADMIN_EMAILS is empty string and no DB match', async () => {
    process.env.ADMIN_EMAILS = '';
    mockSql.mockResolvedValue([{ isAdmin: false }]);
    const result = await isUserAdmin('user-1', 'user@example.com');
    expect(result).toBe(false);
  });

  it('handles ADMIN_EMAILS with single entry (no comma)', async () => {
    process.env.ADMIN_EMAILS = 'solo@example.com';
    const result = await isUserAdmin('user-1', 'solo@example.com');
    expect(result).toBe(true);
  });
});
