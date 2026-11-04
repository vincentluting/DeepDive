// ============================================================
// Tests for TwIVI Scoring (Ipsative Centering)
// ============================================================

import { describe, it, expect } from 'vitest';
import { scoreDDVQ21, DDVQ21_VALUE_MAP, DDVQ21_HIGHER_ORDER } from '../score-ddvq21';

// ============================================================
// Helper: Generate all-same answers for 20 items (IDs 1-20)
// ============================================================

function allSameAnswers(rating: number): Record<number, number> {
  const answers: Record<number, number> = {};
  for (let i = 1; i <= 20; i++) {
    answers[i] = rating;
  }
  return answers;
}

// ============================================================
// Tests
// ============================================================

describe('scoreDDVQ21', () => {
  describe('basic structure', () => {
    it('should return raw, centered, higherOrder, ranking, and top3', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      expect(result).toHaveProperty('raw');
      expect(result).toHaveProperty('centered');
      expect(result).toHaveProperty('higherOrder');
      expect(result).toHaveProperty('ranking');
      expect(result).toHaveProperty('top3');
    });

    it('should have 10 value types in raw scores', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      const expectedTypes = [
        'self-direction', 'stimulation', 'hedonism', 'achievement', 'power',
        'security', 'conformity', 'tradition', 'benevolence', 'universalism',
      ];
      for (const type of expectedTypes) {
        expect(result.raw).toHaveProperty(type);
        expect(result.centered).toHaveProperty(type);
      }
    });

    it('should have 4 higher-order dimensions', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      expect(Object.keys(result.higherOrder)).toHaveLength(4);
      expect(result.higherOrder).toHaveProperty('openness-to-change');
      expect(result.higherOrder).toHaveProperty('self-enhancement');
      expect(result.higherOrder).toHaveProperty('conservation');
      expect(result.higherOrder).toHaveProperty('self-transcendence');
    });

    it('should have ranking with 10 items', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      expect(result.ranking).toHaveLength(10);
    });

    it('should have top3 with 3 items', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      expect(result.top3).toHaveLength(3);
    });
  });

  describe('ipsative centering', () => {
    it('should produce all-zero centered scores when all answers are the same', () => {
      for (const rating of [1, 3, 6]) {
        const result = scoreDDVQ21(allSameAnswers(rating));
        for (const score of Object.values(result.centered)) {
          expect(score).toBe(0);
        }
      }
    });

    it('should produce positive centered scores for above-average values', () => {
      // Rate achievement items high (6), everything else moderate (3)
      const answers = allSameAnswers(3);
      // TwIVI achievement items: 8, 18
      answers[8] = 6;
      answers[18] = 6;

      const result = scoreDDVQ21(answers);
      expect(result.centered.achievement).toBeGreaterThan(0);
    });

    it('should produce negative centered scores for below-average values', () => {
      // Rate power items low (1), everything else high (5)
      const answers = allSameAnswers(5);
      // TwIVI power items: 9, 19
      answers[9] = 1;
      answers[19] = 1;

      const result = scoreDDVQ21(answers);
      expect(result.centered.power).toBeLessThan(0);
    });

    it('should compute correct MRAT and centered values for a known case', () => {
      // Set up a simple scenario: all items = 3 except tradition (2, 12) = 6
      const answers = allSameAnswers(3);
      answers[2] = 6;
      answers[12] = 6;

      const result = scoreDDVQ21(answers);

      // MRAT = (18 * 3 + 2 * 6) / 20 = (54 + 12) / 20 = 3.3
      const expectedMrat = (18 * 3 + 2 * 6) / 20;

      // Tradition raw = mean(6, 6) = 6
      expect(result.raw.tradition).toBe(6);
      // Tradition centered = 6 - MRAT
      expect(result.centered.tradition).toBeCloseTo(6 - expectedMrat, 1);

      // Other 2-item types raw = 3
      expect(result.raw['self-direction']).toBe(3);
      expect(result.centered['self-direction']).toBeCloseTo(3 - expectedMrat, 1);
    });

    it('should have centered scores summing approximately to zero', () => {
      // Generate random answers
      const answers: Record<number, number> = {};
      for (let i = 1; i <= 20; i++) {
        answers[i] = Math.floor(Math.random() * 6) + 1;
      }
      const result = scoreDDVQ21(answers);

      const centeredValues = Object.values(result.centered);
      const sum = centeredValues.reduce((a, b) => a + b, 0);
      // All values have 2 items each, so sum should be very close to zero
      expect(Math.abs(sum)).toBeLessThan(1);
    });
  });

  describe('higher-order dimensions', () => {
    it('should compute higher-order as mean of constituent centered scores', () => {
      const answers = allSameAnswers(3);
      // Boost self-direction (5, 15) and stimulation (6, 16) for openness-to-change
      answers[5] = 6; answers[15] = 6;
      answers[6] = 6; answers[16] = 6;

      const result = scoreDDVQ21(answers);

      // openness-to-change = mean(centered['self-direction'], centered['stimulation'])
      const expected = (result.centered['self-direction'] + result.centered.stimulation) / 2;
      expect(result.higherOrder['openness-to-change']).toBeCloseTo(expected, 2);
    });

    it('should have all-zero higher-order when all answers are the same', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      for (const score of Object.values(result.higherOrder)) {
        expect(score).toBe(0);
      }
    });

    it('should reflect self-enhancement from achievement + power + hedonism', () => {
      const answers = allSameAnswers(3);
      // Boost achievement (8, 18), power (9, 19), hedonism (7, 17)
      answers[8] = 6; answers[18] = 6;
      answers[9] = 6; answers[19] = 6;
      answers[7] = 6; answers[17] = 6;

      const result = scoreDDVQ21(answers);
      expect(result.higherOrder['self-enhancement']).toBeGreaterThan(0);
      // Conservation should be negative since those items stayed at 3
      expect(result.higherOrder['conservation']).toBeLessThan(0);
    });

    it('should reflect conservation from security + conformity + tradition', () => {
      const answers = allSameAnswers(3);
      // Boost security (10, 20), conformity (1, 11), tradition (2, 12)
      answers[10] = 6; answers[20] = 6;
      answers[1] = 6; answers[11] = 6;
      answers[2] = 6; answers[12] = 6;

      const result = scoreDDVQ21(answers);
      expect(result.higherOrder['conservation']).toBeGreaterThan(0);
    });

    it('should reflect self-transcendence from benevolence + universalism', () => {
      const answers = allSameAnswers(3);
      // Boost benevolence (3, 13), universalism (4, 14)
      answers[3] = 6; answers[13] = 6;
      answers[4] = 6; answers[14] = 6;

      const result = scoreDDVQ21(answers);
      expect(result.higherOrder['self-transcendence']).toBeGreaterThan(0);
    });
  });

  describe('ranking', () => {
    it('should rank highest centered score first', () => {
      const answers = allSameAnswers(3);
      // Set self-direction to 6 (items 5, 15)
      answers[5] = 6;
      answers[15] = 6;

      const result = scoreDDVQ21(answers);
      expect(result.ranking[0]).toBe('self-direction');
    });

    it('should have top3 be the first 3 in ranking', () => {
      const answers = allSameAnswers(3);
      // Set three value types to high scores
      answers[5] = 6; answers[15] = 6;   // self-direction = 6
      answers[6] = 6; answers[16] = 6;   // stimulation = 6
      answers[7] = 6; answers[17] = 6;   // hedonism = 6

      const result = scoreDDVQ21(answers);
      expect(result.top3).toEqual(result.ranking.slice(0, 3));
    });

    it('should include all 10 value types in ranking', () => {
      const result = scoreDDVQ21(allSameAnswers(4));
      const expectedTypes = new Set([
        'self-direction', 'stimulation', 'hedonism', 'achievement', 'power',
        'security', 'conformity', 'tradition', 'benevolence', 'universalism',
      ]);
      expect(result.ranking).toHaveLength(10);
      for (const type of result.ranking) {
        expect(expectedTypes.has(type)).toBe(true);
      }
    });
  });

  describe('raw scores', () => {
    it('should compute raw score as mean of assigned items', () => {
      const answers = allSameAnswers(3);
      // Self-direction items 5, 15 → set to 5 and 3
      answers[5] = 5;
      answers[15] = 3;

      const result = scoreDDVQ21(answers);
      expect(result.raw['self-direction']).toBe(4); // mean of (5, 3)
    });

    it('should compute correct raw for universalism (2 items)', () => {
      const answers = allSameAnswers(3);
      // Universalism items: 4, 14
      answers[4] = 6;
      answers[14] = 4;

      const result = scoreDDVQ21(answers);
      expect(result.raw.universalism).toBe(5); // mean of (6, 4)
    });

    it('should compute correct raw for all-same at boundary values', () => {
      const resultMin = scoreDDVQ21(allSameAnswers(1));
      const resultMax = scoreDDVQ21(allSameAnswers(6));
      for (const type of Object.keys(resultMin.raw)) {
        expect(resultMin.raw[type as keyof typeof resultMin.raw]).toBe(1);
        expect(resultMax.raw[type as keyof typeof resultMax.raw]).toBe(6);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty answers', () => {
      const result = scoreDDVQ21({});
      for (const score of Object.values(result.raw)) {
        expect(score).toBe(0);
      }
      for (const score of Object.values(result.centered)) {
        expect(score).toBe(0);
      }
      for (const score of Object.values(result.higherOrder)) {
        expect(score).toBe(0);
      }
    });

    it('should handle partial answers', () => {
      // Only answer items for one value type
      const answers: Record<number, number> = { 5: 5, 15: 5 }; // self-direction only
      const result = scoreDDVQ21(answers);
      expect(result.raw['self-direction']).toBe(5);
      // Other types should be 0 (no items answered)
      expect(result.raw.power).toBe(0);
    });

    it('should handle extreme scores (all 1s vs all 6s)', () => {
      const result1 = scoreDDVQ21(allSameAnswers(1));
      const result6 = scoreDDVQ21(allSameAnswers(6));

      // Both should have all-zero centered scores
      for (const type of Object.keys(result1.centered)) {
        expect(result1.centered[type as keyof typeof result1.centered]).toBe(0);
        expect(result6.centered[type as keyof typeof result6.centered]).toBe(0);
      }

      // Raw scores should be 1 and 6 respectively
      for (const type of Object.keys(result1.raw)) {
        expect(result1.raw[type as keyof typeof result1.raw]).toBe(1);
        expect(result6.raw[type as keyof typeof result6.raw]).toBe(6);
      }
    });
  });

  describe('data integrity', () => {
    it('should have all 20 item IDs covered in DDVQ21_VALUE_MAP', () => {
      const allItemIds = new Set<number>();
      for (const itemIds of Object.values(DDVQ21_VALUE_MAP)) {
        for (const id of itemIds) {
          allItemIds.add(id);
        }
      }
      expect(allItemIds.size).toBe(20);
      // Verify it's exactly items 1-20
      for (let i = 1; i <= 20; i++) {
        expect(allItemIds.has(i)).toBe(true);
      }
    });

    it('should have 10 value types in DDVQ21_VALUE_MAP', () => {
      expect(Object.keys(DDVQ21_VALUE_MAP)).toHaveLength(10);
    });

    it('should have all values with exactly 2 items each', () => {
      for (const [, items] of Object.entries(DDVQ21_VALUE_MAP)) {
        expect(items).toHaveLength(2);
      }
    });

    it('should have 4 higher-order dimensions in DDVQ21_HIGHER_ORDER', () => {
      expect(Object.keys(DDVQ21_HIGHER_ORDER)).toHaveLength(4);
    });

    it('should cover all 10 value types across higher-order dimensions', () => {
      const allValues = new Set<string>();
      for (const values of Object.values(DDVQ21_HIGHER_ORDER)) {
        for (const v of values) {
          allValues.add(v);
        }
      }
      // Hedonism is only in self-enhancement, so total unique = 10
      expect(allValues.size).toBe(10);
    });
  });
});
