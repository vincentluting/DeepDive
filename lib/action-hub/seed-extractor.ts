// ============================================================
// Seed Extractor — Extract actionable seeds from a CareerReport
//
// Pure function — no DB, no LLM calls.
// Extracts candidate ActionItems from:
//   1. Panel 3 action plan tasks (week 1)
//   2. Panel 3 job search strategy (resume highlights, networking tips)
//   3. Panel 1 career directions (as exploration seeds)
//   4. Career drain warnings (as reflection seeds)
//
// Returns unsorted seeds; use priority-ranker for ordering.
// ============================================================

import type { CareerReport } from '@/lib/types/report';
import type { ActionCategory, ActionIntensity } from '@/lib/db/action-hub';

// ── Locale helper: pick text by locale with fallback to 'en' ──
type LocaleTexts = Record<string, string>;
function L(texts: LocaleTexts, locale: string): string {
  return texts[locale] ?? texts.en;
}

export interface ActionSeed {
  title: string;
  description: string;
  category: ActionCategory;
  intensity: ActionIntensity;
  sourceDimension: string;
  estimatedMinutes: number;
  /** Raw relevance weight from extraction context (0-1). Used by priority-ranker. */
  rawWeight: number;
}

/**
 * Extract all actionable seeds from a career report.
 * Returns an unsorted list. Use `rankSeeds()` to prioritize.
 */
export function extractSeeds(report: CareerReport): ActionSeed[] {
  const seeds: ActionSeed[] = [];
  const locale = report.locale ?? 'en';

  // ── 1. Panel 3 action plan tasks (highest signal) ──────────

  if (report.careerPathway?.actionPlan?.week1?.tasks) {
    for (const task of report.careerPathway.actionPlan.week1.tasks) {
      seeds.push({
        title: task.description,
        description: task.description,
        category: inferCategory(task.description),
        intensity: task.difficulty === 'easy' ? 'passive' : 'active',
        sourceDimension: 'panel3_week1',
        estimatedMinutes: task.difficulty === 'stretch' ? 45 : 30,
        rawWeight: 0.9,
      });
    }
  }

  // ── 2. Job search strategy seeds ───────────────────────────

  const strategy = report.careerPathway?.jobSearchStrategy;
  if (strategy) {
    // Resume highlights → "optimize resume" task
    if (strategy.resumeHighlights?.length) {
      seeds.push({
        title: L({ en: 'Optimize your resume', zh: '优化你的简历', nl: 'Optimaliseer je cv', de: 'Optimiere deinen Lebenslauf', fr: 'Optimise ton CV', es: 'Optimiza tu currículum', pt: 'Otimize seu currículo', it: 'Ottimizza il tuo CV', ru: 'Оптимизируйте своё резюме', ja: '履歴書を最適化する', ko: '이력서를 최적화하세요' }, locale),
        description: strategy.resumeHighlights.join('; '),
        category: 'apply',
        intensity: 'active',
        sourceDimension: 'panel3_resume',
        estimatedMinutes: 45,
        rawWeight: 0.8,
      });
    }

    // Networking tips → social seeds
    if (strategy.networkingTips?.length) {
      for (const tip of strategy.networkingTips.slice(0, 3)) {
        seeds.push({
          title: tip,
          description: tip,
          category: 'network',
          intensity: 'social',
          sourceDimension: 'panel3_networking',
          estimatedMinutes: 20,
          rawWeight: 0.75,
        });
      }
    }

    // Positioning → reflection seed
    if (strategy.positioning) {
      seeds.push({
        title: L({ en: 'Clarify your career positioning', zh: '明确你的职业定位', nl: 'Verduidelijk je carrièrepositionering', de: 'Kläre deine Karrierepositionierung', fr: 'Clarifie ton positionnement professionnel', es: 'Clarifica tu posicionamiento profesional', pt: 'Esclareça seu posicionamento profissional', it: 'Chiarisci il tuo posizionamento professionale', ru: 'Определите своё карьерное позиционирование', ja: 'キャリアポジショニングを明確にする', ko: '커리어 포지셔닝을 명확히 하세요' }, locale),
        description: strategy.positioning,
        category: 'reflect',
        intensity: 'passive',
        sourceDimension: 'panel3_positioning',
        estimatedMinutes: 15,
        rawWeight: 0.7,
      });
    }
  }

  // ── 3. Panel 1 career directions → exploration seeds ───────

  const directions = report.careerMatch?.directions;
  if (directions?.length) {
    for (const dir of directions.slice(0, 5)) {
      const title = locale === 'zh' ? dir.title_zh : dir.title_en;
      seeds.push({
        title: `${L({ en: 'Explore direction', zh: '探索方向', nl: 'Verken richting', de: 'Richtung erkunden', fr: 'Explorer la direction', es: 'Explorar dirección', pt: 'Explorar direção', it: 'Esplorare direzione', ru: 'Исследовать направление', ja: '方向性を探る', ko: '방향 탐색' }, locale)}: ${title}`,
        description: dir.whySuitable || title,
        category: 'explore',
        intensity: 'passive',
        sourceDimension: `panel1_direction_${dir.rank}`,
        estimatedMinutes: 15,
        rawWeight: 0.6 + (dir.matchScore ?? 0) * 0.003,
      });
    }
  }

  // ── 4. Career drain warnings → reflection seeds ────────────

  const drain = report.careerDrainWarning;
  if (drain?.drainingDirections?.length) {
    const summary = locale === 'zh' ? drain.framingSummary_zh : drain.framingSummary_en;
    seeds.push({
      title: L({ en: 'Understand your career drain zones', zh: '了解你的职业消耗区域', nl: 'Begrijp je carrière-energielekken', de: 'Verstehe deine Karriere-Energiefresser', fr: 'Comprends tes zones d\'épuisement professionnel', es: 'Comprende tus zonas de desgaste profesional', pt: 'Entenda suas zonas de esgotamento profissional', it: 'Comprendi le tue zone di dispendio professionale', ru: 'Определите зоны карьерного истощения', ja: 'キャリアの消耗ゾーンを理解する', ko: '커리어 소모 영역을 이해하세요' }, locale),
      description: summary || L({ en: 'Reflect on career directions that may drain your energy', zh: '反思可能消耗你能量的职业方向', nl: 'Reflecteer op carrièrerichtingen die je energie kunnen kosten', de: 'Reflektiere über Karrierewege, die deine Energie rauben könnten', fr: 'Réfléchis aux directions professionnelles qui pourraient t\'épuiser', es: 'Reflexiona sobre las direcciones profesionales que pueden agotar tu energía', pt: 'Reflita sobre direções de carreira que podem drenar sua energia', it: 'Rifletti sulle direzioni professionali che potrebbero esaurirti', ru: 'Подумайте о карьерных направлениях, которые могут истощать вашу энергию', ja: 'エネルギーを消耗する可能性のあるキャリアの方向性を振り返る', ko: '에너지를 소모할 수 있는 커리어 방향에 대해 성찰하세요' }, locale),
      category: 'reflect',
      intensity: 'passive',
      sourceDimension: 'career_drain',
      estimatedMinutes: 10,
      rawWeight: 0.5,
    });
  }

  return seeds;
}

// ── Helpers ──────────────────────────────────────────────────

const NETWORK_KEYWORDS = /network|connect|reach out|informational|coffee|联系|社交|人脉|约谈/i;
const LEARN_KEYWORDS = /learn|read|research|course|study|学习|课程|阅读|研究/i;
const CREATE_KEYWORDS = /create|build|write|portfolio|project|创建|写|作品集|项目/i;
const APPLY_KEYWORDS = /apply|resume|cover letter|submit|投递|简历|求职信/i;
const REFLECT_KEYWORDS = /reflect|journal|think|consider|反思|思考|日记/i;

function inferCategory(text: string): ActionCategory {
  if (NETWORK_KEYWORDS.test(text)) return 'network';
  if (APPLY_KEYWORDS.test(text)) return 'apply';
  if (CREATE_KEYWORDS.test(text)) return 'create';
  if (LEARN_KEYWORDS.test(text)) return 'learn';
  if (REFLECT_KEYWORDS.test(text)) return 'reflect';

  return 'explore';
}
