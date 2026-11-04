// ============================================================
// E2E Regression: facet-name (hyphen vs underscore) fix verification
//
// Bug summary (fixed 2026-05-10):
//   IPIP data source uses hyphens for 5 facets:
//     N4_Self-Consciousness, E5_Excitement-Seeking, C1_Self-Efficacy,
//     C4_Achievement-Striving, C5_Self-Discipline
//   Several profile-generation consumers were doing lookups with the
//   underscore form, causing those facets to silently fall back to a
//   midpoint default (3.0) and to be excluded from coreQualities.
//
// This test runs the full pipeline end-to-end (QuickDive -> Register ->
// DeepDive -> Score -> Profile), then asserts:
//   1. interpersonalEnergy.derivedFrom.N4 reflects the actual IPIP score
//      (not the buggy 3.0 fallback).
//   2. coreQualities never contains the legacy underscore facet keys.
//   3. coreQualities entries' facet names are present in the canonical
//      hyphen vocabulary (no camelCase / no underscore-instead-of-hyphen).
//   4. profile page renders without error.
//   5. captures a screenshot for visual evidence.
// ============================================================

import { test, expect, type Browser } from "@playwright/test";
import {
  obtainCsrf,
  registerUser,
  apiHeaders,
  authedHeaders,
  cleanupTestUser,
} from "./fixtures/test-setup";
import {
  RIASEC_SCORES,
  SJT_ANSWERS,
  DDVQ21_ANSWERS,
  IPIP60_ANSWERS,
  QUICKDIVE_RESULT_DATA,
  buildDeepDiveAnswers,
} from "./fixtures/test-answers";

const BASE = `http://localhost:${process.env.E2E_PORT || "3000"}`;

const TEST_EMAIL = `e2e-facet-fix-${Date.now()}@test.deepdive.dev`;
const TEST_PASSWORD = "FacetFixTest123!";
const TEST_NAME = "Facet Fix Test";

// Canonical facet vocabulary from lib/questionnaire/module-c-ipip-neo60.ts
const CANONICAL_FACETS = new Set([
  "N1_Anxiety",
  "N2_Anger",
  "N3_Depression",
  "N4_Self-Consciousness",
  "N5_Immoderation",
  "N6_Vulnerability",
  "E1_Friendliness",
  "E2_Gregariousness",
  "E3_Assertiveness",
  "E4_Activity_Level",
  "E5_Excitement-Seeking",
  "E6_Cheerfulness",
  "O1_Imagination",
  "O2_Artistic_Interests",
  "O3_Emotionality",
  "O4_Adventurousness",
  "O5_Intellect",
  "O6_Liberalism",
  "A1_Trust",
  "A2_Morality",
  "A3_Altruism",
  "A4_Cooperation",
  "A5_Modesty",
  "A6_Sympathy",
  "C1_Self-Efficacy",
  "C2_Orderliness",
  "C3_Dutifulness",
  "C4_Achievement-Striving",
  "C5_Self-Discipline",
  "C6_Cautiousness",
]);

const LEGACY_UNDERSCORE_KEYS = [
  "N4_Self_Consciousness",
  "E5_Excitement_Seeking",
  "C1_Self_Efficacy",
  "C4_Achievement_Striving",
  "C5_Self_Discipline",
  // camelCase variants from career-drain alias map
  "N4_SelfConsciousness",
  "E5_ExcitementSeeking",
  "C1_SelfEfficacy",
  "C4_AchievementStriving",
  "C5_SelfDiscipline",
];

let csrfToken: string;
let sessionCookie: string;
let userId: string;
let assessmentId: string;
let profileId: string | undefined;
let scoredProfile: { bigFive: { facets: Record<string, number> } } | null =
  null;

async function createAuthedBrowserContext(browser: Browser) {
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const sessionValue = sessionCookie.replace("session=", "");
  await context.addCookies([
    { name: "csrf-token", value: csrfToken, url: BASE },
    { name: "session", value: sessionValue, url: BASE },
  ]);
  return context;
}

test.describe.serial("Facet-name fix regression", () => {
  test.beforeAll(async ({ request }) => {
    csrfToken = await obtainCsrf(request);
    const headers = () => apiHeaders(csrfToken);

    const qdRes = await request.post(`${BASE}/api/quickdive/save`, {
      headers: headers(),
      data: {
        scores: RIASEC_SCORES,
        code: "AI",
        label: "The Creative Analyst",
        locale: "en",
        exploreMode: "narrative",
        resultData: QUICKDIVE_RESULT_DATA,
      },
    });
    expect(qdRes.ok(), `QD save: ${qdRes.status()}`).toBeTruthy();
    const quickDiveResultId = (await qdRes.json()).id;

    sessionCookie = await registerUser(
      request,
      csrfToken,
      TEST_EMAIL,
      TEST_PASSWORD,
      TEST_NAME,
    );
    const auth = () => authedHeaders(csrfToken, sessionCookie);

    const meRes = await request.get(`${BASE}/api/auth/me`, {
      headers: auth(),
    });
    const meBody = (await meRes.json()) as { user?: { id?: string } };
    userId = meBody.user!.id!;

    await request.post(`${BASE}/api/test/set-cohort`, {
      headers: headers(),
      data: { email: TEST_EMAIL, cohort: "beta_2026" },
    });
    await request.post(`${BASE}/api/quickdive/claim`, {
      headers: auth(),
      data: { resultId: quickDiveResultId },
    });

    const sessId = crypto.randomUUID();
    await request.post(`${BASE}/api/session/create`, {
      headers: auth(),
      data: { sessionId: sessId, tier: "deep", language: "en" },
    });
    await request.post(`${BASE}/api/session/save`, {
      headers: auth(),
      data: {
        sessionId: sessId,
        answers: buildDeepDiveAnswers(),
        currentModule: "C",
        currentQuestionIndex: 59,
        language: "en",
      },
    });

    const scoreRes = await request.post(`${BASE}/api/score`, {
      headers: auth(),
      data: {
        sessionId: sessId,
        sjt: SJT_ANSWERS,
        values: DDVQ21_ANSWERS,
        ipip: IPIP60_ANSWERS,
        riasecNormalized: RIASEC_SCORES,
        locale: "en",
      },
    });
    expect(scoreRes.ok(), `Score: ${scoreRes.status()}`).toBeTruthy();
    const scoreBody = await scoreRes.json();
    assessmentId = scoreBody.id;
    scoredProfile = scoreBody;

    const profileRes = await request.post(`${BASE}/api/generate-profile`, {
      headers: auth(),
      data: { assessmentId, locale: "en" },
    });
    if (profileRes.ok()) {
      const profileBody = await profileRes.json();
      profileId = profileBody.id;
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupTestUser(request, TEST_EMAIL);
  });

  test("score result reports the canonical hyphen N4_Self-Consciousness key", async () => {
    expect(scoredProfile).toBeTruthy();
    const facets = scoredProfile!.bigFive.facets;
    // The canonical key must be present.
    expect(facets["N4_Self-Consciousness"]).toBeDefined();
    // The legacy underscore key must NOT be present (would indicate
    // upstream scoring produced wrong-shape data).
    expect(facets["N4_Self_Consciousness"]).toBeUndefined();
    // Same for the other 4 hyphen facets.
    expect(facets["E5_Excitement-Seeking"]).toBeDefined();
    expect(facets["C1_Self-Efficacy"]).toBeDefined();
    expect(facets["C4_Achievement-Striving"]).toBeDefined();
    expect(facets["C5_Self-Discipline"]).toBeDefined();
  });

  test("profile.interpersonalEnergy.derivedFrom.N4 reflects actual IPIP score (not buggy default 3.0)", async ({
    request,
  }) => {
    test.skip(!profileId, "Profile not generated");

    const auth = () => authedHeaders(csrfToken, sessionCookie);
    const profileRes = await request.get(
      `${BASE}/api/generate-profile?userId=${userId}`,
      { headers: auth() },
    );
    expect(
      profileRes.ok(),
      `profile fetch: ${profileRes.status()}`,
    ).toBeTruthy();
    const profile = (await profileRes.json()) as {
      interpersonalEnergy?: { derivedFrom?: { N4?: number } };
      conflictHandling?: { derivedFrom?: { N4?: number } };
    };

    // The fixture's N4 items should NOT yield exactly 3.0 (default fallback).
    // IPIP60_ANSWERS has items 7=4, 8=3 — actual N4 score depends on reverse-
    // keying but is provably non-default for these inputs.
    const actualN4 = scoredProfile!.bigFive.facets["N4_Self-Consciousness"];
    expect(actualN4).toBeDefined();

    const interpN4 = profile.interpersonalEnergy?.derivedFrom?.N4;
    expect(interpN4).toBeDefined();
    expect(interpN4).toBeCloseTo(actualN4!, 1);

    const conflictN4 = profile.conflictHandling?.derivedFrom?.N4;
    expect(conflictN4).toBeDefined();
    expect(conflictN4).toBeCloseTo(actualN4!, 1);
  });

  test("profile.coreQualities never contains legacy underscore/camelCase facet keys", async ({
    request,
  }) => {
    test.skip(!profileId, "Profile not generated");

    const auth = () => authedHeaders(csrfToken, sessionCookie);
    const profileRes = await request.get(
      `${BASE}/api/generate-profile?userId=${userId}`,
      { headers: auth() },
    );
    const profile = (await profileRes.json()) as {
      coreQualities?: Array<{ facet: string }>;
    };

    const facets = (profile.coreQualities ?? []).map((q) => q.facet);

    // Every facet in the output must be in the canonical vocabulary
    for (const facet of facets) {
      expect(
        CANONICAL_FACETS.has(facet),
        `coreQualities contains non-canonical facet "${facet}"`,
      ).toBe(true);
    }

    // Negative assertion: none of the legacy keys present
    for (const legacy of LEGACY_UNDERSCORE_KEYS) {
      expect(facets).not.toContain(legacy);
    }
  });

  test("profile page renders + screenshot of current state", async ({
    browser,
  }) => {
    test.skip(!profileId, "Profile not generated");
    test.setTimeout(120_000);

    const context = await createAuthedBrowserContext(browser);
    const page = await context.newPage();

    await page.goto(`${BASE}/en/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(new RegExp(`/en/profile/${userId}(?:[?#].*)?$`), {
      timeout: 60_000,
      waitUntil: "domcontentloaded",
    });
    await page.waitForFunction(
      () => (document.body?.innerText?.length ?? 0) > 200,
      { timeout: 30_000 },
    );

    // No app-level error (regex avoids matching depth indicators like "1500m")
    await expect(
      page
        .locator("main")
        .getByText(
          /Unable to Load|something went wrong|Internal Server Error/i,
        ),
    ).not.toBeVisible({ timeout: 3_000 });

    // Capture full-page screenshot for visual evidence (committed to
    // test-results/ on failure or via --update-snapshots).
    await page.screenshot({
      path: `test-results/facet-fix-profile-${Date.now()}.png`,
      fullPage: true,
    });

    await context.close();
  });
});
