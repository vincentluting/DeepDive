"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

import { getSurfaceForPath } from "@/lib/design/surfaces";

/**
 * Locale-level template — wraps every page transition.
 *
 * The shared layout (Header, MobileTabBar, AmbientField) lives in layout.tsx
 * and stays **static** across navigations; only the page content fades.
 *
 * Surface-aware: crossing a Surface boundary (e.g. Dive → Revelation, or
 * Utility → Dive) gets a longer, more deliberate fade so the shift between
 * domains feels intentional; navigating within a Surface stays snappy
 * (iOS-tab-switch feel).
 *
 * Why `template.tsx` and not `layout.tsx`?
 *   - template.tsx re-mounts on every navigation → the enter animation replays
 *   - layout.tsx persists → cannot replay child transitions
 *
 * IMPORTANT — opacity only, never transform:
 *   This element is an ancestor of `position: fixed` UI (AmbientField, the
 *   mobile tab bar, the coach companion). A `transform`/`will-change: transform`
 *   here would make those fixed elements resolve against this box instead of
 *   the viewport, so transitions stay strictly opacity-based.
 */

// Module-scoped so it survives the per-navigation remount of this template,
// letting us detect whether a navigation crossed a Surface boundary.
let prevSurface: string | null = null;

export default function LocaleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const surface = getSurfaceForPath(pathname ?? "/");
  // Read (don't mutate) module state during render so the value is stable
  // across React's double-render in dev StrictMode; commit it in an effect.
  const crossedSurface = prevSurface !== null && prevSurface !== surface;

  useEffect(() => {
    prevSurface = surface;
  }, [surface]);

  return (
    <motion.div
      key={pathname}
      initial={false}
      animate={{ opacity: 1 }}
      transition={
        crossedSurface
          ? { duration: 0.6, ease: [0.16, 1, 0.3, 1] } // cross-surface: --motion-l5 feel
          : { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } // in-surface: snappy
      }
      style={{ willChange: "opacity" }}
    >
      {children}
    </motion.div>
  );
}
