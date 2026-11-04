// ============================================================
// Module Resolver — Determines which Deep Dive modules to show
//
// Quick Dive is a prerequisite for Deep Dive (enforced by page gate).
// Deep Dive always runs 3 modules (A + B + C), never includes RIASEC.
// Partial resume support: only remaining (incomplete) modules are shown.
// ============================================================

import { getExplorationProgress } from "@/lib/db/exploration-progress";

// ── Question counts per module ───────────────────────────────

const MODULE_A_QUESTION_COUNT = 6; // SJT scenarios
const MODULE_B_QUESTION_COUNT = 20; // TwIVI
const MODULE_C_QUESTION_COUNT = 60; // IPIP-60

/** Average seconds per question, by module (calibrated to ~20 min total) */
const AVG_SECONDS = {
  sjt: 40,
  ddvq: 15,
  ipip: 11,
};

// ── Public types ─────────────────────────────────────────────

export interface ResolvedModules {
  /** Always false — RIASEC is handled by Quick Dive, not Deep Dive */
  includeRIASEC: boolean;
  /** Module A: SJT (6 scenarios) */
  includeModuleA: boolean;
  /** Module B: TwIVI (20 values items) */
  includeModuleB: boolean;
  /** Module C: IPIP-60 (60 personality items) */
  includeModuleC: boolean;
  /** Total scored questions across all included modules */
  totalQuestions: number;
  /** Estimated completion time in minutes */
  estimatedMinutes: number;
}

// ── Main resolver ────────────────────────────────────────────

/**
 * Resolve which Deep Dive modules a user still needs to complete.
 *
 * Logic:
 * 1. includeRIASEC is always false (Quick Dive gate enforces prerequisite)
 * 2. Check UserExplorationProgress.modulesJson for per-module completion
 * 3. Each Deep Dive module (sjt, ddvq, ipip60) is included only if
 *    the user hasn't completed it yet
 * 4. Calculate total questions and estimated time from included modules
 */
export async function resolveDeepDiveModules(
  userId: string,
): Promise<ResolvedModules> {
  const explorationProgress = await getExplorationProgress(userId);

  // Check per-module completion from exploration progress
  const modules = explorationProgress?.modules ?? {};
  const includeModuleA = modules.sjt == null;
  const includeModuleB = modules.ddvq == null;
  const includeModuleC = modules.ipip60 == null;

  // Calculate totals
  let totalQuestions = 0;
  let totalSeconds = 0;

  if (includeModuleA) {
    totalQuestions += MODULE_A_QUESTION_COUNT;
    totalSeconds += MODULE_A_QUESTION_COUNT * AVG_SECONDS.sjt;
  }
  if (includeModuleB) {
    totalQuestions += MODULE_B_QUESTION_COUNT;
    totalSeconds += MODULE_B_QUESTION_COUNT * AVG_SECONDS.ddvq;
  }
  if (includeModuleC) {
    totalQuestions += MODULE_C_QUESTION_COUNT;
    totalSeconds += MODULE_C_QUESTION_COUNT * AVG_SECONDS.ipip;
  }

  const estimatedMinutes = Math.ceil(totalSeconds / 60);

  return {
    includeRIASEC: false,
    includeModuleA,
    includeModuleB,
    includeModuleC,
    totalQuestions,
    estimatedMinutes,
  };
}

// ── Client-side resolver (from pre-fetched data) ─────────────

/**
 * Pure function variant for client-side use.
 * Accepts pre-fetched data instead of making DB calls.
 */
export function resolveDeepDiveModulesFromData(params: {
  hasQuickDiveResult: boolean;
  completedModules: Record<string, unknown>;
}): ResolvedModules {
  const { completedModules } = params;

  const includeModuleA = completedModules.sjt == null;
  const includeModuleB = completedModules.ddvq == null;
  const includeModuleC = completedModules.ipip60 == null;

  let totalQuestions = 0;
  let totalSeconds = 0;

  if (includeModuleA) {
    totalQuestions += MODULE_A_QUESTION_COUNT;
    totalSeconds += MODULE_A_QUESTION_COUNT * AVG_SECONDS.sjt;
  }
  if (includeModuleB) {
    totalQuestions += MODULE_B_QUESTION_COUNT;
    totalSeconds += MODULE_B_QUESTION_COUNT * AVG_SECONDS.ddvq;
  }
  if (includeModuleC) {
    totalQuestions += MODULE_C_QUESTION_COUNT;
    totalSeconds += MODULE_C_QUESTION_COUNT * AVG_SECONDS.ipip;
  }

  const estimatedMinutes = Math.ceil(totalSeconds / 60);

  return {
    includeRIASEC: false,
    includeModuleA,
    includeModuleB,
    includeModuleC,
    totalQuestions,
    estimatedMinutes,
  };
}
