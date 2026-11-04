// ============================================================
// Tests for Seed Extractor
// ============================================================

import { describe, it, expect } from 'vitest';
import { extractSeeds } from '../seed-extractor';
import type { CareerReport } from '@/lib/types/report';

// ── Helpers ────────────────────────────────────────────────

function makeReport(overrides: Partial<CareerReport> = {}): CareerReport {
  return {
    locale: 'en',
    careerMatch: null,
    panel2_identity: null,
    careerPathway: null,
    careerDrainWarning: null,
    ...overrides,
  } as CareerReport;
}

// ── Tests ──────────────────────────────────────────────────

describe('extractSeeds', () => {
  it('returns empty array for empty report', () => {
    const seeds = extractSeeds(makeReport());
    expect(seeds).toEqual([]);
  });

  it('extracts seeds from Panel 3 week1 tasks', () => {
    const report = makeReport({
      careerPathway: {
        actionPlan: {
          week1: {
            tasks: [
              { description: 'Research 3 companies', difficulty: 'easy' },
              { description: 'Update your LinkedIn profile', difficulty: 'stretch' },
            ],
          },
        },
      } as CareerReport['careerPathway'],
    });

    const seeds = extractSeeds(report);
    expect(seeds.length).toBeGreaterThanOrEqual(2);

    const researchSeed = seeds.find(s => s.title.includes('Research'));
    expect(researchSeed).toBeDefined();
    expect(researchSeed!.rawWeight).toBe(0.9);
    expect(researchSeed!.intensity).toBe('passive'); // easy → passive
    expect(researchSeed!.sourceDimension).toBe('panel3_week1');
  });

  it('generates career drain reflection seeds', () => {
    const report = makeReport({
      careerDrainWarning: {
        drainingDirections: [{ title: 'Accounting', reason: 'Low openness' }],
        framingSummary_en: 'These directions may drain your energy',
        framingSummary_zh: '这些方向可能消耗你的能量',
      } as unknown as CareerReport['careerDrainWarning'],
    });

    const seeds = extractSeeds(report);
    expect(seeds.length).toBe(1);
    expect(seeds[0].category).toBe('reflect');
    expect(seeds[0].sourceDimension).toBe('career_drain');
    expect(seeds[0].title).toContain('career drain');
  });

  it('generates Chinese titles when locale is zh', () => {
    const report = makeReport({
      locale: 'zh',
      careerPathway: {
        jobSearchStrategy: {
          resumeHighlights: ['强调领导力'],
        },
      } as CareerReport['careerPathway'],
    });

    const seeds = extractSeeds(report);
    const resumeSeed = seeds.find(s => s.category === 'apply');
    expect(resumeSeed).toBeDefined();
    expect(resumeSeed!.title).toBe('优化你的简历');
  });

  it('infers categories from keyword matching', () => {
    const report = makeReport({
      careerPathway: {
        actionPlan: {
          week1: {
            tasks: [
              { description: 'Network with professionals in your field', difficulty: 'easy' },
              { description: 'Learn a new programming language', difficulty: 'easy' },
              { description: 'Create a portfolio website', difficulty: 'stretch' },
              { description: 'Apply to 3 positions', difficulty: 'easy' },
              { description: 'Reflect on your career values', difficulty: 'easy' },
            ],
          },
        },
      } as CareerReport['careerPathway'],
    });

    const seeds = extractSeeds(report);
    expect(seeds.find(s => s.title.includes('Network'))!.category).toBe('network');
    expect(seeds.find(s => s.title.includes('Learn'))!.category).toBe('learn');
    expect(seeds.find(s => s.title.includes('Create'))!.category).toBe('create');
    expect(seeds.find(s => s.title.includes('Apply'))!.category).toBe('apply');
    expect(seeds.find(s => s.title.includes('Reflect'))!.category).toBe('reflect');
  });

  it('extracts career direction exploration seeds from Panel 1', () => {
    const report = makeReport({
      careerMatch: {
        directions: [
          { title_en: 'UX Designer', title_zh: 'UX设计师', rank: 1, matchScore: 85, whySuitable: 'Great fit' },
          { title_en: 'Product Manager', title_zh: '产品经理', rank: 2, matchScore: 75, whySuitable: 'Good match' },
        ],
      } as CareerReport['careerMatch'],
    });

    const seeds = extractSeeds(report);
    expect(seeds.length).toBe(2);
    expect(seeds[0].category).toBe('explore');
    expect(seeds[0].title).toContain('UX Designer');
    // Higher matchScore → higher rawWeight
    expect(seeds[0].rawWeight).toBeGreaterThan(seeds[1].rawWeight);
  });
});
