// ============================================================
// Immersive Explore — Design Tokens
// ============================================================
// Centralized visual vocabulary for the warm archive aesthetic.
// All immersive-explore components reference these tokens
// instead of hardcoding rgba/hex values inline.
//
// WHY separate from globals.css?
// The immersive module uses a warm-brown-gold palette that is
// visually distinct from the ocean-blue depth spectrum used
// everywhere else in the product. Keeping them co-located with
// the module makes the boundary explicit.
// ============================================================

// ── Base Palette ────────────────────────────────────────────

export const C = {
  // Background layers (deepest → lightest)
  bgDeepest:  '#0A0806',
  bgDeep:     '#0F0C06',
  bgWarm:     '#1A1408',
  bgCard:     '#1A1610',
  bgSurface:  '#0A0A0A',
  bgEnvelope: '#12100E',

  // Text layers (brightest → faintest)
  textBright:    'rgba(245, 235, 220, 0.92)',
  textPrimary:   'rgba(245, 235, 220, 0.75)',
  textSecondary: 'rgba(200, 185, 165, 0.8)',
  textTertiary:  'rgba(200, 185, 165, 0.65)',
  textMuted:     'rgba(180, 160, 140, 0.4)',
  textFaint:     'rgba(180, 160, 140, 0.3)',

  // Gold accent family
  gold:        'rgba(240, 220, 170, 0.9)',
  goldMuted:   'rgba(240, 220, 170, 0.5)',
  goldSubtle:  'rgba(240, 220, 170, 0.85)',

  // Warm brown (interactive elements)
  brown:       'rgba(139, 104, 64, 0.8)',
  brownMuted:  'rgba(139, 104, 64, 0.3)',
  brownSubtle: 'rgba(139, 104, 64, 0.2)',
  brownFaint:  'rgba(139, 104, 64, 0.5)',
  brownBright: 'rgba(160, 130, 80, 0.6)',
  brownActive: 'rgba(160, 130, 80, 0.8)',
  brownHighlight: 'rgba(240, 220, 170, 0.9)',

  // White overlay
  whiteSubtle:  'rgba(255, 255, 255, 0.03)',
  whiteBorder:  'rgba(255, 255, 255, 0.06)',
  whiteMid:     'rgba(255, 255, 255, 0.08)',
  whiteMuted:   'rgba(255, 255, 255, 0.15)',

  // Black overlay
  blackLight:   'rgba(0, 0, 0, 0.3)',
  blackMid:     'rgba(0, 0, 0, 0.5)',
  blackHeavy:   'rgba(0, 0, 0, 0.6)',

  // Seal (envelope-specific reds)
  sealDark:   '#6B1A1A',
  sealMid:    '#8B2E2E',
  sealGlow:   'rgba(180, 70, 70, 0.4)',
  sealBorder: 'rgba(140, 50, 50, 0.6)',
  sealBg:     'rgba(140, 50, 50, 0.08)',
  sealText:   'rgba(180, 70, 70, 0.7)',
  sealMuted:  'rgba(140, 50, 50, 0.5)',

  // Invitation-specific
  invCardBg:     'rgba(80, 68, 50, 0.15)',
  invCardBorder: 'rgba(80, 68, 50, 0.3)',
  invCardHover:  'rgba(80, 68, 50, 0.25)',
  invText:       'rgba(200, 185, 165, 0.7)',
  invTextHover:  'rgba(200, 185, 165, 0.8)',
  invSealText:   '#C4958F',

  // Archive ceremony (generating phase)
  ceremonySeal:       'rgba(112, 96, 80, 0.6)',   // #706050 taupe at 60%
  ceremonySealGlow:   'rgba(112, 96, 80, 0.25)',
  ceremonySealBright: 'rgba(160, 140, 110, 0.8)',
  ceremonySealFaint:  'rgba(112, 96, 80, 0.12)',
  ceremonyText:       'rgba(200, 185, 165, 0.6)',

  // Rules-specific
  rulesGradientFrom: 'rgba(100, 40, 40, 0.3)',
  rulesGradientTo:   'rgba(80, 30, 30, 0.2)',
  rulesBorder:       'rgba(140, 50, 50, 0.3)',
  rulesText:         'rgba(220, 200, 180, 0.8)',
  rulesShadow:       'rgba(100, 40, 40, 0.15)',
  rulesShadowHover:  'rgba(100, 40, 40, 0.25)',
  rulesBorderHover:  'rgba(140, 50, 50, 0.5)',
} as const

// ── Gradients ───────────────────────────────────────────────

export const GRADIENTS = {
  shellBg:   `radial-gradient(ellipse at 50% 60%, ${C.bgWarm} 0%, ${C.bgDeep} 50%, ${C.bgDeepest} 100%)`,
  cardDark:  `linear-gradient(170deg, ${C.bgCard} 0%, #141008 100%)`,
  charsBg:   `radial-gradient(ellipse at 50% 30%, ${C.bgEnvelope} 0%, ${C.bgDeepest} 100%)`,
} as const

// ── Animation Timing ────────────────────────────────────────

export const T = {
  // Durations (seconds)
  instant:   0.15,
  fast:      0.3,
  normal:    0.5,
  slow:      0.8,
  dramatic:  1.6,

  // Stagger delay factors (seconds per item)
  staggerTight:  0.05,
  staggerNormal: 0.15,
  staggerWide:   0.3,
  staggerItem:   0.2,     // body paragraphs, rule items
  staggerRuleItem: 0.4,   // rules phase items (slower for drama)

  // Standard easing — matches globals.css --ease-out-quint
  ease: [0.22, 1, 0.36, 1] as const,
} as const

// ── Button Style Utilities ──────────────────────────────────

export interface LikertButtonStyle {
  background: string
  border: string
  color: string
  boxShadow: string
  opacity: number
}

/**
 * Compute inline styles for a Likert scale button.
 * Keeps the 50+ lines of conditional styling out of JSX.
 */
export function getLikertButtonStyle(opts: {
  isSelected: boolean
  accentColor: string
  disabled: boolean
}): LikertButtonStyle {
  const { isSelected, accentColor, disabled } = opts

  if (isSelected) {
    return {
      background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
      border: `1.5px solid ${accentColor}50`,
      color: `${accentColor}E6`,
      boxShadow: `0 0 20px ${accentColor}15, inset 0 1px 0 ${C.whiteMid}`,
      opacity: 1,
    }
  }

  return {
    background: `${C.whiteSubtle}`,
    border: `1px solid ${C.whiteBorder}`,
    color: C.textPrimary,
    boxShadow: 'none',
    opacity: disabled ? 0.35 : 1,
  }
}

/**
 * Style presets for CTA buttons across immersive phases.
 */
export function getCtaStyle(variant: 'gold' | 'seal' | 'ghost'): Record<string, string> {
  switch (variant) {
    case 'gold':
      return {
        background: C.brownSubtle,
        border: `1px solid ${C.brownMuted}`,
        color: C.goldSubtle,
      }
    case 'seal':
      return {
        background: `linear-gradient(135deg, ${C.rulesGradientFrom}, ${C.rulesGradientTo})`,
        border: `1px solid ${C.rulesBorder}`,
        color: C.rulesText,
        boxShadow: `0 4px 20px ${C.rulesShadow}`,
      }
    case 'ghost':
      return {
        background: C.invCardBg,
        border: `1px solid ${C.invCardBorder}`,
        color: C.invText,
      }
    default:
      return {}
  }
}
