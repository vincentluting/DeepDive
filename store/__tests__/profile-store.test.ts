import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProfileStore } from '../profile-store';

// Helper to get a fresh store state between tests
function getStore() {
  return useProfileStore.getState();
}

describe('useProfileStore.fetchProfile', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProfileStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('sets locked=true and no error when API returns 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await getStore().fetchProfile('user-123');

    const state = getStore();
    expect(state.locked).toBe(true);
    expect(state.error).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets error="load_failed" and locked=false when API returns 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await getStore().fetchProfile('user-123');

    const state = getStore();
    expect(state.error).toBe('load_failed');
    expect(state.locked).toBe(false);
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets error="load_failed" and locked=false on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    await getStore().fetchProfile('user-123');

    const state = getStore();
    expect(state.error).toBe('load_failed');
    expect(state.locked).toBe(false);
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('sets profile and clears error/locked when API returns 200 with data', async () => {
    const mockProfile = { id: 'p-1', userId: 'user-123', archetype: { code: 'R-explore' } };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockProfile),
    }));

    await getStore().fetchProfile('user-123');

    const state = getStore();
    expect((state.profile as any)?.id).toBe('p-1');
    expect(state.error).toBeNull();
    expect(state.locked).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('does not expose raw "Failed to fetch profile" string in any error state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await getStore().fetchProfile('user-123');

    expect(getStore().error).not.toBe('Failed to fetch profile');
  });

  it('resets locked and error to false/null before fetching', async () => {
    // Pre-set a locked state
    useProfileStore.setState({ locked: true, error: 'old-error' });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const fetchPromise = getStore().fetchProfile('user-123');

    // isLoading should be true immediately after initiating fetch
    expect(useProfileStore.getState().isLoading).toBe(true);
    expect(useProfileStore.getState().locked).toBe(false);
    expect(useProfileStore.getState().error).toBeNull();

    await fetchPromise;
  });
});
