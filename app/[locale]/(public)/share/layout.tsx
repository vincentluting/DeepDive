import { SurfaceBoundary } from "@/components/design/surface-boundary";

export default function PublicShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SurfaceBoundary
      surface="revelation"
      className="min-h-dvh bg-[var(--rev-paper)] text-[var(--rev-ink)]"
    >
      {children}
    </SurfaceBoundary>
  );
}
