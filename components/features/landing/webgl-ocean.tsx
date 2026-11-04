"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type MutableRefObject } from "react";

// ============================================================
// WebGLOcean — the four-tier capability gate for the living-water shader.
//
//   Tier 0 SSR / no-JS      → renders nothing (canvas is ssr:false)
//   Tier 1 reduced-motion   → null (no canvas, like dive-particles)
//   Tier 2 mobile/low-end   → null → the existing CSS descent shows, byte
//                             for byte identical to today (China-mobile path)
//   Tier 3 capable desktop  → mounts the WebGL canvas (lazy chunk)
//
// Only Tier 3 ever downloads the shader chunk. The decision re-runs live on
// viewport / reduced-motion changes (matchMedia), mirroring dive-particles.
// ============================================================

const OceanCanvas = dynamic(
  () => import("./webgl-ocean-canvas").then((m) => m.WebGLOceanCanvas),
  { ssr: false },
);

const DESKTOP_MQ = "(min-width: 1024px)";

// Phase 1 foundation flag — OFF until Phase 2 tunes the two-hour grade and
// flips it on. With this false the gate always returns null → the current CSS
// descent is unchanged in both light and dark.
const OCEAN_ENABLED = true;

type CapNavigator = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

// Memoised: WebGL availability never changes within a session, so probe ONCE.
// Re-probing on every matchMedia change would create (and leak) a fresh context
// each time, starving the browser's small live-context quota and breaking the
// real canvas.
let webglProbe: boolean | null = null;

function probeWebGL(): boolean {
  if (webglProbe !== null) return webglProbe;
  try {
    const c = document.createElement("canvas");
    const gl =
      c.getContext("webgl2") ||
      c.getContext("webgl") ||
      c.getContext("experimental-webgl");
    webglProbe = !!gl;
    // Release the throwaway context immediately — don't hold a quota slot.
    if (gl && "getExtension" in gl) {
      (gl as WebGLRenderingContext)
        .getExtension("WEBGL_lose_context")
        ?.loseContext();
    }
    return webglProbe;
  } catch {
    webglProbe = false;
    return false;
  }
}

/** Bail on low-memory / few-core / data-saver devices even at desktop widths. */
function deviceCapable(): boolean {
  const nav = navigator as CapNavigator;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return false;
  }
  if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4
  ) {
    return false;
  }
  if (nav.connection?.saveData) return false;
  return true;
}

export function WebGLOcean({
  depthRef,
}: {
  depthRef: MutableRefObject<number>;
}) {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    if (!OCEAN_ENABLED) return;
    const wide = window.matchMedia(DESKTOP_MQ);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const decide = () => {
      setMount(
        wide.matches && !reduce.matches && deviceCapable() && probeWebGL(),
      );
    };
    decide();
    wide.addEventListener("change", decide);
    reduce.addEventListener("change", decide);
    return () => {
      wide.removeEventListener("change", decide);
      reduce.removeEventListener("change", decide);
    };
  }, []);

  if (!mount) return null;
  return <OceanCanvas depthRef={depthRef} />;
}
