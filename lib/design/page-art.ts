/**
 * Page-Art system — "one shell, per-page variation" engine (Meridian).
 *
 * Each page = one painting from the shared asset pool × its own crop position,
 * filter treatment and accent color. Transcribed from the approved concept
 * boards (docs/design/page-templates/template-gallery-v2.html `pageArt` map).
 *
 * Rendered by `components/design/meridian/page-art-layer.tsx`.
 * Spec: `.claude/skills/deepdive-design/references/page-art.md`.
 */

export type PageArtAsset =
  | "sunlit-day"
  | "hero-ocean"
  | "lighthouse"
  | "profile-descent-day"
  | "profile-descent-midnight"
  | "waiting"
  | "archive"
  | "theater"
  | "laboratory"
  | "zeroroom"
  | "mechanical"
  | "negotiation";

/** Asset id → public path. brand/* are webp-converted paintings; scenes ship as webp. */
export const PAGE_ART_ASSETS: Record<
  PageArtAsset,
  { src: string; kind: "brand" | "scene" }
> = {
  "sunlit-day": { src: "/brand/sunlit-descent-day.webp", kind: "brand" },
  "hero-ocean": { src: "/brand/monograph-hero-ocean.webp", kind: "brand" },
  lighthouse: { src: "/brand/monograph-lighthouse.webp", kind: "brand" },
  "profile-descent-day": {
    src: "/brand/profile-descent-day.webp",
    kind: "brand",
  },
  "profile-descent-midnight": {
    src: "/brand/profile-descent-midnight.webp",
    kind: "brand",
  },
  waiting: { src: "/immersive/scenes/waiting.webp", kind: "scene" },
  archive: { src: "/immersive/scenes/archive.webp", kind: "scene" },
  theater: { src: "/immersive/scenes/theater.webp", kind: "scene" },
  laboratory: { src: "/immersive/scenes/laboratory.webp", kind: "scene" },
  zeroroom: { src: "/immersive/scenes/zeroroom.webp", kind: "scene" },
  mechanical: { src: "/immersive/scenes/mechanical.webp", kind: "scene" },
  negotiation: { src: "/immersive/scenes/negotiation.webp", kind: "scene" },
};

export interface PageArt {
  /** Painting for Monet Noon (light mode). */
  light: PageArtAsset;
  /** Painting for Midnight (dark mode). */
  dark: PageArtAsset;
  /** object-position crop per mode. */
  posLight: string;
  posDark: string;
  /** Per-page accent, exposed as `--page-accent` for buttons/active states. */
  accent: string;
  /** Wash family (defaults to the route's surface; override for special pages). */
  wash?: "dive" | "revelation" | "sanctuary" | "utility";
}

/**
 * Route-segment → art config. Keys match the first meaningful path segment
 * after the locale (e.g. `/en/dashboard` → "dashboard").
 *
 * Accents are deliberate literal hex — per-page atmosphere art direction from
 * the approved concept boards, not UI tokens (UI colors live in globals.css).
 */
/* eslint-disable local/no-hardcoded-brand-colors -- page-art accents are per-page art direction, not UI tokens */
export const PAGE_ART: Record<string, PageArt> = {
  landing: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "center 7%",
    posDark: "center top",
    accent: "#0b6f9d",
  },
  explore: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "58% 12%",
    posDark: "45% top",
    accent: "#0870ae",
  },
  dashboard: {
    light: "sunlit-day",
    dark: "archive",
    posLight: "42% 18%",
    posDark: "center 48%",
    accent: "#2c8395",
  },
  quickdive: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "62% 14%",
    posDark: "58% top",
    accent: "#0b86b2",
  },
  "immersive-dive": {
    light: "theater",
    dark: "theater",
    posLight: "center 45%",
    posDark: "center 45%",
    accent: "#6fb9cc",
  },
  deepdive: {
    light: "laboratory",
    dark: "hero-ocean",
    posLight: "center 44%",
    posDark: "center top",
    accent: "#42a9c6",
  },
  "post-assessment": {
    light: "zeroroom",
    dark: "zeroroom",
    posLight: "center 48%",
    posDark: "center 48%",
    accent: "#4d8fa0",
  },
  "profile-reveal": {
    light: "lighthouse",
    dark: "archive",
    posLight: "22% 42%",
    posDark: "center 46%",
    accent: "#8a7b56",
  },
  profile: {
    light: "profile-descent-day",
    dark: "profile-descent-midnight",
    posLight: "center center",
    posDark: "center center",
    accent: "#2b708f",
    // "dive" atmosphere (lighter, bluer wash) lets the descent ocean breathe
    // through in noon mode, while content panels keep revelation paper grammar.
    // Per the cinematic-profile spec: "dive for atmosphere, revelation in content".
    wash: "dive",
  },
  reports: {
    light: "lighthouse",
    dark: "archive",
    posLight: "18% 42%",
    posDark: "center 48%",
    accent: "#3f768d",
  },
  report: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "50% 14%",
    posDark: "center top",
    accent: "#296f91",
  },
  processing: {
    light: "mechanical",
    dark: "mechanical",
    posLight: "center 44%",
    posDark: "center 44%",
    accent: "#5d94a6",
  },
  "action-hub": {
    light: "archive",
    dark: "archive",
    posLight: "center 48%",
    posDark: "center 48%",
    accent: "#b39150",
    wash: "sanctuary",
  },
  coaching: {
    light: "waiting",
    dark: "waiting",
    posLight: "center 48%",
    posDark: "center 48%",
    accent: "#b89455",
    wash: "sanctuary",
  },
  companions: {
    light: "negotiation",
    dark: "negotiation",
    posLight: "center 48%",
    posDark: "center 48%",
    accent: "#ae8a58",
    wash: "sanctuary",
  },
  settings: {
    light: "sunlit-day",
    dark: "archive",
    posLight: "32% 18%",
    posDark: "center 48%",
    accent: "#287d93",
  },
  login: {
    light: "lighthouse",
    dark: "hero-ocean",
    posLight: "18% 42%",
    posDark: "center top",
    accent: "#276d8d",
  },
  register: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "60% 16%",
    posDark: "center top",
    accent: "#0b7fa8",
  },
  "forgot-password": {
    light: "waiting",
    dark: "hero-ocean",
    posLight: "center 48%",
    posDark: "center top",
    accent: "#6e8f9b",
  },
  "reset-password": {
    light: "zeroroom",
    dark: "hero-ocean",
    posLight: "center 48%",
    posDark: "center top",
    accent: "#6c8fa0",
  },
  pricing: {
    light: "sunlit-day",
    dark: "hero-ocean",
    posLight: "70% 12%",
    posDark: "center top",
    accent: "#0c759b",
  },
  research: {
    light: "laboratory",
    dark: "laboratory",
    posLight: "center 48%",
    posDark: "center 48%",
    accent: "#477f94",
    wash: "utility",
  },
  "ai-career-check": {
    light: "mechanical",
    dark: "mechanical",
    posLight: "center 44%",
    posDark: "center 44%",
    accent: "#5d94a6",
    wash: "utility",
  },
};

/**
 * Resolve art config from a pathname (locale-prefixed or not).
 * Returns null when the route has no art entry — the page keeps its own bg.
 */
export function getPageArt(pathname: string): PageArt | null {
  const segments = pathname.split("/").filter(Boolean);
  // Drop locale prefix (2-letter codes like en/zh/de…).
  const first = segments[0]?.length === 2 ? segments[1] : segments[0];
  if (!first) return PAGE_ART.landing;
  return PAGE_ART[first] ?? null;
}
