// ============================================================
// useExperiment — Client-side React hook for A/B experiments
//
// Usage:
//   const variant = useExperiment('qd_personalized_insight')
//   if (variant === 'treatment') { showInsight() }
//
// Uses clientId (anonymous) or userId (authenticated) as the
// stable identifier for deterministic assignment.
// ============================================================

"use client";

import { useMemo } from "react";
import { assignVariant } from "./assign";
import { getClientId } from "@/lib/auth/client-id";

/**
 * Get the assigned variant for an experiment.
 *
 * @param experimentId - Experiment ID from config
 * @param options - Optional overrides for identifier and cohort
 * @returns Variant ID string, or null if not eligible
 */
export function useExperiment(
  experimentId: string,
  options?: { userId?: string | null; cohort?: string | null },
): string | null {
  const identifier = options?.userId || getClientId();

  return useMemo(
    () => assignVariant(experimentId, identifier, options?.cohort),
    [experimentId, identifier, options?.cohort],
  );
}
