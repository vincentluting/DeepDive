// ============================================================
// Schwartz Conflict Pairs — canonical pair-to-value mapping
//
// Pair ids are UI-friendly historical ids. Do not split them by "_":
// `autonomy_conformity` maps to the real Schwartz key `self-direction`.
// ============================================================

import type {
  SchwartzConflictPair,
  SchwartzValue,
} from "@/lib/types/dimensions";

export const SCHWARTZ_CONFLICT_PAIR_VALUES: Record<
  SchwartzConflictPair,
  readonly [SchwartzValue, SchwartzValue]
> = {
  achievement_benevolence: ["achievement", "benevolence"],
  power_universalism: ["power", "universalism"],
  autonomy_conformity: ["self-direction", "conformity"],
  stimulation_security: ["stimulation", "security"],
};

export function getSchwartzConflictValues(
  pair: SchwartzConflictPair | null | undefined,
): readonly [SchwartzValue, SchwartzValue] | null {
  return pair ? (SCHWARTZ_CONFLICT_PAIR_VALUES[pair] ?? null) : null;
}
