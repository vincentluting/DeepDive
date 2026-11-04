// ============================================================
// Tests: detectIntraDomainTensions
// ============================================================

import { describe, it, expect } from 'vitest';
import { detectIntraDomainTensions, type FacetPairInput } from '../detect-facet-tensions';

describe('detectIntraDomainTensions', () => {
  it('returns empty array when no facets deviate beyond threshold', () => {
    const facets: FacetPairInput[] = [
      { domain: 'extraversion', facet: 'E1', score: 3.0, deviationFromMean: 0.1 },
      { domain: 'extraversion', facet: 'E2', score: 2.9, deviationFromMean: -0.1 },
      { domain: 'extraversion', facet: 'E3', score: 3.1, deviationFromMean: 0.2 },
    ];
    expect(detectIntraDomainTensions(facets)).toEqual([]);
  });

  it('detects a tension when facets deviate in opposite directions', () => {
    const facets: FacetPairInput[] = [
      { domain: 'extraversion', facet: 'E3_Assertiveness', score: 4.2, deviationFromMean: 0.8 },
      { domain: 'extraversion', facet: 'E2_Gregariousness', score: 1.5, deviationFromMean: -1.5 },
      { domain: 'extraversion', facet: 'E1_Friendliness', score: 3.0, deviationFromMean: 0.0 },
    ];

    const result = detectIntraDomainTensions(facets);
    expect(result).toHaveLength(1);
    expect(result[0].domain).toBe('extraversion');
    expect(result[0].high.facet).toBe('E3_Assertiveness');
    expect(result[0].low.facet).toBe('E2_Gregariousness');
    expect(result[0].tensionStrength).toBeCloseTo(2.3); // 0.8 + 1.5
  });

  it('returns tensions sorted by strength (strongest first)', () => {
    const facets: FacetPairInput[] = [
      // Weak tension in extraversion
      { domain: 'extraversion', facet: 'E3', score: 3.5, deviationFromMean: 0.3 },
      { domain: 'extraversion', facet: 'E2', score: 2.5, deviationFromMean: -0.5 },
      // Strong tension in conscientiousness
      { domain: 'conscientiousness', facet: 'C1', score: 4.5, deviationFromMean: 1.2 },
      { domain: 'conscientiousness', facet: 'C6', score: 1.8, deviationFromMean: -1.5 },
    ];

    const result = detectIntraDomainTensions(facets);
    expect(result).toHaveLength(2);
    expect(result[0].domain).toBe('conscientiousness');
    expect(result[1].domain).toBe('extraversion');
  });

  it('respects maxResults parameter', () => {
    const facets: FacetPairInput[] = [
      { domain: 'extraversion', facet: 'E3', score: 4.0, deviationFromMean: 0.5 },
      { domain: 'extraversion', facet: 'E2', score: 2.0, deviationFromMean: -1.0 },
      { domain: 'conscientiousness', facet: 'C1', score: 4.5, deviationFromMean: 1.2 },
      { domain: 'conscientiousness', facet: 'C6', score: 1.8, deviationFromMean: -1.5 },
      { domain: 'openness', facet: 'O1', score: 4.0, deviationFromMean: 0.8 },
      { domain: 'openness', facet: 'O6', score: 2.0, deviationFromMean: -0.6 },
    ];

    expect(detectIntraDomainTensions(facets, 1)).toHaveLength(1);
    expect(detectIntraDomainTensions(facets, 2)).toHaveLength(2);
  });

  it('picks strongest positive and negative within each domain', () => {
    const facets: FacetPairInput[] = [
      { domain: 'openness', facet: 'O1', score: 4.0, deviationFromMean: 0.5 },
      { domain: 'openness', facet: 'O5', score: 4.5, deviationFromMean: 1.0 },  // stronger positive
      { domain: 'openness', facet: 'O6', score: 2.0, deviationFromMean: -0.6 },
      { domain: 'openness', facet: 'O2', score: 1.5, deviationFromMean: -1.2 }, // stronger negative
    ];

    const result = detectIntraDomainTensions(facets);
    expect(result).toHaveLength(1);
    expect(result[0].high.facet).toBe('O5');
    expect(result[0].low.facet).toBe('O2');
  });

  it('handles empty input', () => {
    expect(detectIntraDomainTensions([])).toEqual([]);
  });

  it('ignores domains with only positive or only negative deviations', () => {
    const facets: FacetPairInput[] = [
      { domain: 'agreeableness', facet: 'A1', score: 4.0, deviationFromMean: 0.5 },
      { domain: 'agreeableness', facet: 'A2', score: 4.5, deviationFromMean: 1.0 },
      // all positive — no tension
    ];
    expect(detectIntraDomainTensions(facets)).toEqual([]);
  });
});
