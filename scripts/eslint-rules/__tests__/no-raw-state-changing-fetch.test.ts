// ============================================================
// ESLint rule test: no-raw-state-changing-fetch
//
// Uses the RuleTester from eslint/use-at-your-own-risk (for flat config
// compatibility with ESLint 9). This file guarantees the rule keeps
// detecting regressions and keeps exempting the intended patterns.
// ============================================================
import { describe, it } from "vitest";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RuleTester } = require("eslint");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rule = require("../no-raw-state-changing-fetch.js");

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

describe("no-raw-state-changing-fetch", () => {
  it("accepts valid patterns and rejects raw /api POST/PUT/DELETE/PATCH", () => {
    ruleTester.run("no-raw-state-changing-fetch", rule, {
      valid: [
        // GET is safe (no CSRF check)
        `fetch("/api/foo", { method: "GET" });`,
        // HEAD is safe
        `fetch("/api/foo", { method: "HEAD" });`,
        // External URL — CSRF doesn't apply
        `fetch("https://api.anthropic.com/v1/messages", { method: "POST" });`,
        `fetch("https://api.openai.com/v1/chat", { method: "POST" });`,
        // Exempt endpoints (sendBeacon pattern / webhooks)
        `fetch("/api/analytics/event", { method: "POST" });`,
        `fetch("/api/analytics/duration", { method: "POST" });`,
        `fetch("/api/stripe/webhook", { method: "POST" });`,
        // csrfFetch is the blessed path
        `csrfFetch("/api/quickdive/save", { method: "POST" });`,
        // No options — can't determine method, skip
        `fetch("/api/foo");`,
        // Non-literal method — can't prove state-changing, skip
        `fetch("/api/foo", { method: m });`,
      ],
      invalid: [
        {
          code: `fetch("/api/quickdive/save", { method: "POST" });`,
          errors: [{ messageId: "useCsrfFetch" }],
        },
        {
          code: `fetch("/api/auth/reset-password", { method: "POST", body: "{}" });`,
          errors: [{ messageId: "useCsrfFetch" }],
        },
        {
          code: `fetch("/api/stripe/checkout", { method: "POST" });`,
          errors: [{ messageId: "useCsrfFetch" }],
        },
        {
          code: `fetch("/api/coach-persona", { method: "PATCH" });`,
          errors: [{ messageId: "useCsrfFetch" }],
        },
        {
          // Template-literal URL with dynamic segment — rule must still catch
          code: "fetch(`/api/admin/users/${id}/reports`, { method: 'DELETE' });",
          errors: [{ messageId: "useCsrfFetch" }],
        },
        {
          // Method case-insensitive
          code: `fetch("/api/foo", { method: "post" });`,
          errors: [{ messageId: "useCsrfFetch" }],
        },
      ],
    });
  });
});
