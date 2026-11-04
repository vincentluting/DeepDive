// ============================================================
// Global Setup — Pre-warm optimization for E2E test suite.
//
// Creates a shared State 2 test user and caches context to disk.
// This is an OPTIMIZATION, not a hard dependency — each spec
// uses ensureSharedContext() which falls back to building its
// own pipeline user if this setup fails or is skipped.
//
// Runs ONCE before all Playwright projects.
// ============================================================

import { request } from "@playwright/test";
import { buildState2User } from "./fixtures/test-setup";
import * as fs from "fs";
import * as path from "path";

/** Shared test user credentials */
export const SHARED_USER = {
  email: `e2e-shared-${Date.now()}@test.deepdive.dev`,
  password: "SharedTestPass123!",
  name: "E2E Shared User",
};

/** Path to persist shared context between setup → tests → teardown */
export const SHARED_CONTEXT_PATH = path.join(__dirname, ".shared-context.json");

/** Path to Playwright storageState (cookies + localStorage) */
export const STORAGE_STATE_PATH = path.join(__dirname, ".storage-state.json");

export default async function globalSetup() {
  const sharedSetupMode = process.env.E2E_SHARED_SETUP_MODE ?? "full";
  if (sharedSetupMode === "skip") {
    for (const f of [SHARED_CONTEXT_PATH, STORAGE_STATE_PATH]) {
      try {
        fs.unlinkSync(f);
      } catch {
        // already absent
      }
    }
    console.log("[global-setup] Shared pipeline setup skipped");
    return;
  }

  const port = process.env.E2E_PORT || "3000";
  const ctx = await request.newContext({
    baseURL: `http://localhost:${port}`,
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
  });

  try {
    // Build full pipeline: QuickDive → Register → Claim → DeepDive → Score → Profile → Report
    let testContext;
    try {
      testContext = await buildState2User(
        ctx,
        SHARED_USER.email,
        SHARED_USER.password,
        SHARED_USER.name,
      );
    } catch (setupError) {
      // Write minimal fallback context so downstream specs get a clear skip
      // instead of an unhelpful ENOENT crash
      console.error(`[global-setup] Pipeline failed:`, setupError);
      fs.writeFileSync(
        SHARED_CONTEXT_PATH,
        JSON.stringify(
          {
            csrfToken: "",
            sessionCookie: "",
            quickDiveResultId: "",
            questionnaireSessionId: "",
            assessmentId: "",
            profileId: undefined,
            reportId: undefined,
            email: SHARED_USER.email,
            _setupError: String(setupError),
          },
          null,
          2,
        ),
      );
      throw setupError;
    }

    // Persist TestContext for tests and teardown
    fs.writeFileSync(
      SHARED_CONTEXT_PATH,
      JSON.stringify(
        {
          ...testContext,
          email: SHARED_USER.email,
        },
        null,
        2,
      ),
    );

    // Persist storageState (cookies) for browser-context tests
    const storageState = {
      cookies: [
        {
          name: "csrf-token",
          value: testContext.csrfToken,
          domain: "localhost",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "Lax" as const,
          expires: -1,
        },
        {
          name: "session",
          value: testContext.sessionCookie.replace("session=", ""),
          domain: "localhost",
          path: "/",
          httpOnly: true,
          secure: false,
          sameSite: "Lax" as const,
          expires: -1,
        },
      ],
      origins: [],
    };
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(storageState, null, 2));

    // Warm the dev server routes sequentially.
    // Concurrent first-hit compiles can corrupt webpack dev manifests and
    // cause unrelated 500s later in the suite.
    const base = `http://localhost:${port}`;
    const warmupRoutes = [
      "/en/explore",
      "/zh/explore",
      "/en/quickdive",
      "/zh/quickdive",
      "/en",
      "/zh",
      "/en/deepdive",
      "/zh/deepdive",
      "/en/coaching",
      "/zh/coaching",
      "/en/report/latest",
      "/en/login",
      "/en/register",
      "/en/legal/privacy",
      "/en/legal/terms",
      "/en/ai-career-check",
      "/en/immersive-dive",
      "/en/dashboard",
      "/en/settings",
      "/en/profile",
      "/api/auth/me",
      "/api/reports/latest",
      "/api/journey",
    ];

    if (testContext.reportId) {
      warmupRoutes.push(
        `/api/report/${testContext.reportId}`,
        `/en/report/${testContext.reportId}`,
        `/zh/report/${testContext.reportId}`,
      );
    }

    for (const route of warmupRoutes) {
      await ctx.get(`${base}${route}`).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ── Fail-fast health probes ──
    // After warming, verify critical routes actually return 2xx/3xx.
    // If infra is broken (corrupt .next/dev, compilation error), we
    // abort immediately instead of letting tests hit confusing 500s.
    const healthProbes: Array<{ path: string; name: string }> = [
      { path: "/en/register", name: "Register page" },
      { path: "/en/profile", name: "Profile page" },
    ];
    if (testContext.reportId) {
      healthProbes.push({
        path: `/api/report/${testContext.reportId}`,
        name: "Report API",
      });
    }

    for (const probe of healthProbes) {
      let lastStatus = 0;
      let healthy = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await ctx.get(`${base}${probe.path}`);
          lastStatus = res.status();
          if (lastStatus >= 200 && lastStatus < 400) {
            healthy = true;
            break;
          }
        } catch {
          // network error, will retry
        }
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      if (!healthy) {
        throw new Error(
          `[global-setup] ❌ Health probe FAILED: ${probe.name} (${probe.path}) → HTTP ${lastStatus}\n` +
            `Infrastructure is broken — aborting E2E suite.\n` +
            `Try: rm -rf .next/dev && npm run test:e2e`,
        );
      }
      console.log(`[global-setup] ✓ ${probe.name}`);
    }

    const hasReport = testContext.reportId ? "✓" : "✗ (LLM unavailable)";
    const hasProfile = testContext.profileId ? "✓" : "✗";
    console.log(`\n[global-setup] Shared user ready: ${SHARED_USER.email}`);
    console.log(`[global-setup] Profile: ${hasProfile} | Report: ${hasReport}`);
    console.log(`[global-setup] Assessment: ${testContext.assessmentId}\n`);
  } finally {
    await ctx.dispose();
  }
}
