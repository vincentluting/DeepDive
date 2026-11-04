// ============================================================
// Archetype Avatar Asset — central mapping between 12-archetype
// codes ("R-enhancement") and the avatar image files shipped at
// public/12 avatar/{ArchetypeName}-{gender}.png.
//
// All avatar URL generation routes through this module. Future
// asset relocation (e.g. renaming to public/archetype-avatars/, switching to
// a CDN, or producing WebP originals) only needs edits here.
// ============================================================

export type AvatarGender = "male" | "female";

/** Code (RIASEC-orientation) → ArchetypeName used in the asset filename. */
export const AVATAR_NAME_BY_CODE: Readonly<Record<string, string>> = {
  "R-enhancement": "Architect",
  "R-transcendence": "Backbone",
  "I-enhancement": "Tactician",
  "I-transcendence": "Researcher",
  "A-enhancement": "Icon",
  "A-transcendence": "Dreamweaver",
  "S-enhancement": "Mentor",
  "S-transcendence": "Healer",
  "E-enhancement": "Ace",
  "E-transcendence": "Pioneer",
  "C-enhancement": "Commander",
  "C-transcendence": "Arbiter",
};

/** Local fallback folder containing the 24 archetype avatar PNGs (46MB total).
 *  Space is kept to match the user's upload; encoded on the wire. */
const LOCAL_CHIBI_DIR = "/12 avatar";

/**
 * Resolves the CDN base URL when configured.
 *
 * Env var: NEXT_PUBLIC_AVATAR_CDN_BASE
 *   - e.g. "https://cdn.example.com/avatars" (no trailing slash)
 *   - When set, avatars are served as `.webp` from this base
 *   - When unset, falls back to local `/12 avatar/*.png`
 *
 * Why env-driven: Vercel Hobby has a 100GB/mo bandwidth ceiling. 46MB of
 * PNGs would exhaust it after ~2k unique visits with full asset loads
 * during thesis recruitment, halting deployment. Cloudflare R2 (10GB +
 * unlimited egress free) absorbs this. The fallback path lets dev /
 * preview keep working without R2 setup.
 */
function getCdnBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_AVATAR_CDN_BASE?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

/** Returns the public URL for a given archetype × gender, or null when
 *  the archetype code is unknown (component falls back to placeholder).
 *
 *  Uses CDN + webp when NEXT_PUBLIC_AVATAR_CDN_BASE is set; otherwise
 *  falls back to URL-encoded local PNG path. */
export function getAvatarAssetUrl(
  archetypeCode: string,
  gender: AvatarGender,
): string | null {
  const name = AVATAR_NAME_BY_CODE[archetypeCode];
  if (!name) return null;

  const cdnBase = getCdnBase();
  if (cdnBase) {
    return `${cdnBase}/${name}-${gender}.webp`;
  }

  const filename = `${name}-${gender}.png`;
  return `${encodeURI(LOCAL_CHIBI_DIR)}/${encodeURIComponent(filename)}`;
}

/** Deterministic gender fallback when no explicit selection exists.
 *
 *  Why: users can land on a saved report URL without ever having been
 *  asked (different user viewing a share link). Hash-based fallback
 *  guarantees the same archetype always shows the same avatar style — no
 *  "why does this look different now" UX surprise. */
export function fallbackGenderForCode(archetypeCode: string): AvatarGender {
  const code = archetypeCode || "";
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
  return sum % 2 === 0 ? "female" : "male";
}

/** Resolves the URL using the provided gender, or a deterministic
 *  fallback if the caller didn't supply one. */
export function resolveAvatarUrl(
  archetypeCode: string,
  gender: AvatarGender | null | undefined,
): string | null {
  const resolved = gender ?? fallbackGenderForCode(archetypeCode);
  return getAvatarAssetUrl(archetypeCode, resolved);
}

/** Type guard for persisted values from DB / API. */
export function isAvatarGender(v: unknown): v is AvatarGender {
  return v === "male" || v === "female";
}
