/**
 * Lightweight haptic feedback utilities
 * Progressive enhancement: silently no-ops when unsupported
 */
export function hapticLight() {
  // Light tap 50ms — used for: option selection confirmation
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }
}

export function hapticMedium() {
  // Medium pulse 15ms — used for: start button press
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(15)
  }
}

export function hapticSuccess() {
  // Triple pulse — used for: archetype reveal, generation complete
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([10, 50, 20])
  }
}


export function hapticDepthDescent() {
  // Phase transition — tactile pattern for depth descent
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([12, 35, 8, 35, 20])
  }
}

export function hapticTap() {
  // Micro tap 8ms — used for: tab bar selection, navigation taps
  // Shorter than hapticLight to feel like a crisp "tick"
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8)
  }
}
