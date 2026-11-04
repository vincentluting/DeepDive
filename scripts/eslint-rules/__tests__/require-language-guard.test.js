import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterAll, beforeAll, describe, it } from "vitest";

const require = createRequire(import.meta.url);
const { RuleTester } = require("eslint");
const tseslint = require("typescript-eslint");
const rule = require("../require-language-guard.js");

const repoRoot = process.cwd();
const tempDir = fs.mkdtempSync(
  path.join(os.tmpdir(), "require-language-guard-rule-"),
);

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

beforeAll(() => {
  fs.writeFileSync(
    path.join(tempDir, "ai.ts"),
    'export { callLLM } from "@/lib/ai/model-router";\n',
    "utf8",
  );
});

afterAll(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("require-language-guard", () => {
  it("requires a matching guard import, pragma, or exempt path", () => {
    ruleTester.run("require-language-guard", rule, {
      valid: [
        {
          filename: path.join(repoRoot, "lib/profile-generation/guarded.ts"),
          code: `
            import { callLLM } from "@/lib/ai/model-router";
            import { enforceOutputLocale } from "@/lib/report-generation/language-guard";

            async function run() {
              return callLLM("profile-narrative", []);
            }
          `,
        },
        {
          filename: path.join(repoRoot, "lib/profile-generation/pragma.ts"),
          code: `
            // @language-guard-exempt: verbatim passthrough is required here
            import { callLLM } from "@/lib/ai/model-router";

            async function run() {
              return callLLM("profile-narrative", []);
            }
          `,
        },
        {
          filename: path.join(repoRoot, "lib/ai/model-router.ts"),
          code: `
            async function run() {
              return callLLM("profile-narrative", []);
            }
          `,
        },
        {
          filename: path.join(repoRoot, "app/api/coaching-chat/route.ts"),
          code: `
            import { streamLLM } from "@/lib/ai/model-router";
            import { observeStreamLocale } from "@/lib/coaching/stream-language-observer";

            async function run() {
              return streamLLM("coaching", []);
            }
          `,
        },
        {
          filename: path.join(tempDir, "feature.ts"),
          code: `
            import { callLLM } from "./ai";
            import { enforceOutputLocale } from "@/lib/report-generation/language-guard";

            async function run() {
              return callLLM("profile-narrative", []);
            }
          `,
        },
      ],
      invalid: [
        {
          filename: path.join(repoRoot, "lib/profile-generation/missing-guard.ts"),
          code: `
            import { callLLM } from "@/lib/ai/model-router";

            async function run() {
              return callLLM("profile-narrative", []);
            }
          `,
          errors: [
            {
              message:
                "lib/profile-generation/missing-guard.ts invokes callLLM but neither imports a language guard nor declares `@language-guard-exempt: <reason>`. See lib/report-generation/language-guard.ts (non-streaming) or lib/coaching/stream-language-observer.ts (streaming).",
            },
          ],
        },
        {
          filename: path.join(repoRoot, "lib/profile-generation/alias.ts"),
          code: `
            import { callLLM as llm } from "@/lib/ai/model-router";

            async function run() {
              return Promise.all([llm("profile-narrative", [])]);
            }
          `,
          errors: [
            {
              message:
                "lib/profile-generation/alias.ts invokes callLLM but neither imports a language guard nor declares `@language-guard-exempt: <reason>`. See lib/report-generation/language-guard.ts (non-streaming) or lib/coaching/stream-language-observer.ts (streaming).",
            },
          ],
        },
        {
          filename: path.join(repoRoot, "app/api/coaching-chat/no-observer.ts"),
          code: `
            import { streamLLM } from "@/lib/ai/model-router";

            async function run() {
              return streamLLM("coaching", []);
            }
          `,
          errors: [
            {
              message:
                "app/api/coaching-chat/no-observer.ts invokes streamLLM but neither imports a language guard nor declares `@language-guard-exempt: <reason>`. See lib/report-generation/language-guard.ts (non-streaming) or lib/coaching/stream-language-observer.ts (streaming).",
            },
          ],
        },
      ],
    });
  });
});
