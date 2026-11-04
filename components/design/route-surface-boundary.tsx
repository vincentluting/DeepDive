"use client";

import type React from "react";
import { usePathname } from "next/navigation";

import { SurfaceBoundary } from "@/components/design/surface-boundary";
import { getSurfaceForPath } from "@/lib/design/surfaces";

export function RouteSurfaceBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const surface = getSurfaceForPath(pathname ?? "/");

  return <SurfaceBoundary surface={surface}>{children}</SurfaceBoundary>;
}
