// ============================================================
// Zustand Store: Auth Session Cache
// ============================================================
// Caches user identity + latest report ID across page navigations.
// Eliminates waterfall API calls in useHeaderUser — fetch once,
// read from memory on subsequent route changes.

const __DEV__ = process.env.NODE_ENV === "development";

import { create } from "zustand";

import { loadFromLocalStorage } from "@/lib/questionnaire/store-utils";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin?: boolean;
}

interface AuthStore {
  user: AuthUser | null;
  latestReportId: string | null;
  /** 0=new, 1=quickDiveOnly, 2=deepReport, 3=powerUser — controls nav locked state */
  userLevel: 0 | 1 | 2 | 3;
  hasInProgressSession: boolean;
  isLoading: boolean;
  /** Whether initial fetch has completed at least once */
  initialized: boolean;

  // Actions
  fetchSession: () => Promise<void>;
  setLatestReportId: (id: string | null) => void;
  setUserLevel: (level: 0 | 1 | 2 | 3) => void;
  /** Clear cache and re-fetch session — call after any action that changes userLevel */
  invalidateAndRefetch: () => Promise<void>;
  checkInProgressSession: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  latestReportId: null,
  userLevel: 0,
  hasInProgressSession: false,
  isLoading: false,
  initialized: false,

  fetchSession: async () => {
    // Skip if already initialized — use cached data
    if (get().initialized) return;

    set({ isLoading: true });

    try {
      // Step 1: Check auth status first
      const authRes = await fetch("/api/auth/me");

      if (!authRes.ok) {
        set({
          user: null,
          latestReportId: null,
          userLevel: 0,
          isLoading: false,
          initialized: true,
        });
        return;
      }

      const data = await authRes.json();
      const user = data.user ?? null;
      const userLevel = (data.userLevel ?? 0) as 0 | 1 | 2 | 3;

      set({
        user,
        latestReportId: null,
        userLevel,
        isLoading: false,
        initialized: true,
      });

      // Fetch report metadata after identity is available so nav/auth UI
      // does not remain anonymous while a slower report query is in flight.
      if (!user) return;

      const reportRes = await fetch("/api/reports/latest").catch(() => null);
      if (reportRes?.ok) {
        const reportData = await reportRes.json();
        set({ latestReportId: reportData.id ?? null });
      }
    } catch (err) {
      if (__DEV__) console.error("Failed to fetch session:", err);
      set({
        user: null,
        latestReportId: null,
        userLevel: 0,
        isLoading: false,
        initialized: true,
      });
    }
  },

  setLatestReportId: (id) => set({ latestReportId: id }),
  setUserLevel: (level) => set({ userLevel: level }),

  invalidateAndRefetch: async () => {
    set({ initialized: false });
    await get().fetchSession();
  },

  checkInProgressSession: () => {
    // Read the canonical questionnaire session (sessionStorage since
    // 2026-05-18). loadFromLocalStorage already excludes completed/expired
    // sessions and is SSR-safe (returns null when window is absent).
    const session = loadFromLocalStorage();
    set({ hasInProgressSession: !!(session && session.answers?.length > 0) });
  },

  clearSession: () =>
    set({
      user: null,
      latestReportId: null,
      userLevel: 0,
      hasInProgressSession: false,
      isLoading: false,
      initialized: false,
    }),
}));
