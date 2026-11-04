// ============================================================
// archetype-avatar-asset — CDN env-driven URL resolution
//
// Pins the contract that decides whether 46MB of local PNGs
// vs Cloudflare R2 WebPs get served. Mistakes here cost real
// money (Vercel Hobby bandwidth ceiling) and could halt thesis
// recruitment mid-collection, so the behavior is unit-tested
// independently of bundler env inlining.
// ============================================================

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getAvatarAssetUrl,
  resolveAvatarUrl,
  fallbackGenderForCode,
} from "../archetype-avatar-asset";

const ORIGINAL_BASE = process.env.NEXT_PUBLIC_AVATAR_CDN_BASE;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_AVATAR_CDN_BASE;
});

afterEach(() => {
  if (ORIGINAL_BASE === undefined) {
    delete process.env.NEXT_PUBLIC_AVATAR_CDN_BASE;
  } else {
    process.env.NEXT_PUBLIC_AVATAR_CDN_BASE = ORIGINAL_BASE;
  }
});

describe("getAvatarAssetUrl", () => {
  it("returns local PNG path when CDN base is unset", () => {
    expect(getAvatarAssetUrl("R-enhancement", "female")).toBe(
      "/12%20avatar/Architect-female.png",
    );
  });

  it("returns CDN WebP URL when CDN base is set", () => {
    process.env.NEXT_PUBLIC_AVATAR_CDN_BASE = "https://cdn.example.com/avatars";
    expect(getAvatarAssetUrl("R-enhancement", "female")).toBe(
      "https://cdn.example.com/avatars/Architect-female.webp",
    );
  });

  it("strips trailing slashes from CDN base", () => {
    process.env.NEXT_PUBLIC_AVATAR_CDN_BASE =
      "https://cdn.example.com/avatars///";
    expect(getAvatarAssetUrl("I-transcendence", "male")).toBe(
      "https://cdn.example.com/avatars/Researcher-male.webp",
    );
  });

  it("treats whitespace-only CDN base as unset (defensive)", () => {
    process.env.NEXT_PUBLIC_AVATAR_CDN_BASE = "   ";
    expect(getAvatarAssetUrl("E-enhancement", "male")).toBe(
      "/12%20avatar/Ace-male.png",
    );
  });

  it("returns null for unknown archetype code", () => {
    expect(getAvatarAssetUrl("X-unknown", "female")).toBeNull();
  });

  it("maps every published archetype code to a non-null URL (local fallback)", () => {
    const codes = [
      "R-enhancement",
      "R-transcendence",
      "I-enhancement",
      "I-transcendence",
      "A-enhancement",
      "A-transcendence",
      "S-enhancement",
      "S-transcendence",
      "E-enhancement",
      "E-transcendence",
      "C-enhancement",
      "C-transcendence",
    ];
    for (const code of codes) {
      expect(
        getAvatarAssetUrl(code, "female"),
        `missing female for ${code}`,
      ).not.toBeNull();
      expect(
        getAvatarAssetUrl(code, "male"),
        `missing male for ${code}`,
      ).not.toBeNull();
    }
  });
});

describe("resolveAvatarUrl", () => {
  it("uses provided gender when given", () => {
    expect(resolveAvatarUrl("R-enhancement", "male")).toContain(
      "Architect-male",
    );
  });

  it("falls back to hash-derived gender when null", () => {
    const url = resolveAvatarUrl("R-enhancement", null);
    expect(url).toContain("Architect-");
  });
});

describe("fallbackGenderForCode", () => {
  it("is deterministic for the same code", () => {
    const a = fallbackGenderForCode("R-enhancement");
    const b = fallbackGenderForCode("R-enhancement");
    expect(a).toBe(b);
  });

  it("returns a valid gender for any non-empty input", () => {
    const result = fallbackGenderForCode("anything");
    expect(["male", "female"]).toContain(result);
  });
});
