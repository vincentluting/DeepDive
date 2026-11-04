#!/usr/bin/env npx tsx
// ============================================================
// Populate titleLocales for all CareerDirection rows
// ============================================================
// Generates translations from titleEn for 9 additional locales.
// Most career titles are internationally recognized terms that
// translate straightforwardly. Run after migration 052.
//
// Usage: npx tsx scripts/populate-career-title-locales.ts
// ============================================================

import { config } from 'dotenv'
import { join } from 'path'
config({ path: join(__dirname, '..', '.env.local') })
config({ path: join(__dirname, '..', '.env') })

import { sql } from '../lib/db/connection'

// ── Well-known career title translations ────────────────────
// For standard job titles, we use a lookup + rule-based approach.
// Titles not in the map get a best-effort translation based on
// common patterns (e.g., "... Engineer" → "... Ingenieur" in DE).

const SUFFIX_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Engineer': { nl: 'Ingenieur', de: 'Ingenieur', fr: 'Ingénieur', es: 'Ingeniero/a', pt: 'Engenheiro/a', it: 'Ingegnere', ru: 'Инженер', ja: 'エンジニア', ko: '엔지니어' },
  'Developer': { nl: 'Ontwikkelaar', de: 'Entwickler', fr: 'Développeur', es: 'Desarrollador/a', pt: 'Desenvolvedor/a', it: 'Sviluppatore', ru: 'Разработчик', ja: 'デベロッパー', ko: '개발자' },
  'Designer': { nl: 'Ontwerper', de: 'Designer', fr: 'Designer', es: 'Diseñador/a', pt: 'Designer', it: 'Designer', ru: 'Дизайнер', ja: 'デザイナー', ko: '디자이너' },
  'Manager': { nl: 'Manager', de: 'Manager', fr: 'Manager', es: 'Gerente', pt: 'Gerente', it: 'Manager', ru: 'Менеджер', ja: 'マネージャー', ko: '매니저' },
  'Analyst': { nl: 'Analist', de: 'Analyst', fr: 'Analyste', es: 'Analista', pt: 'Analista', it: 'Analista', ru: 'Аналитик', ja: 'アナリスト', ko: '애널리스트' },
  'Specialist': { nl: 'Specialist', de: 'Spezialist', fr: 'Spécialiste', es: 'Especialista', pt: 'Especialista', it: 'Specialista', ru: 'Специалист', ja: 'スペシャリスト', ko: '전문가' },
  'Director': { nl: 'Directeur', de: 'Direktor', fr: 'Directeur', es: 'Director/a', pt: 'Diretor/a', it: 'Direttore', ru: 'Директор', ja: 'ディレクター', ko: '디렉터' },
  'Consultant': { nl: 'Consultant', de: 'Berater', fr: 'Consultant', es: 'Consultor/a', pt: 'Consultor/a', it: 'Consulente', ru: 'Консультант', ja: 'コンサルタント', ko: '컨설턴트' },
  'Coordinator': { nl: 'Coördinator', de: 'Koordinator', fr: 'Coordinateur', es: 'Coordinador/a', pt: 'Coordenador/a', it: 'Coordinatore', ru: 'Координатор', ja: 'コーディネーター', ko: '코디네이터' },
  'Researcher': { nl: 'Onderzoeker', de: 'Forscher', fr: 'Chercheur', es: 'Investigador/a', pt: 'Pesquisador/a', it: 'Ricercatore', ru: 'Исследователь', ja: '研究者', ko: '연구원' },
  'Therapist': { nl: 'Therapeut', de: 'Therapeut', fr: 'Thérapeute', es: 'Terapeuta', pt: 'Terapeuta', it: 'Terapeuta', ru: 'Терапевт', ja: 'セラピスト', ko: '치료사' },
  'Scientist': { nl: 'Wetenschapper', de: 'Wissenschaftler', fr: 'Scientifique', es: 'Científico/a', pt: 'Cientista', it: 'Scienziato/a', ru: 'Учёный', ja: '科学者', ko: '과학자' },
  'Architect': { nl: 'Architect', de: 'Architekt', fr: 'Architecte', es: 'Arquitecto/a', pt: 'Arquiteto/a', it: 'Architetto', ru: 'Архитектор', ja: 'アーキテクト', ko: '아키텍트' },
  'Teacher': { nl: 'Docent', de: 'Lehrer', fr: 'Enseignant', es: 'Profesor/a', pt: 'Professor/a', it: 'Insegnante', ru: 'Учитель', ja: '教師', ko: '교사' },
  'Writer': { nl: 'Schrijver', de: 'Autor', fr: 'Écrivain', es: 'Escritor/a', pt: 'Escritor/a', it: 'Scrittore', ru: 'Писатель', ja: 'ライター', ko: '작가' },
  'Producer': { nl: 'Producent', de: 'Produzent', fr: 'Producteur', es: 'Productor/a', pt: 'Produtor/a', it: 'Produttore', ru: 'Продюсер', ja: 'プロデューサー', ko: '프로듀서' },
  'Strategist': { nl: 'Strateeg', de: 'Stratege', fr: 'Stratège', es: 'Estratega', pt: 'Estrategista', it: 'Stratega', ru: 'Стратег', ja: 'ストラテジスト', ko: '전략가' },
  'Officer': { nl: 'Functionaris', de: 'Beauftragter', fr: 'Responsable', es: 'Oficial', pt: 'Oficial', it: 'Responsabile', ru: 'Офицер', ja: 'オフィサー', ko: '오피서' },
  'Planner': { nl: 'Planner', de: 'Planer', fr: 'Planificateur', es: 'Planificador/a', pt: 'Planejador/a', it: 'Pianificatore', ru: 'Планировщик', ja: 'プランナー', ko: '플래너' },
  'Advisor': { nl: 'Adviseur', de: 'Berater', fr: 'Conseiller', es: 'Asesor/a', pt: 'Consultor/a', it: 'Consulente', ru: 'Советник', ja: 'アドバイザー', ko: '어드바이저' },
}

// For titles that are already international (keep English as-is for most Western languages)
const LOCALES = ['nl', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ja', 'ko'] as const

function translateTitle(titleEn: string): Record<string, string> {
  const result: Record<string, string> = {}

  // For CJK/Cyrillic locales, try to find suffix-based translations
  // For Western locales, most professional titles are used as-is or lightly adapted
  for (const locale of LOCALES) {
    // Check if any known suffix matches
    let translated = false
    for (const [suffix, translations] of Object.entries(SUFFIX_TRANSLATIONS)) {
      if (titleEn.endsWith(suffix)) {
        const prefix = titleEn.slice(0, -suffix.length)
        result[locale] = prefix + translations[locale]
        translated = true
        break
      }
    }
    // If no suffix match, keep titleEn as-is
    // (most job titles like "Data Scientist", "UX Researcher" are internationally recognized)
    if (!translated) {
      result[locale] = titleEn
    }
  }

  return result
}

async function main() {
  console.log('🌐 Populating career direction title translations...')

  // Fetch all rows
  const rows = await sql`SELECT "id", "titleEn" FROM "CareerDirection"`
  console.log(`  Found ${rows.length} career directions`)

  let updated = 0
  const batchSize = 50

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)

    for (const row of batch) {
      const titleEn = row.titleEn as string
      const locales = translateTitle(titleEn)

      await sql`
        UPDATE "CareerDirection"
        SET "titleLocales" = ${JSON.stringify(locales)}, "updatedAt" = NOW()
        WHERE "id" = ${row.id as string}
      `
      updated++
    }

    console.log(`  Updated ${Math.min(i + batchSize, rows.length)}/${rows.length}`)
  }

  console.log(`✅ Done — ${updated} career directions updated with locale titles`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Failed:', err)
  process.exit(1)
})
