// ============================================================
// useAvatarGender — storage-layer abstraction for the user's
// archetype avatar gender selection.
//
// Resolution priority (reads):
//   1. opts.savedGender   (from DB, passed in by the server)
//   2. localStorage        (client-side echo after selection)
//   3. null → needsPrompt = true (caller decides whether to show modal)
//
// Writes (setGender):
//   - Always updates localStorage immediately (instant UI feedback)
//   - DB persistence is piggybacked onto POST /api/quickdive/save at
//     assessment completion — see the Quick Dive save payload.
//
// Why a hook: consuming components don't need to know whether the
// value comes from DB, localStorage, or a future UserPreferences
// table. If persistence migrates, only this file changes.
// ============================================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { isAvatarGender, type AvatarGender } from "./archetype-avatar-asset";

const STORAGE_KEY = "dd_avatar_gender";
const LEGACY_STORAGE_KEY = "dd_chibi_gender";

export interface UseAvatarGenderOptions {
  /** Server-injected gender from the latest Quick Dive result. Wins over localStorage. */
  savedGender?: AvatarGender | null;
  /** Archetype code — future use for hash-fallback UIs. Not consumed here directly. */
  archetypeCode?: string;
}

export interface UseAvatarGenderResult {
  gender: AvatarGender | null;
  setGender: (g: AvatarGender) => void;
  needsPrompt: boolean;
  loading: boolean;
}

function readFromStorage(): AvatarGender | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return isAvatarGender(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeToStorage(g: AvatarGender): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, g);
  } catch {
    // Storage may be disabled (incognito / privacy mode) — callers
    // can still display the avatar for the current session via React state.
  }
}

export function useAvatarGender(
  opts: UseAvatarGenderOptions = {},
): UseAvatarGenderResult {
  const { savedGender } = opts;

  // Start from server-injected value (SSR-safe). Never read localStorage
  // during initial render to avoid hydration mismatch.
  const [gender, setGenderState] = useState<AvatarGender | null>(
    savedGender ?? null,
  );
  const [hydrated, setHydrated] = useState(false);

  // On mount, if no server value, read localStorage. This happens after
  // hydration so SSR/CSR markup agrees.
  useEffect(() => {
    if (savedGender) {
      setGenderState(savedGender);
      setHydrated(true);
      return;
    }
    const stored = readFromStorage();
    if (stored) setGenderState(stored);
    setHydrated(true);
  }, [savedGender]);

  const setGender = useCallback((g: AvatarGender) => {
    setGenderState(g);
    writeToStorage(g);
  }, []);

  return {
    gender,
    setGender,
    needsPrompt: hydrated && gender === null,
    loading: !hydrated,
  };
}
