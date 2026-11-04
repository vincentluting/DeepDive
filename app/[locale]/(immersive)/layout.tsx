import "@/app/immersive-animations.css";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { SurfaceBoundary } from "@/components/design/surface-boundary";
import type { Locale } from "@/lib/i18n/config";

export default async function ImmersiveLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale as Locale);

  return (
    <SurfaceBoundary surface="dive">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-primary focus-visible:text-white focus-visible:rounded-lg"
      >
        {dict.a11y.skipToContent}
      </a>
      {children}
    </SurfaceBoundary>
  );
}
