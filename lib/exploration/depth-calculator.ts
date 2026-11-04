// ============================================================
// Depth Calculator — Exploration Progress Engine
//
// Pure functions that map completed modules to ocean depth (metres).
// No side effects, no DB access — safe to import anywhere.
//
// Design principle: the journey reflects user-facing steps, not
// internal assessment sub-modules. "Deep Dive" is one step for
// the user, even though it contains SJT + DDVQ + IPIP-60 internally.
//
// Module key convention: camelCase (matches DEPTH_WEIGHTS keys)
// Display ID convention: lowercase (used in API responses)
// ============================================================

// ── Main path depth weights — 6 user-facing modules ──────
// Each module adds depth when completed. Total = 3000m.
export const DEPTH_WEIGHTS = {
  quickDive: 400, // 0     → 400m   — QuickDiveResult
  deepDive: 850, // 400   → 1250m  — AssessmentResult (SJT+DDVQ+IPIP combined)
  profile: 250, // 1250  → 1500m  — PersonalProfile (auto)
  report: 500, // 1500  → 2000m  — CareerReport (auto)
  actionHub: 500, // 2000  → 2500m  — ActionPlan / ActionItem
  coaching: 500, // 2500  → 3000m  — CoachingSession
} as const;

export const MAX_DEPTH = 3000;

export const DEPTH_ZONES = [
  {
    id: "surface",
    minDepth: 0,
    label: {
      en: "Surface",
      zh: "水面",
      nl: "Oppervlak",
      de: "Oberfläche",
      es: "Superficie",
      fr: "Surface",
      it: "Superficie",
      ja: "水面",
      ko: "수면",
      pt: "Superfície",
      ru: "Поверхность",
    },
  },
  {
    id: "shallows",
    minDepth: 400,
    label: {
      en: "Shallows",
      zh: "浅水区",
      nl: "Ondiep water",
      de: "Flachwasser",
      es: "Aguas poco profundas",
      fr: "Eaux peu profondes",
      it: "Acque basse",
      ja: "浅瀬",
      ko: "얕은 물",
      pt: "Águas rasas",
      ru: "Мелководье",
    },
  },
  {
    id: "openwater",
    minDepth: 1250,
    label: {
      en: "Open Water",
      zh: "开阔水域",
      nl: "Open water",
      de: "Offenes Wasser",
      es: "Aguas abiertas",
      fr: "Eaux libres",
      it: "Acque aperte",
      ja: "外洋",
      ko: "넓은 바다",
      pt: "Águas abertas",
      ru: "Открытая вода",
    },
  },
  {
    id: "depths",
    minDepth: 2000,
    label: {
      en: "The Deep Current",
      zh: "深流区",
      nl: "De diepe stroom",
      de: "Die tiefe Strömung",
      es: "La corriente profunda",
      fr: "Le courant profond",
      it: "La corrente profonda",
      ja: "深層流",
      ko: "깊은 해류",
      pt: "A corrente profunda",
      ru: "Глубинное течение",
    },
  },
  {
    id: "abyss",
    minDepth: 2500,
    label: {
      en: "The Luminous Deep",
      zh: "发光带",
      nl: "De lichtende diepte",
      de: "Die leuchtende Tiefe",
      es: "La profundidad luminosa",
      fr: "Les profondeurs lumineuses",
      it: "L'abisso luminoso",
      ja: "発光帯",
      ko: "빛나는 심연",
      pt: "A profundeza luminosa",
      ru: "Светящаяся бездна",
    },
  },
] as const;

// ── Types ──────────────────────────────────────────────────

export type ModuleKey = keyof typeof DEPTH_WEIGHTS;
export type DepthZone = (typeof DEPTH_ZONES)[number];
export type ModuleStatus = "completed" | "available" | "locked";

export interface DepthResult {
  depthM: number;
  zone: DepthZone;
  completionPercent: number;
}

/** Persisted exploration progress for a user. */
export interface UserExplorationProgress {
  userId: string;
  /** Keyed by ModuleKey (main) + SideQuestKey; value is completion timestamp or null. */
  modules: Record<string, Date | null>;
  depthM: number;
  updatedAt: Date;
}

export interface ModuleStatusItem {
  id: string;
  status: ModuleStatus;
  /** Cumulative depth after this module is completed. */
  depth: number;
  label: Record<string, string>;
  depthGain: number;
  /** Estimated completion time (omitted for auto-unlocked steps like report). */
  time?: string;
  /** ISO timestamp — only present when status === 'completed'. */
  completedAt?: string;
}

// ── Module metadata (single source of truth for UI) ──────

export interface ModuleMeta {
  /** Lowercase display ID used in API responses. */
  id: string;
  label: Record<string, string>;
  time?: string;
  depthGain: number;
  /** Total cumulative depth once this module is done. */
  cumulativeDepth: number;
}

export const MODULE_META: Record<ModuleKey, ModuleMeta> = {
  quickDive: {
    id: "quickdive",
    label: {
      en: "Quick Dive",
      zh: "快速测评",
      nl: "Snelle Duik",
      de: "Schnelltauchgang",
      es: "Inmersión Rápida",
      fr: "Plongée Rapide",
      it: "Immersione Rapida",
      ja: "クイック診断",
      ko: "빠른 진단",
      pt: "Mergulho Rápido",
      ru: "Быстрый тест",
    },
    time: "5 min",
    depthGain: 400,
    cumulativeDepth: 400,
  },
  deepDive: {
    id: "deepdive",
    label: {
      en: "Deep Dive",
      zh: "深度测评",
      nl: "Diepe Duik",
      de: "Tieftauchgang",
      es: "Inmersión Profunda",
      fr: "Plongée Profonde",
      it: "Immersione Profonda",
      ja: "ディープ診断",
      ko: "심층 진단",
      pt: "Mergulho Profundo",
      ru: "Глубокий тест",
    },
    time: "15 min",
    depthGain: 850,
    cumulativeDepth: 1250,
  },
  profile: {
    id: "profile",
    label: {
      en: "Profile",
      zh: "个人档案",
      nl: "Profiel",
      de: "Profil",
      es: "Perfil",
      fr: "Profil",
      it: "Profilo",
      ja: "プロフィール",
      ko: "프로필",
      pt: "Perfil",
      ru: "Профиль",
    },
    depthGain: 250,
    cumulativeDepth: 1500,
  },
  report: {
    id: "report",
    label: {
      en: "Career Report",
      zh: "职业报告",
      nl: "Loopbaanrapport",
      de: "Karrierebericht",
      es: "Informe Profesional",
      fr: "Rapport de Carrière",
      it: "Report Professionale",
      ja: "キャリアレポート",
      ko: "커리어 리포트",
      pt: "Relatório de Carreira",
      ru: "Карьерный отчёт",
    },
    depthGain: 500,
    cumulativeDepth: 2000,
  },
  actionHub: {
    id: "actionhub",
    label: {
      en: "Action Hub",
      zh: "行动中心",
      nl: "Actiecentrum",
      de: "Aktionszentrum",
      es: "Centro de Acción",
      fr: "Centre d'Action",
      it: "Centro Azione",
      ja: "アクションハブ",
      ko: "액션 허브",
      pt: "Central de Ação",
      ru: "Центр действий",
    },
    time: "10 min",
    depthGain: 500,
    cumulativeDepth: 2500,
  },
  coaching: {
    id: "coaching",
    label: {
      en: "AI Coach",
      zh: "AI 教练",
      nl: "AI Coach",
      de: "KI-Coach",
      es: "Coach IA",
      fr: "Coach IA",
      it: "Coach IA",
      ja: "AIコーチ",
      ko: "AI 코치",
      pt: "Coach IA",
      ru: "ИИ-тренер",
    },
    time: "20 min",
    depthGain: 500,
    cumulativeDepth: 3000,
  },
};

/** Display + dependency order for main-path modules. */
export const MODULE_SEQUENCE: ModuleKey[] = [
  "quickDive",
  "deepDive",
  "profile",
  "report",
  "actionHub",
  "coaching",
];

/** Prerequisites that must be completed before a module becomes available. */
const MODULE_PREREQUISITES: Record<ModuleKey, ModuleKey[]> = {
  quickDive: [],
  deepDive: ["quickDive"],
  profile: ["deepDive"], // auto-generated after Deep Dive
  report: ["profile"], // needs profile first
  actionHub: ["report"],
  coaching: ["report"], // coaching unlocks after report, independent of actionHub
};

// ── Side quests — optional branches off the main path ────

export type SideQuestKey = "immersive" | "realityCheck";

export interface SideQuestMeta {
  key: SideQuestKey;
  /** Lowercase display ID. */
  id: string;
  label: Record<string, string>;
  /** Which main-path module this branches off of. */
  parentModule: ModuleKey;
  time?: string;
}

export const SIDE_QUESTS: SideQuestMeta[] = [
  {
    key: "immersive",
    id: "immersive",
    label: {
      en: "Immersive Dive",
      zh: "沉浸体验",
      nl: "Immersieve Duik",
      de: "Immersiver Tauchgang",
      es: "Inmersión Envolvente",
      fr: "Plongée Immersive",
      it: "Immersione Coinvolgente",
      ja: "没入体験",
      ko: "몰입 체험",
      pt: "Mergulho Imersivo",
      ru: "Погружение",
    },
    parentModule: "quickDive",
    time: "5 min",
  },
  {
    key: "realityCheck",
    id: "reality",
    label: {
      en: "Reality Check",
      zh: "现实条件",
      nl: "Realiteitscheck",
      de: "Realitätscheck",
      es: "Verificación de Realidad",
      fr: "Bilan Réaliste",
      it: "Verifica Realtà",
      ja: "現実チェック",
      ko: "현실 점검",
      pt: "Verificação de Realidade",
      ru: "Проверка реальности",
    },
    parentModule: "report",
    time: "3 min",
  },
];

// ── Exported functions ─────────────────────────────────────

/**
 * Calculate total depth and zone from a module completion map.
 * Only main-path modules contribute to depth; side quests are tracked but not counted.
 */
export function calculateDepth(
  completedModules: Record<string, Date | null>,
): DepthResult {
  let depthM = 0;
  for (const key of Object.keys(DEPTH_WEIGHTS) as ModuleKey[]) {
    if (completedModules[key] != null) {
      depthM += DEPTH_WEIGHTS[key];
    }
  }
  const zone = getDepthZone(depthM);
  const completionPercent = Math.floor((depthM / MAX_DEPTH) * 100);
  return { depthM, zone, completionPercent };
}

/**
 * Return the deepest zone whose minDepth is ≤ depthM.
 */
export function getDepthZone(depthM: number): DepthZone {
  let result: DepthZone = DEPTH_ZONES[0];
  for (const zone of DEPTH_ZONES) {
    if (depthM >= zone.minDepth) {
      result = zone;
    }
  }
  return result;
}

/**
 * Return the list of module keys that have been completed (non-null timestamp).
 * Includes both main-path and side-quest keys.
 */
export function getCompletedModulesList(
  progress: UserExplorationProgress,
): string[] {
  return Object.entries(progress.modules)
    .filter(([, completedAt]) => completedAt !== null)
    .map(([key]) => key);
}

/**
 * Build the full ordered module status list for API responses.
 * Includes main-path modules + side quests (appended after their parent).
 */
export function getModuleStatusList(
  progress: UserExplorationProgress,
): ModuleStatusItem[] {
  const completedSet = new Set(getCompletedModulesList(progress));
  const items: ModuleStatusItem[] = [];

  for (const moduleKey of MODULE_SEQUENCE) {
    const meta = MODULE_META[moduleKey];
    const isCompleted = completedSet.has(moduleKey);
    const prerequisites = MODULE_PREREQUISITES[moduleKey];
    const prerequisitesMet = prerequisites.every((prereq) =>
      completedSet.has(prereq),
    );

    const status: ModuleStatus = isCompleted
      ? "completed"
      : prerequisitesMet
        ? "available"
        : "locked";

    const item: ModuleStatusItem = {
      id: meta.id,
      status,
      depth: meta.cumulativeDepth,
      label: meta.label,
      depthGain: meta.depthGain,
    };

    if (meta.time !== undefined) {
      item.time = meta.time;
    }

    if (isCompleted) {
      const completedAt = progress.modules[moduleKey];
      if (completedAt) {
        item.completedAt = completedAt.toISOString();
      }
    }

    items.push(item);

    // Append side quests that branch off this module
    for (const sq of SIDE_QUESTS) {
      if (sq.parentModule !== moduleKey) continue;
      const sqDone = completedSet.has(sq.key);
      const sqItem: ModuleStatusItem = {
        id: sq.id,
        status: sqDone ? "completed" : isCompleted ? "available" : "locked",
        depth: 0, // side quests don't contribute to depth
        label: sq.label,
        depthGain: 0,
      };
      if (sq.time) sqItem.time = sq.time;
      if (sqDone) {
        const sqCompletedAt = progress.modules[sq.key];
        if (sqCompletedAt) sqItem.completedAt = sqCompletedAt.toISOString();
      }
      items.push(sqItem);
    }
  }

  return items;
}
