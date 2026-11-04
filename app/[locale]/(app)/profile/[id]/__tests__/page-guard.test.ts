import { describe, it, expect, vi, beforeEach } from "vitest";

// next/navigation.redirect throws to halt rendering in Next.js. We mirror that
// behaviour with a sentinel error so the test can detect both whether redirect
// was called AND what URL it targeted.
const REDIRECT = "__REDIRECT__";
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const err = new Error(`${REDIRECT}:${url}`);
    throw err;
  }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUserWithAdmin: vi.fn(),
}));

// All downstream data fetches are irrelevant for the guard — we never reach
// them in the redirect cases. The success case still needs ProfileContent's
// queries to not blow up; mock them as harmless no-ops.
vi.mock("@/lib/auth/users", () => ({
  getUserById: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/user-context", () => ({
  getUserContextOrCompute: vi.fn().mockResolvedValue({ latestReportId: null }),
}));
vi.mock("@/lib/db/cached", () => ({
  getCachedProfile: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/conditions", () => ({
  getRealConditionsByUserId: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/platform", () => ({
  getLatestQuickDiveByUserId: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/assessments", () => ({
  getLatestSessionIdForUser: vi.fn().mockResolvedValue(null),
  getEffectiveAssessment: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/journey", () => ({
  getJourneyState: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/db/reports", () => ({
  getReportInputHash: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/db/riasec-canonical", () => ({
  getCanonicalRiasec: vi.fn(),
}));
vi.mock("@/lib/db/pipeline", () => ({
  getLatestPipelineForUser: vi.fn().mockResolvedValue(null),
  getPipelineByAssessment: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/journey/state-machine", () => ({
  hasReached: vi.fn().mockReturnValue(false),
}));
vi.mock("@/lib/report/prerequisites", () => ({
  computeInputHash: vi.fn(),
  checkReportFreshness: vi.fn(),
}));
vi.mock("@/lib/analytics/funnel", () => ({
  trackFunnelEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/profile-generation/narrative-renderability", () => ({
  hasCompleteNarratives: vi.fn(),
}));
vi.mock("@/lib/profile-generation/profile-fingerprint", () => ({
  computeNarrativeInputHash: vi.fn(),
  isProfileCurrentForAssessment: vi.fn(),
}));
vi.mock("@/components/profile-panels/profile-dashboard", () => ({
  ProfileDashboard: () => null,
}));

// Import AFTER all mocks are registered so the page module picks up the mocks.
import ProfilePage from "../page";
import { redirect } from "next/navigation";
import { getCurrentUserWithAdmin } from "@/lib/auth";

function makeParams(profileId: string, locale = "en") {
  return Promise.resolve({ id: profileId, locale });
}

async function runGuardOnly(params: Promise<{ id: string; locale: string }>) {
  // ProfilePage redirects in its top-level guard before reaching the heavy
  // <ProfileContent> Suspense child. We catch the synthetic redirect error so
  // the test can assert what URL it targeted.
  try {
    await ProfilePage({ params });
    return null;
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.startsWith(REDIRECT + ":")) {
      return msg.slice(REDIRECT.length + 1);
    }
    throw err;
  }
}

describe("profile/[id]/page guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to login when there is no session user", async () => {
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      null,
    );

    const target = await runGuardOnly(makeParams("any-id"));

    expect(target).toBe("/en/login");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("redirects a non-admin viewing someone else back to their own profile", async () => {
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-a",
      email: "a@example.com",
      name: "A",
      createdAt: new Date(),
      cohort: null,
      researchGroup: null,
      isAdmin: false,
    });

    const target = await runGuardOnly(makeParams("user-b"));

    expect(target).toBe("/en/profile/user-a");
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("does NOT redirect a non-admin viewing their own profile", async () => {
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-a",
      email: "a@example.com",
      name: "A",
      createdAt: new Date(),
      cohort: null,
      researchGroup: null,
      isAdmin: false,
    });

    const target = await runGuardOnly(makeParams("user-a"));

    // Self-view succeeds → no redirect from the guard. (ProfileContent itself
    // may still redirect internally based on pipeline state, but that's
    // outside the top-level guard's responsibility.)
    expect(target).toBeNull();
  });

  it("does NOT redirect an admin viewing another user's profile", async () => {
    (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      createdAt: new Date(),
      cohort: null,
      researchGroup: null,
      isAdmin: true,
    });

    const target = await runGuardOnly(makeParams("user-b"));

    expect(target).toBeNull();
  });

  // Guard uses `user.isAdmin === true` (strict equality). Any non-true value
  // — undefined, null, 1, "true", omitted — must NOT grant admin access.
  // Lock that edge down so a refactor never accidentally loosens it.
  it.each([
    ["isAdmin: undefined", { isAdmin: undefined }],
    ["isAdmin: null", { isAdmin: null }],
    ["isAdmin: 1", { isAdmin: 1 as unknown as boolean }],
    ['isAdmin: "true"', { isAdmin: "true" as unknown as boolean }],
    ["isAdmin omitted", {}],
  ])(
    "treats %s as non-admin and redirects when viewing another user",
    async (_label, override) => {
      (getCurrentUserWithAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-a",
        email: "a@example.com",
        name: "A",
        createdAt: new Date(),
        cohort: null,
        researchGroup: null,
        ...override,
      });

      const target = await runGuardOnly(makeParams("user-b"));

      expect(target).toBe("/en/profile/user-a");
    },
  );
});
