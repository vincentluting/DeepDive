"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/lib/device";

export interface AmbientParticlesProps {
  /** Base particle count at desktop width. Halved on viewports ≤768px. */
  count?: number;
  /** Particle fill color as an "r, g, b" triplet (alpha is applied per particle). */
  color?: string;
  /** z-index within the ambient container. */
  zIndex?: number;
  className?: string;
}

/**
 * AmbientParticles — parameterized floating-particle canvas, abstracted from
 * the Landing particles (`components/features/landing/dive-particles.tsx`).
 *
 * Particles drift slowly upward with a sine twinkle. Cheap to run: a single
 * 2D canvas driven by one requestAnimationFrame loop. The loop pauses while
 * the tab is hidden (visibilitychange) and renders nothing at all under
 * prefers-reduced-motion. Mobile viewports get half the particle count.
 */
export function AmbientParticles({
  count = 40,
  color = "200, 240, 255",
  zIndex = 0,
  className,
}: AmbientParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const total = Math.max(1, Math.round(isMobile ? count / 2 : count));

    let w = 0;
    let h = 0;
    let animId = 0;
    const particles: Array<{
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      alpha: number;
      phase: number;
    }> = [];

    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }

    function init() {
      resize();
      particles.length = 0;
      for (let i = 0; i < total; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          vy: -(Math.random() * 0.3 + 0.1),
          vx: (Math.random() - 0.5) * 0.2,
          alpha: Math.random() * 0.5 + 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t: number) {
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.1;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const twinkle = 0.5 + Math.sin(t * 0.002 + p.phase) * 0.5;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${color}, ${p.alpha * twinkle})`;
        ctx!.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    function start() {
      if (!animId) animId = requestAnimationFrame(draw);
    }
    function stop() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = 0;
      }
    }
    function onVisibility() {
      if (document.hidden) stop();
      else start();
    }
    const onResize = () => resize();

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    init();
    start();

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      stop();
    };
  }, [count, color]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
      }}
    />
  );
}
