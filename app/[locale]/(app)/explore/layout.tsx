import { SurfaceBoundary } from "@/components/design/surface-boundary";

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SurfaceBoundary surface="dive" className="min-h-dvh">
      {children}
    </SurfaceBoundary>
  );
}
