import "@/app/immersive-animations.css";
import { AppHeader } from "@/components/layout/app-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { CoachCompanion } from "@/components/coach/coach-companion";
import { RouteSurfaceBoundary } from "@/components/design/route-surface-boundary";
import { RoutePageArt } from "@/components/design/meridian/route-page-art";
import type { Locale } from "@/lib/i18n/config";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <RouteSurfaceBoundary>
      {/* Meridian Page-Art: per-route painting + wash + grain behind all content.
          Routes without a PAGE_ART entry render nothing (keep bespoke bg). */}
      <RoutePageArt />
      <AppHeader locale={locale as Locale} />
      <main
        id="main-content"
        className="flex-1 min-h-dvh"
        style={{
          paddingTop: "var(--header-height, 64px)",
          // Reserve space for the mobile tab bar (incl. iOS safe-area inset).
          // Variable resolves to 0 on md+ via globals.css, so desktop is unaffected.
          paddingBottom: "var(--mobile-tab-bar-height, 0px)",
        }}
      >
        {children}
      </main>
      <MobileTabBar locale={locale as Locale} />
      <CoachCompanion locale={locale} />
    </RouteSurfaceBoundary>
  );
}
