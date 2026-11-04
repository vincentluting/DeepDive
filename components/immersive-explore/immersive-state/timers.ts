// ============================================================
// Immersive Engine — Timer Orchestration
// ============================================================
// Question advancement is now synchronous inside RECORD_ANSWER.
// The only remaining timer drives the 5-step generation animation
// shown after the user submits the avatar gender.
// ============================================================

"use client";

import { useEffect, type Dispatch } from "react";
import type { ImmersiveState, ImmersiveAction } from "./types";

export function useImmersiveTimers(
  state: ImmersiveState,
  dispatch: Dispatch<ImmersiveAction>,
) {
  // Generation animation: 500ms per step, 5 steps total.
  useEffect(() => {
    if (state.phase !== "generating") return;

    let step = 0;
    const interval = setInterval(() => {
      step++;
      dispatch({ type: "GEN_STEP", step });
      if (step >= 5) clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, [state.phase, dispatch]);
}
