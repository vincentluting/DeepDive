"use client";

import { motion } from "framer-motion";
import { getArchetypeContent } from "@/lib/content";
import type { Locale } from "@/lib/i18n/config";
import { getLocalizedField } from "@/lib/i18n/localize";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

type AvatarSize = "sm" | "md" | "lg";

const SIZE_MAP: Record<AvatarSize, number> = {
  sm: 40,
  md: 80,
  lg: 200,
};

interface ArchetypeAvatarProps {
  /** Archetype code, e.g. "R-enhancement", "I-enhancement", "S-transcendence" */
  code: string;
  /** Display size: sm=40px, md=80px, lg=200px */
  size?: AvatarSize;
  /** Enable a subtle breathing animation (scale 1.0 → 1.03 → 1.0, 3s loop) */
  animated?: boolean;
  /** Show the archetype label below the avatar */
  showLabel?: boolean;
  /** Locale for label display */
  locale?: Locale;
  /** Additional CSS class */
  className?: string;
}

/** Returns a distinctive abstract SVG symbol for each archetype, rendered at 0.12 opacity.
 *  12-type archetypes: each RIASEC dimension shares a symbol family.
 *  enhancement = primary symbol (sharp/ascending), transcendence = secondary symbol (grounded/expansive). */
function getArchetypeSymbol(code: string) {
  // Extract RIASEC dimension from code (e.g. "R-enhancement" → "R")
  const dim = code.split("-")[0];
  const orientation = code.split("-")[1]; // enhancement | transcendence

  switch (dim) {
    case "R": // Realistic — build/craft
      return orientation === "transcendence" ? (
        // Principal — hexagon outline (stability, structure)
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="100,42 150,71 150,129 100,158 50,129 50,71" />
        </g>
      ) : (
        // Builder/Pioneer — curved arrow path (bottom-left to top-right)
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M45 160 Q90 90 155 45" />
          <path d="M143 50 L155 45 L150 58" />
        </g>
      );
    case "I": // Investigative — analyze/decode
      return orientation === "transcendence" ? (
        // Scientist — bullseye / concentric circles + center dot
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <circle cx="100" cy="100" r="65" />
          <circle cx="100" cy="100" r="42" />
          <circle cx="100" cy="100" r="18" />
          <circle cx="100" cy="100" r="5" fill="white" stroke="none" />
        </g>
      ) : (
        // Analyst/Evangelist — DNA double helix (two crossing S-curves)
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M70 35 C130 65, 70 95, 100 115 C130 135, 70 165, 130 190" />
          <path d="M130 35 C70 65, 130 95, 100 115 C70 135, 130 165, 70 190" />
        </g>
      );
    case "A": // Artistic — create/disrupt
      return orientation === "transcendence" ? (
        // Director — three weaving/crossing soft curves
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M30 65 C70 65, 80 100, 100 100 C120 100, 130 135, 170 135" />
          <path d="M30 100 C70 80, 90 120, 100 100 C110 80, 130 120, 170 100" />
          <path d="M30 135 C70 135, 80 100, 100 100 C120 100, 130 65, 170 65" />
        </g>
      ) : (
        // Virtuoso/Disruptor — broken horizontal line with sharp fracture
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="28" y1="100" x2="82" y2="100" />
          <polyline points="82,100 95,72 105,128 118,100" />
          <line x1="118" y1="100" x2="172" y2="100" />
        </g>
      );
    case "S": // Social — connect/support
      return orientation === "transcendence" ? (
        // Advocate — shield outline
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M65 45 L135 45 Q150 45 150 65 L150 115 Q150 155 100 172 Q50 155 50 115 L50 65 Q50 45 65 45 Z" />
        </g>
      ) : (
        // Coach/Connector — three expanding ripple arcs
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <path d="M72 115 A28 28 0 0 0 128 115" />
          <path d="M55 115 A45 45 0 0 0 145 115" />
          <path d="M38 115 A62 62 0 0 0 162 115" />
          <circle cx="100" cy="118" r="4" fill="white" stroke="none" />
        </g>
      );
    case "E": // Enterprising — lead/drive
      return orientation === "transcendence" ? (
        // Captain — compass wheel
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <circle cx="100" cy="100" r="55" />
          <circle cx="100" cy="100" r="18" />
          <line x1="100" y1="45" x2="100" y2="82" />
          <line x1="139" y1="61" x2="113" y2="87" />
          <line x1="155" y1="100" x2="118" y2="100" />
          <line x1="139" y1="139" x2="113" y2="113" />
          <line x1="100" y1="155" x2="100" y2="118" />
          <line x1="61" y1="139" x2="87" y2="113" />
          <line x1="45" y1="100" x2="82" y2="100" />
          <line x1="61" y1="61" x2="87" y2="87" />
        </g>
      ) : (
        // Maverick/Changemaker — lightning bolt
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="115,32 88,98 105,98 80,168" />
        </g>
      );
    case "C": // Conventional — organize/optimize
      return orientation === "transcendence" ? (
        // Architect — balance scale
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="100" y1="88" x2="100" y2="152" />
          <line x1="75" y1="152" x2="125" y2="152" />
          <line x1="35" y1="88" x2="165" y2="88" />
          <line x1="50" y1="88" x2="50" y2="118" />
          <line x1="150" y1="88" x2="150" y2="118" />
          <path d="M32 118 Q50 135, 68 118" />
          <path d="M132 118 Q150 135, 168 118" />
          <circle cx="100" cy="88" r="5" fill="white" stroke="none" />
        </g>
      ) : (
        // Operator/Strategist — 3×3 dot grid with diagonal connections
        <g
          opacity="0.12"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        >
          <line x1="60" y1="60" x2="140" y2="100" />
          <line x1="100" y1="60" x2="60" y2="140" />
          <line x1="140" y1="60" x2="100" y2="140" />
          <line x1="60" y1="100" x2="140" y2="140" />
          <circle cx="60" cy="60" r="4" fill="white" stroke="none" />
          <circle cx="100" cy="60" r="4" fill="white" stroke="none" />
          <circle cx="140" cy="60" r="4" fill="white" stroke="none" />
          <circle cx="60" cy="100" r="4" fill="white" stroke="none" />
          <circle cx="100" cy="100" r="4" fill="white" stroke="none" />
          <circle cx="140" cy="100" r="4" fill="white" stroke="none" />
          <circle cx="60" cy="140" r="4" fill="white" stroke="none" />
          <circle cx="100" cy="140" r="4" fill="white" stroke="none" />
          <circle cx="140" cy="140" r="4" fill="white" stroke="none" />
        </g>
      );
    default:
      return null;
  }
}

/** Generic ocean-themed fallback SVG for unknown archetype codes */
function FallbackAvatar({
  size,
  ariaLabel,
}: {
  size: number;
  ariaLabel: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <radialGradient id="fallback-bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#1e293b" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" rx="24" fill="url(#fallback-bg)" />
      <path
        d="M0 155 Q25 145, 50 155 T100 155 T150 155 T200 155 V200 H0Z"
        fill="rgba(255,255,255,0.1)"
      />
      <path
        d="M0 165 Q25 155, 50 165 T100 165 T150 165 T200 165 V200 H0Z"
        fill="rgba(255,255,255,0.07)"
      />
      <circle cx="100" cy="85" r="45" fill="rgba(255,255,255,0.12)" />
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="42"
        fontWeight="700"
        fill="white"
        letterSpacing="2"
      >
        ?
      </text>
      <text
        x="100"
        y="130"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="11"
        fill="rgba(255,255,255,0.6)"
      >
        DEEP DIVE
      </text>
    </svg>
  );
}

/** Color block avatar with the archetype's brand color, initial letter, and a unique symbol */
function ColorAvatar({
  colorHex,
  initial,
  size,
  label: _label,
  code,
  ariaLabel,
}: {
  colorHex: string;
  initial: string;
  size: number;
  label: string;
  code: string;
  ariaLabel: string;
}) {
  // Darken the color slightly for the gradient bottom
  const darkerHex = darkenHex(colorHex, 0.25);

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <radialGradient
          id={`av-grad-${colorHex.replace("#", "")}`}
          cx="45%"
          cy="35%"
          r="65%"
        >
          <stop offset="0%" stopColor={colorHex} />
          <stop offset="100%" stopColor={darkerHex} />
        </radialGradient>
      </defs>
      <rect
        width="200"
        height="200"
        rx="24"
        fill={`url(#av-grad-${colorHex.replace("#", "")})`}
      />
      {/* Subtle light overlay at top */}
      <rect
        width="200"
        height="100"
        rx="24"
        fill="rgba(255,255,255,0.08)"
        style={{ clipPath: "inset(0 0 50% 0)" }}
      />
      {/* Archetype-specific decorative symbol */}
      {getArchetypeSymbol(code)}
      <text
        x="100"
        y="100"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="var(--font-display, system-ui, -apple-system, sans-serif)"
        fontSize="82"
        fontWeight="700"
        fill="rgba(255,255,255,0.92)"
        letterSpacing="2"
      >
        {initial}
      </text>
    </svg>
  );
}

/** Darken a hex color by a factor (0-1) */
function darkenHex(hex: string, factor: number): string {
  const r = Math.max(
    0,
    Math.round(parseInt(hex.slice(1, 3), 16) * (1 - factor)),
  );
  const g = Math.max(
    0,
    Math.round(parseInt(hex.slice(3, 5), 16) * (1 - factor)),
  );
  const b = Math.max(
    0,
    Math.round(parseInt(hex.slice(5, 7), 16) * (1 - factor)),
  );
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function ArchetypeAvatar({
  code,
  size = "md",
  animated = false,
  showLabel = false,
  locale = "en",
  className = "",
}: ArchetypeAvatarProps) {
  const px = SIZE_MAP[size];
  const content = getArchetypeContent(code);
  const a11y = getDictionaryClient(locale).a11y;

  // Determine label text
  const label = content ? getLocalizedField(content, "label", locale) : null;

  // If the code is invalid (no content), show fallback
  if (!content) {
    const fallback = (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <FallbackAvatar size={px} ariaLabel={a11y.unknownArchetype} />
        {showLabel && (
          <span className="mt-1.5 text-xs text-muted-foreground truncate max-w-full">
            {label || code}
          </span>
        )}
      </div>
    );

    if (animated) {
      return (
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="inline-flex"
        >
          {fallback}
        </motion.div>
      );
    }

    return fallback;
  }

  // Use the first letter of the English label as the avatar initial
  const initial = content.label_en.charAt(0).toUpperCase();
  const colorHex = content.colorHex;

  const wrapper = (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <ColorAvatar
        colorHex={colorHex}
        initial={initial}
        size={px}
        label={label || code}
        code={code}
        ariaLabel={`${label || code} ${a11y.avatarLabel}`}
      />
      {showLabel && label && (
        <span className="mt-1.5 text-xs text-muted-foreground truncate max-w-full">
          {label}
        </span>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex"
      >
        {wrapper}
      </motion.div>
    );
  }

  return wrapper;
}
