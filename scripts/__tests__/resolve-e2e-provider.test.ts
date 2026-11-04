import { describe, expect, it } from "vitest";
import { resolveE2EProvider, type ProviderEnv } from "../resolve-e2e-provider";

// Table-driven tests covering the full env × explicit-flag matrix
// plus the defensive-normalization cases surfaced by the 2026-05-03
// cross-review (gpt-5.4): mixed case, surrounding whitespace, blank keys,
// and stray non-true/false values.

interface Case {
  name: string;
  env: ProviderEnv;
  expect:
    | { kind: "ok"; useGroq: "true" | "false"; bannerIncludes: string }
    | { kind: "error"; messageIncludes: string };
}

const CASES: Case[] = [
  // ── Explicit opt-out ──────────────────────────────────────────────
  {
    name: "explicit false → production routing",
    env: { E2E_USE_GROQ: "false", GROQ_API_KEY: "key" },
    expect: {
      kind: "ok",
      useGroq: "false",
      bannerIncludes: "explicit override",
    },
  },
  {
    name: "explicit false (uppercase, trimmed) is normalized",
    env: { E2E_USE_GROQ: "  FALSE ", GROQ_API_KEY: "key" },
    expect: {
      kind: "ok",
      useGroq: "false",
      bannerIncludes: "explicit override",
    },
  },

  // ── Explicit opt-in ───────────────────────────────────────────────
  {
    name: "explicit true + key → Groq",
    env: { E2E_USE_GROQ: "true", GROQ_API_KEY: "key" },
    expect: {
      kind: "ok",
      useGroq: "true",
      bannerIncludes: "explicit E2E_USE_GROQ=true",
    },
  },
  {
    name: "explicit true (mixed case) + key → Groq",
    env: { E2E_USE_GROQ: "True", GROQ_API_KEY: "key" },
    expect: {
      kind: "ok",
      useGroq: "true",
      bannerIncludes: "explicit E2E_USE_GROQ=true",
    },
  },
  {
    name: "explicit true + missing key → error",
    env: { E2E_USE_GROQ: "true" },
    expect: { kind: "error", messageIncludes: "GROQ_API_KEY is missing" },
  },
  {
    name: "explicit true + blank key (whitespace only) → error",
    env: { E2E_USE_GROQ: "true", GROQ_API_KEY: "   " },
    expect: { kind: "error", messageIncludes: "GROQ_API_KEY is missing" },
  },

  // ── Auto-detect default (E2E_USE_GROQ unset) ──────────────────────
  {
    name: "unset + key → Groq (default)",
    env: { GROQ_API_KEY: "key" },
    expect: { kind: "ok", useGroq: "true", bannerIncludes: "default" },
  },
  {
    name: "unset + no key → production with loud warning",
    env: {},
    expect: {
      kind: "ok",
      useGroq: "false",
      bannerIncludes: "GROQ_API_KEY not found",
    },
  },
  {
    name: "unset + blank key → production with loud warning",
    env: { GROQ_API_KEY: "  " },
    expect: {
      kind: "ok",
      useGroq: "false",
      bannerIncludes: "GROQ_API_KEY not found",
    },
  },

  // ── Malformed explicit values must NOT silently fall through ──────
  {
    name: 'explicit "1" is rejected (not a recognized boolean)',
    env: { E2E_USE_GROQ: "1", GROQ_API_KEY: "key" },
    expect: { kind: "error", messageIncludes: "unsupported value" },
  },
  {
    name: 'explicit "" (empty string) is rejected',
    env: { E2E_USE_GROQ: "", GROQ_API_KEY: "key" },
    expect: { kind: "error", messageIncludes: "unsupported value" },
  },
  {
    name: 'explicit "yes" is rejected',
    env: { E2E_USE_GROQ: "yes", GROQ_API_KEY: "key" },
    expect: { kind: "error", messageIncludes: "unsupported value" },
  },
  {
    name: 'explicit "0" is rejected',
    env: { E2E_USE_GROQ: "0" },
    expect: { kind: "error", messageIncludes: "unsupported value" },
  },
];

describe("resolveE2EProvider", () => {
  for (const c of CASES) {
    it(c.name, () => {
      const result = resolveE2EProvider(c.env);
      if (c.expect.kind === "ok") {
        expect(result.kind).toBe("ok");
        if (result.kind !== "ok") return;
        expect(result.useGroq).toBe(c.expect.useGroq);
        expect(result.banner).toContain(c.expect.bannerIncludes);
      } else {
        expect(result.kind).toBe("error");
        if (result.kind !== "error") return;
        expect(result.message).toContain(c.expect.messageIncludes);
      }
    });
  }

  it("rejects malformed value before checking GROQ_API_KEY (priority)", () => {
    // "yes" is rejected even when key is missing (because explicit-but-invalid
    // is a higher-priority signal than the key-missing branch).
    const result = resolveE2EProvider({ E2E_USE_GROQ: "yes" });
    expect(result.kind).toBe("error");
    if (result.kind === "error") {
      expect(result.message).toContain("unsupported value");
    }
  });

  it("does not mutate input env", () => {
    const env: ProviderEnv = {
      E2E_USE_GROQ: "  TRUE  ",
      GROQ_API_KEY: " key ",
    };
    const before = JSON.stringify(env);
    resolveE2EProvider(env);
    expect(JSON.stringify(env)).toBe(before);
  });
});
