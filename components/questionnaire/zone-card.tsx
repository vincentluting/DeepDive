"use client";

import { motion } from "framer-motion";
import type { OceanZone } from "@/lib/questionnaire/constants";

export type ZoneStatus = "completed" | "active" | "locked";

interface ZoneCardProps {
  zone: OceanZone;
  status: ZoneStatus;
  progress: number; // 0–1
  language: "en" | "zh";
  hasDiscovery?: boolean;
  reduced?: boolean;
}

export function ZoneCard({
  zone,
  status,
  progress,
  language,
  hasDiscovery = false,
  reduced = false,
}: ZoneCardProps) {
  const isUltra = zone.tier === "ultra";
  const name = language === "zh" ? zone.name_zh : zone.name_en;
  const depthLabel = `${zone.depthStart}–${zone.depthEnd}m`;

  return (
    <div
      className="relative flex flex-col items-center rounded-xl overflow-hidden"
      style={{
        width: "120px",
        height: "90px",
        border: isUltra
          ? "1px dashed rgba(255,255,255,0.12)"
          : status === "active"
            ? `1px solid ${zone.colorPrimary}50`
            : status === "completed"
              ? `1px solid ${zone.colorPrimary}35`
              : "1px solid rgba(255,255,255,0.08)",
        background: isUltra
          ? "rgba(255,255,255,0.02)"
          : status === "active"
            ? `linear-gradient(180deg, ${zone.colorPrimary}12 0%, ${zone.colorPrimary}06 100%)`
            : status === "completed"
              ? `linear-gradient(180deg, ${zone.colorPrimary}10 0%, ${zone.colorPrimary}04 100%)`
              : "rgba(255,255,255,0.02)",
        opacity: isUltra ? 0.2 : status === "locked" ? 0.4 : 1,
        filter: status === "locked" && !isUltra ? "grayscale(0.6)" : "none",
        transition: "all 0.5s ease",
      }}
    >
      {/* Fill from bottom (water rising) */}
      {!isUltra && status !== "locked" && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            background: `linear-gradient(180deg, ${zone.colorPrimary}20 0%, ${zone.colorPrimary}35 100%)`,
          }}
          initial={{ height: 0 }}
          animate={{
            height: `${Math.max(progress * 100, status === "completed" ? 100 : 0)}%`,
          }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
          }
        />
      )}

      {/* Water line animation on active zone */}
      {status === "active" && progress > 0 && progress < 1 && !reduced && (
        <motion.div
          className="absolute left-0 right-0 h-px pointer-events-none"
          style={{
            bottom: `${progress * 100}%`,
            background: `linear-gradient(90deg, transparent, ${zone.colorPrimary}80, transparent)`,
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-2 py-2 gap-0.5">
        {/* Glow circle replaces emoji */}
        <div
          className="w-3 h-3 rounded-full mb-0.5"
          style={{
            background: `radial-gradient(circle, ${zone.colorPrimary}40 0%, ${zone.colorPrimary}10 60%, transparent 100%)`,
            boxShadow:
              status === "active" ? `0 0 8px ${zone.colorGlow}` : "none",
          }}
        />
        <span
          className="text-[10px] font-medium text-center leading-tight"
          style={{
            color:
              status === "active" ? zone.colorPrimary : "rgba(255,255,255,0.7)",
          }}
        >
          {name}
        </span>
        <span
          className="text-[8px] font-mono"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          {depthLabel}
        </span>

        {/* Status indicator */}
        <div className="mt-0.5">
          {status === "completed" && (
            <span
              className="inline-flex items-center gap-0.5 text-[8px] font-medium"
              style={{ color: zone.colorPrimary }}
            >
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          )}
          {status === "active" && !reduced && (
            <motion.div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: zone.colorPrimary }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          {status === "locked" && !isUltra && (
            <svg
              className="w-2.5 h-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={2}
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 018 0v4" />
            </svg>
          )}
          {isUltra && (
            <span
              className="text-[7px] font-mono tracking-wider"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              ULTRA
            </span>
          )}
        </div>
      </div>

      {/* Glow effect for completed zones */}
      {status === "completed" && !reduced && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: `inset 0 0 12px ${zone.colorGlow}` }}
        />
      )}

      {/* Discovery dot */}
      {hasDiscovery && status === "completed" && (
        <motion.div
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{
            background: zone.colorPrimary,
            boxShadow: `0 0 6px ${zone.colorGlow}`,
          }}
          animate={reduced ? {} : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Active zone border pulse */}
      {status === "active" && !reduced && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: `1px solid ${zone.colorPrimary}` }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
