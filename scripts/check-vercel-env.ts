// ============================================================
// Vercel env parity check — compares Vercel `production` (or `preview`)
// environment variable *names* against .env.local to catch deployment
// configuration drift before it bites the thesis launch.
//
// Reads only KEY NAMES (no values) from `vercel env ls` — secrets stay
// on Vercel servers and out of this transcript.
//
// Usage:
//   npm run check:vercel-env              # production parity
//   npm run check:vercel-env -- preview   # preview parity
//
// Requires: `vercel login` + `vercel link` already done. The repository
// already has .vercel/project.json so `vercel env ls` should work.
// Exits 1 if any CRITICAL key is missing on Vercel side.
// ============================================================

import { execSync } from "child_process";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const ENV_LOCAL_PATH = resolve(process.cwd(), ".env.local");
const localParsed = existsSync(ENV_LOCAL_PATH)
  ? parse(readFileSync(ENV_LOCAL_PATH))
  : {};
const localKeys = Object.keys(localParsed);

const ENVIRONMENT_ARG = process.argv[2] || "production";
const ENVIRONMENT = ENVIRONMENT_ARG === "preview" ? "preview" : "production";

console.log(`\n🔍 Vercel ${ENVIRONMENT} env parity check`);
console.log("======================================\n");
console.log(`Local .env.local keys: ${localKeys.length}`);

let rawOutput: string;
try {
  rawOutput = execSync(`vercel env ls ${ENVIRONMENT}`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch (err) {
  const stderr = (err as { stderr?: Buffer | string }).stderr;
  console.error("\n❌ `vercel env ls` failed.");
  if (stderr) console.error(String(stderr).trim());
  console.error(
    "\n   Common fixes:",
    "\n     vercel login",
    "\n     vercel link",
    "\n   Then re-run this script.\n",
  );
  process.exit(1);
}

// Parse vercel env ls text output. The table layout looks like:
//   name                  value         environments    created
//   ────────────────────────────────────────────────────────────
//   ANTHROPIC_API_KEY     Encrypted     Production      ...
// We extract key names from lines whose first token matches the
// uppercase-snake env-name convention.
const ENV_NAME_RE = /^[A-Z][A-Z0-9_]*$/;
const vercelKeys = new Set<string>();
for (const line of rawOutput.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("name") || /^[─-]/.test(trimmed)) continue;
  const first = trimmed.split(/\s+/)[0];
  if (ENV_NAME_RE.test(first)) vercelKeys.add(first);
}

console.log(`Vercel ${ENVIRONMENT} keys:  ${vercelKeys.size}`);

const localSet = new Set(localKeys);
const both = localKeys.filter((k) => vercelKeys.has(k));
const onlyLocal = localKeys.filter((k) => !vercelKeys.has(k));
const onlyVercel = [...vercelKeys].filter((k) => !localSet.has(k));

// Keys that MUST exist on Vercel for the production thesis pipeline to work.
// Missing any of these blocks the launch.
const CRITICAL: readonly string[] = [
  "POSTGRES_URL",
  "AUTH_SECRET",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "CRON_SECRET",
  "RESEND_API_KEY",
];

// POSTGRES_URL has acceptable aliases (mirrors scripts/check-env.ts REQUIRED).
const POSTGRES_ALIASES = [
  "POSTGRES_URL",
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
];
const hasPostgres = POSTGRES_ALIASES.some((a) => vercelKeys.has(a));

const missingCritical: string[] = [];
for (const key of CRITICAL) {
  if (key === "POSTGRES_URL") {
    if (!hasPostgres) missingCritical.push("POSTGRES_URL (or alias)");
    continue;
  }
  if (!vercelKeys.has(key)) missingCritical.push(key);
}

console.log(`\n📊 Parity summary`);
console.log(`   In both:        ${both.length} keys`);
console.log(`   Only local:     ${onlyLocal.length} keys`);
console.log(`   Only Vercel:    ${onlyVercel.length} keys`);

if (missingCritical.length > 0) {
  console.log(
    `\n❌ CRITICAL missing in Vercel ${ENVIRONMENT} (${missingCritical.length})`,
  );
  for (const k of missingCritical) console.log(`   • ${k}`);
  console.log(
    `\n   Fix: \`vercel env add <NAME> ${ENVIRONMENT}\` for each, then redeploy.`,
  );
}

if (onlyLocal.length > 0) {
  console.log(
    `\n⚠️  In .env.local but not in Vercel ${ENVIRONMENT} (${onlyLocal.length})`,
  );
  for (const k of onlyLocal) {
    const tag = CRITICAL.includes(k) ? "❌" : "•";
    console.log(`   ${tag} ${k}`);
  }
}

if (onlyVercel.length > 0) {
  const previewLimit = 20;
  console.log(
    `\nℹ️  In Vercel ${ENVIRONMENT} but not in .env.local (${onlyVercel.length}) — usually intentional`,
  );
  for (const k of onlyVercel.slice(0, previewLimit)) console.log(`   • ${k}`);
  if (onlyVercel.length > previewLimit) {
    console.log(`   … (+ ${onlyVercel.length - previewLimit} more)`);
  }
}

const fatal = missingCritical.length > 0;
console.log(
  `\n${fatal ? "❌ FAIL" : "✅ OK"}: ${fatal ? `Vercel ${ENVIRONMENT} missing critical env — thesis launch blocked` : `Vercel ${ENVIRONMENT} parity acceptable`}\n`,
);

process.exit(fatal ? 1 : 0);
