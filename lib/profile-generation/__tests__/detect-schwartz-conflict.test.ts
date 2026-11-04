// ============================================================
// Tests: detectSchwartzConflict
// ============================================================

import { describe, it, expect } from 'vitest';
import { detectSchwartzConflict } from '../detect-schwartz-conflict';
import type { SchwartzValue } from '@/lib/types/dimensions';

function makecentered(overrides: Partial<Record<SchwartzValue, number>> = {}): Record<SchwartzValue, number> {
  return {
    achievement: 0,
    power: 0,
    stimulation: 0,
    'self-direction': 0,
    hedonism: 0,
    benevolence: 0,
    universalism: 0,
    conformity: 0,
    tradition: 0,
    security: 0,
    ...overrides,
  };
}

describe('detectSchwartzConflict', () => {
  it('returns null when all centered scores are near zero', () => {
    expect(detectSchwartzConflict(makecentered())).toBeNull();
  });

  it('detects achievement vs benevolence conflict (Self-Enhancement ↔ Self-Transcendence)', () => {
    const centered = makecentered({
      achievement: 0.8,
      benevolence: 0.6,
    });
    expect(detectSchwartzConflict(centered)).toBe('achievement_benevolence');
  });

  it('detects power vs universalism conflict', () => {
    const centered = makecentered({
      power: 0.5,
      universalism: 0.7,
    });
    expect(detectSchwartzConflict(centered)).toBe('power_universalism');
  });

  it('detects autonomy vs conformity conflict (Openness ↔ Conservation)', () => {
    const centered = makecentered({
      'self-direction': 0.6,
      conformity: 0.5,
    });
    expect(detectSchwartzConflict(centered)).toBe('autonomy_conformity');
  });

  it('detects stimulation vs security conflict', () => {
    const centered = makecentered({
      stimulation: 0.5,
      security: 0.5,
    });
    expect(detectSchwartzConflict(centered)).toBe('stimulation_security');
  });

  it('returns null when one side is below threshold', () => {
    const centered = makecentered({
      achievement: 0.8,
      benevolence: 0.1, // below 0.3 threshold
    });
    expect(detectSchwartzConflict(centered)).toBeNull();
  });

  it('returns null when combined strength is below minimum', () => {
    const centered = makecentered({
      achievement: 0.35,
      benevolence: 0.35,
      // sum = 0.7, below MIN_CONFLICT_STRENGTH of 0.8
    });
    expect(detectSchwartzConflict(centered)).toBeNull();
  });

  it('returns the strongest conflict when multiple pairs qualify', () => {
    const centered = makecentered({
      achievement: 0.5,
      benevolence: 0.5,    // strength = 1.0
      'self-direction': 0.8,
      conformity: 0.7,     // strength = 1.5 (stronger)
    });
    expect(detectSchwartzConflict(centered)).toBe('autonomy_conformity');
  });

  it('handles missing values gracefully (defaults to 0)', () => {
    const partial = { achievement: 0.8, benevolence: 0.6 } as Record<SchwartzValue, number>;
    expect(detectSchwartzConflict(partial)).toBe('achievement_benevolence');
  });
});
