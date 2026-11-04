import { RouteSurfaceBoundary } from "@/components/design/route-surface-boundary";
import { RoutePageArt } from "@/components/design/meridian/route-page-art";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteSurfaceBoundary>
      <RoutePageArt />
      {children}
    </RouteSurfaceBoundary>
  );
}
