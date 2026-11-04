import { beforeEach, describe, expect, it, vi } from "vitest";

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
  confirmCoachingHypothesis,
  createCoachingHypothesis,
  rejectCoachingHypothesis,
} from "../coaching-hypotheses";

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockResolvedValue([]);
});

describe("coaching hypotheses DB", () => {
  it("creates an active hypothesis with evidence JSON", async () => {
    const row = {
      id: "hyp-1",
      userId: "user-1",
      hypothesis: "User may need concrete evidence before choosing an offer.",
      evidenceJson: ["offer anxiety"],
      counterEvidenceJson: [],
      confidence: 0.65,
      status: "active",
      sourceSessionId: "session-1",
      lastValidatedAt: null,
      createdAt: "2026-06-10T00:00:00Z",
      updatedAt: "2026-06-10T00:00:00Z",
    };
    sqlMock.mockResolvedValueOnce([row]);

    const result = await createCoachingHypothesis({
      userId: "user-1",
      hypothesis: row.hypothesis,
      evidence: ["offer anxiety"],
      confidence: 0.65,
      sourceSessionId: "session-1",
    });

    expect(result.id).toBe("hyp-1");
    expect(sqlMock).toHaveBeenCalledTimes(1);
  });

  it("confirms a hypothesis and updates lastValidatedAt", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "hyp-1" }]);

    const ok = await confirmCoachingHypothesis({
      id: "hyp-1",
      userId: "user-1",
      evidence: "用户确认了这个模式",
    });

    expect(ok).toBe(true);
    const sqlText = String(sqlMock.mock.calls[0][0]);
    expect(sqlText).toContain('"status" = \'confirmed\'');
    expect(sqlText).toContain('"lastValidatedAt" = now()');
  });

  it("rejects a hypothesis by recording counter-evidence", async () => {
    sqlMock.mockResolvedValueOnce([{ id: "hyp-1" }]);

    const ok = await rejectCoachingHypothesis({
      id: "hyp-1",
      userId: "user-1",
      counterEvidence: "用户明确反驳：这次不是因为害怕选错",
    });

    expect(ok).toBe(true);
    const sqlText = String(sqlMock.mock.calls[0][0]);
    expect(sqlText).toContain('"status" = \'rejected\'');
    expect(sqlText).toContain('"counterEvidenceJson"');
  });
});
