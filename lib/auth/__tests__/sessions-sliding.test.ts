import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock next/headers so cookies().set() doesn't throw outside a request ctx.
const cookieStore = {
  set: vi.fn(),
  delete: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

// Mock the DB connection. We capture the template-string calls so we can
// assert that getSession issues exactly one atomic UPDATE ... RETURNING
// per invocation (no SELECT + UPDATE split, no extra refresh writes).
type SqlCall = { strings: readonly string[]; values: readonly unknown[] };
const sqlCalls: SqlCall[] = [];
const sqlMock = vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
  sqlCalls.push({ strings: [...strings], values });
  const joined = strings.join("?");
  // UPDATE...RETURNING path in getSession
  if (joined.includes("UPDATE") && joined.includes("RETURNING")) {
    const cached = (sqlMock as unknown as { __row?: unknown }).__row;
    return Promise.resolve(cached ? [cached] : []);
  }
  return Promise.resolve([]);
});
vi.mock("@/lib/db/connection", () => ({ sql: sqlMock }));

describe("getSession — atomic sliding refresh", () => {
  beforeEach(async () => {
    sqlCalls.length = 0;
    cookieStore.set.mockClear();
    cookieStore.delete.mockClear();
    (sqlMock as unknown as { __row?: unknown }).__row = undefined;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("issues exactly one atomic UPDATE...RETURNING (no SELECT+UPDATE split)", async () => {
    (sqlMock as unknown as { __row?: unknown }).__row = {
      id: "sess-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
    };
    const { getSession } = await import("../sessions");
    const session = await getSession("sess-1");

    expect(session).not.toBeNull();
    const updateCalls = sqlCalls.filter((c) =>
      c.strings.join("").includes("UPDATE"),
    );
    const selectCalls = sqlCalls.filter(
      (c) =>
        c.strings.join("").includes("SELECT") &&
        !c.strings.join("").includes("UPDATE"),
    );
    expect(updateCalls).toHaveLength(1);
    expect(selectCalls).toHaveLength(0);
    expect(updateCalls[0].strings.join("")).toMatch(/RETURNING/);
  });

  it("returns null when no live session exists (UPDATE matches zero rows)", async () => {
    (sqlMock as unknown as { __row?: unknown }).__row = undefined;
    const { getSession } = await import("../sessions");
    const session = await getSession("missing-id");
    expect(session).toBeNull();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("refreshes browser cookie on every successful getSession", async () => {
    (sqlMock as unknown as { __row?: unknown }).__row = {
      id: "sess-2",
      userId: "user-2",
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    };
    const { getSession } = await import("../sessions");
    await getSession("sess-2");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "session",
      "sess-2",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      }),
    );
  });

  it("swallows RSC read-only cookie throw without failing auth", async () => {
    (sqlMock as unknown as { __row?: unknown }).__row = {
      id: "sess-3",
      userId: "user-3",
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    };
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error(
        "Cookies can only be modified in a Server Action or Route Handler",
      );
    });
    const { getSession } = await import("../sessions");
    const session = await getSession("sess-3");
    expect(session).not.toBeNull();
    expect(session?.id).toBe("sess-3");
  });

  it("passes sliding threshold (gap > 1 day) as interval to the SQL CASE", async () => {
    (sqlMock as unknown as { __row?: unknown }).__row = {
      id: "sess-4",
      userId: "user-4",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    const { getSession } = await import("../sessions");
    await getSession("sess-4");

    const updateCall = sqlCalls.find((c) =>
      c.strings.join("").includes("UPDATE"),
    );
    expect(updateCall).toBeDefined();
    const gapMs = updateCall!.values.find((v) => v === 24 * 60 * 60 * 1000);
    expect(gapMs).toBe(24 * 60 * 60 * 1000);
  });
});
