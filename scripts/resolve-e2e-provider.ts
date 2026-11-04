// ============================================================
// E2E LLM provider resolver
//
// Pure function — no side effects, no process.env reads. Caller passes the
// environment so it can be unit-tested with table-driven cases.
//
// Decision matrix (E2E_USE_GROQ × GROQ_API_KEY):
//   "false"     × *           → production routing (explicit opt-out)
//   "true"      × present     → Groq (explicit opt-in)
//   "true"      × missing     → error (asked for Groq, can't deliver)
//   <unset>     × present     → Groq (default — auto-detect)
//   <unset>     × missing     → production routing (with loud warning)
//   <invalid>   × *           → error (refuse to silently fall back)
//
// Defensive normalization: trim() + toLowerCase() on E2E_USE_GROQ so that
// "True" / "true " / " false" all behave as if explicit. trim() on
// GROQ_API_KEY so that "   " (whitespace-only) is NOT treated as truthy.
// ============================================================

export type ProviderResolution =
  | {
      kind: "ok";
      useGroq: "true" | "false";
      banner: string;
    }
  | {
      kind: "error";
      message: string;
    };

export interface ProviderEnv {
  E2E_USE_GROQ?: string;
  GROQ_API_KEY?: string;
  // Index signature so `process.env` (which is NodeJS.ProcessEnv —
  // a Record<string, string | undefined>) is assignable to this type.
  [key: string]: string | undefined;
}

export function resolveE2EProvider(env: ProviderEnv): ProviderResolution {
  const rawExplicit = env.E2E_USE_GROQ;
  const explicit = rawExplicit?.trim().toLowerCase();
  const groqKey = (env.GROQ_API_KEY ?? "").trim();
  const hasGroqKey = groqKey.length > 0;

  if (
    rawExplicit !== undefined &&
    explicit !== "true" &&
    explicit !== "false"
  ) {
    return {
      kind: "error",
      message:
        `❌ E2E_USE_GROQ has unsupported value ${JSON.stringify(rawExplicit)}.\n` +
        '   Only "true" or "false" are accepted (case-insensitive, trimmed).\n' +
        "   Unset E2E_USE_GROQ to use auto-detect (Groq if GROQ_API_KEY present).",
    };
  }

  if (explicit === "false") {
    return {
      kind: "ok",
      useGroq: "false",
      banner:
        "🧪 E2E LLM: production routing (E2E_USE_GROQ=false explicit override)",
    };
  }

  if (explicit === "true") {
    if (!hasGroqKey) {
      return {
        kind: "error",
        message:
          "❌ E2E_USE_GROQ=true was requested but GROQ_API_KEY is missing or blank.\n" +
          "   Either add GROQ_API_KEY to .env.local, or unset E2E_USE_GROQ.",
      };
    }
    return {
      kind: "ok",
      useGroq: "true",
      banner: "🧪 E2E LLM: Groq (explicit E2E_USE_GROQ=true)",
    };
  }

  if (hasGroqKey) {
    return {
      kind: "ok",
      useGroq: "true",
      banner: "🧪 E2E LLM: Groq (default — GROQ_API_KEY detected)",
    };
  }

  return {
    kind: "ok",
    useGroq: "false",
    banner:
      "⚠️  E2E LLM: production routing (Anthropic/OpenAI/Gemini)\n" +
      "   GROQ_API_KEY not found in .env.local. This run will:\n" +
      "     • burn paid LLM quota on every report/coaching/narrative call\n" +
      "     • inherit production provider health (outages → false negatives)\n" +
      "     • run slower (~25-45s per report vs ~3-5s on Groq)\n" +
      "   Get a free key at https://console.groq.com/keys and add to .env.local.",
  };
}
