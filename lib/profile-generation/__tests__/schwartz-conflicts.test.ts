import { describe, expect, it } from "vitest";
import {
  SCHWARTZ_CONFLICT_PAIR_VALUES,
  getSchwartzConflictValues,
} from "../schwartz-conflicts";

describe("Schwartz conflict pair mapping", () => {
  it("maps autonomy_conformity to the real self-direction value key", () => {
    expect(getSchwartzConflictValues("autonomy_conformity")).toEqual([
      "self-direction",
      "conformity",
    ]);
  });

  it("keeps all pair ids mapped to valid concrete value keys", () => {
    expect(SCHWARTZ_CONFLICT_PAIR_VALUES).toEqual({
      achievement_benevolence: ["achievement", "benevolence"],
      power_universalism: ["power", "universalism"],
      autonomy_conformity: ["self-direction", "conformity"],
      stimulation_security: ["stimulation", "security"],
    });
  });
});
