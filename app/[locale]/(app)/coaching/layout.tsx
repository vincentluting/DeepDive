import type React from "react";
import { SurfaceBoundary } from "@/components/design/surface-boundary";

export default function CoachingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SurfaceBoundary
      surface="sanctuary"
      className="min-h-screen bg-[var(--sanc-salt)] text-[var(--sanc-ink)]"
    >
      {children}
    </SurfaceBoundary>
  );
}
