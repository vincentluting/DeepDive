import { defineConfig } from "@playwright/test";

const E2E_PORT = Number(process.env.E2E_PORT) || 3000;
const E2E_MANAGED = process.env.E2E_MANAGED === "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: E2E_MANAGED ? 90_000 : 30_000,
  // Managed E2E shares one Next dev server and one temporary Neon branch.
  // Keep the release gate serial so first-hit compiles, shared setup users,
  // and DB-backed resume flows do not race each other.
  workers: E2E_MANAGED ? 1 : undefined,
  retries: 0,
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    headless: true,
    // Bot detection blocks Playwright's default User-Agent (contains "Playwright")
    // and also checks for standard browser headers (Accept-Language, sec-ch-ua, etc.).
    // Provide a full set of browser-like headers to pass Layer 2 header analysis.
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "sec-ch-ua":
        '"Chromium";v="120", "Google Chrome";v="120", "Not-A.Brand";v="99"',
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Dest": "document",
    },
  },
  projects: [
    // ── Desktop (default) ──
    {
      name: "smoke",
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: "auth-redirects",
      testMatch: /auth-redirects\.spec\.ts/,
    },
    {
      name: "quickdive-flow",
      testMatch: /quickdive-flow\.spec\.ts/,
      timeout: 180_000, // 30 questions + values + reveal under cold dev compiles
    },
    {
      name: "core-journey",
      testMatch: /core-journey\.spec\.ts/,
      timeout: 150_000, // report generation can take 100s+
    },
    {
      name: "deep-dive-flow",
      testMatch: /deep-dive-flow\.spec\.ts/,
      timeout: 180_000, // questionnaire + scoring + profile + report generation
    },
    {
      name: "facet-name-regression",
      testMatch: /facet-name-regression\.spec\.ts/,
      timeout: 180_000, // full pipeline + screenshot
    },
    {
      name: "coaching-flow",
      testMatch: /coaching-flow\.spec\.ts/,
      timeout: 300_000, // real Anthropic streaming: 60-90s per call × 3-4 serial calls
    },
    {
      name: "coaching-layout",
      testMatch: /coaching-layout\.spec\.ts/,
      timeout: 120_000,
    },
    {
      name: "session-lifecycle",
      testMatch: /session-lifecycle\.spec\.ts/,
      timeout: 60_000,
    },
    {
      name: "analytics-pipeline",
      testMatch: /analytics-pipeline\.spec\.ts/,
      timeout: 150_000, // setup requires full pipeline
    },
    {
      name: "explore-hub-flow",
      testMatch: /explore-hub-flow\.spec\.ts/,
    },
    {
      name: "ai-career-check-flow",
      testMatch: /ai-career-check-flow\.spec\.ts/,
    },
    {
      name: "research-survey-flow",
      testMatch: /research-survey-flow\.spec\.ts/,
      timeout: 60_000,
    },
    {
      name: "public-pages-smoke",
      testMatch: /public-pages-smoke\.spec\.ts/,
    },
    {
      name: "landing-experience",
      testMatch: /landing-experience\.spec\.ts/,
      timeout: 60_000,
    },
    {
      name: "report-rendering",
      testMatch: /report-rendering\.spec\.ts/,
      timeout: 180_000, // full pipeline setup + LLM report generation
    },
    {
      name: "report-stream-fallback",
      testMatch: /report-stream-fallback\.spec\.ts/,
      timeout: 240_000, // browser flow + real report generation fallback
    },
    {
      name: "audit-features",
      testMatch: /audit-features\.spec\.ts/,
      timeout: 120_000, // keyboard test builds fresh user + coaching needs LLM
    },
    // ── Mobile (375px, Chromium) ──
    {
      name: "immersive-dive-flow",
      testMatch: /immersive-dive-flow\.spec\.ts/,
      timeout: 300_000, // 38 questions + revelation cinematic = long flow
    },
    {
      name: "immersive-dive-edge",
      testMatch: /immersive-dive-edge\.spec\.ts/,
      timeout: 90_000,
    },
    // ── Mobile (375px, Chromium) ──
    {
      name: "mobile-smoke",
      testMatch: /smoke\.spec\.ts/,
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
    {
      name: "mobile-responsive",
      testMatch: /mobile-responsive\.spec\.ts/,
      timeout: 90_000,
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
    {
      name: "mobile-visual-regression",
      testMatch: /mobile-visual-regression\.spec\.ts/,
      timeout: 60_000,
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
  ],
  // When E2E_MANAGED=true (via npm run test:e2e), the wrapper script
  // manages the dev server with a branch DB. Otherwise fall back to
  // auto-starting on port 3000 for direct `npx playwright test` usage.
  webServer: E2E_MANAGED
    ? undefined
    : {
        // Keep direct local Playwright runs aligned with the isolated E2E script.
        // The helper clears stale .next/dev artifacts before starting webpack dev.
        command: "node --import tsx scripts/start-e2e-dev.ts --port 3000",
        port: 3000,
        reuseExistingServer: true,
      },
});
