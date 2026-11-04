import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    pool: "forks",
    exclude: ["node_modules", "e2e", ".claude/worktrees/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["lib/scoring/**", "lib/report-generation/**"],
      thresholds: {
        "lib/scoring/**": {
          lines: 80,
        },
        "lib/report-generation/**": {
          lines: 70,
        },
      },
    },
  },
});
