// ============================================================
// Tests for Password Hashing & Verification
// ============================================================

import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the DB module before importing passwords
vi.mock('@/lib/db', () => ({
  sql: vi.fn(),
}));

import { hashPassword, verifyPassword } from '../passwords';

describe('hashPassword', () => {
  it('returns a bcrypt hash string', async () => {
    const hash = await hashPassword('testPassword123');
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('produces different hashes for the same password (salted)', async () => {
    const hash1 = await hashPassword('samePassword');
    const hash2 = await hashPassword('samePassword');
    expect(hash1).not.toBe(hash2);
  });

  it('produces different hashes for different passwords', async () => {
    const hash1 = await hashPassword('password1');
    const hash2 = await hashPassword('password2');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('verifies correct bcrypt password', async () => {
    const password = 'mySecretPassword';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('rejects incorrect bcrypt password', async () => {
    const hash = await hashPassword('correctPassword');
    const result = await verifyPassword('wrongPassword', hash);
    expect(result).toBe(false);
  });

  it('handles empty password gracefully', async () => {
    const hash = await hashPassword('nonEmpty');
    const result = await verifyPassword('', hash);
    expect(result).toBe(false);
  });

  // Edge case: legacy SHA-256 verification
  describe('legacy SHA-256 fallback', () => {
    const originalEnv = process.env.AUTH_SECRET;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.AUTH_SECRET = originalEnv;
      } else {
        delete process.env.AUTH_SECRET;
      }
    });

    it('returns false for legacy hash when AUTH_SECRET is not set', async () => {
      delete process.env.AUTH_SECRET;
      // A 64-char hex string that doesn't start with $2 is treated as legacy SHA-256
      const fakeLegacyHash = 'a'.repeat(64);
      const result = await verifyPassword('anyPassword', fakeLegacyHash);
      expect(result).toBe(false);
    });

    it('verifies correct legacy SHA-256 hash when AUTH_SECRET is set', async () => {
      process.env.AUTH_SECRET = 'test-secret';
      const password = 'legacyPassword';

      // Manually compute SHA-256(password + secret) to create a valid legacy hash
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'test-secret');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legacyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const result = await verifyPassword(password, legacyHash);
      expect(result).toBe(true);
    });

    it('rejects wrong password for legacy SHA-256 hash', async () => {
      process.env.AUTH_SECRET = 'test-secret';

      // Create a valid legacy hash for 'correctPwd'
      const encoder = new TextEncoder();
      const data = encoder.encode('correctPwd' + 'test-secret');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const legacyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const result = await verifyPassword('wrongPwd', legacyHash);
      expect(result).toBe(false);
    });
  });
});
