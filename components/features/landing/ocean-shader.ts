// ============================================================
// Ocean shader — the living-water atmosphere for Landing "The Descent".
//
// A single fullscreen-triangle fragment shader renders caustics, volumetric
// god-rays, a four-act depth fog, and a warm "heart-light" pool. No 3D
// engine: everything is screen-space, driven by `u_depth` (0→1 descent).
//
// The two Meridian hours are NOT a shader branch — JS derives a per-mode
// colour set (`buildOceanStops`) from the live `--md-*` tokens and feeds it
// as uniforms, animating between sets on a theme flip. The GLSL stays a
// generic water renderer; the art direction (noon stays luminous, midnight
// sinks to near-black) lives in the pure, unit-tested helpers below.
//
// Pure (GPU-free) exports are testable in node; the GLSL strings are only
// asserted for shape. Real visual tuning happens via /preview in Phase 2.
// ============================================================

export type RGB = readonly [number, number, number];
export type OceanMode = "noon" | "midnight";

/** Base palette read from the live Meridian tokens for the current hour. */
export interface OceanPalette {
  paper: RGB; // --md-paper   (page base)
  sea: RGB; // --md-sea       (primary)
  seaBright: RGB; // --md-sea-bright
  seaDeep: RGB; // --md-sea-deep
  gold: RGB; // --md-gold     (heart-light)
}

/** Derived per-frame colour set fed to the shader as uniforms. */
export interface OceanStops {
  /** Four-act fog colours: surface → photic → twilight → deep. */
  fog: readonly [RGB, RGB, RGB, RGB];
  ray: RGB; // god-ray colour (sun by noon, moon-cyan by midnight)
  caustic: RGB; // caustic highlight colour
  heart: RGB; // heart-light pool colour (warm gold, both hours)
  rayStrength: number; // 0..1 — sun is strong, moon is soft
  causticStrength: number; // 0..1
}

// ── colour math (pure) ──

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function mix3(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

export function scale3(a: RGB, s: number): RGB {
  return [clamp01(a[0] * s), clamp01(a[1] * s), clamp01(a[2] * s)];
}

/** Rec. 709 relative luminance — used by tests to assert the depth curves. */
export function relativeLuma(c: RGB): number {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/**
 * Parse a CSS colour string (`#rgb`, `#rrggbb`, `rgb()/rgba()`) to a 0..1
 * RGB triple. Returns null on anything unparseable so callers can fall back
 * to a hard-coded literal (a token can resolve empty under shell masking).
 */
export function parseColor(css: string | null | undefined): RGB | null {
  if (!css) return null;
  const s = css.trim();

  if (s[0] === "#") {
    const hex = s.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      if ([r, g, b].some(Number.isNaN)) return null;
      return [r / 255, g / 255, b / 255];
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].some(Number.isNaN)) return null;
      return [r / 255, g / 255, b / 255];
    }
    return null;
  }

  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const parts = m[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const r = parseFloat(parts[0]);
    const g = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);
    if ([r, g, b].some(Number.isNaN)) return null;
    return [clamp01(r / 255), clamp01(g / 255), clamp01(b / 255)];
  }

  return null;
}

/** Piecewise-linear interpolation across the four fog stops (t in 0..1). */
export function mixDepthColor(
  fog: readonly [RGB, RGB, RGB, RGB],
  t: number,
): RGB {
  const c = clamp01(t);
  if (c < 1 / 3) return mix3(fog[0], fog[1], c * 3);
  if (c < 2 / 3) return mix3(fog[1], fog[2], (c - 1 / 3) * 3);
  return mix3(fog[2], fog[3], (c - 2 / 3) * 3);
}

// ── Atmosphere anchor hues — sampled from the Meridian Monet paintings ──
// Atmosphere layer = artistic freedom (NOT UI tokens; outside the 2-accent law
// and the contrast gate). Colours taken from the ACTUAL brand hero paintings so
// the shader water harmonises with the painting instead of fighting it:
//   Noon  (public/brand/sunlit-descent-day.webp): warm cream light + soft,
//          low-saturation powder-cyan water — impressionist, stays luminous.
//   Midnight (public/brand/monograph-hero-ocean.webp): deep navy → near-black
//          + cool cyan god-rays / bioluminescence.
// The earlier saturated-cerulean + cold-white version clashed with Monet's warm
// light; this is the fix (user picked candidate "A — Monet Sunlit" off swatches).
// The painting owns the pale SURFACE (0m); the shader is the water BELOW it, so
// its shallowest stop is already a mid cerulean — DARKER than the painting — and
// it only deepens from there. (Earlier the shader's pale fog0 surfaced at ~200m
// and read BRIGHTER than 0m — an illogical, non-monotonic descent. Fixed.)
const N_SURFACE: RGB = [0.373, 0.651, 0.8]; // #5FA6CC mid cerulean (just below the painting)
const N_PHOTIC: RGB = [0.243, 0.541, 0.722]; // #3E8AB8 cerulean
const N_TWILIGHT: RGB = [0.165, 0.396, 0.565]; // #2A6590 deep cerulean
const N_DEEP: RGB = [0.102, 0.282, 0.439]; // #1A4870 deep blue (still lit, never black)
const WARM_LIGHT: RGB = [1.0, 0.957, 0.867]; // #FFF4DD warm cream caustic
const WARM_RAY: RGB = [1.0, 0.937, 0.808]; // #FFEFCE warm cream god-rays
const M_SURFACE: RGB = [0.071, 0.188, 0.31]; // #12304F lit deep navy
const M_PHOTIC: RGB = [0.047, 0.129, 0.22]; // #0C2138 navy
const M_TWILIGHT: RGB = [0.024, 0.071, 0.122]; // #06121F dark navy
const M_DEEP: RGB = [0.008, 0.039, 0.071]; // #020A12 near-black abyss
const COOL_GLOW: RGB = [0.31, 0.761, 0.902]; // #4FC2E6 cool cyan bioluminescence
const COOL_RAY: RGB = [0.49, 0.847, 0.941]; // #7DD8F0 cool cyan god-rays

/**
 * Derive the four-act colour set for an hour from its live palette.
 *
 * Noon  — sunlight through clear water: stays luminous all the way down,
 *         depth read through cooler/saturated colour, not darkness.
 * Midnight — moonlit deep: sinks toward near-black at the abyss for the
 *         full cinematic crush, then the heart-light pool resolves warm.
 *
 * Pure: tested by feeding the Meridian light/dark literals.
 */
export function buildOceanStops(
  palette: OceanPalette,
  mode: OceanMode,
): OceanStops {
  const { gold } = palette;

  if (mode === "noon") {
    // Monet Sunlit — warm cream light over soft, low-saturation powder-cyan
    // water; stays luminous all the way down (never black), matching the hero
    // painting's impressionist light.
    return {
      fog: [N_SURFACE, N_PHOTIC, N_TWILIGHT, N_DEEP],
      ray: WARM_RAY, // warm cream surface shafts (the Monet sunburst)
      caustic: WARM_LIGHT, // soft warm sun dapple
      heart: gold,
      rayStrength: 1,
      causticStrength: 0.55, // softened so the warm light never washes the water
    };
  }

  // Midnight — deep navy sinking to a near-black abyss with cool cyan god-rays
  // and bioluminescence, sampled from the dark hero painting; gold heart.
  return {
    fog: [M_SURFACE, M_PHOTIC, M_TWILIGHT, M_DEEP],
    ray: COOL_RAY, // cool cyan god-rays
    caustic: COOL_GLOW, // cool cyan bioluminescence
    heart: gold,
    rayStrength: 0.6,
    causticStrength: 0.5,
  };
}

// ── GLSL ──
// Inline template strings (Turbopack has no raw-loader for .glsl files).
// GLSL ES 1.00 so it runs on both webgl & webgl2 contexts.

/** Fullscreen-triangle vertex shader (attribute-driven for WebGL1). */
export const OCEAN_VERT = /* glsl */ `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/** The living-water fragment shader. */
export const OCEAN_FRAG = /* glsl */ `
precision highp float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_depth;
uniform vec2 u_res;
uniform vec3 u_fog0;
uniform vec3 u_fog1;
uniform vec3 u_fog2;
uniform vec3 u_fog3;
uniform vec3 u_ray;
uniform vec3 u_caustic;
uniform vec3 u_heart;
uniform float u_rayStrength;
uniform float u_causticStrength;
uniform float u_heartGlow;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 fogAt(float t) {
  if (t < 0.3333) return mix(u_fog0, u_fog1, t / 0.3333);
  if (t < 0.6666) return mix(u_fog1, u_fog2, (t - 0.3333) / 0.3333);
  return mix(u_fog2, u_fog3, (t - 0.6666) / 0.3334);
}

void main() {
  vec2 uv = v_uv;
  vec2 p = uv;
  p.x *= u_res.x / max(u_res.y, 1.0);

  // Depth felt at this pixel: scroll descent + vertical position (top reads
  // shallower than bottom), giving a volumetric sense without geometry.
  float vt = clamp(u_depth + (1.0 - uv.y) * 0.25 - 0.08, 0.0, 1.0);

  vec3 col = fogAt(vt);

  // Caustics — domain-warped fbm, ridged into cells, animated; brightest at
  // the surface but keeping a floor at depth so the water stays alive.
  vec2 cp = p * 3.2;
  vec2 warp = vec2(fbm(cp + u_time * 0.05), fbm(cp + 5.2 + u_time * 0.04));
  float caus = fbm(cp + warp * 1.5 + vec2(0.0, -u_time * 0.06));
  caus = pow(1.0 - abs(caus * 2.0 - 1.0), 2.0);
  float causMask = mix(0.22, 1.0, 1.0 - smoothstep(0.0, 0.9, vt));
  col += u_caustic * caus * u_causticStrength * causMask * 0.85;

  // God-rays — soft angular shafts from a light origin above top-centre;
  // brighter, with a faint floor so distant shafts persist into the deep.
  vec2 rp = uv - vec2(0.5, 1.15);
  float ang = atan(rp.x, -rp.y);
  float rays = fbm(vec2(ang * 3.0, length(rp) * 1.2 - u_time * 0.04));
  rays = pow(rays, 2.0);
  float rayMask =
    mix(0.12, 1.0, 1.0 - smoothstep(0.1, 0.9, vt)) * smoothstep(0.0, 0.55, uv.y);
  col += u_ray * rays * u_rayStrength * rayMask * 0.7;

  // Surface light — the glow pouring from just under the surface. Confined to
  // the shallowest band (vt < ~0.18) so it lights the waterline only and never
  // brightens the photic/200m zone (which must read DARKER than the surface).
  float surf = smoothstep(0.46, 0.0, distance(uv, vec2(0.5, 0.95)));
  float surfMask = 1.0 - smoothstep(0.0, 0.18, vt);
  col += u_ray * surf * surfMask * u_rayStrength * 0.45;

  // Heart-light — a warm pool low-centre that blooms at the greatest depth.
  float pool = smoothstep(0.62, 0.0, distance(uv, vec2(0.5, 0.40)));
  col = mix(col, u_heart, pool * u_heartGlow * 0.6);

  // Coverage: transparent at the surface so the LCP painting carries the hero,
  // then ramping to opaque by ~1/3 down — matched to the painting's fade so the
  // photo→shader handoff is a clean cross, not a long muddy overlap.
  float body = smoothstep(0.02, 0.32, u_depth);
  float shimmer = clamp(caus * causMask * 0.5 + rays * rayMask * 0.4, 0.0, 1.0);
  float alpha = clamp(max(body, shimmer * 0.5), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`;

/** Uniform names the canvas wires up — kept in sync with the FRAG source. */
export const OCEAN_UNIFORMS = [
  "u_time",
  "u_depth",
  "u_res",
  "u_fog0",
  "u_fog1",
  "u_fog2",
  "u_fog3",
  "u_ray",
  "u_caustic",
  "u_heart",
  "u_rayStrength",
  "u_causticStrength",
  "u_heartGlow",
] as const;
