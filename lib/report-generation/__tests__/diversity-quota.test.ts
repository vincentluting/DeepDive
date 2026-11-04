// ============================================================
// Tests: diversity-quota — riasecPairKey + selectWithQuota
// ============================================================

import { describe, it, expect } from "vitest";
import {
  MAX_PER_RIASEC_GROUP,
  riasecPairKey,
  selectWithQuota,
} from "../diversity-quota";
import type { RIASECDimension } from "@/lib/types";

const vec = (
  partial: Partial<Record<RIASECDimension, number>>,
): Record<RIASECDimension, number> => ({
  R: 0,
  I: 0,
  A: 0,
  S: 0,
  E: 0,
  C: 0,
  ...partial,
});

describe("riasecPairKey", () => {
  it("returns the top-2 dimensions in canonical order", () => {
    expect(riasecPairKey(vec({ E: 85, I: 70, S: 40 }))).toBe("IE");
    expect(riasecPairKey(vec({ R: 90, C: 80 }))).toBe("RC");
  });

  it("is unordered: dominant/secondary swap yields the same key", () => {
    const eDominant = riasecPairKey(vec({ E: 85, I: 70 }));
    const iDominant = riasecPairKey(vec({ I: 85, E: 70 }));
    expect(eDominant).toBe(iDominant);
    expect(eDominant).toBe("IE");
  });

  it("breaks ties deterministically by canonical R,I,A,S,E,C order", () => {
    // All equal → first two canonical dims win
    expect(
      riasecPairKey(vec({ R: 50, I: 50, A: 50, S: 50, E: 50, C: 50 })),
    ).toBe("RI");
    // Tie for second place between A and S → A wins (canonical order)
    expect(riasecPairKey(vec({ E: 90, A: 60, S: 60 }))).toBe("AE");
  });
});

interface Item {
  id: string;
  group: string;
}

const opts = (
  count: number,
  groupCounts: Map<string, number>,
  extra: Partial<Parameters<typeof selectWithQuota<Item>>[1]> = {},
) => ({
  count,
  keyOf: (x: Item) => x.group,
  idOf: (x: Item) => x.id,
  maxPerGroup: MAX_PER_RIASEC_GROUP,
  groupCounts,
  ...extra,
});

describe("selectWithQuota", () => {
  it("skips the third same-group item and takes the next different group", () => {
    const pool: Item[] = [
      { id: "a1", group: "IE" },
      { id: "a2", group: "IE" },
      { id: "a3", group: "IE" },
      { id: "b1", group: "RC" },
    ];
    const picked = selectWithQuota([pool], opts(3, new Map()));
    expect(picked.map((x) => x.id)).toEqual(["a1", "a2", "b1"]);
  });

  it("back-fills past the quota when the pool cannot satisfy count otherwise", () => {
    const pool: Item[] = [
      { id: "a1", group: "IE" },
      { id: "a2", group: "IE" },
      { id: "a3", group: "IE" },
      { id: "a4", group: "IE" },
    ];
    const picked = selectWithQuota([pool], opts(3, new Map()));
    // Slot contract wins over diversity: 3 items even though all share a group
    expect(picked.map((x) => x.id)).toEqual(["a1", "a2", "a3"]);
  });

  it("respects excludeIds across both quota and back-fill passes", () => {
    const pool: Item[] = [
      { id: "a1", group: "IE" },
      { id: "a2", group: "IE" },
      { id: "a3", group: "IE" },
    ];
    const picked = selectWithQuota(
      [pool],
      opts(3, new Map(), { excludeIds: new Set(["a2"]) }),
    );
    expect(picked.map((x) => x.id)).toEqual(["a1", "a3"]);
  });

  it("shares the group budget across calls via the same groupCounts map", () => {
    const groupCounts = new Map<string, number>();
    const first = selectWithQuota(
      [
        [
          { id: "a1", group: "IE" },
          { id: "a2", group: "IE" },
          { id: "b1", group: "RC" },
        ],
      ],
      opts(3, groupCounts),
    );
    expect(first.map((x) => x.id)).toEqual(["a1", "a2", "b1"]);

    const second = selectWithQuota(
      [
        [
          { id: "a3", group: "IE" },
          { id: "c1", group: "AS" },
          { id: "c2", group: "AS" },
        ],
      ],
      opts(2, groupCounts),
    );
    // "IE" already exhausted by the first call → a3 skipped in quota pass
    expect(second.map((x) => x.id)).toEqual(["c1", "c2"]);
  });

  it("walks pools in priority order and dedupes items present in both", () => {
    const priority: Item[] = [{ id: "p1", group: "IE" }];
    const fallback: Item[] = [
      { id: "p1", group: "IE" },
      { id: "f1", group: "RC" },
      { id: "f2", group: "AS" },
    ];
    const picked = selectWithQuota([priority, fallback], opts(3, new Map()));
    expect(picked.map((x) => x.id)).toEqual(["p1", "f1", "f2"]);
  });

  it("returns fewer than count only when the pools are truly exhausted", () => {
    const picked = selectWithQuota(
      [[{ id: "a1", group: "IE" }]],
      opts(3, new Map()),
    );
    expect(picked.map((x) => x.id)).toEqual(["a1"]);
    expect(selectWithQuota([[]], opts(2, new Map()))).toEqual([]);
  });

  it("degrades to first-N-by-rank with an infinite quota", () => {
    const pool: Item[] = [
      { id: "a1", group: "IE" },
      { id: "a2", group: "IE" },
      { id: "a3", group: "IE" },
      { id: "b1", group: "RC" },
    ];
    const picked = selectWithQuota(
      [pool],
      opts(3, new Map(), { maxPerGroup: Number.POSITIVE_INFINITY }),
    );
    expect(picked.map((x) => x.id)).toEqual(["a1", "a2", "a3"]);
  });
});
