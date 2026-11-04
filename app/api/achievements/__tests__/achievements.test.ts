import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

vi.mock("@/lib/api/api-errors", () => ({
  ApiErrorCode: {
    INTERNAL_ERROR: "INTERNAL_ERROR",
  },
  createErrorResponse: vi.fn(
    (code: string, msg: string, status: number) =>
      new Response(JSON.stringify({ error: code, message: msg }), { status }),
  ),
  logApiError: vi.fn(),
}));

vi.mock("@/lib/db/achievements", () => ({
  getUserAchievements: vi.fn(),
}));

vi.mock("@/lib/achievements/registry", () => ({
  ACHIEVEMENT_REGISTRY: [
    {
      key: "first_dive",
      nameEn: "First Dive",
      nameZh: "初次潜水",
      descriptionEn: "Complete your first assessment",
      descriptionZh: "完成第一次评测",
      rarity: "common",
      hidden: false,
    },
    {
      key: "secret_explorer",
      nameEn: "Secret Explorer",
      nameZh: "秘密探索者",
      descriptionEn: "Discover a hidden feature",
      descriptionZh: "发现隐藏功能",
      rarity: "rare",
      hidden: true,
    },
  ],
}));

vi.mock("@/lib/i18n/get-dictionary", () => ({
  getDictionary: vi.fn().mockResolvedValue({
    dashboardPage: { achievementHidden: "Hidden achievement" },
  }),
}));

import { guardRoute } from "@/lib/api/api-guard";
import { getUserAchievements } from "@/lib/db/achievements";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(locale = "en"): Request {
  return new Request("http://localhost/api/achievements", {
    method: "GET",
    headers: { "x-locale": locale },
  });
}

function allowGuard(user: { id: string } = { id: "u1" }) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: false,
    user,
  });
}

function blockGuard(status = 401) {
  (guardRoute as ReturnType<typeof vi.fn>).mockResolvedValue({
    blocked: true,
    response: new Response("Unauthorized", { status }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────
describe("GET /api/achievements", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(async () => {
    const mod = await import("../route");
    handler = mod.GET as unknown as (req: Request) => Promise<Response>;
  });

  it("returns 401 when guard blocks", async () => {
    blockGuard();
    const res = await handler(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns achievements and registry (happy path, en)", async () => {
    allowGuard({ id: "u1" });
    (getUserAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        achievementKey: "first_dive",
        unlockedAt: "2026-03-20T10:00:00Z",
      },
    ]);

    const res = await handler(makeRequest("en"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.total).toBe(2);
    expect(json.unlocked).toBe(1);
    expect(json.achievements).toHaveLength(1);

    // Registry should show full details for unlocked, hide for locked hidden
    const firstDive = json.registry.find(
      (r: { key: string }) => r.key === "first_dive",
    );
    expect(firstDive.name).toBe("First Dive");
    expect(firstDive.unlocked).toBe(true);

    const secret = json.registry.find(
      (r: { key: string }) => r.key === "secret_explorer",
    );
    expect(secret.name).toBe("???");
    expect(secret.description).toBe("Hidden achievement");
    expect(secret.unlocked).toBe(false);
  });

  it("shows hidden achievement details when unlocked", async () => {
    allowGuard({ id: "u1" });
    (getUserAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([
      { achievementKey: "first_dive", unlockedAt: "2026-03-20" },
      { achievementKey: "secret_explorer", unlockedAt: "2026-03-21" },
    ]);

    const res = await handler(makeRequest("en"));
    const json = await res.json();

    const secret = json.registry.find(
      (r: { key: string }) => r.key === "secret_explorer",
    );
    expect(secret.name).toBe("Secret Explorer");
    expect(secret.unlocked).toBe(true);
  });

  it("uses Chinese names when locale is zh", async () => {
    allowGuard({ id: "u1" });
    (getUserAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([
      { achievementKey: "first_dive", unlockedAt: "2026-03-20" },
    ]);

    const res = await handler(makeRequest("zh"));
    const json = await res.json();

    const firstDive = json.registry.find(
      (r: { key: string }) => r.key === "first_dive",
    );
    expect(firstDive.name).toBe("初次潜水");
    expect(firstDive.description).toBe("完成第一次评测");
  });

  it("returns empty achievements for new user", async () => {
    allowGuard({ id: "u1" });
    (getUserAchievements as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await handler(makeRequest());
    const json = await res.json();

    expect(json.unlocked).toBe(0);
    expect(json.total).toBe(2);
    expect(json.achievements).toEqual([]);
  });

  it("returns 500 on DB error", async () => {
    allowGuard({ id: "u1" });
    (getUserAchievements as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB down"),
    );

    const res = await handler(makeRequest());
    expect(res.status).toBe(500);
  });
});
