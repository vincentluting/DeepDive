import type React from "react";
import type { Surface } from "@/lib/design/surfaces";

/**
 * SurfaceBoundary — declares the Surface for all descendant UI.
 *
 * Wrap route-group layouts to establish the visual domain:
 *
 * ```tsx
 * // app/[locale]/(report)/layout.tsx
 * export default function ReportLayout({ children }) {
 *   return (
 *     <SurfaceBoundary surface="revelation" className="min-h-screen bg-[var(--rev-paper)]">
 *       {children}
 *     </SurfaceBoundary>
 *   );
 * }
 * ```
 *
 * Styles then scope via the attribute selector:
 *
 * ```css
 * [data-surface="revelation"] .btn-primary { ... }
 * ```
 *
 * See `.claude/skills/deepdive-design/references/surfaces.md`.
 */
export function SurfaceBoundary({
  surface,
  children,
  className,
}: {
  surface: Surface;
  children: React.ReactNode;
  className?: string;
}) {
  const boundaryClassName = [
    "dd-surface-boundary",
    `dd-surface-${surface}`,
    surface === "dive" ? "sunlit-field" : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div data-surface={surface} className={boundaryClassName}>
      {children}
    </div>
  );
}
