import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────
vi.mock("@/lib/api/api-guard", () => ({
  guardRoute: vi.fn(),
}));

vi.mock("@/lib/api/with-logging", () => ({
  withLogging: (_path: string, handler: (...args: unknown[]) => unknown) =>
    handler,
}));

const mockSql = vi.fn();
vi.mock("@/lib/db/connection", () => ({
  sql: (...args: unknown[]) => mockSql(...args),
}));

import { guardRoute } from "@/lib/api/api-guard";

// ── Helpers ──────────────────────────────────────────────────
function makeRequest(): Request {
  return new Request("http://localhost/api/session/resume", { method: "GET" });
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
describe("GET /api/session/resume", () => {
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

  it("returns null session when no in-progress session found", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.session).toBeNull();
  });

  it("returns null session when answers array is empty", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([
      {
        id: "s1",
        language: "en",
        answersJson: [],
        currentQuestionIndex: 0,
        currentModule: "sjt",
        explorationProgressJson: null,
        startedAt: new Date().toISOString(),
      },
    ]);

    const res = await handler(makeRequest());
    const json = await res.json();
    expect(json.session).toBeNull();
  });

  it("returns null session when answersJson is null", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockResolvedValue([
      {
        id: "s1",
        language: "en",
        answersJson: null,
        currentQuestionIndex: 0,
        currentModule: "sjt",
        explorationProgressJson: null,
        startedAt: new Date().toISOString(),
      },
    ]);

    const res = await handler(makeRequest());
    const json = await res.json();
    // null answers → empty array via ??, then length 0 → null session
    expect(json.session).toBeNull();
  });

  it("returns resumable session with progress (happy path)", async () => {
    allowGuard({ id: "u1" });
    const startedAt = new Date("2026-03-23T10:00:00Z");
    mockSql.mockResolvedValue([
      {
        id: "s-active",
        language: "zh",
        answersJson: [
          { questionId: 1, answer: "A" },
          { questionId: 2, answer: "B" },
        ],
        currentQuestionIndex: 2,
        currentModule: "values",
        explorationProgressJson: { completedModules: ["sjt"] },
        startedAt: startedAt.toISOString(),
      },
    ]);

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.session.id).toBe("s-active");
    expect(json.session.language).toBe("zh");
    expect(json.session.answerCount).toBe(2);
    expect(json.session.currentQuestionIndex).toBe(2);
    expect(json.session.currentModule).toBe("values");
    expect(json.session.startedAt).toBe(startedAt.getTime());
  });

  it("returns null session on DB error (graceful fallback)", async () => {
    allowGuard({ id: "u1" });
    mockSql.mockRejectedValue(new Error("DB connection lost"));

    const res = await handler(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.session).toBeNull();
  });
});
