import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ───────────────────────────────────────────────────

const { sqlMock } = vi.hoisted(() => ({
  sqlMock: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/db/connection", () => ({
  sql: new Proxy(sqlMock, {
    apply(target, _thisArg, args) {
      return target(...args);
    },
  }),
}));

import {
  acceptConnectionRequest,
  areFriends,
  createConnectionRequest,
  declineConnectionRequest,
  deleteConnection,
  getConnectionBuckets,
  isBlockedEitherWay,
  markReportReviewed,
} from "../companions";

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockResolvedValue([]);
});

// ── Tests ───────────────────────────────────────────────────

describe("createConnectionRequest()", () => {
  const requesterId = "user-A";
  const recipientId = "user-B";

  it("rejects self-requests without touching the DB", async () => {
    const result = await createConnectionRequest({
      requesterId: "u1",
      recipientId: "u1",
    });
    expect(result).toEqual({ ok: false, reason: "self" });
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("rejects when either side has blocked the other", async () => {
    // Pre-flight conflict probe is a UNION ALL of block + reverse-pair
    // checks. A blocked relationship surfaces with kind='blocked'.
    sqlMock.mockResolvedValueOnce([{ kind: "blocked" }]);

    const result = await createConnectionRequest({
      requesterId,
      recipientId,
    });

    expect(result).toEqual({ ok: false, reason: "blocked" });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("rejects bidirectionally — already-pending reverse pair returns 'duplicate'", async () => {
    // The same UNION ALL probe also catches B → A when A is now requesting B.
    sqlMock.mockResolvedValueOnce([{ kind: "duplicate" }]);

    const result = await createConnectionRequest({
      requesterId,
      recipientId,
    });

    expect(result).toEqual({ ok: false, reason: "duplicate" });
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("returns 'duplicate' when the same-direction unique constraint trips on INSERT race", async () => {
    sqlMock
      .mockResolvedValueOnce([]) // no conflict in pre-probe
      .mockRejectedValueOnce(
        new Error(
          'duplicate key value violates unique constraint "companion_connection_unique_pair"',
        ),
      );

    const result = await createConnectionRequest({
      requesterId,
      recipientId,
    });

    expect(result).toEqual({ ok: false, reason: "duplicate" });
  });

  it("returns the new connection on success", async () => {
    const fakeRow = {
      id: "conn-1",
      requesterId,
      recipientId,
      status: "pending",
      requesterMessage: "hi",
      acceptedAt: null,
      declinedAt: null,
      createdAt: "2026-05-03T00:00:00Z",
    };
    sqlMock
      .mockResolvedValueOnce([]) // no conflict in pre-probe
      .mockResolvedValueOnce([fakeRow]); // INSERT returning row

    const result = await createConnectionRequest({
      requesterId,
      recipientId,
      requesterMessage: "hi",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.connection.id).toBe("conn-1");
      expect(result.connection.status).toBe("pending");
      expect(result.connection.requesterMessage).toBe("hi");
    }
  });

  it("propagates non-unique-constraint errors", async () => {
    sqlMock
      .mockResolvedValueOnce([]) // no conflict in pre-probe
      .mockRejectedValueOnce(new Error("connection lost"));

    await expect(
      createConnectionRequest({ requesterId, recipientId }),
    ).rejects.toThrow("connection lost");
  });
});

describe("acceptConnectionRequest() — race protection", () => {
  it("returns false when the row is no longer in 'pending' (race lost)", async () => {
    // UPDATE ... WHERE status='pending' RETURNING id → 0 rows means another
    // accept got there first, or the row was declined/deleted in the meantime.
    sqlMock.mockResolvedValueOnce([]);

    const result = await acceptConnectionRequest("conn-1", "user-B");
    expect(result).toBe(false);
  });

  it("returns true when the transition succeeded", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "conn-1" }]);

    const result = await acceptConnectionRequest("conn-1", "user-B");
    expect(result).toBe(true);
  });
});

describe("declineConnectionRequest()", () => {
  it("only transitions rows still in 'pending'", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "conn-1" }]);
    expect(await declineConnectionRequest("conn-1", "user-B")).toBe(true);

    sqlMock.mockResolvedValueOnce([]);
    expect(await declineConnectionRequest("conn-1", "user-B")).toBe(false);
  });
});

describe("deleteConnection()", () => {
  it("returns false when caller is neither requester nor recipient", async () => {
    sqlMock.mockResolvedValueOnce([]); // WHERE clause filters out the row

    const result = await deleteConnection("conn-1", "stranger");
    expect(result).toBe(false);
  });

  it("returns true when the caller owns the connection", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "conn-1" }]);

    const result = await deleteConnection("conn-1", "user-A");
    expect(result).toBe(true);
  });
});

describe("getConnectionBuckets()", () => {
  it("buckets rows by direction and excludes declined ones from UI surfaces", async () => {
    const ts = "2026-05-03T00:00:00Z";
    sqlMock.mockResolvedValueOnce([
      // Incoming pending — recipient is the viewer
      {
        id: "in-1",
        requesterId: "other-1",
        recipientId: "viewer",
        status: "pending",
        requesterMessage: null,
        acceptedAt: null,
        declinedAt: null,
        createdAt: ts,
      },
      // Outgoing pending — requester is the viewer
      {
        id: "out-1",
        requesterId: "viewer",
        recipientId: "other-2",
        status: "pending",
        requesterMessage: "hey",
        acceptedAt: null,
        declinedAt: null,
        createdAt: ts,
      },
      // Accepted (either direction)
      {
        id: "acc-1",
        requesterId: "viewer",
        recipientId: "other-3",
        status: "accepted",
        requesterMessage: null,
        acceptedAt: ts,
        declinedAt: null,
        createdAt: ts,
      },
      // Declined — must be omitted from the buckets
      {
        id: "dec-1",
        requesterId: "viewer",
        recipientId: "other-4",
        status: "declined",
        requesterMessage: null,
        acceptedAt: null,
        declinedAt: ts,
        createdAt: ts,
      },
    ]);

    const buckets = await getConnectionBuckets("viewer");

    expect(buckets.incomingPending.map((c) => c.id)).toEqual(["in-1"]);
    expect(buckets.outgoingPending.map((c) => c.id)).toEqual(["out-1"]);
    expect(buckets.accepted.map((c) => c.id)).toEqual(["acc-1"]);
    // Sanity: declined rows are not surfaced on any tab in v1
    const all = [
      ...buckets.incomingPending,
      ...buckets.outgoingPending,
      ...buckets.accepted,
    ];
    expect(all.map((c) => c.id)).not.toContain("dec-1");
  });
});

describe("areFriends() / isBlockedEitherWay()", () => {
  it("areFriends returns true on a hit", async () => {
    sqlMock.mockResolvedValueOnce([{ "?column?": 1 }]);
    expect(await areFriends("a", "b")).toBe(true);
  });

  it("areFriends returns false on no hit", async () => {
    sqlMock.mockResolvedValueOnce([]);
    expect(await areFriends("a", "b")).toBe(false);
  });

  it("isBlockedEitherWay treats the two directions symmetrically", async () => {
    sqlMock.mockResolvedValueOnce([{ "?column?": 1 }]);
    expect(await isBlockedEitherWay("a", "b")).toBe(true);

    sqlMock.mockResolvedValueOnce([]);
    expect(await isBlockedEitherWay("a", "b")).toBe(false);
  });
});

describe("markReportReviewed() — admin queue gate", () => {
  it("only transitions reports still in 'open'", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "r-1" }]);
    expect(
      await markReportReviewed({
        reportId: "r-1",
        reviewerId: "admin",
        status: "reviewed",
      }),
    ).toBe(true);

    sqlMock.mockResolvedValueOnce([]);
    expect(
      await markReportReviewed({
        reportId: "r-1",
        reviewerId: "admin",
        status: "dismissed",
      }),
    ).toBe(false);
  });
});
