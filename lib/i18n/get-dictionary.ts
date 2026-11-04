import type { Locale } from "./config";

// Section type helper for flat string records
type StringRecord = Record<string, string>;
type ActionCategoryRecord = Record<
  "explore" | "learn" | "network" | "create" | "apply" | "reflect",
  string
>;

export interface Dictionary {
  nav: {
    home: string;
    dashboard: string;
    signIn: string;
    begin: string;
    explore?: string;
    profile?: string;
    reports?: string;
    allReports?: string;
    latestReport?: string;
    tools?: string;
    subtitle?: string;
    settings?: string;
    privacy?: string;
    quickDive?: string;
    aiCoach?: string;
    viewLatestExploration?: string;
    adminLabel: string;
    switchLocale: string;
    mobileNavLabel: string;
  };
  common: {
    home: string;
    dashboard: string;
    signIn: string;
    signOut: string;
    register: string;
    begin: string;
    continue: string;
    back: string;
    next: string;
    submit: string;
    save: string;
    cancel: string;
    delete: string;
    loading: string;
    error: string;
    success: string;
    notFound: string;
    language: string;
    theme: string;
    langLabelEn: string;
    langLabelZh: string;
  };
  // Component-level translation sections
  quickPreview: StringRecord;
  reportsPage: StringRecord;
  loginForm: StringRecord;
  registerForm: StringRecord;
  reportCard: StringRecord;
  profile: StringRecord;
  actionPlan: StringRecord;
  moduleTransition: StringRecord;
  reportsList: StringRecord;
  // Page-level translation sections
  dashboardPage: StringRecord;
  welcomeCard: StringRecord;
  loginPage: StringRecord;
  registerPage: StringRecord;
  forgotPasswordPage: {
    title: string;
    description: string;
    backToLogin: string;
    form: {
      emailLabel: string;
      emailPlaceholder: string;
      submitButton: string;
      submitting: string;
      successMessage: string;
      errorMessage: string;
    };
  };
  resetPasswordPage: {
    title: string;
    description: string;
    form: {
      newPasswordLabel: string;
      confirmPasswordLabel: string;
      submitButton: string;
      submitting: string;
      successMessage: string;
      errorMessage: string;
      tokenExpired: string;
      passwordMismatch: string;
      backToLogin: string;
    };
  };
  reportView: StringRecord;
  questionnaireReviewPage: StringRecord;
  profileReveal: StringRecord;
  // Landing page
  landing: StringRecord;
  reportCardFlow: {
    continueExploring: string;
    goBack: string;
    screenOf: string;
    viewFullReport: string;
    viewCardFlow: string;
    startExploring: string;
    youReachedEnd: string;
    viewProfile: string;
    screenLabels: Record<string, string>;
    screenSubtitles: Record<string, string>;
  };
  depthMeter: StringRecord;
  // Error page
  errorPage: StringRecord;
  // Not found page
  notFoundPage: StringRecord;
  // Page metadata
  metadata: StringRecord;
  // Accessibility labels
  a11y: StringRecord;
  // Confidence indicator
  confidenceIndicator: StringRecord;
  // Migrated from inline translations
  coachingChat: StringRecord;
  aiAnxiety: StringRecord;
  coachCompanion: StringRecord;
  narrativeExplore: StringRecord;
  logoutButton: StringRecord;
  // Report panel translations
  reportPanels: StringRecord;
  // PR-2: migrated inline translations
  microFeedback: StringRecord;
  questionnaireShell: StringRecord;
  realityConditions: StringRecord;
  resumeUpload: StringRecord;
  reportDepthDialog: StringRecord;
  privacy: Record<string, string | string[]>;
  coaching: StringRecord;
  exploreHub: StringRecord;
  quickDive: StringRecord;
  valuesQuestion: StringRecord;
  admin: StringRecord;
  quickDiveReport: StringRecord;
  // Share page
  share: StringRecord;
  // AI memory panel
  memoryPanel: StringRecord;
  // Legal pages
  legal: StringRecord;
  // New sections for hardcoded text migration
  deepDiveIntro: StringRecord;
  // Questionnaire v2.0 question components
  sjtChatBubble: StringRecord;
  pvqLikert: StringRecord;
  ipipLikert: StringRecord;
  coachingInsights: StringRecord;
  // Unified settings page
  settingsPage: StringRecord;
  // Career Inputs card on Settings — resume + future LinkedIn/portfolio sources
  careerInputs: StringRecord;
  // Dashboard continue exploration card
  dashboardContinue: StringRecord;
  // Module C breathing moment messages
  breathingMoments: StringRecord;
  // Completion ceremony teaser
  completionCeremony: StringRecord;
  // Coaching session satisfaction feedback
  coachingFeedback: StringRecord;
  // Ocean exploration map (questionnaire zone progress)
  explorationMap: StringRecord;
  // Share card generation
  shareCard: StringRecord;
  // Exploration hub page
  explorePage: StringRecord;
  // AI Career Impact Checker (public SEO page)
  aiCareerCheck: StringRecord;
  // Pricing page
  pricing: StringRecord;
  // Post-assessment survey (SCC + research questions)
  postAssessment: StringRecord;
  // Post-1-week research reminder
  post1WeekReminder: StringRecord;
  // Cross-tab conflict warning
  crossTabWarning: StringRecord;
  // Pipeline observer page (post Deep Dive processing)
  processing: StringRecord;
  // Cohort journey system (research enrollment, invite codes)
  cohort: {
    journeyTitle: string;
    journeySubtitle: string;
    progressLabel: string;
    steps: {
      pre_assessment: string;
      quick_dive: string;
      deep_dive: string;
      coaching: string;
      post_immediate: string;
      post_1week: string;
    };
    status: {
      completed: string;
      current: string;
      locked: string;
      notYetEligible: string;
    };
    gateMessage: string;
    post1weekNotYet: string;
    allComplete: string;
  };
  // Onboarding
  onboarding: {
    title: string;
    subtitle: string;
    step1Title: string;
    step1Options: StringRecord;
    step2Title: string;
    step2Options: StringRecord;
    startButton: string;
    skipButton: string;
  };
  // Action Hub
  actionHub: {
    title: string;
    subtitle: string;
    subtitleWithArchetype?: string;
    hero?: {
      eyebrow: string;
      eyebrowFirstDay?: string;
      titleWithArchetype: string;
      titleNoArchetype: string;
      statComplete: string;
      statMilestones: string;
      statNextCategory: string;
      statNoMilestones: string;
      statAllDone: string;
      statStale?: string;
    };
    sectionLabels?: {
      keystone: string;
      milestones: string;
      actions: string;
      exercises: string;
    };
    keystoneLabel?: string;
    whyForYou?: string;
    keystoneWhyWithArchetype?: string;
    keystoneWhyNoArchetype?: string;
    generatePlan: string;
    regeneratePlan: string;
    generating: string;
    noPlan: string;
    noPlanDesc: string;
    goToReport: string;
    categories: StringRecord;
    status: StringRecord;
    intensity: StringRecord;
    actions: StringRecord;
    stats: StringRecord;
    progressModel: {
      phaseLabel: string;
      countLabel: string;
      sourceNote: string;
      phase1: string;
      phase2: string;
      phase3: string;
    };
    nextStep: {
      label: string;
      why: string;
      outcome: string;
      start: string;
      complete: string;
      alternatives: string;
      empty: string;
    };
    guidanceTemplates: {
      reasonDefault: string;
      outcomeDefault: string;
      sourcePanel3Week1: string;
      matchedFlowReason: string;
      matchedNonNegReason: string;
      reasonByCategory: ActionCategoryRecord;
      outcomeByCategory: ActionCategoryRecord;
    };
    filters: StringRecord;
    resources: StringRecord;
    minutes: string;
    emptyState: string;
    errors: { loadFailed: string; networkError: string; generic: string };
    milestones: StringRecord;
    progress: StringRecord;
    feedback: StringRecord;
    exercises?: {
      title: string;
      subtitle: string;
      nonNegotiables: {
        title: string;
        subtitle: string;
        instruction: string;
        stepSelect: string;
        stepSelectHint: string;
        stepNarrow: string;
        stepNarrowHint: string;
        stepRank: string;
        stepRankHint: string;
        tooMany: string;
        confirm: string;
        completed: string;
        completedHint: string;
        redo: string;
        rank: string;
        removeLabel: string;
        dimensions: Record<string, string>;
        options: Record<string, string>;
      };
      flowMoments: {
        title: string;
        subtitle: string;
        instruction: string;
        momentLabel: string;
        descriptionPlaceholder: string;
        activityLabel: string;
        socialLabel: string;
        environmentLabel: string;
        addMoment: string;
        confirm: string;
        completed: string;
        completedHint: string;
        redo: string;
        pattern: string;
        noPattern: string;
        activities: Record<string, string>;
        social: Record<string, string>;
        environment: Record<string, string>;
        errors: Record<string, string>;
      };
      energyLog: {
        title: string;
        subtitle: string;
        instruction: string;
        dayLabel: string;
        energizerLabel: string;
        energizerPlaceholder: string;
        drainLabel: string;
        drainPlaceholder: string;
        overallLabel: string;
        saveDay: string;
        saving: string;
        dayComplete: string;
        challengeProgress: string;
        completed: string;
        completedHint: string;
        redo: string;
        avgEnergy: string;
        trend: string;
        trends: Record<string, string>;
        energizers: string;
        drains: string;
        energyLevels: Record<string, string>;
        errors: Record<string, string>;
      };
    };
  };
  // Archetype Companion (social discovery) — see lib/i18n/dictionaries/{locale}/companions.json
  companionSettings: StringRecord;
  companionOnboarding: StringRecord;
  companionDiscover: StringRecord;
  companionConnections: StringRecord;
  companionDashboardCard: StringRecord;
  companionProfileDetail: StringRecord;
  companionReport: StringRecord;
  companionAdminQueue: StringRecord;
  // Research recruitment landing — rendered by app/[locale]/(public)/research
  researchLanding: {
    meta: { title: string; description: string };
    eyebrow: string;
    headline: string;
    subhead: string;
    study: { title: string; body: string };
    whatYouGet: { title: string; items: string[] };
    privacy: { title: string; body: string };
    eligibility: { title: string; items: string[] };
    cta: {
      primary: string;
      primaryNoInvite: string;
      secondary: string;
      inviteHint: string;
      noInviteHint: string;
    };
    trust: {
      researcher: string;
      researcherName: string;
      supervisor: string;
      supervisorName: string;
      contact: string;
    };
    estimatedTime: string;
  };
  // Prerequisite-gate copy — rendered by components/journey/prerequisite-gate.tsx
  // when a feature's preconditions aren't met (replaces silent redirects).
  // Schema is mirrored by lib/journey/gate-copy.ts.
  journeyGate: {
    steps: {
      quickDive: string;
      deepDive: string;
      profile: string;
      report: string;
      actionHub: string;
      coaching: string;
    };
    stepIndicator: string;
    stepAriaLabel: string;
    stepStatus: {
      done: string;
      blocked: string;
      pending: string;
    };
    nav: { locked: string };
    actionHub: GateNamespaceCopy;
    companionsCohort: GateNamespaceCopy;
    companionsOptIn: GateNamespaceCopy;
    companionsProfile: GateNamespaceCopy;
    deepDive: GateNamespaceCopy;
    postAssessment: GateNamespaceCopy;
    pipeline: GateNamespaceCopy;
  };
}

interface GateNamespaceCopy {
  title: string;
  body: string;
  meta?: string;
  primaryCta: string;
  secondaryCta?: string;
}

// ── Namespace-based loading ──────────────────────────────────
// Dictionary is split into namespace files for maintainability:
//   dictionaries/{locale}/common.json, home.json, quickdive.json, etc.
// All namespaces are merged at load time so consumers see one Dictionary.
// The monolithic en.json / zh.json files are kept as reference but no
// longer used by the loader.

const NAMESPACES = [
  "common",
  "home",
  "quickdive",
  "deepdive",
  "report",
  "profile",
  "coaching",
  "dashboard",
  "research",
  "admin",
  "actionHub",
  "cohort",
  "onboarding",
  "pricing",
  "processing",
  "companions",
  "journeyGate",
  "researchLanding",
] as const;

async function loadNamespaces(locale: Locale): Promise<Dictionary> {
  const modules = await Promise.all(
    NAMESPACES.map((ns) =>
      import(`./dictionaries/${locale}/${ns}.json`).then((m) => m.default),
    ),
  );
  return Object.assign({}, ...modules) as Dictionary;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return loadNamespaces(locale);
}
