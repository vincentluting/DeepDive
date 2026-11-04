#!/usr/bin/env node
// ============================================================
// Thesis LLM Pipeline Smoke Test — Full Research Participant Flow
//
// Verifies thesis_2026 cohort path end-to-end:
//   Register → SetCohort(thesis_2026/classic) → Consent → T0 (pre)
//   → QD save (attention check) → Claim → DD → RC → Score
//   → Profile → Report → Verify content + LLMUsageLog
//   → Cleanup (PrePostAssessment cascade)
//
// Usage:
//   npm run smoke:thesis              # default (en)
//   tsx scripts/smoke-test-thesis.ts --zh
//   tsx scripts/smoke-test-thesis.ts --keep     # don't delete user
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
const localeArg = process.argv.find((a) => a.startsWith("--locale="));
const LOCALE = localeArg
  ? localeArg.split("=")[1]
  : process.argv.includes("--zh")
    ? "zh"
    : "en";
const KEEP_USER = process.argv.includes("--keep");

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let csrfToken = "";
let cookieJar = "";

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
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
      "User-Agent": UA,
      Cookie: cookieJar,
    },
    body: isGet ? undefined : JSON.stringify(data ?? {}),
  });
  mergeCookies(res);
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text.substring(0, 200) };
  }
  return { status: res.status, json };
}

async function obtainCsrf(): Promise<string> {
  const res = await fetch(`${BASE}/en/explore`, {
    headers: { "User-Agent": UA },
  });
  const cookies = res.headers.getSetCookie?.() || [];
  const csrfCookie = cookies.find((c) => c.startsWith("csrf-token="));
  if (!csrfCookie) throw new Error("No csrf-token cookie returned");
  const csrf = csrfCookie.split(";")[0].split("=")[1];
  for (const raw of cookies) {
    const pair = raw.split(";")[0];
    const name = pair.split("=")[0];
    cookieJar = cookieJar
      ? cookieJar.replace(new RegExp(`${name}=[^;]*;?\\s*`, "g"), "")
      : "";
    cookieJar = (cookieJar ? cookieJar + "; " : "") + pair;
  }
  return csrf;
}

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

const SCC_RESPONSES: Record<string, number> = {};
for (let i = 1; i <= 12; i++) SCC_RESPONSES[`scc${i}`] = 3;

const CDC_RESPONSES: Record<string, number> = {};
for (let i = 1; i <= 5; i++) CDC_RESPONSES[`cdc${i}`] = 4;

// Pre-flight LLM provider health. Calls /api/health/llm with HEALTH_CHECK_SECRET
// or CRON_SECRET (matches the endpoint's auth fallback). Returns a classification
// so the runner can distinguish "code bug" failures from "LLM provider/env
// configuration" failures — the latter shouldn't be treated as smoke regressions.
async function preflightLLMHealth(): Promise<{
  health: "healthy" | "degraded" | "unhealthy" | "skipped";
  detail: string;
}> {
  const secret =
    process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET || "";
  if (!secret) {
    return {
      health: "skipped",
      detail: "no HEALTH_CHECK_SECRET / CRON_SECRET in env",
    };
  }
  try {
    const res = await fetch(`${BASE}/api/health/llm`, {
      headers: { Authorization: `Bearer ${secret}`, "User-Agent": UA },
    });
    const body = (await res.json()) as {
      overallStatus?: string;
      providers?: Array<{ provider: string; status: string }>;
    };
    const summary =
      body.providers?.map((p) => `${p.provider}=${p.status}`).join(" ") ?? "";
    const health =
      res.status === 200
        ? "healthy"
        : res.status === 207
          ? "degraded"
          : "unhealthy";
    return { health, detail: `${body.overallStatus ?? "?"} (${summary})` };
  } catch (err) {
    return {
      health: "skipped",
      detail: `probe failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function main() {
  const ts = Date.now();
  const email = `thesis-smoke-${ts}@test.deepdive.dev`;
  const password = "ThesisSmoke123!";
  let assessmentId = "";
  let reportId = "";

  console.log(`\n🔬 Thesis Pipeline Smoke Test`);
  console.log(`   Locale: ${LOCALE} | User: ${email}`);
  console.log(`   Base: ${BASE}`);

  // === Pre-flight: classify LLM provider health BEFORE running the pipeline. ===
  // Goal: when smoke fails downstream, we already know whether the failure is
  // attributable to LLM provider/config issues (no point retrying the same way)
  // or a real code regression (worth investigating).
  const pre = await preflightLLMHealth();
  const preLabel = {
    healthy: "✅ HEALTHY",
    degraded: "⚠️  DEGRADED",
    unhealthy: "❌ UNHEALTHY",
    skipped: "⏭️  SKIPPED",
  }[pre.health];
  console.log(`   LLM pre-flight: ${preLabel} — ${pre.detail}`);
  if (pre.health === "degraded") {
    console.log(
      `   ↳ Some providers fall back. Coaching/report failures may not be code bugs.`,
    );
  } else if (pre.health === "unhealthy") {
    console.log(
      `   ↳ No providers reachable. Pipeline failure is almost certainly env, not code.`,
    );
  }
  console.log();

  await step("Obtain CSRF", async () => {
    csrfToken = await obtainCsrf();
    return `token=${csrfToken.substring(0, 8)}...`;
  });

  await step("Register", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        "User-Agent": UA,
        Cookie: cookieJar,
      },
      body: JSON.stringify({ email, password, name: "Thesis Smoke" }),
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

  await step("Set thesis cohort + classic group", async () => {
    const r = await api("/api/test/set-cohort", {
      email,
      cohort: "thesis_2026",
      researchGroup: "classic",
    });
    if (r.status !== 200)
      throw new Error(
        `set-cohort failed: ${r.status} ${JSON.stringify(r.json)}`,
      );
    return "thesis_2026/classic";
  });

  await step("Consent (T0 prerequisite)", async () => {
    const r = await api("/api/pre-post-assessment/consent", {
      consentGiven: true,
    });
    if (r.status !== 200)
      throw new Error(`Consent failed: ${r.status} ${JSON.stringify(r.json)}`);
    return "consent recorded";
  });

  await step("T0 pre-assessment (SCC-12 + CDC-5 + demo)", async () => {
    const r = await api("/api/pre-post-assessment", {
      assessmentType: "pre",
      sccResponses: SCC_RESPONSES,
      cdcResponses: CDC_RESPONSES,
      experienceFeedback: {
        demo_age: "25-34",
        demo_gender: "Female",
        demo_employment: "Employed full-time",
        demo_experience: "3-5",
      },
    });
    if (r.status !== 200)
      throw new Error(`T0 failed: ${r.status} ${JSON.stringify(r.json)}`);
    return `id=${r.json.id}`;
  });

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

  await step("Quick Dive claim", async () => {
    const saveResult = results.find((r) => r.name === "Quick Dive save");
    const resultId = saveResult?.detail.split("=")[1];
    if (!resultId) throw new Error("No resultId from QD save");
    const r = await api("/api/quickdive/claim", { resultId });
    if (r.status !== 200) throw new Error(`Claim failed: ${r.status}`);
    return "claimed";
  });

  let ddSessionId = "";
  await step("Deep Dive session + RC + Score", async () => {
    ddSessionId = crypto.randomUUID();
    const r = await api("/api/session/create", {
      sessionId: ddSessionId,
      tier: "deep",
      language: LOCALE,
    });
    if (r.status !== 200) throw new Error(`DD create failed: ${r.status}`);

    const answers = buildDeepDiveAnswers();
    const save = await api("/api/session/save", {
      sessionId: ddSessionId,
      answers,
      currentModule: "C",
      currentQuestionIndex: 85,
      language: LOCALE,
    });
    if (save.status !== 200) throw new Error(`DD save failed: ${save.status}`);

    const rc = await api("/api/reality-conditions", {
      sessionId: ddSessionId,
      userId: null,
      conditions: {
        education: { level: "master", field: "Psychology" },
        experienceYears: 4,
        pastIndustries: ["Education", "Research"],
        currentCity: "Amsterdam",
        targetCities: ["Amsterdam", "Berlin"],
        visaStatus: "citizen",
      },
    });
    if (rc.status !== 200)
      throw new Error(`RC failed: ${rc.status} ${JSON.stringify(rc.json)}`);

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
    return `assessmentId=${assessmentId}`;
  });

  await step("Profile generation (algorithmic)", async () => {
    const r = await api("/api/generate-profile", {
      assessmentId,
      locale: LOCALE,
    });
    if (r.status !== 200) throw new Error(`Profile failed: ${r.status}`);
    const archetype = (r.json.archetype as Record<string, string>)?.code;
    return `archetype=${archetype}`;
  });

  await step("Report generation (2-3 LLM calls)", async () => {
    const r = await api("/api/generate-report", {
      assessmentId,
      locale: LOCALE,
    });
    if (r.status !== 200)
      throw new Error(`Report failed: ${r.status} ${JSON.stringify(r.json)}`);
    reportId = r.json.reportId as string;
    return `reportId=${reportId}`;
  });

  await step("Report content + LLM-call sanity", async () => {
    const issues: string[] = [];
    const reportStep = results.find((r) =>
      r.name.startsWith("Report generation"),
    );
    if (reportStep && reportStep.durationMs < 5000) {
      issues.push(
        `Generation too fast (${reportStep.durationMs}ms) — fallback?`,
      );
    }

    const r = await api(`/api/admin/users/me/reports`, undefined, "GET");
    if (r.status === 200 && Array.isArray(r.json)) {
      const report = (r.json as Record<string, unknown>[]).find(
        (rep) => rep.id === reportId,
      );
      if (report) {
        const json = report.reportJson as Record<string, unknown>;
        const match = json?.careerMatch as Record<string, unknown>;
        const summary = match?.summary as string;
        if (
          summary?.startsWith("Based on your interest map, personality profile")
        ) {
          issues.push("career-match summary = fallback template");
        }
      } else {
        issues.push("report not found via admin endpoint");
      }
    }
    if (issues.length > 0) {
      throw new Error(`Quality issues: ${issues.join("; ")}`);
    }
    return `${reportStep?.durationMs}ms ok`;
  });

  // Coaching SSE smoke — verifies AI coaching endpoint produces stream
  await step("Coaching chat SSE start", async () => {
    const res = await fetch(`${BASE}/api/coaching-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        "User-Agent": UA,
        Cookie: cookieJar,
      },
      body: JSON.stringify({
        messages: [
          { role: "user", content: "Tell me about my report briefly." },
        ],
        answers: {},
        reportSummary: {
          archetype: "I-enhancement",
          archetypeName: "The Analyst",
          shadowName: "The Doubter",
        },
        round: 1,
        maxRounds: 3,
        locale: LOCALE,
        ageConfirmed: true,
      }),
    });
    if (res.status !== 200) {
      const txt = await res.text().catch(() => "");
      throw new Error(
        `Coaching failed: ${res.status} ${txt.substring(0, 200)}`,
      );
    }
    const ctype = res.headers.get("content-type") || "";
    // Coaching streams as text/plain (chunk-by-chunk LLM tokens), not SSE.
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No readable body");
    const start = Date.now();
    let bytesRead = 0;
    while (Date.now() - start < 20_000 && bytesRead < 800) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) bytesRead += value.length;
    }
    try {
      await reader.cancel();
    } catch {
      // ignore — best-effort cancel
    }
    if (bytesRead === 0)
      throw new Error(`Stream produced 0 bytes within 20s (ctype=${ctype})`);
    return `${bytesRead}B in ${Date.now() - start}ms via ${ctype.split(";")[0]}`;
  });

  if (!KEEP_USER) {
    await step("Cleanup (cascade incl PrePostAssessment)", async () => {
      const r = await api("/api/test/cleanup", { email });
      return r.status === 200 ? "cleaned" : `cleanup status: ${r.status}`;
    });
  }

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

  console.log(`User email (for DB inspection if --keep): ${email}`);
  if (assessmentId) console.log(`Assessment ID: ${assessmentId}`);
  if (reportId) console.log(`Report ID: ${reportId}`);

  // Exit code semantics (lets CI/operator route fix-it tickets):
  //   0 — all steps passed
  //   1 — pipeline failure with LLM healthy → likely a code regression
  //   2 — pipeline failure while LLM was degraded/unhealthy → likely env/upstream
  //   3 — pipeline failure with no LLM pre-flight signal (skipped) → unknown
  if (failed === 0) {
    process.exit(0);
  }
  const exitCode =
    pre.health === "healthy"
      ? 1
      : pre.health === "degraded" || pre.health === "unhealthy"
        ? 2
        : 3;
  console.log(
    `   ↳ exit ${exitCode}: ${exitCode === 1 ? "LLM healthy at start → investigate as code regression" : exitCode === 2 ? "LLM was " + pre.health + " → likely provider/env issue, not code" : "LLM pre-flight skipped → root cause unknown"}\n`,
  );
  process.exit(exitCode);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
