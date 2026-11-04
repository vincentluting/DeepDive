#!/usr/bin/env node
// ============================================================
// LLM Pipeline Smoke Test — Full Report Generation
//
// Verifies the complete data pipeline works end-to-end:
//   Register → QD → Claim → DD → Score → Profile → Report → Verify Content
//
// Usage:
//   npm run smoke:report              # default (en)
//   npm run smoke:report -- --zh      # test Chinese locale
//   npm run smoke:report -- --keep    # don't delete test user after
//
// Requires: dev server running on localhost:3000 (or BASE_URL env)
// ============================================================

import {
  RIASEC_SCORES,
  SJT_ANSWERS,
  DDVQ21_ANSWERS,
  IPIP60_ANSWERS,
  QUICKDIVE_RESULT_DATA,
  buildDeepDiveAnswers,
} from "../e2e/fixtures/test-answers";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const LOCALE = process.argv.includes("--zh") ? "zh" : "en";
const KEEP_USER = process.argv.includes("--keep");
const TIMEOUT = 300_000; // 5 min for LLM calls

// ── Helpers ──

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let csrfToken = "";
let cookieJar = ""; // accumulated cookies

function mergeCookies(res: Response): void {
  const setCookies = res.headers.getSetCookie?.() || [];
  const existing = new Map(
    cookieJar
      .split("; ")
      .filter(Boolean)
      .map((c) => [c.split("=")[0], c] as [string, string]),
  );
  for (const raw of setCookies) {
    const pair = raw.split(";")[0];
    const name = pair.split("=")[0];
    existing.set(name, pair);
  }
  cookieJar = [...existing.values()].join("; ");
}

async function api(
  path: string,
  data?: Record<string, unknown>,
  method = "POST",
): Promise<{ status: number; json: Record<string, unknown> }> {
  const isGet = method === "GET";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(isGet ? {} : { "Content-Type": "application/json" }),
      "x-csrf-token": csrfToken,
      "User-Agent": UA,
      Cookie: cookieJar,
    },
    ...(isGet ? {} : { body: JSON.stringify(data ?? {}) }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  mergeCookies(res);
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.substring(0, 500) };
  }
  return { status: res.status, json };
}

async function obtainCsrf(): Promise<string> {
  const res = await fetch(`${BASE}/${LOCALE}/login`, {
    headers: { "User-Agent": UA },
    redirect: "manual",
  });
  mergeCookies(res);
  const csrf = cookieJar.match(/csrf-token=([^;]+)/)?.[1];
  if (!csrf) throw new Error("Failed to obtain CSRF token");
  return csrf;
}

// ── Test Steps ──

interface StepResult {
  name: string;
  ok: boolean;
  detail: string;
  durationMs: number;
}

const results: StepResult[] = [];

async function step(name: string, fn: () => Promise<string>): Promise<boolean> {
  const start = Date.now();
  try {
    const detail = await fn();
    const ms = Date.now() - start;
    results.push({ name, ok: true, detail, durationMs: ms });
    console.log(`  ✅ ${name} (${ms}ms) — ${detail}`);
    return true;
  } catch (err) {
    const ms = Date.now() - start;
    const detail = err instanceof Error ? err.message : String(err);
    results.push({ name, ok: false, detail, durationMs: ms });
    console.log(`  ❌ ${name} (${ms}ms) — ${detail}`);
    return false;
  }
}

// ── Main ──

async function main() {
  const ts = Date.now();
  const email = `smoke-${ts}@test.deepdive.dev`;
  const password = "SmokeTest123!";
  let assessmentId = "";
  let reportId = "";

  console.log(`\n🔬 LLM Pipeline Smoke Test`);
  console.log(`   Locale: ${LOCALE} | User: ${email}`);
  console.log(`   Base: ${BASE}\n`);

  // 1. CSRF
  await step("Obtain CSRF", async () => {
    csrfToken = await obtainCsrf();
    return `token=${csrfToken.substring(0, 8)}...`;
  });

  // 2. Register
  await step("Register", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        "User-Agent": UA,
        Cookie: cookieJar,
      },
      body: JSON.stringify({ email, password, name: "Smoke Tester" }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Register failed: ${res.status} ${body.substring(0, 200)}`,
      );
    }
    mergeCookies(res);
    return `registered`;
  });

  // 3. Quick Dive
  await step("Quick Dive save", async () => {
    const r = await api("/api/quickdive/save", {
      scores: RIASEC_SCORES,
      code: "AI",
      label: "The Creative Analyst",
      locale: LOCALE,
      exploreMode: "classic",
      resultData: QUICKDIVE_RESULT_DATA,
    });
    if (r.status !== 200)
      throw new Error(`QD save failed: ${r.status} ${JSON.stringify(r.json)}`);
    return `resultId=${r.json.id}`;
  });

  // 4. Claim
  await step("Quick Dive claim", async () => {
    // Get result ID from previous step
    const saveResult = results.find((r) => r.name === "Quick Dive save");
    const resultId = saveResult?.detail.split("=")[1];
    if (!resultId) throw new Error("No resultId from QD save");
    const r = await api("/api/quickdive/claim", { resultId });
    if (r.status !== 200) throw new Error(`Claim failed: ${r.status}`);
    return "claimed";
  });

  // 5. Set cohort
  await step("Set cohort", async () => {
    const r = await api("/api/test/set-cohort", {
      email,
      cohort: "beta_2026",
    });
    if (r.status !== 200) throw new Error(`Cohort failed: ${r.status}`);
    return "beta_2026";
  });

  // 6. Deep Dive session + Real Conditions + Score
  let ddSessionId = "";
  await step("Deep Dive session", async () => {
    ddSessionId = crypto.randomUUID();
    const r = await api("/api/session/create", {
      sessionId: ddSessionId,
      tier: "deep",
      language: LOCALE,
    });
    if (r.status !== 200) throw new Error(`DD create failed: ${r.status}`);

    // Save all 86 answers
    const answers = buildDeepDiveAnswers();
    const save = await api("/api/session/save", {
      sessionId: ddSessionId,
      answers,
      currentModule: "C",
      currentQuestionIndex: 85,
      language: LOCALE,
    });
    if (save.status !== 200) throw new Error(`DD save failed: ${save.status}`);

    // Save real conditions (triggers career-pathway LLM call in report)
    const rc = await api("/api/reality-conditions", {
      sessionId: ddSessionId,
      userId: null,
      conditions: {
        education: { level: "master", field: "Computer Science" },
        experienceYears: 5,
        pastIndustries: ["Technology", "Consulting"],
        currentCity: "Amsterdam",
        targetCities: ["Amsterdam", "London", "remote"],
        visaStatus: "work_visa",
      },
    });
    if (rc.status !== 200)
      throw new Error(
        `RealConditions save failed: ${rc.status} ${JSON.stringify(rc.json)}`,
      );

    // Score
    const score = await api("/api/score", {
      sessionId: ddSessionId,
      sjt: SJT_ANSWERS,
      values: DDVQ21_ANSWERS,
      ipip: IPIP60_ANSWERS,
      riasecNormalized: RIASEC_SCORES,
      locale: LOCALE,
    });
    if (score.status !== 200)
      throw new Error(
        `Score failed: ${score.status} ${JSON.stringify(score.json)}`,
      );
    assessmentId = score.json.id as string;
    return `assessmentId=${assessmentId} (with realConditions)`;
  });

  // 7. Profile generation
  await step("Profile generation", async () => {
    const r = await api("/api/generate-profile", {
      assessmentId,
      locale: LOCALE,
    });
    if (r.status !== 200) throw new Error(`Profile failed: ${r.status}`);
    const archetype = (r.json.archetype as Record<string, string>)?.code;
    return `archetype=${archetype}`;
  });

  // 8. Report generation (THE KEY TEST — real LLM calls)
  await step("Report generation (LLM)", async () => {
    const r = await api("/api/generate-report", {
      assessmentId,
      locale: LOCALE,
    });
    if (r.status !== 200)
      throw new Error(`Report failed: ${r.status} ${JSON.stringify(r.json)}`);
    reportId = r.json.reportId as string;
    return `reportId=${reportId}`;
  });

  // 9. Verify report content quality
  await step("Report content quality", async () => {
    const issues: string[] = [];

    // Check timing — real LLM calls take >10s
    const reportStep = results.find(
      (r) => r.name === "Report generation (LLM)",
    );
    if (reportStep && reportStep.durationMs < 5000) {
      issues.push(
        `Generation too fast (${reportStep.durationMs}ms) — likely all fallback`,
      );
    }

    // Fetch report via admin endpoint to check content
    const r = await api(`/api/admin/users/me/reports`, undefined, "GET");
    if (r.status === 200 && Array.isArray(r.json)) {
      const report = (r.json as Record<string, unknown>[]).find(
        (rep) => rep.id === reportId,
      );
      if (report) {
        const json = report.reportJson as Record<string, unknown>;
        const match = json?.careerMatch as Record<string, unknown>;
        const summary = match?.summary as string;
        // Check for fallback template text
        if (
          summary?.startsWith("Based on your interest map, personality profile")
        ) {
          issues.push("career-match summary is fallback template text");
        }
      }
    }

    if (issues.length > 0) {
      throw new Error(`Quality issues: ${issues.join("; ")}`);
    }

    return `${reportStep?.durationMs}ms, content verified`;
  });

  // 10. Cleanup
  if (!KEEP_USER) {
    await step("Cleanup test user", async () => {
      const r = await api("/api/test/cleanup", { email });
      return r.status === 200 ? "cleaned" : `cleanup status: ${r.status}`;
    });
  }

  // ── Summary ──
  console.log("\n" + "═".repeat(60));
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const totalMs = results.reduce((sum, r) => sum + r.durationMs, 0);

  if (failed === 0) {
    console.log(
      `✅ ALL ${passed} STEPS PASSED (${(totalMs / 1000).toFixed(1)}s total)`,
    );
  } else {
    console.log(`❌ ${failed} FAILED, ${passed} passed`);
    results
      .filter((r) => !r.ok)
      .forEach((r) => console.log(`   FAIL: ${r.name} — ${r.detail}`));
  }
  console.log("═".repeat(60) + "\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
