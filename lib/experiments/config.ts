// ============================================================
// Experiment Configuration — Declarative A/B Test Definitions
//
// Add experiments here. Each experiment defines:
//   - variants with traffic weights
//   - optional cohort restrictions
//   - start/end dates for auto-expiry
//
// Assignment is deterministic (hash-based) — no DB writes needed.
// ============================================================

export interface ExperimentVariant {
  /** Variant identifier (e.g. "control", "treatment") */
  id: string;
  /** Traffic weight (relative, not percentage). Weights are normalized at assignment time. */
  weight: number;
}

export interface ExperimentConfig {
  /** Unique experiment identifier */
  id: string;
  /** Human-readable description */
  description: string;
  /** Variant definitions with traffic weights */
  variants: ExperimentVariant[];
  /** If set, only users in these cohorts are eligible */
  cohortRestriction?: string[];
  /** ISO date string — experiment not active before this */
  startDate?: string;
  /** ISO date string — experiment not active after this */
  endDate?: string;
  /** If true, experiment is paused (all users get first variant) */
  paused?: boolean;
}

// ============================================================
// Active Experiments
// ============================================================

// No active experiments right now. Add entries here when the product has
// enough user volume to reach statistical significance (historically ~1k+
// samples per variant). Early-stage features are shipped 100% and evaluated
// via qualitative feedback (NPS, coach chat, user interviews).
export const EXPERIMENTS: Record<string, ExperimentConfig> = {};

// ============================================================
// Helpers
// ============================================================

/** Get an experiment config by ID, or null if not found */
export function getExperiment(id: string): ExperimentConfig | null {
  return EXPERIMENTS[id] ?? null;
}

/** List all currently active experiments */
export function getActiveExperiments(): ExperimentConfig[] {
  const now = new Date().toISOString();
  return Object.values(EXPERIMENTS).filter((exp) => {
    if (exp.paused) return false;
    if (exp.startDate && now < exp.startDate) return false;
    if (exp.endDate && now > exp.endDate) return false;
    return true;
  });
}
