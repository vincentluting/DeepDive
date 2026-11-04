import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db connection module
const mockSql = vi.fn();
vi.mock('../db/connection', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

// Mock crypto.randomUUID
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-0001',
}));

// Import after mocking
const { backfillFunnelEvents } = await import('../db/identity');

describe('backfillFunnelEvents', () => {
  beforeEach(() => {
    mockSql.mockReset();
  });

  it('should update UserFunnel records matching the anonymousId', async () => {
    // Simulate UPDATE returning count of 3 rows
    mockSql.mockResolvedValueOnce({ count: 3 });

    const result = await backfillFunnelEvents('new-user-id', 'test-client-id');

    expect(result).toBe(3);
    expect(mockSql).toHaveBeenCalledTimes(1);

    // Verify the tagged-template call includes the right parameters
    // mockSql receives (strings[], ...values) from tagged template
    const callArgs = mockSql.mock.calls[0];
    // The template strings array is the first arg
    const templateStrings = callArgs[0];
    // Should contain UPDATE "UserFunnel" SET "userId" ... WHERE "clientId" ...
    const joined = Array.isArray(templateStrings) ? templateStrings.join('?') : '';
    expect(joined).toContain('UPDATE "UserFunnel"');
    expect(joined).toContain('"userId"');
    expect(joined).toContain('"clientId"');

    // The interpolated values should be userId and anonymousId
    const values = callArgs.slice(1);
    expect(values).toContain('new-user-id');
    expect(values).toContain('test-client-id');
  });

  it('should return 0 when no rows match', async () => {
    mockSql.mockResolvedValueOnce({ count: 0 });

    const result = await backfillFunnelEvents('new-user-id', 'nonexistent-client');

    expect(result).toBe(0);
    expect(mockSql).toHaveBeenCalledTimes(1);
  });

  it('should return 0 when count is not provided in result', async () => {
    // Some SQL drivers return an empty-like result
    mockSql.mockResolvedValueOnce({});

    const result = await backfillFunnelEvents('user-123', 'client-456');

    expect(result).toBe(0);
  });
});
