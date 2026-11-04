// ============================================================
// Client-safe Career Pool for Quick Dive
//
// Static JSON bundled at build time — no DB dependency.
// Used by client components (use-explore-engine.ts).
//
// For Deep Dive / report generation, use career-pool.ts (server-only).
// ============================================================

import staticPool from "./static-pool.json";

import type { AiEraCategory } from "@/lib/types/report";

interface StaticCareer {
  id: string;
  zh: string;
  en: string;
  r: number;
  i: number;
  a: number;
  s: number;
  e: number;
  c: number;
  ai: string | null;
  rl: number | null;
}

export interface ClientCareer {
  id: string;
  title_zh: string;
  title_en: string;
  idealRIASEC: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  aiEraCategory?: AiEraCategory;
  aiExposureScore?: number | null;
  aiImpactLabel?: "low" | "medium" | "high" | null;
  resilienceLevel?: number;
}

let _cache: ClientCareer[] | null = null;

/**
 * Get the career pool for client-side matching (Quick Dive).
 * Always returns data synchronously — no DB, no async, no cold start.
 */
export function getCareerPoolClient(): ClientCareer[] {
  if (_cache) return _cache;

  _cache = (staticPool as StaticCareer[]).map((c) => ({
    id: c.id,
    title_zh: c.zh,
    title_en: c.en,
    idealRIASEC: { R: c.r, I: c.i, A: c.a, S: c.s, E: c.e, C: c.c },
    aiEraCategory: (c.ai as AiEraCategory | undefined) ?? undefined,
    resilienceLevel: c.rl ?? undefined,
  }));

  return _cache;
}
