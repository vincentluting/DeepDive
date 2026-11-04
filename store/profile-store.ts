// ============================================================
// Zustand Store: Personal Profile Data
// ============================================================

import { create } from 'zustand';
import type { PersonalProfileData } from '@/lib/types';

interface ProfileStore {
  profile: PersonalProfileData | null;
  isLoading: boolean;
  error: string | null;
  /** true when the API returned 404 — profile not yet generated (Deep Dive not completed) */
  locked: boolean;

  // Actions
  setProfile: (profile: PersonalProfileData) => void;
  setError: (error: string | null) => void;
  fetchProfile: (profileId: string) => Promise<void>;
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  locked: false,

  setProfile: (profile) => set({ profile, isLoading: false, error: null, locked: false }),
  setError: (error) => set({ error, isLoading: false }),

  fetchProfile: async (profileId: string) => {
    set({ isLoading: true, error: null, locked: false });
    try {
      const res = await fetch(`/api/generate-profile?userId=${profileId}`);

      if (res.status === 404) {
        // Profile not yet generated — Deep Dive not completed. Not a technical error.
        set({ locked: true, isLoading: false });
        return;
      }

      if (!res.ok) {
        // Real server / network error
        set({ error: 'load_failed', isLoading: false });
        return;
      }

      const data = await res.json();
      set({ profile: data, isLoading: false });
    } catch {
      // Network failure or JSON parse error
      set({ error: 'load_failed', isLoading: false });
    }
  },

  reset: () => set({ profile: null, isLoading: false, error: null, locked: false }),
}));
