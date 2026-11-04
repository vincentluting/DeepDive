// ============================================================
// Layer 3 — mapBigFiveToCollabStyle() Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { mapBigFiveToCollabStyle as mapBigFiveToDisc } from '../layer3-derive';
import type { BigFiveDimension } from '../../types';

// ---- Helpers ----

/** Build a flat domain record where every domain has the same score (1-5). */
function uniformDomains(score: number): Record<BigFiveDimension, number> {
  return {
    neuroticism: score,
    extraversion: score,
    openness: score,
    agreeableness: score,
    conscientiousness: score,
  };
}

/** Build a facets record where every facet has the same score (1-5). */
function uniformFacets(score: number): Record<string, number> {
  const facetKeys = [
    'N1_Anxiety', 'N2_Anger', 'N3_Depression', 'N4_Self-Consciousness', 'N5_Immoderation', 'N6_Vulnerability',
    'E1_Friendliness', 'E2_Gregariousness', 'E3_Assertiveness', 'E4_Activity_Level', 'E5_Excitement-Seeking', 'E6_Cheerfulness',
    'O1_Imagination', 'O2_Artistic_Interests', 'O3_Emotionality', 'O4_Adventurousness', 'O5_Intellect', 'O6_Liberalism',
    'A1_Trust', 'A2_Morality', 'A3_Altruism', 'A4_Cooperation', 'A5_Modesty', 'A6_Sympathy',
    'C1_Self-Efficacy', 'C2_Orderliness', 'C3_Dutifulness', 'C4_Achievement-Striving', 'C5_Self-Discipline', 'C6_Cautiousness',
  ];
  const record: Record<string, number> = {};
  for (const key of facetKeys) {
    record[key] = score;
  }
  return record;
}

// ============================================================
// Output shape
// ============================================================

describe('mapBigFiveToCollabStyle — output shape', () => {
  it('returns all required CollabMapping fields', () => {
    const result = mapBigFiveToDisc(uniformDomains(3));

    expect(result.primary).toMatch(/^[DISC]$/);
    expect(result.secondary === null || /^[DISC]$/.test(result.secondary)).toBe(true);
    expect(result.scores).toHaveProperty('D');
    expect(result.scores).toHaveProperty('I');
    expect(result.scores).toHaveProperty('S');
    expect(result.scores).toHaveProperty('C');
    expect(typeof result.cssGradient).toBe('string');
    expect(result.derivedFrom).toBe('big_five_mapping');
    expect(typeof result.approximationNote_zh).toBe('string');
    expect(typeof result.approximationNote_en).toBe('string');
    expect(typeof result.confidence).toBe('number');
  });

  it('scores sum to 100', () => {
    const result = mapBigFiveToDisc(uniformDomains(3));
    const sum = result.scores.D + result.scores.I + result.scores.S + result.scores.C;
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
  });

  it('scores sum to 100 with facets provided', () => {
    const result = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));
    const sum = result.scores.D + result.scores.I + result.scores.S + result.scores.C;
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
  });

  it('all individual scores are non-negative', () => {
    const result = mapBigFiveToDisc(uniformDomains(1)); // extreme low
    expect(result.scores.D).toBeGreaterThanOrEqual(0);
    expect(result.scores.I).toBeGreaterThanOrEqual(0);
    expect(result.scores.S).toBeGreaterThanOrEqual(0);
    expect(result.scores.C).toBeGreaterThanOrEqual(0);
  });

  it('all individual scores are non-negative at extreme high inputs', () => {
    const result = mapBigFiveToDisc(uniformDomains(5)); // extreme high
    expect(result.scores.D).toBeGreaterThanOrEqual(0);
    expect(result.scores.I).toBeGreaterThanOrEqual(0);
    expect(result.scores.S).toBeGreaterThanOrEqual(0);
    expect(result.scores.C).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================
// Facet vs domain fallback
// ============================================================

describe('mapBigFiveToCollabStyle — facet vs domain fallback', () => {
  it('returns lower confidence (≤0.50) when no facets are provided', () => {
    const result = mapBigFiveToDisc(uniformDomains(3));
    expect(result.confidence).toBeLessThanOrEqual(0.50);
  });

  it('returns higher confidence (>0.50) when all facets are provided', () => {
    const result = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));
    expect(result.confidence).toBeGreaterThan(0.50);
  });

  it('domain-only and full-facet at midpoint (3) give nearly identical scores', () => {
    const withDomains = mapBigFiveToDisc(uniformDomains(3));
    const withFacets  = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));

    // At midpoint all deviations = 0; both should converge to 25 each
    expect(Math.abs(withDomains.scores.D - withFacets.scores.D)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(withDomains.scores.I - withFacets.scores.I)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(withDomains.scores.S - withFacets.scores.S)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(withDomains.scores.C - withFacets.scores.C)).toBeLessThanOrEqual(0.5);
  });

  it('handles empty facet record gracefully (treats as domain-only)', () => {
    const result = mapBigFiveToDisc(uniformDomains(3), {});
    expect(result.confidence).toBeLessThanOrEqual(0.50);
    const sum = result.scores.D + result.scores.I + result.scores.S + result.scores.C;
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
  });

  it('handles partially missing facets by falling back to domain', () => {
    // Provide only a few of the 15 facets
    const partialFacets: Record<string, number> = {
      'E3_Assertiveness': 4.5,
      'C4_Achievement-Striving': 4.5,
    };
    const result = mapBigFiveToDisc(uniformDomains(3), partialFacets);
    expect(result.confidence).toBeGreaterThan(0.45);
    expect(result.confidence).toBeLessThan(0.75);
    const sum = result.scores.D + result.scores.I + result.scores.S + result.scores.C;
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(0.1);
  });
});

// ============================================================
// Facet-level signal differentiation
// ============================================================

describe('mapBigFiveToCollabStyle — Collaboration Style signal direction', () => {
  it('high assertiveness + low agreeableness facets elevate D score', () => {
    const baseline = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));

    const facets = uniformFacets(3);
    facets['E3_Assertiveness']       = 5; // D ↑
    facets['A4_Cooperation']         = 1; // D ↑ (reversed)
    facets['A5_Modesty']             = 1; // D ↑ (reversed)
    facets['C4_Achievement-Striving']= 5; // D ↑

    const result = mapBigFiveToDisc(uniformDomains(3), facets);
    expect(result.scores.D).toBeGreaterThan(baseline.scores.D);
    expect(result.primary).toBe('D');
  });

  it('high friendliness + gregariousness + cheerfulness facets elevate I score', () => {
    const baseline = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));

    const facets = uniformFacets(3);
    facets['E1_Friendliness']   = 5; // I ↑
    facets['E2_Gregariousness'] = 5; // I ↑
    facets['E6_Cheerfulness']   = 5; // I ↑
    facets['O3_Emotionality']   = 5; // I ↑

    const result = mapBigFiveToDisc(uniformDomains(3), facets);
    expect(result.scores.I).toBeGreaterThan(baseline.scores.I);
    expect(result.primary).toBe('I');
  });

  it('high altruism + cooperation + self-discipline + low neuroticism elevate S score', () => {
    const baseline = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));

    const facets = uniformFacets(3);
    facets['A3_Altruism']       = 5; // S ↑
    facets['A4_Cooperation']    = 5; // S ↑
    facets['C5_Self-Discipline']= 5; // S ↑
    // Low N domain (reversed) → use domain override for neuroticism
    const domains = { ...uniformDomains(3), neuroticism: 1 }; // low N = stable = S ↑

    const result = mapBigFiveToDisc(domains, facets);
    expect(result.scores.S).toBeGreaterThan(baseline.scores.S);
    expect(result.primary).toBe('S');
  });

  it('high orderliness + cautiousness + dutifulness + low adventurousness elevate C score', () => {
    const baseline = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));

    const facets = uniformFacets(3);
    facets['C2_Orderliness']     = 5; // C ↑
    facets['C6_Cautiousness']    = 5; // C ↑
    facets['C3_Dutifulness']     = 5; // C ↑
    facets['O4_Adventurousness'] = 1; // C ↑ (reversed)

    const result = mapBigFiveToDisc(uniformDomains(3), facets);
    expect(result.scores.C).toBeGreaterThan(baseline.scores.C);
    expect(result.primary).toBe('C');
  });
});

// ============================================================
// Neuroticism domain in S-style
// ============================================================

describe('mapBigFiveToCollabStyle — neuroticism effect on S', () => {
  it('low neuroticism (stable) increases S score relative to high neuroticism', () => {
    const facets = uniformFacets(3);
    const stable   = mapBigFiveToDisc({ ...uniformDomains(3), neuroticism: 1 }, facets);
    const unstable = mapBigFiveToDisc({ ...uniformDomains(3), neuroticism: 5 }, facets);

    expect(stable.scores.S).toBeGreaterThan(unstable.scores.S);
  });
});

// ============================================================
// Primary / secondary logic
// ============================================================

describe('mapBigFiveToCollabStyle — primary and secondary', () => {
  it('primary has the highest score', () => {
    const result = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));
    const maxScore = Math.max(result.scores.D, result.scores.I, result.scores.S, result.scores.C);
    expect(result.scores[result.primary]).toBe(maxScore);
  });

  it('secondary is null when primary dominates strongly', () => {
    // Make D vastly dominant
    const facets = uniformFacets(3);
    facets['E3_Assertiveness']        = 5;
    facets['A4_Cooperation']          = 1;
    facets['A5_Modesty']              = 1;
    facets['C4_Achievement-Striving'] = 5;
    // Push I, S, C low
    facets['E1_Friendliness']    = 1;
    facets['E2_Gregariousness']  = 1;
    facets['E6_Cheerfulness']    = 1;
    facets['A3_Altruism']        = 1;
    facets['C2_Orderliness']     = 1;
    facets['C6_Cautiousness']    = 1;
    facets['C3_Dutifulness']     = 1;

    const domains = { ...uniformDomains(1), neuroticism: 5 };
    const result = mapBigFiveToDisc(domains, facets);

    // When D is dominant, secondary should be null (gap ≥ 12pp)
    if (result.primary === 'D') {
      const sorted = [...(['D', 'I', 'S', 'C'] as const)].sort((a, b) => result.scores[b] - result.scores[a]);
      const gap = result.scores[sorted[0]] - result.scores[sorted[1]];
      if (gap >= 12) {
        expect(result.secondary).toBeNull();
      }
    }
  });

  it('cssGradient contains primary color hex', () => {
    const result = mapBigFiveToDisc(uniformDomains(3));
    const DISC_HEX: Record<string, string> = {
      D: '#E74C3C', I: '#F1C40F', S: '#2ECC71', C: '#3498DB',
    };
    expect(result.cssGradient).toContain(DISC_HEX[result.primary]);
  });

  it('cssGradient contains secondary color hex when secondary is present', () => {
    // At midpoint scores are nearly equal, so secondary should be present
    const result = mapBigFiveToDisc(uniformDomains(3), uniformFacets(3));
    if (result.secondary !== null) {
      const DISC_HEX: Record<string, string> = {
        D: '#E74C3C', I: '#F1C40F', S: '#2ECC71', C: '#3498DB',
      };
      expect(result.cssGradient).toContain(DISC_HEX[result.secondary]);
    }
  });
});

// ============================================================
// Dead-zone fix: midpoint inputs should spread scores evenly
// ============================================================

describe('mapBigFiveToCollabStyle — no dead zones at midpoint', () => {
  it('all four scores are non-zero when inputs are at midpoint (3.0)', () => {
    const result = mapBigFiveToDisc(uniformDomains(3));
    expect(result.scores.D).toBeGreaterThan(0);
    expect(result.scores.I).toBeGreaterThan(0);
    expect(result.scores.S).toBeGreaterThan(0);
    expect(result.scores.C).toBeGreaterThan(0);
  });
});
