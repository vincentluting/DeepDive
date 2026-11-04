import { describe, expect, it } from "vitest";

import {
  buildOceanStops,
  mixDepthColor,
  OCEAN_FRAG,
  OCEAN_UNIFORMS,
  OCEAN_VERT,
  parseColor,
  relativeLuma,
  type OceanPalette,
  type RGB,
} from "../ocean-shader";

// The live Meridian token literals (globals.css :root / .dark). The shader
// reads these from getComputedStyle at runtime; here we feed them directly so
// the derived colour curves are pinned to the real palette.
const NOON: OceanPalette = {
  paper: parseColor("#F9FAF6")!,
  sea: parseColor("#0B5F91")!,
  seaBright: parseColor("#0F86B8")!,
  seaDeep: parseColor("#05375D")!,
  gold: parseColor("#D8B46A")!,
};
const MIDNIGHT: OceanPalette = {
  paper: parseColor("#04121F")!,
  sea: parseColor("#76D4E8")!,
  seaBright: parseColor("#3FA8C9")!,
  seaDeep: parseColor("#0B5F91")!,
  gold: parseColor("#D8B46A")!,
};

const inUnit = (c: RGB) => c.every((n) => n >= 0 && n <= 1);

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#0B5F91")).toEqual([11 / 255, 95 / 255, 145 / 255]);
  });

  it("parses 3-digit hex", () => {
    expect(parseColor("#fff")).toEqual([1, 1, 1]);
  });

  it("parses rgb() and rgba(), ignoring alpha", () => {
    expect(parseColor("rgb(118, 212, 232)")).toEqual([
      118 / 255,
      212 / 255,
      232 / 255,
    ]);
    expect(parseColor("rgba(255, 246, 214, 0.52)")).toEqual([
      255 / 255,
      246 / 255,
      214 / 255,
    ]);
  });

  it("tolerates surrounding whitespace", () => {
    expect(parseColor("  #05375D  ")).toEqual([5 / 255, 55 / 255, 93 / 255]);
  });

  it("returns null for empty or unparseable input", () => {
    expect(parseColor("")).toBeNull();
    expect(parseColor(null)).toBeNull();
    expect(parseColor(undefined)).toBeNull();
    expect(parseColor("not-a-color")).toBeNull();
    expect(parseColor("#ggffzz")).toBeNull();
  });
});

describe("buildOceanStops — the two-hour depth curves", () => {
  const noon = buildOceanStops(NOON, "noon");
  const midnight = buildOceanStops(MIDNIGHT, "midnight");

  it("keeps every channel within [0,1] for both hours", () => {
    for (const set of [noon, midnight]) {
      for (const c of [...set.fog, set.ray, set.caustic, set.heart]) {
        expect(inUnit(c)).toBe(true);
      }
    }
  });

  it("noon stays luminous at the deepest stop (never sinks to black)", () => {
    expect(relativeLuma(noon.fog[3])).toBeGreaterThan(0.18);
  });

  it("midnight sinks to near-black at the deepest stop", () => {
    expect(relativeLuma(midnight.fog[3])).toBeLessThan(0.06);
  });

  it("midnight is darker than noon at every depth", () => {
    for (let t = 0; t <= 1.0001; t += 0.25) {
      const n = relativeLuma(mixDepthColor(noon.fog, t));
      const m = relativeLuma(mixDepthColor(midnight.fog, t));
      expect(m).toBeLessThan(n);
    }
  });

  it("resolves to the same warm gold heart-light in both hours", () => {
    expect(noon.heart).toEqual(parseColor("#D8B46A"));
    expect(midnight.heart).toEqual(noon.heart);
  });

  it("noon has stronger sunlight than midnight's moonlight", () => {
    expect(noon.rayStrength).toBeGreaterThan(midnight.rayStrength);
    expect(noon.causticStrength).toBeGreaterThan(midnight.causticStrength);
  });
});

describe("mixDepthColor", () => {
  const fog = buildOceanStops(NOON, "noon").fog;

  it("returns the surface stop at t=0 and the deep stop at t=1", () => {
    expect(mixDepthColor(fog, 0)).toEqual(fog[0]);
    expect(mixDepthColor(fog, 1)).toEqual(fog[3]);
  });

  it("clamps out-of-range t", () => {
    expect(mixDepthColor(fog, -1)).toEqual(fog[0]);
    expect(mixDepthColor(fog, 2)).toEqual(fog[3]);
  });

  it("descends monotonically in luminance for the noon curve", () => {
    let prev = Infinity;
    for (let t = 0; t <= 1.0001; t += 0.2) {
      const luma = relativeLuma(mixDepthColor(fog, t));
      expect(luma).toBeLessThanOrEqual(prev + 1e-6);
      prev = luma;
    }
  });
});

describe("GLSL source shape", () => {
  it("declares every wired uniform in the fragment shader", () => {
    for (const u of OCEAN_UNIFORMS) {
      expect(OCEAN_FRAG).toContain(u);
    }
  });

  it("vertex shader exposes the fullscreen-triangle attribute + varying", () => {
    expect(OCEAN_VERT).toContain("a_pos");
    expect(OCEAN_VERT).toContain("v_uv");
    expect(OCEAN_FRAG).toContain("gl_FragColor");
  });
});
