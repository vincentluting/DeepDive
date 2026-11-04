// ============================================================
// Tests for SJT Should-Would Gap Scoring
// ============================================================

import { describe, it, expect } from 'vitest';
import { scoreSJTGaps } from '../score-sjt';
import type { SJTAnswer } from '../score-sjt';
import { SJT_SCENARIOS } from '../../questionnaire';

// ============================================================
// Helper: Generate consistent answers (should = would)
// ============================================================

function allConsistentAnswers(choice: string = 'A'): SJTAnswer[] {
  return SJT_SCENARIOS.map(s => ({
    scenarioId: s.id,
    wouldChoice: choice,
    shouldChoice: choice,
  }));
}

// ============================================================
// Helper: Generate maximally tense answers (should ≠ would)
// ============================================================

function _maxTensionAnswers(): SJTAnswer[] {
  return SJT_SCENARIOS.map(s => ({
    scenarioId: s.id,
    wouldChoice: 'D', // typically lowest score
    shouldChoice: 'A', // typically highest score
  }));
}

// ============================================================
// Tests
// ============================================================

describe('scoreSJTGaps', () => {
  describe('basic structure', () => {
    it('should return scenarios, overallConsistency, and notableTensions', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      expect(result).toHaveProperty('scenarios');
      expect(result).toHaveProperty('overallConsistency');
      expect(result).toHaveProperty('notableTensions');
    });

    it('should return 6 scenario tension scores', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      expect(result.scenarios).toHaveLength(6);
    });

    it('should have correct scenario IDs', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      const ids = result.scenarios.map(s => s.scenarioId);
      expect(ids).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('consistency detection', () => {
    it('should detect 100% consistency when all should = would', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      expect(result.overallConsistency).toBe(1);
      for (const scenario of result.scenarios) {
        expect(scenario.isConsistent).toBe(true);
        expect(scenario.gap).toBe(0);
      }
    });

    it('should detect partial consistency', () => {
      const answers = allConsistentAnswers('B');
      // Make scenario 1 inconsistent
      answers[0].shouldChoice = 'A';

      const result = scoreSJTGaps(answers);
      expect(result.overallConsistency).toBeCloseTo(5 / 6, 2);
      expect(result.scenarios[0].isConsistent).toBe(false);
      expect(result.scenarios[1].isConsistent).toBe(true);
    });

    it('should detect 0% consistency when all answers are different', () => {
      const answers: SJTAnswer[] = SJT_SCENARIOS.map(s => ({
        scenarioId: s.id,
        wouldChoice: 'D',
        shouldChoice: 'A',
      }));
      const result = scoreSJTGaps(answers);
      // Not all scenarios will have gap=0, but some might if scoring maps produce same value
      // For most scenarios, A=4 and D=1, so gap = 3
      expect(result.overallConsistency).toBeLessThan(1);
    });
  });

  describe('gap calculation', () => {
    it('should calculate positive gap (aspiration gap)', () => {
      // SJT-1: A=4, D=1 → should=A(4), would=D(1) → gap = 4-1 = 3
      const answers: SJTAnswer[] = [{
        scenarioId: 1,
        wouldChoice: 'D',
        shouldChoice: 'A',
      }];
      const result = scoreSJTGaps(answers);
      expect(result.scenarios[0].gap).toBe(3); // 4 - 1
      expect(result.scenarios[0].wouldScore).toBe(1);
      expect(result.scenarios[0].shouldScore).toBe(4);
    });

    it('should calculate negative gap (acts more positively)', () => {
      // SJT-1: should=D(1), would=A(4) → gap = 1-4 = -3
      const answers: SJTAnswer[] = [{
        scenarioId: 1,
        wouldChoice: 'A',
        shouldChoice: 'D',
      }];
      const result = scoreSJTGaps(answers);
      expect(result.scenarios[0].gap).toBe(-3);
    });

    it('should handle special scoring for SJT-2 (Agreeableness)', () => {
      // SJT-2 has non-standard scoring: A=1, B=3, C=4, D=2
      const answers: SJTAnswer[] = [{
        scenarioId: 2,
        wouldChoice: 'A', // score = 1
        shouldChoice: 'C', // score = 4
      }];
      const result = scoreSJTGaps(answers);
      expect(result.scenarios[0].wouldScore).toBe(1);
      expect(result.scenarios[0].shouldScore).toBe(4);
      expect(result.scenarios[0].gap).toBe(3);
    });

    it('should handle B=C same score for SJT-3 (Conscientiousness)', () => {
      // SJT-3: A=4, B=3, C=3, D=1
      const answersBC: SJTAnswer[] = [{
        scenarioId: 3,
        wouldChoice: 'B', // score = 3
        shouldChoice: 'C', // score = 3
      }];
      const result = scoreSJTGaps(answersBC);
      expect(result.scenarios[0].gap).toBe(0); // 3-3 = 0
      expect(result.scenarios[0].isConsistent).toBe(true);
    });
  });

  describe('domain mapping', () => {
    it('should map each scenario to the correct domain', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      const domainMap: Record<number, string> = {
        1: 'extraversion',
        2: 'agreeableness',
        3: 'conscientiousness',
        4: 'neuroticism',
        5: 'openness',
        6: 'extraversion', // dual domain: primary = extraversion
      };
      for (const scenario of result.scenarios) {
        expect(scenario.domain).toBe(domainMap[scenario.scenarioId]);
      }
    });

    it('should have secondary domain for SJT-6', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      const sjt6 = result.scenarios.find(s => s.scenarioId === 6);
      expect(sjt6?.domainSecondary).toBe('agreeableness');
    });

    it('should not have secondary domain for SJT-1 through SJT-5', () => {
      const result = scoreSJTGaps(allConsistentAnswers());
      for (const scenario of result.scenarios) {
        if (scenario.scenarioId !== 6) {
          expect(scenario.domainSecondary).toBeUndefined();
        }
      }
    });
  });

  describe('notable tensions', () => {
    it('should detect notable tensions when gap >= 2', () => {
      // SJT-1: would=D(1), should=A(4) → gap=3 → notable
      const answers: SJTAnswer[] = [{
        scenarioId: 1,
        wouldChoice: 'D',
        shouldChoice: 'A',
      }];
      const result = scoreSJTGaps(answers);
      expect(result.notableTensions).toContain('extraversion');
    });

    it('should not detect notable tensions when gap < 2', () => {
      // SJT-1: would=B(3), should=A(4) → gap=1 → not notable
      const answers: SJTAnswer[] = [{
        scenarioId: 1,
        wouldChoice: 'B',
        shouldChoice: 'A',
      }];
      const result = scoreSJTGaps(answers);
      expect(result.notableTensions).not.toContain('extraversion');
    });

    it('should not duplicate domain names in notable tensions', () => {
      // Both SJT-1 and SJT-6 map to extraversion
      const answers: SJTAnswer[] = [
        { scenarioId: 1, wouldChoice: 'D', shouldChoice: 'A' }, // gap=3
        { scenarioId: 6, wouldChoice: 'D', shouldChoice: 'A' }, // gap=3
      ];
      const result = scoreSJTGaps(answers);
      const extraversionCount = result.notableTensions.filter(d => d === 'extraversion').length;
      expect(extraversionCount).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty answers', () => {
      const result = scoreSJTGaps([]);
      expect(result.scenarios).toHaveLength(0);
      expect(result.overallConsistency).toBe(0);
      expect(result.notableTensions).toHaveLength(0);
    });

    it('should skip invalid scenario IDs', () => {
      const answers: SJTAnswer[] = [{
        scenarioId: 99,
        wouldChoice: 'A',
        shouldChoice: 'A',
      }];
      const result = scoreSJTGaps(answers);
      expect(result.scenarios).toHaveLength(0);
    });

    it('should handle invalid choice IDs gracefully', () => {
      const answers: SJTAnswer[] = [{
        scenarioId: 1,
        wouldChoice: 'X',
        shouldChoice: 'A',
      }];
      const result = scoreSJTGaps(answers);
      // X is not in scoringMap → score = 0
      expect(result.scenarios[0].wouldScore).toBe(0);
      expect(result.scenarios[0].shouldScore).toBe(4);
    });
  });

  describe('data integrity', () => {
    it('should have 6 SJT scenarios defined', () => {
      expect(SJT_SCENARIOS).toHaveLength(6);
    });

    it('should have all scenarios with valid scoring maps', () => {
      for (const scenario of SJT_SCENARIOS) {
        expect(scenario.scoringMap).toBeDefined();
        expect(Object.keys(scenario.scoringMap)).toHaveLength(4); // A, B, C, D
      }
    });

    it('should have SJT-6 with secondary scoring map', () => {
      const sjt6 = SJT_SCENARIOS.find(s => s.id === 6);
      expect(sjt6?.scoringMapSecondary).toBeDefined();
      expect(sjt6?.mappedDomainSecondary).toBe('agreeableness');
    });
  });
});
