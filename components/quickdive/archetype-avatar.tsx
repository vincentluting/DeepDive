// ============================================================
// Archetype Avatar Image — renderer for the 12-archetype avatar
// illustrations shipped under public/12 avatar/.
//
// Asset URL generation is centralized in archetype-avatar-asset.ts.
// Gender resolution priority (when prop omitted):
//   1. useAvatarGender() hook (localStorage)
//   2. archetypeCode-hash deterministic fallback
//
// If the mapped URL returns 404 (e.g. unrecognized archetype code),
// the component falls back to a placeholder. Dev mode shows the code
// in the placeholder to ease debugging.
// ============================================================

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Maximize2, X } from "lucide-react";
import { resolveAvatarUrl, type AvatarGender } from "./archetype-avatar-asset";
import { useAvatarGender } from "./use-avatar-gender";

export type AvatarImageVariant = "hero" | "badge";

interface ArchetypeAvatarImageBaseProps {
  archetypeCode: string;
  variant: AvatarImageVariant;
  /**
   * Explicit gender override. If omitted:
   *   - `useHookGender` defaults to true → reads useAvatarGender()
   *   - Otherwise the deterministic fallback is used directly
   */
  gender?: AvatarGender | null;
  /** When true and no `gender` is passed, read from useAvatarGender. */
  useHookGender?: boolean;
  /** Full URL override (rarely needed). Wins over `archetypeCode + gender`. */
  src?: string;
  /** ARIA label for screen readers (usually the archetype display name). */
  label?: string;
  /** Next/Image `priority` — use on above-the-fold hero only. */
  priority?: boolean;
  className?: string;
}

type ArchetypeAvatarImageProps = ArchetypeAvatarImageBaseProps &
  (
    | {
        expandable?: false;
        closeLabel?: string;
      }
    | {
        /** When true, the hero portrait can be opened in a larger overlay. */
        expandable: true;
        /** Localised close label for the expanded overlay. */
        closeLabel: string;
      }
  );

export function ArchetypeAvatarImage({
  archetypeCode,
  variant,
  gender,
  useHookGender = false,
  src,
  label,
  priority,
  expandable = false,
  closeLabel,
  className,
}: ArchetypeAvatarImageProps) {
  const hook = useAvatarGender({ archetypeCode });
  const resolvedGender: AvatarGender | null =
    gender !== undefined ? gender : useHookGender ? hook.gender : null;

  const resolvedSrc = useMemo(() => {
    if (src) return src;
    return resolveAvatarUrl(archetypeCode, resolvedGender);
  }, [src, archetypeCode, resolvedGender]);

  const [loadFailed, setLoadFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!previewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  if (!resolvedSrc || loadFailed) {
    return variant === "hero" ? (
      <HeroPlaceholder
        archetypeCode={archetypeCode}
        isDev={isDev}
        className={className}
      />
    ) : (
      <BadgePlaceholder archetypeCode={archetypeCode} className={className} />
    );
  }

  if (variant === "hero") {
    const heroImage = (
      <div
        className={`relative w-full h-full ${className ?? ""}`}
        aria-label={label}
      >
        <Image
          src={resolvedSrc}
          alt={label ?? archetypeCode}
          fill
          priority={priority}
          sizes="(max-width: 640px) 80vw, 400px"
          style={{ objectFit: "contain", objectPosition: "center" }}
          onError={() => setLoadFailed(true)}
        />
      </div>
    );

    if (!expandable) return heroImage;

    return (
      <>
        <button
          type="button"
          aria-label={label ?? archetypeCode}
          onClick={() => setPreviewOpen(true)}
          className="group relative block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rev-glow-cold focus-visible:ring-offset-4 focus-visible:ring-offset-rev-paper"
        >
          {heroImage}
          <span
            aria-hidden="true"
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-rev-rule bg-rev-paper/90 text-rev-ink-soft opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>

        {previewOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={label ?? archetypeCode}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-rev-ink/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewOpen(false)}
          >
            <button
              type="button"
              aria-label={closeLabel}
              onClick={() => setPreviewOpen(false)}
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-[2px] border border-rev-paper/20 bg-rev-paper/12 text-rev-paper transition hover:bg-rev-paper/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rev-glow-cold"
            >
              <X className="h-5 w-5" />
            </button>
            <div
              className="relative aspect-square w-[min(88vw,82svh)] max-w-[calc(100vw-2rem)]"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={resolvedSrc}
                alt={label ?? archetypeCode}
                fill
                sizes="(max-width: 640px) 88vw, 82vh"
                style={{ objectFit: "contain", objectPosition: "center" }}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={`relative w-12 h-12 rounded-full overflow-hidden ${className ?? ""}`}
      aria-label={label}
    >
      <Image
        src={resolvedSrc}
        alt={label ?? archetypeCode}
        fill
        sizes="48px"
        style={{ objectFit: "cover", objectPosition: "center top" }}
        onError={() => setLoadFailed(true)}
      />
    </div>
  );
}

// ── Placeholders (shown when URL is null or image fails to load) ──

function HeroPlaceholder({
  archetypeCode,
  isDev,
  className,
}: {
  archetypeCode: string;
  isDev: boolean;
  className?: string;
}) {
  if (!isDev) {
    return (
      <div className={`w-full h-full ${className ?? ""}`} aria-hidden="true" />
    );
  }
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${className ?? ""}`}
      style={{
        border: "1px dashed rgba(255, 225, 160, 0.25)",
        borderRadius: 12,
      }}
    >
      <span
        className="text-xs font-mono tracking-wider"
        style={{ color: "rgba(255, 225, 160, 0.45)" }}
      >
        avatar placeholder · {archetypeCode}
      </span>
    </div>
  );
}


function BadgePlaceholder({
  archetypeCode,
  className,
}: {
  archetypeCode: string;
  className?: string;
}) {
  const initials = getInitials(archetypeCode);
  return (
    <div
      className={`w-12 h-12 rounded-full flex items-center justify-center ${className ?? ""}`}
      style={{
        background: "rgba(255, 225, 160, 0.1)",
        border: "1px solid rgba(255, 225, 160, 0.2)",
      }}
      aria-hidden="true"
    >
      <span
        className="text-[11px] font-mono tracking-wider uppercase"
        style={{ color: "rgba(255, 225, 160, 0.7)" }}
      >
        {initials}
      </span>
    </div>
  );
}

function getInitials(code: string): string {
  const cleaned = code.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (cleaned.length <= 2) return cleaned;
  const hyphenParts = code.split("-");
  if (hyphenParts.length >= 2) {
    return (hyphenParts[0][0] + hyphenParts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2);
}
