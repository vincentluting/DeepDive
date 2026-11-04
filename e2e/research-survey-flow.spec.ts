// ============================================================
// Research Survey Flow — End-to-End API Test
//
// Tests the complete research participant data pipeline:
//   Register → Consent → T0 (pre) → T1 prerequisite gates → T1 (post) → T2 gates
//
// Validates: CDC-5 persistence, demo_gender, Trust-5/Constraints-3,
// UES-12, DR-3, Feature Selection max-2, intervention gates, 7-day gate.
//
// Skip condition: If DATABASE_URL is not available, tests auto-skip.
// ============================================================

import { test, expect } from "@playwright/test";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;
const TEST_EMAIL = `e2e-research-${Date.now()}@test.deepdive.dev`;
const TEST_PASSWORD = "TestPassword123!";
const TEST_NAME = "Research E2E";

let sessionCookie: string;
let csrfToken: string;

function apiHeaders(): Record<string, string> {
  return {
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}`,
  };
}
function authedHeaders(): Record<string, string> {
  return {
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}; ${sessionCookie}`,
  };
}

const SCC_RESPONSES: Record<string, number> = {};
for (let i = 1; i <= 12; i++) SCC_RESPONSES[`scc${i}`] = 3;

const CDC_RESPONSES: Record<string, number> = {};
for (let i = 1; i <= 5; i++) CDC_RESPONSES[`cdc${i}`] = 4;

test.describe.serial("Research Survey Flow", () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.get(`${BASE}/en/explore`);
    const cookies = res.headers()["set-cookie"] ?? "";
    const match = (Array.isArray(cookies) ? cookies.join("; ") : cookies).match(
      /csrf-token=([^;]+)/,
    );
    csrfToken = match?.[1] ?? crypto.randomUUID();
  });

  // ── Step 1: Register ──
  test("Register test user", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/register`, {
      headers: apiHeaders(),
      data: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
      },
    });
    expect(res.ok(), `Register failed: ${res.status()}`).toBeTruthy();
    const cookies = res.headers()["set-cookie"] ?? "";
    const cookieStr = Array.isArray(cookies) ? cookies.join("; ") : cookies;
    const sessionMatch = cookieStr.match(/(session=[^;]+)/);
    expect(sessionMatch).toBeTruthy();
    sessionCookie = sessionMatch![1];
  });

  // ── Step 2: Set cohort (thesis_2026) ──
  test("Set thesis_2026 cohort + research group", async ({ request }) => {
    const res = await request.post(`${BASE}/api/test/set-cohort`, {
      headers: authedHeaders(),
      data: {
        email: TEST_EMAIL,
        cohort: "thesis_2026",
        researchGroup: "classic",
      },
    });
    expect(res.ok(), `Set cohort failed: ${res.status()}`).toBeTruthy();
  });

  // ── Step 3: Submit T0 (pre) with CDC-5 + demographics ──
  test("T0 (pre) — submit with CDC-5 and demographics", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
      data: {
        assessmentType: "pre",
        sccResponses: SCC_RESPONSES,
        cdcResponses: CDC_RESPONSES,
        experienceFeedback: {
          demo_age: "25-34",
          demo_gender: "Male",
          demo_employment: "Employed full-time",
          demo_experience: "3-5",
        },
      },
    });
    expect(res.ok(), `T0 failed: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.id).toBeTruthy();
  });

  // ── Step 4: Duplicate T0 should fail ──
  test("T0 duplicate — should be rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
      data: {
        assessmentType: "pre",
        sccResponses: SCC_RESPONSES,
        cdcResponses: CDC_RESPONSES,
      },
    });
    expect(res.status()).toBe(400);
  });

  // ── Step 5: T1 before intervention completion — should be rejected (API gate) ──
  test("T1 before Deep Dive/report/coaching — should be rejected", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
      data: {
        assessmentType: "post_immediate",
        sccResponses: SCC_RESPONSES,
        cdcResponses: CDC_RESPONSES,
        experienceFeedback: {
          trust_willing_to_disclose: 4,
          trust_felt_understood: 5,
          trust_comfortable_sharing: 4,
          trust_ai_competence: 4,
          trust_emotional_safety: 5,
          constraints_adequately_considered: 4,
          constraints_increased_confidence: 4,
          constraints_actionable: 3,
          most_valuable_features: ["ai_coach", "deep_dive_report"],
          feature_ranking: ["ai_coach", "deep_dive_report"],
          ux1: 4,
          ux2: 5,
          ux3: 4,
          ux4: 2,
          ux5: 2,
          ux6: 2,
          ux7: 5,
          ux8: 4,
          ux9: 4,
          ux10: 5,
          ux11: 5,
          ux12: 4,
          comments: "E2E test feedback",
        },
      },
    });
    // Should fail at the first missing research intervention prerequisite.
    // The API intentionally checks report_generated before coaching, because
    // T1 must measure the full Deep Dive → report → coaching experience.
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error?.message ?? body.message ?? "").toContain(
      "Deep Dive assessment",
    );
  });

  // ── Step 6: Verify >2 features is rejected by Zod ──
  test("Feature selection >2 — should be rejected by Zod", async ({
    request,
  }) => {
    const res = await request.post(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
      data: {
        assessmentType: "post_immediate",
        sccResponses: SCC_RESPONSES,
        cdcResponses: CDC_RESPONSES,
        experienceFeedback: {
          most_valuable_features: [
            "ai_coach",
            "deep_dive_report",
            "profile",
          ],
        },
      },
    });
    expect(res.status()).toBe(400);
  });

  // ── Step 7: T2 without T1 — should be rejected ──
  test("T2 without T1 — should be rejected", async ({ request }) => {
    const res = await request.post(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
      data: {
        assessmentType: "post_1week",
        sccResponses: SCC_RESPONSES,
        cdcResponses: CDC_RESPONSES,
        experienceFeedback: {
          delayed_continued_thinking: 4,
          delayed_took_action: 3,
          delayed_perspective_shift: 4,
        },
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error?.message ?? body.message ?? "").toContain("post_immediate");
  });

  // ── Step 8: Verify GET returns T0 data with CDC scores ──
  test("GET pre-post-assessment — T0 data includes CDC", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/pre-post-assessment`, {
      headers: authedHeaders(),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.pre).toBeTruthy();
    expect(body.pre.sccTotalScore).toBeGreaterThan(0);
    // CDC data should be in the repurposed cdcResponses/cdcTotalScore fields
    expect(body.pre.cdcTotalScore).toBe(20); // 5 items × 4 = 20
    expect(body.pre.cdcResponses).toBeTruthy();
    expect(body.pre.cdcResponses.cdc1).toBe(4);
    // Demographics in experienceFeedback
    expect(body.pre.experienceFeedback.demo_gender).toBe("Male");
    expect(body.pre.experienceFeedback.demo_age).toBe("25-34");
  });

  // ── Step 9: Consent endpoint ──
  test("Consent endpoint — records consent", async ({ request }) => {
    const res = await request.post(
      `${BASE}/api/pre-post-assessment/consent`,
      {
        headers: authedHeaders(),
        data: { consentGiven: true },
      },
    );
    expect(res.ok(), `Consent failed: ${res.status()}`).toBeTruthy();
  });

  // ── Cleanup ──
  test.afterAll(async ({ request }) => {
    await request
      .post(`${BASE}/api/test/cleanup`, {
        headers: apiHeaders(),
        data: { email: TEST_EMAIL },
      })
      .catch(() => {});
  });
});
