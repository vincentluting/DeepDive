// ============================================================
// Unified Explore Result — Router shim.
//
// All explore modes (classic / narrative / immersive) render through the
// Revelation editorial shell. The legacy glassmorphism shell was retired
// when Immersive Dive was migrated to Rev. The `PersonalizedInsight`
// chapter (the only realtime LLM call on this page) was removed at the
// same time — the result page is now 100% algorithmic.
//
// If we ever need to roll back the Immersive migration, revert to the
// flag-gated shim at commit e0166b8f (and restore the deleted legacy
// file from git history).
// ============================================================

"use client";

export type { UnifiedExploreResultProps } from "./revelation/unified-explore-result-rev";
export { UnifiedExploreResultRev as UnifiedExploreResult } from "./revelation/unified-explore-result-rev";
