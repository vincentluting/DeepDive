import { describe, expect, it } from "vitest";
import { SCHWARTZ_VALUE_LABELS } from "@/lib/scoring/constants";
import { getSchwartzConflictValues } from "@/lib/profile-generation/schwartz-conflicts";

describe("profile panel Schwartz conflict labels", () => {
  it("Value Anchors and Inner Tensions can label autonomy_conformity", () => {
    const values = getSchwartzConflictValues("autonomy_conformity");
    expect(values).toEqual(["self-direction", "conformity"]);

    const [firstValue, secondValue] = values!;
    expect(SCHWARTZ_VALUE_LABELS[firstValue].en).toBe("Self-Direction");
    expect(SCHWARTZ_VALUE_LABELS[secondValue].en).toBe("Conformity");
    expect(SCHWARTZ_VALUE_LABELS[firstValue].zh).toBe("自我导向与独立");
    expect(SCHWARTZ_VALUE_LABELS[secondValue].zh).toBe("规范与合规");
  });
});
