"use client";

import { useEffect, useState } from "react";

import type { Surface } from "@/lib/design/surfaces";
import { prefersReducedMotion } from "@/lib/device";

import { AmbientParticles } from "./ambient-particles";

/**
 * Per-surface particle treatment. `null` = no particle canvas for that surface
 * (Revelation paper stays calm — glow + depth only).
 */
const PARTICLE_CONFIG: Record<
  Surface,
  { count: number; color: string } | null
> = {
  dive: { count: 32, color: "118, 212, 232" }, // Meridian phosphorescent motes
  utility: { count: 12, color: "110, 147, 171" }, // sparse sea-soft motes
  revelation: null,
  sanctuary: { count: 14, color: "216, 180, 106" }, // moon-gold motes
};

export interface AmbientFieldProps {
  surface: Surface;
  /** Overall strength. `subtle` dims the whole field; `intense` is full. */
  intensity?: "subtle" | "normal" | "intense";
  /** Force-disable the particle canvas (the glow + depth layers still render). */
  particles?: boolean;
  className?: string;
}

/**
 * AmbientField — the site-wide living background layer (v2 Surface System).
 *
 * One engine, per-surface skin: a fixed, pointer-inert layer that sits behind
 * all content and gives every Surface a breathing backdrop instead of a static
 * gradient. Glow + depth layers are pure CSS (so they render server-side and
 * survive prefers-reduced-motion as a static atmosphere); the particle canvas
 * only mounts client-side when motion is allowed.
 *
 * Mounted once per `SurfaceBoundary` — see `components/design/surface-boundary.tsx`.
 * Visual treatment + per-surface palettes live in `app/globals.css`
 * (`.dd-ambient*`).
 */
export function AmbientField({
  surface,
  intensity = "normal",
  particles = true,
  className,
}: AmbientFieldProps) {
  // Gate the particle canvas behind mount + motion preference so SSR and the
  // first client render agree (both render no canvas → no hydration mismatch).
  const [motionOk, setMotionOk] = useState(false);
  useEffect(() => {
    setMotionOk(!prefersReducedMotion());
  }, []);

  const cfg = PARTICLE_CONFIG[surface];
  const showParticles = particles && motionOk && cfg !== null;

  const className_ = [
    "dd-ambient",
    intensity === "subtle" && "dd-ambient--subtle",
    intensity === "intense" && "dd-ambient--intense",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className_} data-surface={surface} aria-hidden="true">
      <div className="dd-ambient__glow dd-ambient__glow--1" />
      <div className="dd-ambient__glow dd-ambient__glow--2" />
      <div className="dd-ambient__depth" />
      {showParticles && cfg ? (
        <AmbientParticles count={cfg.count} color={cfg.color} zIndex={1} />
      ) : null}
    </div>
  );
}
