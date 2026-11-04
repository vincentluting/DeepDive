import type { Locale } from "./config";
import type { Dictionary } from "./get-dictionary";

// ── Namespace imports (bundled at build time) ────────────────
// Client components need synchronous access, so all namespace
// files are statically imported and merged once.

import enCommon from "./dictionaries/en/common.json";
import enHome from "./dictionaries/en/home.json";
import enQuickdive from "./dictionaries/en/quickdive.json";
import enDeepdive from "./dictionaries/en/deepdive.json";
import enReport from "./dictionaries/en/report.json";
import enProfile from "./dictionaries/en/profile.json";
import enCoaching from "./dictionaries/en/coaching.json";
import enDashboard from "./dictionaries/en/dashboard.json";
import enResearch from "./dictionaries/en/research.json";
import enAdmin from "./dictionaries/en/admin.json";
import enCohort from "./dictionaries/en/cohort.json";
import enActionHub from "./dictionaries/en/actionHub.json";
import enOnboarding from "./dictionaries/en/onboarding.json";
import enPricing from "./dictionaries/en/pricing.json";
import enProcessing from "./dictionaries/en/processing.json";
import enCompanions from "./dictionaries/en/companions.json";
import enJourneyGate from "./dictionaries/en/journeyGate.json";
import enResearchLanding from "./dictionaries/en/researchLanding.json";

import zhCommon from "./dictionaries/zh/common.json";
import zhHome from "./dictionaries/zh/home.json";
import zhQuickdive from "./dictionaries/zh/quickdive.json";
import zhDeepdive from "./dictionaries/zh/deepdive.json";
import zhReport from "./dictionaries/zh/report.json";
import zhProfile from "./dictionaries/zh/profile.json";
import zhCoaching from "./dictionaries/zh/coaching.json";
import zhDashboard from "./dictionaries/zh/dashboard.json";
import zhResearch from "./dictionaries/zh/research.json";
import zhAdmin from "./dictionaries/zh/admin.json";
import zhCohort from "./dictionaries/zh/cohort.json";
import zhActionHub from "./dictionaries/zh/actionHub.json";
import zhOnboarding from "./dictionaries/zh/onboarding.json";
import zhPricing from "./dictionaries/zh/pricing.json";
import zhProcessing from "./dictionaries/zh/processing.json";
import zhCompanions from "./dictionaries/zh/companions.json";
import zhJourneyGate from "./dictionaries/zh/journeyGate.json";
import zhResearchLanding from "./dictionaries/zh/researchLanding.json";

import nlCommon from "./dictionaries/nl/common.json";
import nlHome from "./dictionaries/nl/home.json";
import nlQuickdive from "./dictionaries/nl/quickdive.json";
import nlDeepdive from "./dictionaries/nl/deepdive.json";
import nlReport from "./dictionaries/nl/report.json";
import nlProfile from "./dictionaries/nl/profile.json";
import nlCoaching from "./dictionaries/nl/coaching.json";
import nlDashboard from "./dictionaries/nl/dashboard.json";
import nlResearch from "./dictionaries/nl/research.json";
import nlAdmin from "./dictionaries/nl/admin.json";
import nlCohort from "./dictionaries/nl/cohort.json";
import nlActionHub from "./dictionaries/nl/actionHub.json";
import nlOnboarding from "./dictionaries/nl/onboarding.json";
import nlPricing from "./dictionaries/nl/pricing.json";
import nlProcessing from "./dictionaries/nl/processing.json";
import nlCompanions from "./dictionaries/nl/companions.json";
import nlJourneyGate from "./dictionaries/nl/journeyGate.json";
import nlResearchLanding from "./dictionaries/nl/researchLanding.json";

import deCommon from "./dictionaries/de/common.json";
import deHome from "./dictionaries/de/home.json";
import deQuickdive from "./dictionaries/de/quickdive.json";
import deDeepdive from "./dictionaries/de/deepdive.json";
import deReport from "./dictionaries/de/report.json";
import deProfile from "./dictionaries/de/profile.json";
import deCoaching from "./dictionaries/de/coaching.json";
import deDashboard from "./dictionaries/de/dashboard.json";
import deResearch from "./dictionaries/de/research.json";
import deAdmin from "./dictionaries/de/admin.json";
import deCohort from "./dictionaries/de/cohort.json";
import deActionHub from "./dictionaries/de/actionHub.json";
import deOnboarding from "./dictionaries/de/onboarding.json";
import dePricing from "./dictionaries/de/pricing.json";
import deProcessing from "./dictionaries/de/processing.json";
import deCompanions from "./dictionaries/de/companions.json";
import deJourneyGate from "./dictionaries/de/journeyGate.json";
import deResearchLanding from "./dictionaries/de/researchLanding.json";

import frCommon from "./dictionaries/fr/common.json";
import frHome from "./dictionaries/fr/home.json";
import frQuickdive from "./dictionaries/fr/quickdive.json";
import frDeepdive from "./dictionaries/fr/deepdive.json";
import frReport from "./dictionaries/fr/report.json";
import frProfile from "./dictionaries/fr/profile.json";
import frCoaching from "./dictionaries/fr/coaching.json";
import frDashboard from "./dictionaries/fr/dashboard.json";
import frResearch from "./dictionaries/fr/research.json";
import frAdmin from "./dictionaries/fr/admin.json";
import frCohort from "./dictionaries/fr/cohort.json";
import frActionHub from "./dictionaries/fr/actionHub.json";
import frOnboarding from "./dictionaries/fr/onboarding.json";
import frPricing from "./dictionaries/fr/pricing.json";
import frProcessing from "./dictionaries/fr/processing.json";
import frCompanions from "./dictionaries/fr/companions.json";
import frJourneyGate from "./dictionaries/fr/journeyGate.json";
import frResearchLanding from "./dictionaries/fr/researchLanding.json";

import esCommon from "./dictionaries/es/common.json";
import esHome from "./dictionaries/es/home.json";
import esQuickdive from "./dictionaries/es/quickdive.json";
import esDeepdive from "./dictionaries/es/deepdive.json";
import esReport from "./dictionaries/es/report.json";
import esProfile from "./dictionaries/es/profile.json";
import esCoaching from "./dictionaries/es/coaching.json";
import esDashboard from "./dictionaries/es/dashboard.json";
import esResearch from "./dictionaries/es/research.json";
import esAdmin from "./dictionaries/es/admin.json";
import esCohort from "./dictionaries/es/cohort.json";
import esActionHub from "./dictionaries/es/actionHub.json";
import esOnboarding from "./dictionaries/es/onboarding.json";
import esPricing from "./dictionaries/es/pricing.json";
import esProcessing from "./dictionaries/es/processing.json";
import esCompanions from "./dictionaries/es/companions.json";
import esJourneyGate from "./dictionaries/es/journeyGate.json";
import esResearchLanding from "./dictionaries/es/researchLanding.json";

import ptCommon from "./dictionaries/pt/common.json";
import ptHome from "./dictionaries/pt/home.json";
import ptQuickdive from "./dictionaries/pt/quickdive.json";
import ptDeepdive from "./dictionaries/pt/deepdive.json";
import ptReport from "./dictionaries/pt/report.json";
import ptProfile from "./dictionaries/pt/profile.json";
import ptCoaching from "./dictionaries/pt/coaching.json";
import ptDashboard from "./dictionaries/pt/dashboard.json";
import ptResearch from "./dictionaries/pt/research.json";
import ptAdmin from "./dictionaries/pt/admin.json";
import ptCohort from "./dictionaries/pt/cohort.json";
import ptActionHub from "./dictionaries/pt/actionHub.json";
import ptOnboarding from "./dictionaries/pt/onboarding.json";
import ptPricing from "./dictionaries/pt/pricing.json";
import ptProcessing from "./dictionaries/pt/processing.json";
import ptCompanions from "./dictionaries/pt/companions.json";
import ptJourneyGate from "./dictionaries/pt/journeyGate.json";
import ptResearchLanding from "./dictionaries/pt/researchLanding.json";

import itCommon from "./dictionaries/it/common.json";
import itHome from "./dictionaries/it/home.json";
import itQuickdive from "./dictionaries/it/quickdive.json";
import itDeepdive from "./dictionaries/it/deepdive.json";
import itReport from "./dictionaries/it/report.json";
import itProfile from "./dictionaries/it/profile.json";
import itCoaching from "./dictionaries/it/coaching.json";
import itDashboard from "./dictionaries/it/dashboard.json";
import itResearch from "./dictionaries/it/research.json";
import itAdmin from "./dictionaries/it/admin.json";
import itCohort from "./dictionaries/it/cohort.json";
import itActionHub from "./dictionaries/it/actionHub.json";
import itOnboarding from "./dictionaries/it/onboarding.json";
import itPricing from "./dictionaries/it/pricing.json";
import itProcessing from "./dictionaries/it/processing.json";
import itCompanions from "./dictionaries/it/companions.json";
import itJourneyGate from "./dictionaries/it/journeyGate.json";
import itResearchLanding from "./dictionaries/it/researchLanding.json";

import ruCommon from "./dictionaries/ru/common.json";
import ruHome from "./dictionaries/ru/home.json";
import ruQuickdive from "./dictionaries/ru/quickdive.json";
import ruDeepdive from "./dictionaries/ru/deepdive.json";
import ruReport from "./dictionaries/ru/report.json";
import ruProfile from "./dictionaries/ru/profile.json";
import ruCoaching from "./dictionaries/ru/coaching.json";
import ruDashboard from "./dictionaries/ru/dashboard.json";
import ruResearch from "./dictionaries/ru/research.json";
import ruAdmin from "./dictionaries/ru/admin.json";
import ruCohort from "./dictionaries/ru/cohort.json";
import ruActionHub from "./dictionaries/ru/actionHub.json";
import ruOnboarding from "./dictionaries/ru/onboarding.json";
import ruPricing from "./dictionaries/ru/pricing.json";
import ruProcessing from "./dictionaries/ru/processing.json";
import ruCompanions from "./dictionaries/ru/companions.json";
import ruJourneyGate from "./dictionaries/ru/journeyGate.json";
import ruResearchLanding from "./dictionaries/ru/researchLanding.json";

import jaCommon from "./dictionaries/ja/common.json";
import jaHome from "./dictionaries/ja/home.json";
import jaQuickdive from "./dictionaries/ja/quickdive.json";
import jaDeepdive from "./dictionaries/ja/deepdive.json";
import jaReport from "./dictionaries/ja/report.json";
import jaProfile from "./dictionaries/ja/profile.json";
import jaCoaching from "./dictionaries/ja/coaching.json";
import jaDashboard from "./dictionaries/ja/dashboard.json";
import jaResearch from "./dictionaries/ja/research.json";
import jaAdmin from "./dictionaries/ja/admin.json";
import jaCohort from "./dictionaries/ja/cohort.json";
import jaActionHub from "./dictionaries/ja/actionHub.json";
import jaOnboarding from "./dictionaries/ja/onboarding.json";
import jaPricing from "./dictionaries/ja/pricing.json";
import jaProcessing from "./dictionaries/ja/processing.json";
import jaCompanions from "./dictionaries/ja/companions.json";
import jaJourneyGate from "./dictionaries/ja/journeyGate.json";
import jaResearchLanding from "./dictionaries/ja/researchLanding.json";

import koCommon from "./dictionaries/ko/common.json";
import koHome from "./dictionaries/ko/home.json";
import koQuickdive from "./dictionaries/ko/quickdive.json";
import koDeepdive from "./dictionaries/ko/deepdive.json";
import koReport from "./dictionaries/ko/report.json";
import koProfile from "./dictionaries/ko/profile.json";
import koCoaching from "./dictionaries/ko/coaching.json";
import koDashboard from "./dictionaries/ko/dashboard.json";
import koResearch from "./dictionaries/ko/research.json";
import koAdmin from "./dictionaries/ko/admin.json";
import koCohort from "./dictionaries/ko/cohort.json";
import koActionHub from "./dictionaries/ko/actionHub.json";
import koOnboarding from "./dictionaries/ko/onboarding.json";
import koPricing from "./dictionaries/ko/pricing.json";
import koProcessing from "./dictionaries/ko/processing.json";
import koCompanions from "./dictionaries/ko/companions.json";
import koJourneyGate from "./dictionaries/ko/journeyGate.json";
import koResearchLanding from "./dictionaries/ko/researchLanding.json";

// ── Merge namespaces into full dictionaries ─────────────────
const merge = (...modules: unknown[]) =>
  Object.assign({}, ...modules) as unknown as Dictionary;

const enDict = merge(
  enCommon,
  enHome,
  enQuickdive,
  enDeepdive,
  enReport,
  enProfile,
  enCoaching,
  enDashboard,
  enResearch,
  enAdmin,
  enCohort,
  enActionHub,
  enOnboarding,
  enPricing,
  enProcessing,
  enCompanions,
  enJourneyGate,
  enResearchLanding,
);
const zhDict = merge(
  zhCommon,
  zhHome,
  zhQuickdive,
  zhDeepdive,
  zhReport,
  zhProfile,
  zhCoaching,
  zhDashboard,
  zhResearch,
  zhAdmin,
  zhCohort,
  zhActionHub,
  zhOnboarding,
  zhPricing,
  zhProcessing,
  zhCompanions,
  zhJourneyGate,
  zhResearchLanding,
);
const nlDict = merge(
  nlCommon,
  nlHome,
  nlQuickdive,
  nlDeepdive,
  nlReport,
  nlProfile,
  nlCoaching,
  nlDashboard,
  nlResearch,
  nlAdmin,
  nlCohort,
  nlActionHub,
  nlOnboarding,
  nlPricing,
  nlProcessing,
  nlCompanions,
  nlJourneyGate,
  nlResearchLanding,
);
const deDict = merge(
  deCommon,
  deHome,
  deQuickdive,
  deDeepdive,
  deReport,
  deProfile,
  deCoaching,
  deDashboard,
  deResearch,
  deAdmin,
  deCohort,
  deActionHub,
  deOnboarding,
  dePricing,
  deProcessing,
  deCompanions,
  deJourneyGate,
  deResearchLanding,
);
const frDict = merge(
  frCommon,
  frHome,
  frQuickdive,
  frDeepdive,
  frReport,
  frProfile,
  frCoaching,
  frDashboard,
  frResearch,
  frAdmin,
  frCohort,
  frActionHub,
  frOnboarding,
  frPricing,
  frProcessing,
  frCompanions,
  frJourneyGate,
  frResearchLanding,
);
const esDict = merge(
  esCommon,
  esHome,
  esQuickdive,
  esDeepdive,
  esReport,
  esProfile,
  esCoaching,
  esDashboard,
  esResearch,
  esAdmin,
  esCohort,
  esActionHub,
  esOnboarding,
  esPricing,
  esProcessing,
  esCompanions,
  esJourneyGate,
  esResearchLanding,
);
const ptDict = merge(
  ptCommon,
  ptHome,
  ptQuickdive,
  ptDeepdive,
  ptReport,
  ptProfile,
  ptCoaching,
  ptDashboard,
  ptResearch,
  ptAdmin,
  ptCohort,
  ptActionHub,
  ptOnboarding,
  ptPricing,
  ptProcessing,
  ptCompanions,
  ptJourneyGate,
  ptResearchLanding,
);
const itDict = merge(
  itCommon,
  itHome,
  itQuickdive,
  itDeepdive,
  itReport,
  itProfile,
  itCoaching,
  itDashboard,
  itResearch,
  itAdmin,
  itCohort,
  itActionHub,
  itOnboarding,
  itPricing,
  itProcessing,
  itCompanions,
  itJourneyGate,
  itResearchLanding,
);
const ruDict = merge(
  ruCommon,
  ruHome,
  ruQuickdive,
  ruDeepdive,
  ruReport,
  ruProfile,
  ruCoaching,
  ruDashboard,
  ruResearch,
  ruAdmin,
  ruCohort,
  ruActionHub,
  ruOnboarding,
  ruPricing,
  ruProcessing,
  ruCompanions,
  ruJourneyGate,
  ruResearchLanding,
);
const jaDict = merge(
  jaCommon,
  jaHome,
  jaQuickdive,
  jaDeepdive,
  jaReport,
  jaProfile,
  jaCoaching,
  jaDashboard,
  jaResearch,
  jaAdmin,
  jaCohort,
  jaActionHub,
  jaOnboarding,
  jaPricing,
  jaProcessing,
  jaCompanions,
  jaJourneyGate,
  jaResearchLanding,
);
const koDict = merge(
  koCommon,
  koHome,
  koQuickdive,
  koDeepdive,
  koReport,
  koProfile,
  koCoaching,
  koDashboard,
  koResearch,
  koAdmin,
  koCohort,
  koActionHub,
  koOnboarding,
  koPricing,
  koProcessing,
  koCompanions,
  koJourneyGate,
  koResearchLanding,
);

const dictionaries: Partial<Record<Locale, Dictionary>> & { en: Dictionary } = {
  en: enDict,
  zh: zhDict,
  nl: nlDict,
  de: deDict,
  fr: frDict,
  es: esDict,
  pt: ptDict,
  it: itDict,
  ru: ruDict,
  ja: jaDict,
  ko: koDict,
};

/**
 * Synchronous dictionary loader for client components.
 * All namespace files are bundled at build time.
 */
export function getDictionaryClient(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

/**
 * Get a specific section from the dictionary.
 * Useful for components that only need one section.
 */
export function getDictionarySection<K extends keyof Dictionary>(
  locale: Locale,
  section: K,
): Dictionary[K] {
  const dict = getDictionaryClient(locale);
  return dict[section];
}

// ── Typed slices of the admin namespace ─────────────────────
// The full Admin dictionary is loosely typed as Record<string, string> in
// get-dictionary.ts because its 70+ keys mix flat strings with nested
// objects. For new admin UI work, prefer adding a typed slice + helper here
// so consumers don't sprinkle `as unknown as ...` at the call site.

export interface AdminViewingAsBannerDictionary {
  /** Banner title — must contain a "{email}" placeholder. */
  title: string;
  /** Read-only notice shown under the title. */
  subtitle: string;
  /** "Back to Admin Panel" link label. */
  backToPanel: string;
  /** "View Journey" link label. */
  viewJourney: string;
}

/**
 * Fetch the typed `admin.viewingAsBanner` slice for a locale. Centralizes the
 * runtime-vs-type-mismatch cast for the admin namespace (Dictionary.admin is
 * still typed as Record<string, string> for legacy reasons even though the
 * underlying JSON is nested — see get-dictionary.ts:141).
 */
export function getAdminViewingAsBanner(
  locale: Locale,
): AdminViewingAsBannerDictionary {
  const admin = getDictionaryClient(locale).admin as unknown as {
    viewingAsBanner: AdminViewingAsBannerDictionary;
  };
  return admin.viewingAsBanner;
}

/**
 * Simple template string interpolation.
 * Supports both {{variable}} and {variable} placeholders.
 *
 * Example:
 *   interpolate("Hello {{name}}", { name: "World" }) => "Hello World"
 *   interpolate("Page {page} of {total}", { page: 1, total: 5 }) => "Page 1 of 5"
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) =>
      result
        .replaceAll(`{{${key}}}`, String(value))
        .replaceAll(`{${key}}`, String(value)),
    template,
  );
}
