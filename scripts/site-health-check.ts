/**
 * scripts/site-health-check.ts
 *
 * Full-site health check: crawl every page, check for broken links,
 * console errors, broken images, and accessibility violations (axe-core).
 *
 * Usage:
 *   npm run site:health                         # against localhost:3000
 *   npm run site:health -- --url=https://...    # against any URL
 *   npm run site:health -- --auth               # include authenticated pages
 *
 * Requires: dev server running (npm run dev) or a deployed URL.
 *
 * Output: structured report to stdout + optional JSON file.
 */

import { chromium, type Page, type ConsoleMessage } from "playwright";
import AxeBuilder from "@axe-core/playwright";

// ── Configuration ────────────────────────────────────────────

const DEFAULT_BASE = "http://localhost:3000";
const LOCALE = "en";
const CRAWL_TIMEOUT_MS = 15_000; // per-page navigation timeout
const MAX_PAGES = 200; // safety cap

// Pages that need auth to render meaningful content
const AUTH_PAGES = [
  "/dashboard",
  "/explore",
  "/reports",
  "/profile",
  "/coaching",
  "/settings",
  "/settings/privacy",
  "/action-hub",
];

// Pages that need dynamic IDs — skip in crawl, test separately
const DYNAMIC_ROUTES = [
  "/profile/",
  "/report/",
  "/result/qd/",
  "/share/",
  "/p/",
  "/profile-reveal/",
  "/reset-password",
];

// Static routes to always seed (won't rely on link discovery alone)
const SEED_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/pricing",
  "/ai-career-check",
  "/legal/privacy",
  "/legal/terms",
  "/quickdive",
  "/immersive-dive",
  "/deepdive",
];

// ── Types ────────────────────────────────────────────────────

interface PageResult {
  url: string;
  status: number | null;
  consoleErrors: string[];
  brokenImages: string[];
  axeViolations: AxeViolation[];
  loadTimeMs: number;
  error?: string;
}

interface AxeViolation {
  id: string;
  impact: string;
  description: string;
  helpUrl: string;
  nodes: number;
}

interface HealthReport {
  baseUrl: string;
  timestamp: string;
  totalPages: number;
  passed: number;
  failed: number;
  pages: PageResult[];
  summary: {
    httpErrors: number;
    consoleErrors: number;
    brokenImages: number;
    axeViolations: number;
    axeCritical: number;
  };
}

// ── Helpers ──────────────────────────────────────────────────

function isDynamicRoute(path: string): boolean {
  return DYNAMIC_ROUTES.some((d) => path.includes(d));
}

function normalizeUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    // Only same-origin, no anchors, no query params for dedup
    if (url.origin !== new URL(base).origin) return null;
    // Strip hash and query for dedup
    return url.origin + url.pathname.replace(/\/$/, "") || "/";
  } catch {
    return null;
  }
}

// ── Core ─────────────────────────────────────────────────────

async function checkPage(page: Page, url: string): Promise<PageResult> {
  const consoleErrors: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore known noisy errors
      if (
        text.includes("favicon") ||
        text.includes("Failed to load resource") ||
        text.includes("hydration")
      )
        return;
      consoleErrors.push(text.slice(0, 200));
    }
  };

  page.on("console", onConsole);
  const start = Date.now();

  let status: number | null = null;
  let error: string | undefined;

  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: CRAWL_TIMEOUT_MS,
    });
    // Allow client-side hydration + lazy resources to settle
    await page.waitForTimeout(2000);
    status = response?.status() ?? null;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const loadTimeMs = Date.now() - start;

  // Check broken images
  let brokenImages: string[] = [];
  try {
    brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll("img");
      const broken: string[] = [];
      imgs.forEach((img) => {
        if (img.naturalWidth === 0 && img.src && !img.src.startsWith("data:")) {
          broken.push(img.src.slice(0, 150));
        }
      });
      return broken;
    });
  } catch {
    // page may have navigated away
  }

  // Run axe-core accessibility audit
  let axeViolations: AxeViolation[] = [];
  if (!error && status === 200) {
    try {
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "best-practice"])
        .analyze();
      axeViolations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? "minor",
        description: v.description,
        helpUrl: v.helpUrl,
        nodes: v.nodes.length,
      }));
    } catch {
      // axe injection can fail on error pages
    }
  }

  page.off("console", onConsole);

  return {
    url,
    status,
    consoleErrors,
    brokenImages,
    axeViolations,
    loadTimeMs,
    error,
  };
}

async function discoverLinks(page: Page, baseUrl: string): Promise<string[]> {
  try {
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter(Boolean),
    );
    return hrefs
      .map((h) => normalizeUrl(h, baseUrl))
      .filter((u): u is string => u !== null)
      .filter((u) => !isDynamicRoute(new URL(u).pathname));
  } catch {
    return [];
  }
}

function hasIssues(result: PageResult): boolean {
  return (
    (result.status !== null && result.status >= 400) ||
    !!result.error ||
    result.consoleErrors.length > 0 ||
    result.brokenImages.length > 0 ||
    result.axeViolations.some(
      (v) => v.impact === "critical" || v.impact === "serious",
    )
  );
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const urlArg = args.find((a) => a.startsWith("--url="));
  const baseUrl = urlArg ? urlArg.split("=")[1] : DEFAULT_BASE;
  const includeAuth = args.includes("--auth");
  const jsonOut = args.includes("--json");

  console.log(`\n🏥 Site Health Check — ${baseUrl}`);
  console.log(
    `   Locale: ${LOCALE} | Auth pages: ${includeAuth ? "yes" : "no"}\n`,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: LOCALE,
  });
  const page = await context.newPage();

  // Build initial URL list
  const visited = new Set<string>();
  const queue: string[] = [];

  // Seed static routes
  for (const route of SEED_ROUTES) {
    const url = `${baseUrl}/${LOCALE}${route === "/" ? "" : route}`;
    queue.push(url);
  }

  // Seed auth routes if requested
  if (includeAuth) {
    for (const route of AUTH_PAGES) {
      queue.push(`${baseUrl}/${LOCALE}${route}`);
    }
  }

  const results: PageResult[] = [];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const url = queue.shift()!;
    const normalized = normalizeUrl(url, baseUrl);
    if (!normalized || visited.has(normalized)) continue;
    visited.add(normalized);

    process.stdout.write(
      `  [${visited.size}] ${normalized.replace(baseUrl, "")} ... `,
    );

    const result = await checkPage(page, normalized);
    results.push(result);

    // Status icon
    if (hasIssues(result)) {
      const issues: string[] = [];
      if (result.status && result.status >= 400)
        issues.push(`${result.status}`);
      if (result.error) issues.push("ERR");
      if (result.consoleErrors.length)
        issues.push(`${result.consoleErrors.length} console`);
      if (result.brokenImages.length)
        issues.push(`${result.brokenImages.length} img`);
      const axeCrit = result.axeViolations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );
      if (axeCrit.length) issues.push(`${axeCrit.length} a11y`);
      console.log(`❌ ${issues.join(", ")} (${result.loadTimeMs}ms)`);
    } else {
      console.log(`✅ (${result.loadTimeMs}ms)`);
    }

    // Discover and enqueue new links from this page
    if (!result.error && result.status === 200) {
      const links = await discoverLinks(page, baseUrl);
      for (const link of links) {
        if (!visited.has(link) && !queue.includes(link)) {
          queue.push(link);
        }
      }
    }
  }

  await browser.close();

  // ── Build report ──────────────────────────────────────────

  const summary = {
    httpErrors: results.filter((r) => (r.status && r.status >= 400) || r.error)
      .length,
    consoleErrors: results.reduce((sum, r) => sum + r.consoleErrors.length, 0),
    brokenImages: results.reduce((sum, r) => sum + r.brokenImages.length, 0),
    axeViolations: results.reduce((sum, r) => sum + r.axeViolations.length, 0),
    axeCritical: results.reduce(
      (sum, r) =>
        sum +
        r.axeViolations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        ).length,
      0,
    ),
  };

  const report: HealthReport = {
    baseUrl,
    timestamp: new Date().toISOString(),
    totalPages: results.length,
    passed: results.filter((r) => !hasIssues(r)).length,
    failed: results.filter((r) => hasIssues(r)).length,
    pages: results,
    summary,
  };

  // ── Print summary ─────────────────────────────────────────

  console.log("\n" + "═".repeat(60));
  console.log("📋 HEALTH CHECK REPORT");
  console.log("═".repeat(60));
  console.log(`  Pages checked:     ${report.totalPages}`);
  console.log(`  Passed:            ${report.passed} ✅`);
  console.log(`  Failed:            ${report.failed} ❌`);
  console.log(`  HTTP errors:       ${summary.httpErrors}`);
  console.log(`  Console errors:    ${summary.consoleErrors}`);
  console.log(`  Broken images:     ${summary.brokenImages}`);
  console.log(
    `  A11y violations:   ${summary.axeViolations} (${summary.axeCritical} critical/serious)`,
  );
  console.log("═".repeat(60));

  // Detail: failed pages
  const failed = results.filter((r) => hasIssues(r));
  if (failed.length > 0) {
    console.log("\n🔍 ISSUES:\n");
    for (const p of failed) {
      console.log(`  ${p.url.replace(baseUrl, "")}`);
      if (p.status && p.status >= 400) console.log(`    HTTP ${p.status}`);
      if (p.error) console.log(`    Error: ${p.error}`);
      for (const e of p.consoleErrors) console.log(`    Console: ${e}`);
      for (const img of p.brokenImages) console.log(`    Broken img: ${img}`);
      for (const v of p.axeViolations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      )) {
        console.log(
          `    A11y [${v.impact}]: ${v.id} — ${v.description} (${v.nodes} elements)`,
        );
      }
      console.log();
    }
  }

  if (jsonOut) {
    const fs = await import("node:fs");
    const outPath = "site-health-report.json";
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Full report saved to ${outPath}`);
  }

  // Exit code: 1 if any HTTP errors or critical a11y violations
  const exitCode = summary.httpErrors > 0 || summary.axeCritical > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Health check crashed:", err);
  process.exit(2);
});
