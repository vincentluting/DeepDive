// ============================================================
// Experiments Module — A/B Testing Framework
//
// Deterministic, hash-based experiment assignment.
// No DB writes, no external services.
//
// Usage:
//   Server:  import { assignVariant } from '@/lib/experiments'
//   Client:  import { useExperiment } from '@/lib/experiments/use-experiment'
//   Config:  import { EXPERIMENTS } from '@/lib/experiments/config'
// ============================================================

export { assignVariant, bucketVariant } from "./assign";
export {
  EXPERIMENTS,
  getExperiment,
  getActiveExperiments,
  type ExperimentConfig,
  type ExperimentVariant,
} from "./config";
