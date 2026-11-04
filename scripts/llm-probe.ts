// ============================================================
// scripts/llm-probe.ts
//
// Local manual probe of all configured LLM providers.
// Run with: npm run llm:probe
//
// Loads .env.local, calls checkAllProviders(), pretty-prints the report.
// Useful for:
//   - Verifying API keys after rotation
//   - Debugging local 401/timeout issues
//   - Confirming changes to health-check.ts
//
// Exits 0 on healthy, 1 on degraded, 2 on unhealthy — so it's CI-friendly.
// ============================================================

import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local before importing health-check (which reads process.env)
config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const { checkAllProviders } = await import("../lib/ai/health-check");

  console.log("→ Probing all LLM providers...\n");
  const t0 = Date.now();
  const report = await checkAllProviders();
  const totalMs = Date.now() - t0;

  console.log(
    `Generated: ${report.generatedAt}  (probe took ${totalMs}ms total)\n`,
  );

  // Per-provider breakdown
  for (const p of report.providers) {
    const icon =
      p.status === "healthy"
        ? "✅"
        : p.status === "degraded"
          ? "🟡"
          : p.status === "not_configured"
            ? "⚪"
            : "❌";
    const latency = p.latencyMs > 0 ? `  ${p.latencyMs}ms` : "";
    const reason = p.reason ? `  — ${p.reason}` : "";
    console.log(
      `${icon} ${p.provider.padEnd(10)} ${p.status.padEnd(15)}${latency}${reason}`,
    );
    if (p.errorCode) {
      console.log(`     errorCode: ${p.errorCode}`);
    }
    if (p.httpStatus) {
      console.log(`     httpStatus: ${p.httpStatus}`);
    }
  }

  console.log(`\nOverall: ${report.overallStatus.toUpperCase()}\n`);

  // Exit code reflects status — useful for CI / scripts
  const exitCode =
    report.overallStatus === "healthy"
      ? 0
      : report.overallStatus === "degraded"
        ? 1
        : 2;
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Probe failed:", err);
  process.exit(3);
});
