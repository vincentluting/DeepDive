"use client";

import { usePathname } from "next/navigation";

import { getPageArt } from "@/lib/design/page-art";

import { PageArtLayer } from "./page-art-layer";

/**
 * RoutePageArt — client wrapper that resolves Page-Art from the current
 * pathname. Mount ONCE in a route-group layout (e.g. `(app)`); the painting,
 * crop and accent then follow navigation automatically.
 *
 * Pages without an art entry render nothing (they keep their bespoke bg).
 */
export function RoutePageArt({
  mobileWashOnly = true,
}: {
  mobileWashOnly?: boolean;
}) {
  const pathname = usePathname();
  const art = getPageArt(pathname ?? "");
  if (!art) return null;
  return <PageArtLayer art={art} mobileWashOnly={mobileWashOnly} />;
}
