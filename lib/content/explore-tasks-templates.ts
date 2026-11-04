// ============================================================
// Explore Tasks Templates — PR-B3
// Generates 3 actionable exploration tasks per career direction
// using fixed templates with direction-specific keywords.
// ============================================================

export interface ExploreTask {
  id: string
  templateKey: 'linkedin' | 'articles' | 'informational'
  directionRank: number
  keyword: string
  isCompleted: boolean
}

/**
 * Generates 3 exploration tasks for a given career direction.
 *
 * @param directionRank - The rank/index of the direction (1-based)
 * @param keyword - The direction title used as the search keyword
 * @returns Array of 3 ExploreTask objects
 */
export function generateExploreTasks(
  directionRank: number,
  keyword: string,
): ExploreTask[] {
  return [
    {
      id: `explore-${directionRank}-linkedin`,
      templateKey: 'linkedin',
      directionRank,
      keyword,
      isCompleted: false,
    },
    {
      id: `explore-${directionRank}-articles`,
      templateKey: 'articles',
      directionRank,
      keyword,
      isCompleted: false,
    },
    {
      id: `explore-${directionRank}-informational`,
      templateKey: 'informational',
      directionRank,
      keyword,
      isCompleted: false,
    },
  ]
}

/**
 * Renders a task description by interpolating the keyword into i18n templates.
 *
 * @param templateKey - Which template to use
 * @param keyword - The direction keyword to insert
 * @param t - The i18n dictionary (report section)
 * @returns Rendered task description string
 */
export function renderTaskDescription(
  templateKey: ExploreTask['templateKey'],
  keyword: string,
  t: Record<string, string>,
): string {
  const templateMap: Record<ExploreTask['templateKey'], string> = {
    linkedin: t.exploreTaskLinkedin ?? '',
    articles: t.exploreTaskArticles ?? '',
    informational: t.exploreTaskInformational ?? '',
  }
  return templateMap[templateKey].replace('{{keyword}}', keyword)
}

// ---- localStorage persistence (shared key pattern with Panel 3) ----

const EXPLORE_STORAGE_PREFIX = 'deep_dive_explore_'

function getExploreStorageKey(reportId: string): string {
  return `${EXPLORE_STORAGE_PREFIX}${reportId}`
}

export function loadExploreTaskStates(reportId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(getExploreStorageKey(reportId))
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return {}
}

export function saveExploreTaskStates(reportId: string, states: Record<string, boolean>): void {
  try {
    localStorage.setItem(getExploreStorageKey(reportId), JSON.stringify(states))
  } catch {
    // ignore storage errors
  }
}
