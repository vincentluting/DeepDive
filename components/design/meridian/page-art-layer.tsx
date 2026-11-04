import Image from "next/image";

import { PAGE_ART, PAGE_ART_ASSETS, type PageArt } from "@/lib/design/page-art";

/**
 * PageArtLayer — the Meridian painted-ocean background engine.
 *
 * Fixed full-viewport painting + per-surface wash + grain, sitting behind all
 * content. One painting per mode (Noon/Midnight) with its own crop & filter.
 *
 * Engineering rule (from AmbientField lesson): never mount globally — only in
 * a route-group layout whose pages have no opaque bespoke background, or pass
 * it explicitly per page. Content must sit on the wash, not on the raw image.
 */
export interface PageArtLayerProps {
  /** Key into PAGE_ART (e.g. "dashboard"). Ignored when `art` is provided. */
  route?: keyof typeof PAGE_ART | (string & {});
  /** Explicit config (overrides `route`). */
  art?: PageArt;
  /** Mark the hero image as LCP-priority (landing/auth only). */
  priority?: boolean;
  /** Hide the painting below lg and keep only the wash (perf on mobile). */
  mobileWashOnly?: boolean;
  className?: string;
}

export function PageArtLayer({
  route,
  art: artProp,
  priority = false,
  mobileWashOnly = false,
  className,
}: PageArtLayerProps) {
  const art = artProp ?? (route ? PAGE_ART[route] : undefined);
  if (!art) return null;

  const lightAsset = PAGE_ART_ASSETS[art.light];
  const darkAsset = PAGE_ART_ASSETS[art.dark];
  const wash = art.wash ?? "dive";

  return (
    <div
      aria-hidden="true"
      data-wash={wash}
      className={[
        "md-page-art",
        mobileWashOnly && "md-page-art--wash-only",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ "--page-accent": art.accent } as React.CSSProperties}
    >
      {/* Mode + breakpoint visibility lives in globals.css (.md-page-art__img
          rules) — Tailwind display utilities clash when stacked (lg:block
          overrides dark:hidden). */}
      <Image
        src={lightAsset.src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        quality={75}
        className={`md-page-art__img md-page-art__img--light md-page-art__img--${lightAsset.kind}`}
        style={{ objectPosition: art.posLight }}
      />
      <Image
        src={darkAsset.src}
        alt=""
        fill
        priority={false}
        sizes="100vw"
        quality={75}
        className={`md-page-art__img md-page-art__img--dark md-page-art__img--${darkAsset.kind}`}
        style={{ objectPosition: art.posDark }}
      />
      <div className="md-page-art__wash" />
      <div className="md-grain" />
    </div>
  );
}
