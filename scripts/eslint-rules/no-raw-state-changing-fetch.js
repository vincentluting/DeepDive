/**
 * ESLint rule: no-raw-state-changing-fetch
 *
 * Forbid `fetch(url, { method: "POST" | "PUT" | "DELETE" | "PATCH" })` where
 * `url` is a **same-origin `/api/*` path**. Our `proxy.ts` middleware enforces
 * CSRF on all state-changing requests to same-origin API routes; raw fetch
 * lacks the `x-csrf-token` header and gets silently rejected with 403.
 *
 * Use `csrfFetch` from `@/lib/auth/csrf-client` instead.
 *
 * Scope — only flags fetches whose URL literal starts with `/api/`:
 * - ✅ Caught: `fetch("/api/foo", { method: "POST" })` — hits our backend
 * - ❌ Not caught: `fetch("https://api.anthropic.com/...", { method: "POST" })`
 *   — server-side external API call, CSRF doesn't apply
 * - ❌ Not caught: dynamic URL (template literal with non-`/api/` prefix)
 *
 * Exemptions (still allowed to use raw fetch on `/api/*`):
 * - Endpoints in the ANALYTICS_CSRF_EXEMPT list of proxy.ts
 *   (sendBeacon cannot set custom headers, or webhook uses signature instead)
 *
 * This rule does NOT flag `csrfFetch(...)` itself.
 */

"use strict";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

// Paths exempted from CSRF by proxy.ts — sendBeacon / webhooks / OAuth callback.
// KEEP IN SYNC with ANALYTICS_CSRF_EXEMPT in proxy.ts (single source of truth).
const CSRF_EXEMPT_ENDPOINTS = new Set([
  "/api/analytics/duration",
  "/api/analytics/report-engagement",
  "/api/analytics/event",
  "/api/session/save-beacon",
  "/api/coaching-save-beacon",
  "/api/auth/oauth/callback",
  "/api/stripe/webhook",
]);

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid raw fetch() with state-changing methods (POST/PUT/DELETE/PATCH); use csrfFetch from @/lib/auth/csrf-client.",
      category: "Possible Errors",
      recommended: true,
    },
    schema: [],
    messages: {
      useCsrfFetch:
        "Use `csrfFetch` from `@/lib/auth/csrf-client` instead of raw `fetch` for {{method}} requests. Raw fetch is silently rejected with 403 by the CSRF middleware.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        // Only check bare `fetch(...)` — not `csrfFetch`, not `someObj.fetch`.
        if (node.callee.type !== "Identifier" || node.callee.name !== "fetch") {
          return;
        }

        const [urlArg, optionsArg] = node.arguments;
        if (!optionsArg || optionsArg.type !== "ObjectExpression") return;

        // Only flag same-origin /api/* URLs (where our CSRF middleware applies).
        // External URLs (https://api.anthropic.com/...) are server-side calls to
        // third-party services and don't use our CSRF cookie.
        let urlString = null;
        if (
          urlArg &&
          urlArg.type === "Literal" &&
          typeof urlArg.value === "string"
        ) {
          urlString = urlArg.value;
        } else if (
          urlArg &&
          urlArg.type === "TemplateLiteral" &&
          urlArg.quasis.length > 0
        ) {
          // Check if the template literal starts with /api/ (first quasi).
          urlString = urlArg.quasis[0].value.cooked;
        }
        if (!urlString || !urlString.startsWith("/api/")) return;

        // Find `method: "POST"` etc.
        const methodProp = optionsArg.properties.find(
          (p) =>
            p.type === "Property" &&
            !p.computed &&
            ((p.key.type === "Identifier" && p.key.name === "method") ||
              (p.key.type === "Literal" && p.key.value === "method")),
        );
        if (!methodProp) return;

        // Only flag string literal methods we can prove are state-changing.
        if (methodProp.value.type !== "Literal") return;
        const method = String(methodProp.value.value).toUpperCase();
        if (!STATE_CHANGING_METHODS.has(method)) return;

        // Exempt the sendBeacon / webhook endpoints.
        if (
          urlArg &&
          urlArg.type === "Literal" &&
          typeof urlArg.value === "string"
        ) {
          if (CSRF_EXEMPT_ENDPOINTS.has(urlArg.value)) return;
        }

        context.report({
          node,
          messageId: "useCsrfFetch",
          data: { method },
        });
      },
    };
  },
};
