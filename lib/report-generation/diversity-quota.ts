// ============================================================
// Diversity Quota — candidate selection helpers
//
// Caps how many careers from the same "family" can occupy the
// final recommendation slots. Without a cap, near-identical
// profiles (e.g. every E/I-dominant business role) crowd out all
// 3+2 slots for users whose scores converge — the "every MBA
// gets AI Product Manager" problem.
//
// Family key = unordered RIASEC top-2 pair of the career's ideal
// profile. Unordered matters: "AI Product Manager" variants exist
// in the library as both I-E and E-I dominant; an ordered key
// would split them into different groups and defeat the cap.
// ============================================================

import type { RIASECDimension } from "../types";

/** Max careers sharing one RIASEC pair group across the recommendation slots. */
export const MAX_PER_RIASEC_GROUP = 2;

const CANONICAL_ORDER: RIASECDimension[] = ["R", "I", "A", "S", "E", "C"];

/**
 * Unordered RIASEC top-2 pair key, e.g. {E:85, I:70, ...} → "IE".
 * Ties resolved by canonical R,I,A,S,E,C order so the key is deterministic.
 * The two winning dimensions are joined in canonical order, making
 * {E-dominant, I-secondary} and {I-dominant, E-secondary} the same group.
 */
export function riasecPairKey(ideal: Record<RIASECDimension, number>): string {
  const top2 = [...CANONICAL_ORDER]
    .sort(
      (a, b) =>
        (ideal[b] ?? 0) - (ideal[a] ?? 0) ||
        CANONICAL_ORDER.indexOf(a) - CANONICAL_ORDER.indexOf(b),
    )
    .slice(0, 2);
  return CANONICAL_ORDER.filter((d) => top2.includes(d)).join("");
}

export interface QuotaSelectOptions<T> {
  /** How many items to select. */
  count: number;
  /** Group key per item (e.g. riasecPairKey of the career's ideal profile). */
  keyOf: (item: T) => string;
  /** Stable identity per item, used for dedupe across passes and excludeIds. */
  idOf: (item: T) => string;
  /** Max items per group during the quota pass. */
  maxPerGroup: number;
  /**
   * Group counter, mutated in place. Pass the SAME Map across calls whose
   * slots share one quota budget (primary + exploratory); pass a fresh Map
   * for independently displayed sections (AI-era).
   */
  groupCounts: Map<string, number>;
  /** Item ids that must never be selected (e.g. already chosen as primary). */
  excludeIds?: ReadonlySet<string>;
}

/**
 * Select `count` items by walking the ordered candidate pools in priority
 * order (pass 1: respecting maxPerGroup). If the quota leaves fewer than
 * `count` selected, a second walk ignores the quota and back-fills — the
 * 3+2 slot contract always wins over diversity. With maxPerGroup=Infinity
 * this degrades to exactly the previous first-N-by-rank behavior.
 */
export function selectWithQuota<T>(
  passes: readonly (readonly T[])[],
  opts: QuotaSelectOptions<T>,
): T[] {
  const { count, keyOf, idOf, maxPerGroup, groupCounts, excludeIds } = opts;
  const selected: T[] = [];
  const selectedIds = new Set<string>();

  const walk = (enforceQuota: boolean) => {
    for (const pool of passes) {
      for (const item of pool) {
        if (selected.length >= count) return;
        const id = idOf(item);
        if (selectedIds.has(id) || excludeIds?.has(id)) continue;
        const key = keyOf(item);
        if (enforceQuota && (groupCounts.get(key) ?? 0) >= maxPerGroup) {
          continue;
        }
        selected.push(item);
        selectedIds.add(id);
        groupCounts.set(key, (groupCounts.get(key) ?? 0) + 1);
      }
    }
  };

  walk(true);
  if (selected.length < count) walk(false);
  return selected;
}
