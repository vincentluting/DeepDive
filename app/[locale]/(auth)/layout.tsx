import { MinimalHeader } from "@/components/layout/minimal-header";
import { SurfaceBoundary } from "@/components/design/surface-boundary";
import { RoutePageArt } from "@/components/design/meridian/route-page-art";
import type { Locale } from "@/lib/i18n/config";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SurfaceBoundary surface="utility">
      {/* Meridian: each auth page gets its own painting (lighthouse / sunlit /
          waiting / zeroroom) — full painting on every breakpoint, it IS the page. */}
      <RoutePageArt mobileWashOnly={false} />
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-white focus-visible:rounded-lg"
      >
        Skip to content
      </a>
      <MinimalHeader locale={locale as Locale} />
      {children}
    </SurfaceBoundary>
  );
}
