// ============================================================
// Tests for IPIP-60 Scoring (Standard-Level Big Five)
// ============================================================

import { describe, it, expect } from 'vitest';
import { scoreIPIP60 } from '../score-ipip60';
import {
  IPIP_60_ITEM_IDS,
  IPIP_60_ITEMS,
  IPIP_60_FACET_ITEM_MAP,
} from '../../questionnaire/module-c-ipip-neo60';
import { DOMAIN_FACETS } from '../../questionnaire/module-c-ipip-neo60';

// ============================================================
// Helpers
// ============================================================

function allSameAnswers(rating: number): Record<number, number> {
  const answers: Record<number, number> = {};
  for (const id of IPIP_60_ITEM_IDS) {
    answers[id] = rating;
  }
  return answers;
}

function singleFacetAnswers(
  facetName: string,
  rating: number,
  baseRating = 3,
): Record<number, number> {
  const answers = allSameAnswers(baseRating);
  const itemIds = IPIP_60_FACET_ITEM_MAP[facetName];
  if (itemIds) {
    for (const id of itemIds) {
      answers[id] = rating;
    }
  }
  return answers;
}

// ============================================================
// Tests
// ============================================================

describe('scoreIPIP60', () => {
  describe('basic structure', () => {
    it('should return domains, facets, domainsNormalized, and precision', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      expect(result).toHaveProperty('domains');
      expect(result).toHaveProperty('facets');
      expect(result).toHaveProperty('domainsNormalized');
      expect(result).toHaveProperty('precision');
    });

    it('should have all 5 domains', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      expect(Object.keys(result.domains)).toHaveLength(5);
      expect(result.domains).toHaveProperty('neuroticism');
      expect(result.domains).toHaveProperty('extraversion');
      expect(result.domains).toHaveProperty('openness');
      expect(result.domains).toHaveProperty('agreeableness');
      expect(result.domains).toHaveProperty('conscientiousness');
    });

    it('should have all 30 facets', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      expect(Object.keys(result.facets)).toHaveLength(30);
    });

    it('should have precision = standard', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      expect(result.precision).toBe('standard');
    });
  });

  describe('reverse scoring', () => {
    it('should correctly reverse-score items (midpoint answers)', () => {
      // All answers = 3 (midpoint). Reverse scoring: 6-3=3. So all facets = 3.
      const result = scoreIPIP60(allSameAnswers(3));
      for (const score of Object.values(result.facets)) {
        expect(score).toBe(3);
      }
    });

    it('should produce correct scores for a facet with opposite keying', () => {
      // E2_Gregariousness: "Love large parties" (+), "Avoid crowds" (R)
      // All answers = 5: positive item → 5, reversed item → 6-5=1
      // Facet mean = (5 + 1) / 2 = 3
      const result = scoreIPIP60(allSameAnswers(5));
      expect(result.facets['E2_Gregariousness']).toBe(3);
    });

    it('should produce symmetric scores for extreme answers (1 vs 5)', () => {
      const resultLow = scoreIPIP60(allSameAnswers(1));
      const resultHigh = scoreIPIP60(allSameAnswers(5));

      // For facets with opposite keying: both extremes average to 3.0
      // E2_Gregariousness: (+) and (R) items → low: (1 + 5)/2 = 3, high: (5 + 1)/2 = 3
      expect(resultLow.facets['E2_Gregariousness']).toBe(3);
      expect(resultHigh.facets['E2_Gregariousness']).toBe(3);
    });
  });

  describe('facet scoring (mean of 2 items)', () => {
    it('should compute facet as mean of 2 items', () => {
      // Set specific values for a facet
      const answers = allSameAnswers(3);
      const facetItems = IPIP_60_FACET_ITEM_MAP['E1_Friendliness'];
      // Look up which items are reversed
      const reversedSet = new Set(
        IPIP_60_ITEMS.filter(i => i.isReversed).map(i => i.id),
      );

      // Set both items to known values
      answers[facetItems[0]] = 4;
      answers[facetItems[1]] = 4;

      const result = scoreIPIP60(answers);

      // After reverse-coding (if applicable), the facet should be the mean
      const score0 = reversedSet.has(facetItems[0]) ? 6 - 4 : 4;
      const score1 = reversedSet.has(facetItems[1]) ? 6 - 4 : 4;
      const expected = (score0 + score1) / 2;
      expect(result.facets['E1_Friendliness']).toBeCloseTo(expected, 1);
    });
  });

  describe('domain scoring', () => {
    it('should compute domain as mean of 6 facets at midpoint', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      for (const domain of Object.values(result.domains)) {
        expect(domain).toBe(3);
      }
    });

    it('should compute correct domain for mixed facet scores', () => {
      // Set both N1_Anxiety items to 5, rest to 3
      const answers = singleFacetAnswers('N1_Anxiety', 5, 3);
      const result = scoreIPIP60(answers);

      // Neuroticism domain = mean of 6 facets
      // N1_Anxiety should differ from 3, other N facets should be 3
      // (exact value depends on Item A/B keying for N1)
      const n1Score = result.facets['N1_Anxiety'];
      expect(n1Score).not.toBe(3); // Should differ since we changed from midpoint

      // Domain should be somewhere between 3 and the extreme
      expect(result.domains.neuroticism).toBeGreaterThanOrEqual(2.5);
      expect(result.domains.neuroticism).toBeLessThanOrEqual(3.5);
    });
  });

  describe('normalization (0-100)', () => {
    it('should normalize midpoint score to 50', () => {
      const result = scoreIPIP60(allSameAnswers(3));
      for (const normalized of Object.values(result.domainsNormalized)) {
        expect(normalized).toBe(50);
      }
    });

    it('should use formula: (mean - 1) / 4 * 100', () => {
      // mean=3 → (3-1)/4*100 = 50
      const result = scoreIPIP60(allSameAnswers(3));
      expect(result.domainsNormalized.neuroticism).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle empty answers', () => {
      const result = scoreIPIP60({});
      for (const score of Object.values(result.facets)) {
        expect(score).toBe(0);
      }
      for (const domain of Object.values(result.domains)) {
        expect(domain).toBe(0);
      }
    });

    it('should handle partial answers (one domain only)', () => {
      // Only answer the Neuroticism items (12 items: 2 per facet × 6 facets)
      const answers: Record<number, number> = {};
      const nFacets = DOMAIN_FACETS.neuroticism;
      for (const facetName of nFacets) {
        const itemIds = IPIP_60_FACET_ITEM_MAP[facetName];
        for (const id of itemIds) {
          answers[id] = 4;
        }
      }
      const result = scoreIPIP60(answers);

      // Neuroticism should have a valid score
      expect(result.domains.neuroticism).toBeGreaterThan(0);
      expect(result.domains.neuroticism).toBeLessThanOrEqual(5);

      // Other domains should be 0 (no answers)
      expect(result.domains.extraversion).toBe(0);
      expect(result.domains.openness).toBe(0);
    });
  });

  describe('data integrity', () => {
    it('should have exactly 60 item IDs', () => {
      expect(IPIP_60_ITEM_IDS).toHaveLength(60);
    });

    it('should have exactly 60 filtered items', () => {
      expect(IPIP_60_ITEMS).toHaveLength(60);
    });

    it('should have 30 facet-to-item mappings', () => {
      expect(Object.keys(IPIP_60_FACET_ITEM_MAP)).toHaveLength(30);
    });

    it('should have exactly 2 items per facet', () => {
      for (const [_facetName, itemIds] of Object.entries(IPIP_60_FACET_ITEM_MAP)) {
        expect(itemIds).toHaveLength(2);
      }
    });

    it('should have sequential IDs from 1 to 60', () => {
      const ids = IPIP_60_ITEM_IDS.sort((a, b) => a - b);
      expect(ids[0]).toBe(1);
        expect(ids[ids.length - 1]).toBe(60);

    });

    it('should cover all 5 domains with 6 facets each', () => {
      const domainCounts: Record<string, number> = {};
      for (const item of IPIP_60_ITEMS) {
        domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
      }
      expect(Object.keys(domainCounts)).toHaveLength(5);
      for (const count of Object.values(domainCounts)) {
        expect(count).toBe(12); // 2 items × 6 facets
      }
    });

    it('should map facets correctly to DOMAIN_FACETS', () => {
      for (const [_domain, facetNames] of Object.entries(DOMAIN_FACETS)) {
        for (const facetName of facetNames) {
          expect(IPIP_60_FACET_ITEM_MAP).toHaveProperty(facetName);
        }
      }
    });

    it('should have no duplicate item IDs', () => {
      const uniqueIds = new Set(IPIP_60_ITEM_IDS);
      expect(uniqueIds.size).toBe(IPIP_60_ITEM_IDS.length);
    });
  });
});
