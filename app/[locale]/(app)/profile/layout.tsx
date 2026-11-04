import { SurfaceBoundary } from "@/components/design/surface-boundary";
import { PageArtLayer } from "@/components/design/meridian/page-art-layer";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SurfaceBoundary
      surface="revelation"
      className="min-h-dvh bg-[var(--rev-paper)] text-[var(--rev-ink)]"
    >
      <PageArtLayer route="profile" priority />
      {children}
    </SurfaceBoundary>
  );
}
