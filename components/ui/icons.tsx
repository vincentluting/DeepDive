/**
 * Custom branded SVG icons for Deep Dive
 *
 * Design system v2 — Premium ocean-themed icons
 *
 * Principles:
 *   - 1.75px primary stroke, 1.25px secondary (no sub-1px lines)
 *   - Round caps & joins throughout
 *   - 20×20 optical area within 24×24 viewBox (2px padding)
 *   - No decorative noise: no bubbles, particles, or sub-0.3 opacity layers
 *   - Filled accents use single opacity level (0.15) for subtle depth
 *   - Ocean-inspired shapes, geometrically clean execution
 */

import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function iconDefaults(props: IconProps, size = 24) {
  const { size: s = size, className, ...rest } = props
  return {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg" as const,
    className,
    ...rest,
  }
}

/* ── Bioluminescence ─ radiant star burst ───────────────────── */
export function Bioluminescence(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <path d="M12 2.5v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M12 17.5v4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M2.5 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M17.5 12h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M5.64 5.64l2.83 2.83" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M15.54 15.54l2.83 2.83" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5.64 18.36l2.83-2.83" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M15.54 8.46l2.83-2.83" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

/* ── NautilusSpiral ─ golden ratio spiral ───────────────────── */
export function NautilusSpiral(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 12c0-1.5 1.2-2.7 2.7-2.7 2.4 0 4.3 1.9 4.3 4.3 0 3.3-2.7 6-6 6-4.2 0-7.6-3.4-7.6-7.6C5.4 7 9.6 2.8 14.7 2.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

/* ── SonarPulse ─ concentric radar arcs ─────────────────────── */
export function SonarPulse(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path
        d="M12 7a5 5 0 0 1 5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M12 17a5 5 0 0 1-5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  )
}

/* ── PearlShell ─ clean clamshell with pearl ────────────────── */
export function PearlShell(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M4 14c0 0 2-6 8-6s8 6 8 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M4 14c0 0 2 5 8 5s8-5 8-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="12" cy="14" r="2" fill="currentColor" opacity="0.15" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </svg>
  )
}

/* ── CurrentFlow ─ parallel ocean currents ──────────────────── */
export function CurrentFlow(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M3 8c2.5-1.5 5 1.5 9 0s6.5-1.5 9 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 12c2.5-1.5 5 1.5 9 0s6.5-1.5 9 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M3 16c2.5-1.5 5 1.5 9 0s6.5-1.5 9 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        fill="none"
        opacity="0.35"
      />
    </svg>
  )
}

/* ── ThermalPlume ─ hydrothermal vent plume ─────────────────── */
export function ThermalPlume(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 3c0 0-4.5 5-4.5 9.5a4.5 4.5 0 0 0 9 0C16.5 8 12 3 12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 9c0 0-2 2-2 4a2 2 0 0 0 4 0c0-2-2-4-2-4z"
        fill="currentColor"
        opacity="0.15"
      />
      <path d="M8.5 20h7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

/* ── SeaChart ─ nautical document ───────────────────────────── */
export function SeaChart(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M8 14c2-1.2 4 1.2 8 0"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ── RoseCompass ─ nautical compass rose ────────────────────── */
export function RoseCompass(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <polygon points="12,4.5 13,10.5 12,9.5 11,10.5" fill="currentColor" opacity="0.7" />
      <polygon points="12,19.5 11,13.5 12,14.5 13,13.5" fill="currentColor" opacity="0.35" />
      <polygon points="4.5,12 10.5,11 9.5,12 10.5,13" fill="currentColor" opacity="0.35" />
      <polygon points="19.5,12 13.5,13 14.5,12 13.5,11" fill="currentColor" opacity="0.35" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

/* ── AbyssLantern ─ deep-sea anglerfish light ──────────────── */
export function AbyssLantern(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M9 16h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M10 19h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15 9a3 3 0 1 0-3 3v4"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M9 9a3 3 0 0 1 3-3"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M12 2v3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

/* ── DiverProfile ─ explorer silhouette ─────────────────────── */
export function DiverProfile(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path
        d="M9.5 7.5h5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <path
        d="M5.5 20c0-3.5 2.9-6.5 6.5-6.5s6.5 3 6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ── CoralHome ─ organic arch dwelling ──────────────────────── */
export function CoralHome(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M12 3C8 3 4 7.5 4 12.5V20h16v-7.5C20 7.5 16 3 12 3z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 20v-4a3 3 0 0 1 6 0v4"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── TidalSend ─ directional current ───────────────────────── */
export function TidalSend(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <path
        d="M3 12l18-8-8 18-2-8-8-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M11 13L21 4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  )
}

/* ── SonarConfirm ─ confirmed ping ─────────────────────────── */
export function SonarConfirm(props: IconProps) {
  return (
    <svg {...iconDefaults(props)}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" fill="none" />
      <path
        d="M8 12l3 3 5-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
