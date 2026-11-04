/**
 * ESLint rule: no-inter-poppins-import
 *
 * Deep Dive brand spec uses Fraunces + DM Sans + Source Serif 4 exclusively.
 * Inter and Poppins are explicitly disallowed (see SKILL.md §品牌排版不可替换).
 *
 * Flags:
 * - `import { Inter, Poppins } from "next/font/google"` — direct Google Fonts import
 * - `localFont({ src: [{ path: "...inter..." }] })` — local fontsource path containing inter/poppins
 *
 * The existing `@fontsource/inter` usage in `app/[locale]/layout.tsx` is
 * intentionally preserved as a latin fallback during the v2 Surface migration;
 * it will be removed in Week 4 along with any other legacy Inter references.
 * Until then this rule runs at `warn` level. See `migration-2026-q2.md`.
 */

"use strict";

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow importing Inter or Poppins fonts; Deep Dive uses Fraunces + DM Sans + Source Serif 4.",
      recommended: true,
    },
    schema: [],
    messages: {
      noInter:
        "Inter is not part of Deep Dive's brand typography. Use Fraunces (display), DM Sans (body), or Source Serif 4 (Revelation body). See .claude/skills/deepdive-design/SKILL.md §品牌排版不可替换.",
      noPoppins:
        "Poppins is not part of Deep Dive's brand typography. Use Fraunces (display), DM Sans (body), or Source Serif 4 (Revelation body). See .claude/skills/deepdive-design/SKILL.md §品牌排版不可替换.",
    },
  },

  create(context) {
    function checkLiteralPath(node, str) {
      if (typeof str !== "string") return;
      const lower = str.toLowerCase();
      // Scope: only flag font asset paths or fontsource package refs
      if (!/\.woff2?|fontsource/i.test(lower)) return;
      if (/(^|[\/\-_.])inter[\/\-_.]/.test(lower)) {
        context.report({ node, messageId: "noInter" });
      } else if (/(^|[\/\-_.])poppins[\/\-_.]/.test(lower)) {
        context.report({ node, messageId: "noPoppins" });
      }
    }

    return {
      ImportDeclaration(node) {
        if (node.source.value !== "next/font/google") return;
        for (const spec of node.specifiers) {
          if (spec.type !== "ImportSpecifier") continue;
          const imported = spec.imported && spec.imported.name;
          if (imported === "Inter") {
            context.report({ node: spec, messageId: "noInter" });
          } else if (imported === "Poppins") {
            context.report({ node: spec, messageId: "noPoppins" });
          }
        }
      },
      Literal(node) {
        if (typeof node.value === "string") {
          checkLiteralPath(node, node.value);
        }
      },
    };
  },
};
