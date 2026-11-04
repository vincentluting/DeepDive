import { beforeEach, describe, expect, it, vi } from "vitest";

const queuedRows: unknown[][] = [];
const capturedTemplates: string[][] = [];

vi.mock("@/lib/db/connection", () => ({
  sql: vi.fn((strings: TemplateStringsArray) => {
    capturedTemplates.push([...strings]);
    return Promise.resolve(queuedRows.shift() ?? []);
  }),
}));

import { getUserReports } from "@/lib/db/reports";

beforeEach(() => {
  queuedRows.length = 0;
  capturedTemplates.length = 0;
  vi.clearAllMocks();
});

function joinedSql(): string {
  return capturedTemplates.flat().join(" ");
}

describe("getUserReports", () => {
  it("includes immersive QuickDiveResult rows and falls back to archetype labels", async () => {
    queuedRows.push(
      [],
      [
        {
          id: "qd-immersive",
          createdAt: new Date("2026-05-09T10:00:00.000Z"),
          exploreMode: "immersive",
          summaryEn: "Architect",
          summaryZh: "工程专家",
        },
      ],
    );

    const { reports, error } = await getUserReports("user-1");

    expect(error).toBeUndefined();
    expect(reports).toEqual([
      {
        id: "qd-immersive",
        createdAt: String(new Date("2026-05-09T10:00:00.000Z")),
        summary: "Architect",
        summaryZh: "工程专家",
        reportType: "quick",
        exploreMode: "immersive",
      },
    ]);

    const sqlText = joinedSql();
    expect(sqlText).toContain(
      `q."resultDataJson"->'labelData'->>'label_en'`,
    );
    expect(sqlText).toContain(
      `q."resultDataJson"->'labelData'->>'label_zh'`,
    );
    expect(sqlText).toContain(`q."archetypeLabel"`);
    expect(sqlText).not.toContain(`q."resultDataJson" IS NOT NULL`);
  });
});
