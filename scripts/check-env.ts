// ============================================================
// Deep Dive — Env Var Validation
//
// Runs before `next build` (strict) and `next dev` (soft) to catch
// configuration mistakes before they bite at runtime.
//
// Two failure modes this script catches:
//   1. Required env var missing (e.g. POSTGRES_URL not set)
//   2. Shell parent-process exports `X=""` (empty string) which dotenv
//      refuses to override — masking the value in .env.local. The most
//      painful instance is ANTHROPIC_API_KEY="" silently demoting all
//      Claude calls to OpenAI/Gemini fallback. See:
//        .claude/rules/llm-provider-failover.md Case 7
//
// Modes:
//   default    — warn on shell-overrides, exit 1 on missing required
//   --strict   — additionally exit 1 on critical (LLM) shell-overrides
//   --soft     — warn only, never exit non-zero (used by `predev`)
//
// Usage:
//   npm run check:env              # standalone (default mode)
//   npm run build                  # runs `--strict` via prebuild
//   npm run dev                    # runs `--soft` via predev
//
// Env vars consumed: all of them :)
// ============================================================

import { config, parse } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// === Step 0: snapshot shell env BEFORE loading .env.local ============
// dotenv default: does NOT override pre-existing process.env values.
// To detect shell→.env.local masking, we must see what was in process.env
// BEFORE the dotenv load — anything with `hasOwnProperty` truthy here was
// set by the shell (or parent process), not by .env.local.
const SHELL_HAD: ReadonlySet<string> = new Set(Object.keys(process.env));
const SHELL_SNAPSHOT: Readonly<Record<string, string>> = (() => {
  const snap: Record<string, string> = {};
  for (const key of SHELL_HAD) snap[key] = process.env[key] ?? "";
  return snap;
})();

// === Step 1: parse .env.local content WITHOUT writing to process.env ==
const ENV_LOCAL_PATH = resolve(process.cwd(), ".env.local");
const ENV_LOCAL_PARSED: Readonly<Record<string, string>> = existsSync(
  ENV_LOCAL_PATH,
)
  ? Object.freeze(parse(readFileSync(ENV_LOCAL_PATH)))
  : Object.freeze({});

// === Step 2: now load .env.local into process.env (dotenv default = no-override) ==
config({ path: ENV_LOCAL_PATH });

// === Mode handling ===================================================
const STRICT_MODE = process.argv.includes("--strict");
const SOFT_MODE = process.argv.includes("--soft");

type EnvCheck = {
  name: string;
  purpose: string;
  alternatives?: string[];
};

const REQUIRED: EnvCheck[] = [
  {
    name: "POSTGRES_URL",
    purpose: "Neon Postgres connection",
    alternatives: [
      "DATABASE_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL_NON_POOLING",
    ],
  },
  {
    name: "AUTH_SECRET",
    purpose: "password hashing + session signing",
  },
  {
    name: "OPENAI_API_KEY",
    purpose:
      "structured tasks (panel3, resume-parse, memory-extract, coaching-summary) and default fallback",
  },
  {
    name: "GOOGLE_CLIENT_ID",
    purpose: "Google OAuth login",
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    purpose: "Google OAuth login",
  },
];

const OPTIONAL_WITH_FALLBACK: EnvCheck[] = [
  {
    name: "ANTHROPIC_API_KEY",
    purpose: "Claude narrative tasks (falls back to OpenAI)",
  },
  {
    name: "GOOGLE_API_KEY",
    purpose: "Gemini career-match (falls back to Anthropic/OpenAI)",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    purpose: "distributed rate limit (falls back to in-memory)",
  },
  { name: "UPSTASH_REDIS_REST_TOKEN", purpose: "distributed rate limit" },
  { name: "SENTRY_DSN", purpose: "error monitoring (disabled if missing)" },
  { name: "NEXT_PUBLIC_SENTRY_DSN", purpose: "client-side Sentry" },
  {
    name: "RESEND_API_KEY",
    purpose: "transactional email (disabled if missing)",
  },
  { name: "STRIPE_SECRET_KEY", purpose: "payments (disabled if missing)" },
  { name: "CRON_SECRET", purpose: "cron endpoint auth" },
  { name: "HEALTH_CHECK_SECRET", purpose: "/api/health/* auth" },
  { name: "ADMIN_EMAILS", purpose: "auto-promote matching users to admin" },
  {
    name: "NEXT_PUBLIC_APP_URL",
    purpose: "OG tags + share links (defaults to production URL)",
  },
];

// LLM provider keys whose empty-string shell override silently breaks routing.
// Treated as CRITICAL in --strict mode (build fails) — they are the most painful
// silent failure mode we've observed (2026-05-24 incident).
const LLM_CRITICAL_KEYS: ReadonlySet<string> = new Set([
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
]);

function isPresent(check: EnvCheck): boolean {
  if (process.env[check.name]) return true;
  if (check.alternatives) {
    return check.alternatives.some((alt) => !!process.env[alt]);
  }
  return false;
}

function resolveName(check: EnvCheck): string {
  if (process.env[check.name]) return check.name;
  if (check.alternatives) {
    const found = check.alternatives.find((alt) => !!process.env[alt]);
    if (found) return `${check.name} (via ${found})`;
  }
  return check.name;
}

const SKIP_IN_CI_BUILD =
  process.env.SKIP_ENV_CHECK === "1" ||
  (process.env.NEXT_PHASE === "phase-production-build" &&
    process.env.VERCEL === undefined &&
    process.env.CI === undefined);

if (SKIP_IN_CI_BUILD) {
  console.log("[check-env] skipped (SKIP_ENV_CHECK=1)");
  process.exit(0);
}

const missing: EnvCheck[] = [];
const presentRequired: EnvCheck[] = [];

for (const check of REQUIRED) {
  if (isPresent(check)) {
    presentRequired.push(check);
  } else {
    missing.push(check);
  }
}

const presentOptional: string[] = [];
const absentOptional: EnvCheck[] = [];
for (const check of OPTIONAL_WITH_FALLBACK) {
  if (isPresent(check)) {
    presentOptional.push(check.name);
  } else {
    absentOptional.push(check);
  }
}

// === Shell-override detection ========================================
// For every key that .env.local supplies, see if shell already had it AND
// shell's value is empty (the masking case). Non-masking shell overrides
// (shell has truthy value) are usually intentional per-machine overrides
// and not reported.
interface ShellOverride {
  key: string;
  envLocalLen: number;
  isLlmCritical: boolean;
}

const masking: ShellOverride[] = [];
for (const key of Object.keys(ENV_LOCAL_PARSED)) {
  if (!SHELL_HAD.has(key)) continue;
  const shellLen = (SHELL_SNAPSHOT[key] ?? "").length;
  const envLocalLen = (ENV_LOCAL_PARSED[key] ?? "").length;
  if (shellLen === 0 && envLocalLen > 0) {
    masking.push({
      key,
      envLocalLen,
      isLlmCritical: LLM_CRITICAL_KEYS.has(key),
    });
  }
}
const criticalMasking = masking.filter((m) => m.isLlmCritical);
const benignMasking = masking.filter((m) => !m.isLlmCritical);

// === Report ==========================================================
console.log("\n🔍 Environment Variable Check");
console.log("================================\n");

console.log(`✅ Required (${presentRequired.length}/${REQUIRED.length})`);
for (const check of presentRequired) {
  console.log(`   ${resolveName(check)} — ${check.purpose}`);
}

if (missing.length > 0) {
  console.log(`\n❌ Missing required (${missing.length})`);
  for (const check of missing) {
    const alts = check.alternatives
      ? ` (or ${check.alternatives.join(" | ")})`
      : "";
    console.log(`   ${check.name}${alts} — ${check.purpose}`);
  }
}

console.log(`\n☑️  Optional present (${presentOptional.length})`);
if (presentOptional.length > 0) {
  console.log(`   ${presentOptional.join(", ")}`);
}

if (absentOptional.length > 0) {
  console.log(
    `\n⚠️  Optional absent — features will degrade (${absentOptional.length})`,
  );
  for (const check of absentOptional) {
    console.log(`   ${check.name} — ${check.purpose}`);
  }
}

if (criticalMasking.length > 0 || benignMasking.length > 0) {
  console.log("\n🛡️  Shell-override Detection");
  console.log("================================");
}

if (criticalMasking.length > 0) {
  console.log(
    `\n❌ CRITICAL — LLM key masked by empty shell value (${criticalMasking.length})`,
  );
  console.log(
    "   Symptom: model-router silently demotes Primary → Fallback for every call.",
  );
  console.log(
    '   Cause:   shell parent process exports `KEY=""` and dotenv refuses to override.',
  );
  for (const m of criticalMasking) {
    console.log(
      `   • ${m.key}: .env.local supplies length ${m.envLocalLen}, but shell value is empty.`,
    );
  }
  console.log("\n   Fix (run in your dev shell, then restart server):");
  const unsetList = criticalMasking.map((m) => m.key);
  if (criticalMasking.some((m) => m.key === "ANTHROPIC_API_KEY")) {
    unsetList.push("ANTHROPIC_BASE_URL"); // commonly co-set; safe to unset if present
  }
  console.log(`     unset ${[...new Set(unsetList)].join(" ")}`);
  console.log(`     npm run dev`);
  console.log(
    "\n   Also check ~/.zshrc / ~/.zprofile / ~/.zshenv for persistent exports.",
  );
  console.log(
    "   Permanent fix: remove/guard the export in your shell rc so .env.local can win.",
  );
}

if (benignMasking.length > 0) {
  console.log(
    `\n⚠️  Other empty-shell masks (${benignMasking.length}) — non-LLM, may not matter`,
  );
  for (const m of benignMasking) {
    console.log(
      `   • ${m.key}: .env.local supplies length ${m.envLocalLen}, shell empty.`,
    );
  }
}

// === Exit handling ===================================================
const missingFatal = missing.length > 0;
const llmFatal = criticalMasking.length > 0 && STRICT_MODE;

if (missingFatal && !SOFT_MODE) {
  console.log(
    `\n❌ Missing ${missing.length} required env var(s). Set them in .env.local (dev) or Vercel project settings (prod).`,
  );
  console.log(
    "   To bypass (e.g. ephemeral CI without DB): SKIP_ENV_CHECK=1\n",
  );
  process.exit(1);
}

if (llmFatal) {
  console.log(
    "\n❌ Aborting due to critical LLM shell-override (--strict mode).",
  );
  console.log(
    "   This would cause Primary→Fallback demotion for every LLM call in production.\n",
  );
  process.exit(1);
}

if (criticalMasking.length > 0 && SOFT_MODE) {
  console.log(
    "\n⚠️  Continuing despite critical shell-override (--soft mode). Fix before deploying.\n",
  );
} else if (missingFatal && SOFT_MODE) {
  console.log(
    "\n⚠️  Continuing despite missing required vars (--soft mode). Build will fail.\n",
  );
} else {
  console.log("\n✅ All required env vars present.\n");
}

process.exit(0);
