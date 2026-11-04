/**
 * ESLint rule: no-hardcoded-brand-colors
 *
 * Warns when brand-palette hex codes are hardcoded in TS/TSX strings.
 * Prefer CSS variables from globals.css:
 * - `var(--primary)` / `var(--grad-dive-*)` for brand gradients
 * - `var(--archetype-{key}-dive|rev|sanc)` for archetype colors
 * - `var(--rev-*)` for Revelation surface
 * - `var(--sanc-*)` for Sanctuary surface
 *
 * This rule runs at `warn` level during the Meridian migration.
 * Token dictionary: `.claude/skills/deepdive-design/references/tokens.md`.
 *
 * Skipped files:
 * - Tests and mocks (`*.test.ts`, `__tests__/`, `__mocks__/`)
 * - Auto-generated (`schema-generated.ts` et al.)
 * - Theme providers / CSS variable definition files
 *   (they legitimately resolve the palette to raw hex at the boundary)
 */

"use strict";

// Brand-palette hex codes that must come from CSS variables.
// Includes the retired pre-Meridian palette (regression guard) and the
// live Meridian base layer. Values are lowercased for matching.
const BRAND_HEX = new Set(
  [
    // ── Retired palettes (pre-Meridian) — must not come back ──
    // Primary + v1 gradient
    "#0870ae",
    "#e05291",
    "#8b5cf6",
    "#7c3aed",
    "#1aadeb",
    "#0d8fd0",
    // v2 Dive gradient + generic bioluminescent
    "#42c6ff",
    "#6b46c1",
    "#ff6ba6",
    "#c4b5fd",
    "#a78bfa",
    // Archetype v2 — Dive tier
    "#f39c41",
    "#b47de0",
    "#4ecdc4",
    "#ff8b6b",
    "#a8c5d0",
    // Archetype Flat Material (退役) — should migrate away
    "#e74c3c",
    "#3498db",
    "#9b59b6",
    "#27ae60",
    "#e67e22",
    "#1abc9c",
    // ── Meridian base layer — use var(--md-*) instead ──
    "#f9faf6",
    "#04121f",
    "#0a2336",
    "#0c2a44",
    "#efe2ce",
    "#0b5f91",
    "#0f86b8",
    "#05375d",
    "#76d4e8",
    "#d8b46a",
    "#8a6420",
    "#b98a2f",
  ].map((s) => s.toLowerCase()),
);

const SKIP_PATH_PATTERNS = [
  /\.(test|spec)\.(ts|tsx)$/,
  /\/__tests__\//,
  /\/__mocks__\//,
  /schema-generated/,
  /theme-provider\.(ts|tsx)$/,
  // Frozen content sources — warnings there are expected until explicit migration
  /lib\/content\/archetypes-/,
  /lib\/scoring\//,
];

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn on hardcoded brand palette hex codes in TS/TSX strings. Use CSS variables from globals.css.",
      recommended: true,
    },
    schema: [],
    messages: {
      useCssVar:
        "Hardcoded brand color {{color}} — use a CSS variable instead (e.g. var(--primary), var(--archetype-i-dive), var(--rev-ink)). See .claude/skills/deepdive-design/references/color-system.md.",
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename?.() || "";
    if (SKIP_PATH_PATTERNS.some((re) => re.test(filename))) return {};

    const hexRegex = /#[0-9a-f]{6}\b/gi;

    function checkString(node, str) {
      if (typeof str !== "string" || !str.includes("#")) return;
      const matches = str.match(hexRegex);
      if (!matches) return;
      for (const m of matches) {
        if (BRAND_HEX.has(m.toLowerCase())) {
          context.report({
            node,
            messageId: "useCssVar",
            data: { color: m },
          });
          return; // one report per node is sufficient
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkString(node, node.value);
        }
      },
      TemplateElement(node) {
        if (node.value && typeof node.value.cooked === "string") {
          checkString(node, node.value.cooked);
        }
      },
    };
  },
};
