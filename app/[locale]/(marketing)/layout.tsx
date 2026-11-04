import "@/app/immersive-animations.css";
import { BrandHeader } from "@/components/layout/brand-header";
import { SurfaceBoundary } from "@/components/design/surface-boundary";
import type { Locale } from "@/lib/i18n/config";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SurfaceBoundary surface="dive">
      <BrandHeader locale={locale as Locale} />
      <main id="main-content">{children}</main>
    </SurfaceBoundary>
  );
}
