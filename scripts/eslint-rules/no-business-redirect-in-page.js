/**
 * ESLint rule: no-business-redirect-in-page
 *
 * Flag `redirect("/...")` calls in `app/**\/page.tsx` whose destination isn't on
 * the safe-redirect allowlist. Business preconditions (no report yet, gate
 * not cleared, entitlement missing) should render a <PrerequisiteGate>
 * instead of silently bouncing the user to another page.
 *
 * Allowlist — redirects that may stay as `redirect()`:
 *   /login, /register, /processing, /dashboard?pipelineFailed=…  (legacy)
 *   plus anything dynamic when the developer adds `// gate-redirect-ok: <reason>`
 *   on the preceding line.
 *
 * See: .claude/rules/prerequisite-gate-policy.md
 */

"use strict";

const PATH_ALLOWLIST = [
  /\/login(\?|$)/, // auth-required
  /\/register(\?|$)/, // sign-up flow
  /\/processing(\?|$)/, // observer for live pipelines
];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Discourage silent business redirects in page.tsx; prefer PrerequisiteGate. Mark deliberate redirects with `// gate-redirect-ok: <reason>`.",
      category: "Best Practices",
      recommended: false,
    },
    schema: [],
    messages: {
      preferGate:
        "Business-precondition redirect to {{target}} — render <PrerequisiteGate> from components/journey/prerequisite-gate.tsx instead, or annotate with `// gate-redirect-ok: <reason>` above this call.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename();
    // Only check page.tsx under /app (Next.js App Router pages).
    if (!/\/app\/.*\/page\.tsx?$/.test(filename)) return {};

    const source = context.sourceCode ?? context.getSourceCode();

    return {
      CallExpression(node) {
        // Only `redirect(...)` — not `router.push` etc.
        if (
          node.callee.type !== "Identifier" ||
          node.callee.name !== "redirect"
        ) {
          return;
        }

        const [target] = node.arguments;
        if (!target) return;

        // Resolve literal target if possible. Dynamic targets pass through
        // unless explicitly annotated.
        let targetString = null;
        if (target.type === "Literal" && typeof target.value === "string") {
          targetString = target.value;
        } else if (
          target.type === "TemplateLiteral" &&
          target.quasis.length > 0
        ) {
          targetString = target.quasis.map((q) => q.value.cooked).join("…");
        }

        // Allowlisted destination — fine.
        if (
          targetString &&
          PATH_ALLOWLIST.some((re) => re.test(targetString))
        ) {
          return;
        }

        // Check for `// gate-redirect-ok: <reason>` either directly above the
        // call OR above the nearest enclosing statement (IfStatement /
        // ExpressionStatement / VariableDeclaration), since most redirects
        // live inside an `if` block whose leading comment sits above the
        // if, not above the call expression itself.
        const candidates = [node];
        let parent = node.parent;
        while (parent) {
          if (
            parent.type === "ExpressionStatement" ||
            parent.type === "IfStatement" ||
            parent.type === "BlockStatement" ||
            parent.type === "ReturnStatement"
          ) {
            candidates.push(parent);
          }
          if (parent.type === "IfStatement") break; // stop at if — usual carrier
          parent = parent.parent;
        }
        const hasAck = candidates.some((n) =>
          source
            .getCommentsBefore(n)
            .some((c) => /gate-redirect-ok\s*:/i.test(c.value)),
        );
        if (hasAck) return;

        context.report({
          node,
          messageId: "preferGate",
          data: { target: targetString ?? "<dynamic>" },
        });
      },
    };
  },
};
