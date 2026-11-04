"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface DepthMeterProps {
  maxDepth?: number;
  locale?: string;
}

export function DepthMeter({
  maxDepth = 3000,
  locale = "en",
}: DepthMeterProps) {
  const dict = getDictionaryClient(locale as "en" | "zh");
  const zl = dict.depthMeter as Record<string, string>;

  const [depth, setDepth] = useState(0);
  const rafRef = useRef<number>(0);

  const updateDepth = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    const scrollPercent = scrollTop / docHeight;
    const newDepth = Math.round(Math.max(0, scrollPercent * maxDepth));
    setDepth(newDepth);
  }, [maxDepth]);

  useEffect(() => {
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateDepth);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateDepth();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateDepth]);

  const getZone = (d: number) => {
    if (d < 200)
      return { name: "EPIPELAGIC", label: zl.sunlight, color: "text-cyan-300" };
    if (d < 1000)
      return { name: "MESOPELAGIC", label: zl.twilight, color: "text-sky-300" };
    return { name: "BATHYPELAGIC", label: zl.midnight, color: "text-blue-300" };
  };

  const getSection = (d: number) => {
    if (d < 300) return zl.sectionHero;
    if (d < 800) return zl.sectionArchetypes;
    if (d < 1500) return zl.sectionFeatures;
    if (d < 2200) return zl.sectionTrust;
    return zl.sectionCta;
  };

  const getNumberColor = (d: number) => {
    if (d < 400) return "#E0F7FA";
    if (d < 800) return "#E8F6FF";
    return "#F0F8FF";
  };

  const zone = getZone(depth);
  const section = getSection(depth);
  const progress = Math.min((depth / maxDepth) * 100, 100);

  return (
    <>
      {/* Desktop: full depth meter */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-end gap-2 z-30 pointer-events-none select-none">
        <div className="text-right">
          {/* Depth number */}
          <div
            className="text-4xl font-mono font-bold tracking-tighter tabular-nums transition-colors duration-500"
            style={{ color: getNumberColor(depth) }}
          >
            {depth.toFixed(0)}
            <span
              className="text-sm ml-1 font-sans opacity-60"
              style={{ color: depth < 400 ? "#80CBC4" : "#7DD3FC" }}
            >
              m
            </span>
          </div>

          {/* Zone name */}
          <div
            className={`text-[11px] font-bold tracking-[0.2em] ${zone.color} transition-colors duration-500`}
          >
            {zone.name}
          </div>
          <div
            className="text-[10px] uppercase tracking-widest mt-1 transition-colors duration-500"
            style={{
              color: depth < 400 ? "rgba(224,247,250,0.5)" : "#7DD3FC80",
            }}
          >
            {zone.label}
          </div>

          {/* Current section indicator */}
          <div
            className="mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full inline-block transition-colors duration-500"
            style={{
              color: depth < 400 ? "#B2EBF2" : "#62C0E4",
              background:
                depth < 400 ? "rgba(178,235,242,0.1)" : "rgba(98,192,228,0.08)",
            }}
          >
            {section}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="h-48 w-[3px] rounded-full relative mt-4 overflow-hidden transition-colors duration-500"
          style={{
            background:
              depth < 400 ? "rgba(224,247,250,0.2)" : "rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="absolute top-0 w-full rounded-full bg-gradient-to-b from-cyan-300 via-sky-500 to-blue-600 transition-all duration-300"
            style={{ height: `${progress}%` }}
          />

          {/* Glowing tip */}
          <div
            className="absolute w-[5px] h-[5px] -left-[1px] rounded-full transition-all duration-300"
            style={{
              top: `calc(${progress}% - 2.5px)`,
              background:
                "radial-gradient(circle, rgba(66, 198, 255, 0.8), rgba(66, 198, 255, 0.2))",
              boxShadow:
                "0 0 6px rgba(66, 198, 255, 0.6), 0 0 12px rgba(66, 198, 255, 0.3)",
            }}
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((p) => (
            <div
              key={p}
              className="absolute w-2.5 h-px -left-[3px] transition-colors duration-500"
              style={{
                top: `${p}%`,
                background:
                  depth < 400
                    ? "rgba(224,247,250,0.25)"
                    : "rgba(255,255,255,0.15)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Mobile: minimal depth indicator at top-right */}
      <div className="fixed top-20 right-4 md:hidden z-30 pointer-events-none select-none">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors duration-500"
          style={{
            background:
              depth < 400 ? "rgb(236,254,255)" : "rgba(12,20,38,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow-cyan" />
          <span
            className="text-[10px] font-mono font-bold tabular-nums transition-colors duration-500"
            style={{ color: depth < 400 ? "#003B46" : getNumberColor(depth) }}
          >
            {depth.toFixed(0)}m
          </span>
        </div>
      </div>
    </>
  );
}
