import { ReportHeader } from "@/components/layout/report-header";
import { CoachCompanion } from "@/components/coach/coach-companion";
import { SurfaceBoundary } from "@/components/design/surface-boundary";
import type { Locale } from "@/lib/i18n/config";

export default async function ReportLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SurfaceBoundary
      surface="revelation"
      className="min-h-screen bg-[var(--rev-paper)] text-[var(--rev-ink)]"
    >
      <ReportHeader locale={locale as Locale} />
      <main
        id="main-content"
        className="pb-[max(5rem,env(safe-area-inset-bottom,0px))] md:pb-0"
      >
        {children}
      </main>
      <CoachCompanion locale={locale} />
    </SurfaceBoundary>
  );
}
