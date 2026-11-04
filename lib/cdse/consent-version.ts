// ============================================================
// Consent Versioning — audit trail for informed-consent wording
//
// `CONSENT_VERSION` is a manual, human-readable tag that must be
// bumped every time `RESEARCH_CONSENT` in `research-consent.ts`
// changes in a way a participant would care about (new data
// recipients, new retention period, change to withdrawal terms).
//
// `computeConsentTextHash()` captures the exact bytes of the
// consent surface at POST time, so even a silent edit can be
// detected retroactively. Stored on every ConsentRecord row.
// ============================================================

import { createHash } from "crypto";
import { RESEARCH_CONSENT } from "./research-consent";

// Bump when sections/body text change — format YYYY-MM-DD-vN.
// Mirrors Research_Survey_Final.md spec version in founder/Thesis/.
export const CONSENT_VERSION = "2026-04-06-v5.2";

/** SHA-256 hash of the en+zh consent surface, stable across runs. */
export function computeConsentTextHash(): string {
  const canonical = JSON.stringify({
    version: CONSENT_VERSION,
    en: RESEARCH_CONSENT.en,
    zh: RESEARCH_CONSENT.zh,
  });
  return createHash("sha256").update(canonical).digest("hex");
}
