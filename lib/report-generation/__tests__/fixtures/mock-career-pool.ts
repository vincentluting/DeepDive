// ============================================================
// Mock Career Pool — Test fixture for career direction matching tests
// Replaces the DB-backed career pool with deterministic test data.
// ============================================================

import type { CareerDirectionTemplate } from '@/lib/types/report';

export const MOCK_CAREERS: CareerDirectionTemplate[] = Array.from({ length: 20 }, (_, i) => ({
  id: `test-career-${i + 1}`,
  title_zh: `测试职业${i + 1}`,
  title_en: `Test Career ${i + 1}`,
  subtitle_zh: `测试描述${i + 1}`,
  idealRIASEC: {
    R: (i * 17) % 100, I: (i * 23) % 100, A: (i * 31) % 100,
    S: (i * 37) % 100, E: (i * 41) % 100, C: (i * 43) % 100,
  },
  alignedValues: ['achievement', 'self-direction'].slice(0, (i % 3) + 1),
  idealBigFive: { openness: { min: 40, max: 80 }, conscientiousness: { min: 30, max: 70 } },
  industries: i % 2 === 0 ? ['tech'] : ['finance'],
  crossCulturalFit: ['bridge'] as CareerDirectionTemplate['crossCulturalFit'],
  seniorityRange: { minYears: 0, maxYears: 20 },
  tags: ['test'],
  annotationSource: 'expert-heuristic' as const,
  annotationConfidence: 'expert-estimated' as const,
  lastReviewedAt: '2026-01-01',
}));
