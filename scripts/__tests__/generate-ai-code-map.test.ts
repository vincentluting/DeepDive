import { describe, expect, it } from "vitest";
import {
  buildInventoryMarkdown,
  countByTopLevel,
  getExtension,
  isLikelyContextNoise,
  type TrackedFile,
} from "../generate-ai-code-map";

const FILES: TrackedFile[] = [
  { path: "app/[locale]/page.tsx", sizeBytes: 120, lineCount: 12 },
  { path: "lib/ai/model-router.ts", sizeBytes: 200, lineCount: 20 },
  { path: "components/ui/button.tsx", sizeBytes: 90, lineCount: 9 },
  { path: "scripts/migrations/101-coaching-review-pool.sql", sizeBytes: 60, lineCount: 6 },
  { path: ".claude/quality/codex-redteam/output-final.md", sizeBytes: 500, lineCount: 50 },
  { path: "package-lock.json", sizeBytes: 300, lineCount: 30 },
  { path: "README.md", sizeBytes: 40, lineCount: 4 },
];

describe("generate-ai-code-map helpers", () => {
  it("groups root files under dot and nested files under their top-level directory", () => {
    expect(countByTopLevel(FILES)).toEqual([
      [".", 2],
      [".claude", 1],
      ["app", 1],
      ["components", 1],
      ["lib", 1],
      ["scripts", 1],
    ]);
  });

  it("extracts lowercase extensions and handles extensionless paths", () => {
    expect(getExtension("lib/example.TEST.TS")).toBe("ts");
    expect(getExtension("README")).toBe("(none)");
  });

  it("marks large lockfiles and generated Claude audit output as context noise", () => {
    expect(isLikelyContextNoise("package-lock.json")).toBe(true);
    expect(isLikelyContextNoise(".claude/quality/codex-redteam/output-final.md")).toBe(true);
    expect(isLikelyContextNoise("lib/ai/model-router.ts")).toBe(false);
  });

  it("builds deterministic markdown without timestamps", () => {
    const markdown = buildInventoryMarkdown(FILES);

    expect(markdown).toContain("# AI Code Inventory");
    expect(markdown).toContain("| `lib` | 1 |");
    expect(markdown).toContain("| `lib/ai/model-router.ts` | 20 | 200 B |");
    expect(markdown).toContain("`.claude/quality/codex-redteam/output-final.md`");
    expect(markdown).not.toContain("Generated at");
  });
});
