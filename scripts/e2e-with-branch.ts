// ============================================================
// E2E with Neon Branch Isolation
//
// Creates a temporary Neon branch → starts dev server on port 3001
// → runs Playwright → deletes branch. Test data NEVER touches
// the production database.
//
// Required env: NEON_API_KEY, NEON_PROJECT_ID (in .env.local)
// Recommended: GROQ_API_KEY (auto-enables E2E_USE_GROQ for free, fast,
//              deterministic E2E that does not burn production LLM quota).
//              Override with E2E_USE_GROQ=false to test production routing.
// Usage: npx tsx scripts/e2e-with-branch.ts [playwright args...]
// ============================================================

import { config } from "dotenv";
import { spawn, type ChildProcess } from "child_process";
import { resolve as resolvePath } from "path";
import { resolveE2EProvider } from "./resolve-e2e-provider";
import {
  resolveE2ESharedSetupMode,
  type E2ESharedSetupMode,
} from "./resolve-e2e-shared-setup";

config({ path: resolvePath(__dirname, "../.env.local") });

const NEON_API = "https://console.neon.tech/api/v2";
const PROJECT_ID = process.env.NEON_PROJECT_ID;
const API_KEY = process.env.NEON_API_KEY;
const E2E_PORT = 3001;
const DB_NAME = "neondb";
const ROLE_NAME = "neondb_owner";
const PROJECT_ROOT = resolvePath(__dirname, "..");

if (!PROJECT_ID || !API_KEY) {
  console.error(
    "❌ Missing NEON_PROJECT_ID or NEON_API_KEY in .env.local\n" +
      "   Get your API key at: https://console.neon.tech/app/settings/api-keys",
  );
  process.exit(1);
}

// ── E2E LLM provider strategy ──
//
// Logic lives in `./resolve-e2e-provider.ts` as a pure function so it can be
// unit-tested with table-driven cases (see `__tests__/resolve-e2e-provider.test.ts`).
// We translate its `kind: "error"` results into a fail-fast process.exit here.

const E2E_PROVIDER_RESULT = resolveE2EProvider(process.env);
if (E2E_PROVIDER_RESULT.kind === "error") {
  console.error(E2E_PROVIDER_RESULT.message);
  process.exit(1);
}
const E2E_PROVIDER = E2E_PROVIDER_RESULT;

// ── Neon API helpers ──

async function neonFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${NEON_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neon API ${res.status}: ${body}`);
  }
  return res.json();
}

async function createBranch(): Promise<{
  branchId: string;
  endpointId: string;
}> {
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const data = await neonFetch(`/projects/${PROJECT_ID}/branches`, {
    method: "POST",
    body: JSON.stringify({
      branch: { name: `e2e-${timestamp}` },
      endpoints: [{ type: "read_write" }],
    }),
  });
  return {
    branchId: data.branch.id as string,
    endpointId: data.endpoints[0].id as string,
  };
}

async function waitForEndpoint(
  endpointId: string,
  maxWaitMs = 60_000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const data = await neonFetch(
      `/projects/${PROJECT_ID}/endpoints/${endpointId}`,
    );
    if (data.endpoint.current_state === "active") return;
    if (data.endpoint.current_state === "idle") return; // will wake on first connection
    await new Promise((r) => setTimeout(r, 2000));
  }
  // Proceed anyway — endpoint might activate on first connection
  console.warn("⚠️  Endpoint not yet active, proceeding anyway...");
}

async function getConnectionString(branchId: string): Promise<string> {
  const data = await neonFetch(
    `/projects/${PROJECT_ID}/connection_uri?branch_id=${branchId}&role_name=${ROLE_NAME}&database_name=${DB_NAME}`,
  );
  return data.uri as string;
}

async function deleteBranch(branchId: string): Promise<void> {
  await neonFetch(`/projects/${PROJECT_ID}/branches/${branchId}`, {
    method: "DELETE",
  });
}

// ── Process management ──

/**
 * Stop any existing Next.js dev server in this project directory.
 * Two dev servers sharing the same .next/dev folder can corrupt
 * prerender-manifest.json and poison unrelated routes with 500s.
 */
async function stopExistingDevServer(): Promise<void> {
  try {
    const { execSync } = await import("child_process");
    const output = execSync("ps -axo pid=,command=", {
      encoding: "utf-8",
    });

    const pids = output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(\d+)\s+(.*)$/);
        if (!match) return null;

        const [, pidText, command] = match;
        return {
          pid: Number(pidText),
          command,
        };
      })
      .filter(
        (
          value,
        ): value is {
          pid: number;
          command: string;
        } =>
          value !== null &&
          value.pid !== process.pid &&
          value.command.includes(PROJECT_ROOT) &&
          value.command.includes("next") &&
          value.command.includes("dev"),
      );

    for (const { pid } of pids) {
      try {
        console.log(`⏸️  Stopping existing dev server (PID ${pid})...`);
        process.kill(pid, "SIGTERM");

        for (let i = 0; i < 20; i++) {
          try {
            process.kill(pid, 0);
            await new Promise((r) => setTimeout(r, 500));
          } catch {
            break;
          }
        }
      } catch {
        // process already gone
      }
    }
  } catch {
    // No matching process, that's fine
  }
}

function startDevServer(postgresUrl: string): ChildProcess {
  const child = spawn(
    "node",
    ["--import", "tsx", "scripts/start-e2e-dev.ts", "--port", String(E2E_PORT)],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        POSTGRES_URL: postgresUrl,
        PORT: String(E2E_PORT),
        NODE_ENV: "development",
        E2E_MANAGED: "true",
        E2E_USE_GROQ: E2E_PROVIDER.useGroq,
        E2E_DISABLE_ANALYTICS: "true",
        EMAIL_MODE: "beta",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  // Forward output with prefix
  child.stdout?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.log(`[dev] ${line}`);
  });
  child.stderr?.on("data", (d: Buffer) => {
    const line = d.toString().trim();
    if (line) console.error(`[dev] ${line}`);
  });

  return child;
}

function runMigrations(postgresUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "node",
      ["--import", "tsx", "scripts/run-migrations.ts"],
      {
        cwd: PROJECT_ROOT,
        env: {
          ...process.env,
          POSTGRES_URL: postgresUrl,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    child.stdout?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.log(`[migrate] ${line}`);
    });
    child.stderr?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.error(`[migrate] ${line}`);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Migration runner exited with code ${code ?? 1}`));
    });
  });
}

async function waitForServer(port: number, maxWaitMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(`http://localhost:${port}/en/explore`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      });
      if (res.ok || res.status === 302 || res.status === 307) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Dev server did not start within ${maxWaitMs}ms`);
}

function runPlaywright(
  port: number,
  extraArgs: string[],
  sharedSetupMode: E2ESharedSetupMode,
): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("npx", ["playwright", "test", ...extraArgs], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        E2E_PORT: String(port),
        E2E_MANAGED: "true",
        E2E_SHARED_SETUP_MODE: sharedSetupMode,
      },
      stdio: "inherit",
    } as Parameters<typeof spawn>[2]);

    child.on("close", (code) => resolve(code ?? 1));
  });
}

// ── Suite management ──
// Separate LLM-heavy projects from the default run to reduce noise
// from external API flakiness (e.g. Groq 429).

/** Projects that depend on real LLM calls and are slow/flaky */
const LLM_HEAVY_PROJECTS = [
  "coaching-flow",
  "report-rendering",
  "audit-features",
];

/** Parse --suite=core|full|llm from argv, return cleaned playwright args */
function parseSuiteArgs(argv: string[]): {
  suite: "core" | "full" | "llm";
  playwrightArgs: string[];
} {
  // Drop bare `--` separators introduced by `npm run … -- …`. Without this,
  // they slip into playwrightArgs and Playwright treats every subsequent
  // `--project=…` flag as a POSITIONAL test-file pattern → "No tests found."
  // Bit 2026-05-12 when running `npm run test:e2e:llm` via the e2e-tee wrapper.
  const args = argv.filter((a) => a !== "--");
  let suite: "core" | "full" | "llm" = "core";

  const suiteIdx = args.findIndex((a) => a.startsWith("--suite="));
  if (suiteIdx !== -1) {
    const value = args[suiteIdx].split("=")[1];
    if (value === "full" || value === "llm" || value === "core") {
      suite = value;
    }
    args.splice(suiteIdx, 1);
  }

  return { suite, playwrightArgs: args };
}

/**
 * Inject --project flags based on suite selection.
 * If the user already specified --project, we respect that and skip injection.
 */
function applySuiteFilter(
  suite: "core" | "full" | "llm",
  args: string[],
): string[] {
  // User explicitly chose projects — don't override
  if (args.some((a) => a === "--project" || a.startsWith("--project="))) {
    return args;
  }

  if (suite === "full") {
    return args; // run everything
  }

  if (suite === "llm") {
    // Only LLM-heavy + core-journey as pipeline smoke
    return [
      ...args,
      "--project=core-journey",
      ...LLM_HEAVY_PROJECTS.map((p) => `--project=${p}`),
    ];
  }

  // suite === "core": exclude LLM-heavy projects.
  // Playwright has no --ignore-project, so we must build an exclusion grep.
  // Instead, we list all projects from config minus the heavy ones.
  // Kept in sync with playwright.config.ts — if a new project is added there
  // but not here, it simply won't run in "core" until added.
  const CORE_PROJECTS = [
    "smoke",
    "auth-redirects",
    "quickdive-flow",
    "core-journey",
    "deep-dive-flow",
    "session-lifecycle",
    "analytics-pipeline",
    "explore-hub-flow",
    "ai-career-check-flow",
    "public-pages-smoke",
    "immersive-dive-flow",
    "immersive-dive-edge",
    "mobile-smoke",
    "mobile-responsive",
  ];

  return [...args, ...CORE_PROJECTS.map((p) => `--project=${p}`)];
}

// ── Main ──

async function main() {
  let branchId: string | null = null;
  let devServer: ChildProcess | null = null;
  let exitCode = 1;

  // Ensure cleanup on any exit
  const cleanup = async () => {
    if (devServer && !devServer.killed) {
      console.log("\n🧹 Stopping dev server...");
      devServer.kill("SIGTERM");
    }
    if (branchId) {
      console.log(`🧹 Deleting Neon branch ${branchId}...`);
      try {
        await deleteBranch(branchId);
        console.log("✅ Branch deleted");
      } catch (err) {
        console.error("⚠️  Failed to delete branch:", err);
        console.error(
          `   Manual cleanup: neon branches delete ${branchId} --project-id ${PROJECT_ID}`,
        );
      }
    }
  };

  process.on("SIGINT", async () => {
    await cleanup();
    process.exit(130);
  });
  process.on("SIGTERM", async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    // 0. Stop existing dev server (Next.js blocks two in same dir)
    await stopExistingDevServer();

    // Surface E2E LLM provider strategy up front so failures and timings
    // are interpretable later in the run.
    console.log(E2E_PROVIDER.banner);

    // 1. Create Neon branch
    console.log("🔀 Creating temporary Neon branch...");
    const branch = await createBranch();
    branchId = branch.branchId;
    console.log(`   Branch: ${branchId}`);

    // 2. Wait for endpoint + get connection string
    console.log("⏳ Waiting for endpoint...");
    await waitForEndpoint(branch.endpointId);
    const connectionString = await getConnectionString(branchId);
    console.log("✅ Branch ready");

    // 3. Apply any pending schema migrations to the temporary branch
    console.log("🧱 Applying pending migrations...");
    await runMigrations(connectionString);
    console.log("✅ Migrations ready");

    // 4. Start dev server with branch DB
    console.log(`🚀 Starting dev server on port ${E2E_PORT}...`);
    devServer = startDevServer(connectionString);
    await waitForServer(E2E_PORT);
    console.log("✅ Dev server ready\n");

    // 5. Run Playwright tests
    const { suite, playwrightArgs } = parseSuiteArgs(process.argv.slice(2));
    const finalArgs = applySuiteFilter(suite, playwrightArgs);
    const sharedSetupMode = resolveE2ESharedSetupMode(finalArgs);

    if (suite !== "full") {
      const excluded =
        suite === "core" ? LLM_HEAVY_PROJECTS.join(", ") : "non-LLM projects";
      console.log(`📋 Suite: ${suite} (excluding ${excluded})`);
    }
    console.log(`👤 Shared setup: ${sharedSetupMode}`);

    exitCode = await runPlaywright(E2E_PORT, finalArgs, sharedSetupMode);
  } catch (err) {
    console.error("❌ E2E run failed:", err);
  } finally {
    await cleanup();
  }

  process.exit(exitCode);
}

main();
