// ============================================================
// Career Exploration Engine — Public API
//
// Unified multi-factor career matching with progressive precision.
// ============================================================

// New engine (primary API)
export {
  explore,
  exploreFromRiasec,
} from './engine'

// Types
export type {
  UserProfile,
  ExplorationResult,
  ScoredCareer,
  CareerDisplayItem,
} from './types'

// Legacy compatibility — old matchCareersForDisplay still works
// but now delegates to the new engine internally
export { exploreFromRiasec as matchCareersForDisplay } from './engine'
