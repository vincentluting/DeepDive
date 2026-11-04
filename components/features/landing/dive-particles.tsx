"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

// ============================================================
// DiveParticles — the living depth gauge.
//
// Extracted from the retired OceanCanvas (its 7-layer shell was a
// dark-only asset; the painting + Tyndall shafts now own that job).
// Two hours of the same sea: noon renders warm sunlit dust, midnight
// renders phosphorescent plankton. Density and brightness rise with
// the shared descent value — few and faint at the surface, alive in
// the deep.
//
// Mount gates: desktop (lg+) only, never under prefers-reduced-motion.
// The rAF loop pauses when the tab is hidden. Reads the depth ref each
// frame — never attaches its own scroll listener.
// ============================================================

const MOUNT_MQ = "(min-width: 1024px)";
const POOL = 40; // particle pool; how many draw depends on depth + hour

export function DiveParticles({
  depthRef,
}: {
  depthRef: MutableRefObject<number>;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(MOUNT_MQ);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setActive(wide.matches && !reduce.matches);
    sync();
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);

  if (!active) return null;
  return <ParticleCanvas depthRef={depthRef} />;
}

function ParticleCanvas({ depthRef }: { depthRef: MutableRefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let animId = 0;
    let running = true;

    const particles: Array<{
      x: number;
      y: number;
      r: number;
      vy: number;
      vx: number;
      alpha: number;
      phase: number;
    }> = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    const init = () => {
      resize();
      particles.length = 0;
      for (let i = 0; i < POOL; i++) {
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
    };

    const draw = (t: number) => {
      if (!running) return;
      const depth = depthRef.current;
      const midnight = document.documentElement.classList.contains("dark");
      // noon: warm dust, sparse (12 → 24); midnight: plankton (16 → 40)
      const count = midnight
        ? Math.round(16 + depth * 24)
        : Math.round(12 + depth * 12);
      const hourAlpha = midnight ? 0.75 : 0.4;
      const color = midnight ? "160, 225, 250" : "255, 250, 238";

      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < count; i++) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(t * 0.001 + p.phase) * 0.1;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        const twinkle = 0.5 + Math.sin(t * 0.002 + p.phase) * 0.5;
        const alpha = p.alpha * twinkle * hourAlpha * (0.55 + depth * 0.45);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = document.visibilityState === "visible";
      if (running) {
        cancelAnimationFrame(animId);
        animId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    init();
    animId = requestAnimationFrame(draw);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(animId);
    };
  }, [depthRef]);

  return <canvas ref={canvasRef} className="dd-dive-particles" aria-hidden />;
}
