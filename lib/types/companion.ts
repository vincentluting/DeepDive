// ============================================================
// Archetype Companion — Domain Types
// ============================================================
//
// Companion is the social discovery layer (12-type compatibility
// matching). Decoupled from PersonalProfile so RealConditions and
// other sensitive content never leak into discovery responses.
//
// Access is gated by two layers:
//   1. cohort entitlements.socialFeatures (lib/cohort/types.ts)
//   2. User.socialEnabled (per-user opt-in)
// Both must be true to enter discovery surfaces.
// ============================================================

import type { RIASECDimension, ValueOrientation } from "./dimensions";

// ── Enums (mirror SQL CHECK constraints) ─────────────────────

export type CompanionVisibility =
  | "discoverable" // surfaces in /companions Top-N
  | "friends_only" // hidden from discovery; accepted friends still see it
  | "hidden"; // fully invisible (set when User.socialEnabled flips off)

export type CompanionConnectionStatus =
  | "pending" // recipient has not yet acted
  | "accepted" // both sides may now see each other's CompanionProfile
  | "declined"; // recipient declined; row kept for rate-limit purposes

export type CompanionReportReason =
  | "harassment"
  | "inappropriate_content"
  | "spam"
  | "other";

export type CompanionReportStatus = "open" | "reviewed" | "dismissed";

export type CompanionLocale = "en" | "zh";

// ── RIASEC 6-dim scores stored on profile ────────────────────

/** RIASEC 6-dim score vector, copied from QuickDiveResult on profile creation. */
export type CompanionRiasecScores = Record<RIASECDimension, number>;

// ── Domain Models ────────────────────────────────────────────

export interface CompanionProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  archetypeCode: string;
  scoresJson: CompanionRiasecScores;
  locale: CompanionLocale;
  visibility: CompanionVisibility;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile shape returned to OTHER users (discovery candidates, friend
 * lists, friend profile detail). Strips raw RIASEC scoresJson so we
 * never ship assessment data to peers — they only see name, archetype,
 * bio, locale, visibility, and a server-computed compatibility score.
 *
 * Self-read endpoints (/api/companions/profile) still return the full
 * CompanionProfile; only OTHER users get the public projection.
 */
export type PublicCompanionProfile = Omit<CompanionProfile, "scoresJson">;

export function toPublicCompanionProfile(
  profile: CompanionProfile,
): PublicCompanionProfile {
  const { scoresJson: _scores, ...rest } = profile;
  void _scores;
  return rest;
}

export interface CompanionConnection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: CompanionConnectionStatus;
  requesterMessage: string | null;
  acceptedAt: Date | null;
  declinedAt: Date | null;
  createdAt: Date;
}

export interface CompanionBlock {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
  createdAt: Date;
}

export interface CompanionReport {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: CompanionReportReason;
  details: string | null;
  status: CompanionReportStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

// ── Computed shapes used by API responses ────────────────────

/** A discovery candidate: the public-facing profile + computed compatibility. */
export interface CompanionCandidate {
  profile: PublicCompanionProfile;
  compatibility: {
    score: number; // 0-100, see lib/companions/compatibility.ts
    cosineSimilarity: number; // 0-1 RIASEC vector similarity
    complementarity: number; // 0.7 (same orientation) | 1.0 (opposite)
    primary: RIASECDimension;
    orientation: ValueOrientation;
  };
}

/** Connection list buckets used by the /companions page tabs. */
export interface CompanionConnectionBuckets {
  incomingPending: CompanionConnection[];
  outgoingPending: CompanionConnection[];
  accepted: CompanionConnection[];
}

/**
 * Connection paired with the OTHER party's public profile (relative to viewer).
 * Used by the /companions page so each list row can render
 * displayName + archetype + bio without separate per-row fetches.
 *
 * `other` is the public projection (no scoresJson) — and it's null when
 * the other side has disabled Companion or hidden their profile, so
 * the viewer can still act on the connection (unfriend / cancel) without
 * leaking the disappeared user's identity.
 */
export interface CompanionConnectionWithProfile {
  connection: CompanionConnection;
  other: PublicCompanionProfile | null;
}

export interface CompanionConnectionBucketsWithProfiles {
  incomingPending: CompanionConnectionWithProfile[];
  outgoingPending: CompanionConnectionWithProfile[];
  accepted: CompanionConnectionWithProfile[];
}
