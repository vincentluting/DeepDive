/**
 * Meridian contrast gate — parses the literal-hex `--md-*` base layer out of
 * app/globals.css (:root = Noon, .dark = Midnight) and asserts the WCAG
 * combinations the design system promises.
 *
 * Run: node --import tsx scripts/check-meridian-contrast.ts
 * Spec: .claude/skills/deepdive-design/references/tokens.md §8
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const css = readFileSync(
  path.join(process.cwd(), "app", "globals.css"),
  "utf8",
);

function extractBlock(selector: ":root" | ".dark"): Record<string, string> {
  const start = css.indexOf(selector === ":root" ? "\n:root {" : "\n.dark {");
  if (start === -1) throw new Error(`selector ${selector} not found`);
  // Walk to the matching closing brace of this top-level block.
  let depth = 0;
  let i = css.indexOf("{", start);
  const open = i;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = css.slice(open + 1, i);
  const tokens: Record<string, string> = {};
  const re = /--(md-[a-z-]+):\s*(#[0-9a-fA-F]{6})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) tokens[m[1]] = m[2].toLowerCase();
  return tokens;
}

/** All --md-* declarations (any value form) — used for the parity gate. */
function extractNames(selector: ":root" | ".dark"): string[] {
  const start = css.indexOf(selector === ":root" ? "\n:root {" : "\n.dark {");
  let depth = 0;
  let i = css.indexOf("{", start);
  const open = i;
  for (; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = css.slice(open + 1, i);
  return [...body.matchAll(/--(md-[a-z-]+):/g)].map((m) => m[1]).sort();
}

/** Standard source-over alpha composite of fg at `alpha` onto opaque bg. */
function composite(fg: string, bg: string, alpha: number): string {
  const ch = (hex: string, o: number) =>
    parseInt(hex.replace("#", "").slice(o, o + 2), 16);
  const mix = (o: number) =>
    Math.round(ch(fg, o) * alpha + ch(bg, o) * (1 - alpha));
  return `#${[0, 2, 4]
    .map((o) => mix(o).toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((o) => {
    const c = parseInt(v.slice(o, o + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(fg: string, bg: string): number {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

interface Check {
  fg: string;
  bg: string;
  min: number;
  note: string;
}

// The promises the token spec makes (tokens.md §8).
const NOON_CHECKS: Check[] = [
  { fg: "md-ink", bg: "md-paper", min: 7, note: "body text" },
  { fg: "md-ink", bg: "md-card", min: 7, note: "card text" },
  { fg: "md-ink-soft", bg: "md-paper", min: 4.5, note: "secondary text" },
  { fg: "md-sea", bg: "md-paper", min: 4.5, note: "interactive text" },
  { fg: "md-sea", bg: "md-card", min: 4.5, note: "links on card" },
  { fg: "md-gold-text", bg: "md-paper", min: 4.5, note: "AA gold text" },
  { fg: "md-gold-text", bg: "md-card", min: 4.5, note: "AA gold on card" },
  { fg: "md-sea-bright", bg: "md-paper", min: 3, note: "large text only" },
  { fg: "md-ink-faint", bg: "md-paper", min: 3, note: "large text only" },
];

const MIDNIGHT_CHECKS: Check[] = [
  { fg: "md-ink", bg: "md-paper", min: 7, note: "body text" },
  { fg: "md-ink", bg: "md-card", min: 7, note: "card text" },
  { fg: "md-ink-soft", bg: "md-paper", min: 4.5, note: "secondary text" },
  { fg: "md-sea", bg: "md-paper", min: 4.5, note: "interactive text" },
  {
    fg: "md-gold-text",
    bg: "md-paper",
    min: 4.5,
    note: "gold text (midnight)",
  },
  {
    fg: "md-gold",
    bg: "md-paper",
    min: 4.5,
    note: "gold may be text at night",
  },
];

const noon = extractBlock(":root");
const midnight = extractBlock(".dark");

// Parity gate: every md token declared in :root must exist in .dark (any value form).
const noonKeys = extractNames(":root");
const midnightKeys = extractNames(".dark");
const missing = noonKeys.filter((k) => !midnightKeys.includes(k));
const extra = midnightKeys.filter((k) => !noonKeys.includes(k));

let failures = 0;

if (missing.length || extra.length) {
  failures++;
  console.error("✗ md token parity broken.", { missing, extra });
} else {
  console.log(`✓ md token parity (${noonKeys.length} literal-hex tokens)`);
}

function run(label: string, tokens: Record<string, string>, checks: Check[]) {
  for (const c of checks) {
    const fg = tokens[c.fg];
    const bg = tokens[c.bg];
    if (!fg || !bg) {
      failures++;
      console.error(`✗ [${label}] missing token ${!fg ? c.fg : c.bg}`);
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= c.min;
    if (!ok) failures++;
    console.log(
      `${ok ? "✓" : "✗"} [${label}] ${c.fg} on ${c.bg} = ${r.toFixed(2)}:1 (min ${c.min}) — ${c.note}`,
    );
  }
}

run("noon", noon, NOON_CHECKS);
run("midnight", midnight, MIDNIGHT_CHECKS);

// ── Landing water veil — composite backgrounds at depth ──
// The descent veil (`.dd-landing-water`) lays sea-deep over the page at
// opacity progress×cap. Worst case for dark-ink text is the deepest light
// composite: paper → painting remnant (sea-deep @ .14 floor) → veil
// (gradient bottom stop = sea-deep @ 64% × cap). Veil caps: light .42 /
// dark .8 (band progress: twilight .71, abyss 1).
function veilChecks() {
  const paperL = noon["md-paper"];
  const seaDeepL = noon["md-sea-deep"];
  const goldDeepwater = noon["md-gold-text-deepwater"];
  const inkL = noon["md-ink"];
  if (!paperL || !seaDeepL || !goldDeepwater || !inkL) {
    failures++;
    console.error("✗ [veil] missing tokens for landing veil checks");
    return;
  }
  const painted = composite(seaDeepL, paperL, 0.14); // ocean painting floor
  const lightAt = (progress: number) =>
    composite(seaDeepL, painted, progress * 0.42 * 0.64);
  const twilightL = lightAt(0.71);
  const abyssL = lightAt(1);
  // Text at abyss depth always sits on a reading shelf (paper 56% wash) —
  // bare text exists only down to twilight. Mirror the real DOM stack.
  const abyssShelfL = composite(paperL, abyssL, 0.56);

  const cases: Array<[string, string, string, number, string]> = [
    ["ink @ twilight, bare (light)", inkL, twilightL, 7, "veiled body text"],
    [
      "ink @ abyss, on shelf (light)",
      inkL,
      abyssShelfL,
      7,
      "deepest veiled text rides .dd-landing-shelf",
    ],
    [
      "gold-deepwater @ twilight, bare (light)",
      goldDeepwater,
      twilightL,
      4.5,
      "veiled gold smallcaps",
    ],
    [
      "gold-deepwater @ paper (light)",
      goldDeepwater,
      paperL,
      4.5,
      "same gold above water",
    ],
  ];

  // Dark: veil composites toward near-black — warm ink and gold both gain
  // contrast with depth, but assert the floor anyway (regression guard).
  const paperD = midnight["md-paper"];
  const inkD = midnight["md-ink"];
  const goldD = midnight["md-gold-text-deepwater"];
  if (paperD && inkD && goldD) {
    const darkAbyss = composite("#010a12", paperD, 0.8 * 0.94);
    cases.push(
      ["ink @ abyss (dark)", inkD, darkAbyss, 7, "veiled body text"],
      [
        "gold-deepwater @ abyss (dark)",
        goldD,
        darkAbyss,
        4.5,
        "veiled gold smallcaps",
      ],
    );
  }

  for (const [label, fg, bg, min, note] of cases) {
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failures++;
    console.log(
      `${ok ? "✓" : "✗"} [veil] ${label} = ${r.toFixed(2)}:1 (min ${min}) — ${note}`,
    );
  }
}
veilChecks();

if (failures > 0) {
  console.error(`\n${failures} contrast failure(s).`);
  process.exit(1);
}
console.log("\nAll Meridian contrast promises hold.");
