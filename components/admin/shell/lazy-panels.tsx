"use client";

/**
 * Centralized dynamic() wrappers for heavy admin panels.
 *
 * `ssr: false` is only legal inside client components, so server pages
 * import these lazy bindings instead of calling dynamic() themselves.
 * Recharts-heavy panels (~200 KB) stay out of the initial bundle.
 */
import dynamic from "next/dynamic";
import { LoadingSkeleton } from "@/components/admin/shared/states";

const panelLoading = () => <LoadingSkeleton />;

export const LazyInsightsTab = dynamic(
  () =>
    import("@/components/admin/insights/insights-tab").then((m) => ({
      default: m.InsightsTab,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyFunnelBoard = dynamic(
  () =>
    import("@/components/admin/funnel/funnel-board").then((m) => ({
      default: m.FunnelBoard,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyAnalyticsDashboardPanel = dynamic(
  () =>
    import("@/components/admin/analytics/analytics-panel").then((m) => ({
      default: m.AnalyticsDashboardPanel,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyUserProfilesTab = dynamic(
  () =>
    import("@/components/admin/user-profiles-tab").then((m) => ({
      default: m.UserProfilesTab,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyAnonymousQDTab = dynamic(
  () =>
    import("@/components/admin/anonymous-qd-tab").then((m) => ({
      default: m.AnonymousQDTab,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyInviteCodesTab = dynamic(
  () =>
    import("@/components/admin/invite-codes-tab").then((m) => ({
      default: m.InviteCodesTab,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyCareerLibraryTab = dynamic(
  () =>
    import("@/components/admin/career-library/career-library-tab").then(
      (m) => ({ default: m.CareerLibraryTab }),
    ),
  { ssr: false, loading: panelLoading },
);

export const LazyAIUsageTab = dynamic(
  () =>
    import("@/components/admin/ai-usage-tab").then((m) => ({
      default: m.AIUsageTab,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyResearchProgressPanel = dynamic(
  () =>
    import("@/components/admin/research/research-progress-panel").then((m) => ({
      default: m.ResearchProgressPanel,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyThesisAnalyticsPanel = dynamic(
  () =>
    import("@/components/admin/research/thesis-analytics").then((m) => ({
      default: m.ThesisAnalyticsPanel,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyResearchExportPanel = dynamic(
  () =>
    import("@/components/admin/research/research-export-panel").then((m) => ({
      default: m.ResearchExportPanel,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyDataQualityPanel = dynamic(
  () =>
    import("@/components/admin/research/data-quality-panel").then((m) => ({
      default: m.DataQualityPanel,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyRecruitmentFunnelCard = dynamic(
  () =>
    import("@/components/admin/research/recruitment-funnel-card").then((m) => ({
      default: m.RecruitmentFunnelCard,
    })),
  { ssr: false, loading: panelLoading },
);

export const LazyOverviewBoard = dynamic(
  () =>
    import("@/components/admin/overview/overview-board").then((m) => ({
      default: m.OverviewBoard,
    })),
  { ssr: false, loading: panelLoading },
);
