"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { type OceanZone } from "@/lib/questionnaire/constants";
import { ZoneCard, type ZoneStatus } from "./zone-card";

interface ZoneProgressItem extends OceanZone {
  status: ZoneStatus;
  progress: number;
}

interface MobileMapSheetProps {
  open: boolean;
  onClose: () => void;
  zones: ZoneProgressItem[];
  currentDepthMeters: number;
  language: "en" | "zh";
  discoveredZones: Set<string>;
  reduced?: boolean;
  dict: Record<string, string>;
}

/** Drag threshold in px — if user drags past this, dismiss the sheet */
const DISMISS_THRESHOLD = 80;

export function MobileMapSheet({
  open,
  onClose,
  zones,
  currentDepthMeters,
  language,
  discoveredZones,
  reduced = false,
  dict,
}: MobileMapSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Focus management: auto-focus sheet on open, dismiss on Escape
  useEffect(() => {
    if (!open) return;
    const el = sheetRef.current;
    if (el) el.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Dismiss if dragged down fast enough or past threshold
    if (info.offset.y > DISMISS_THRESHOLD || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            tabIndex={-1}
            role="dialog"
            aria-label={dict.mapTitle}
            aria-modal="true"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-4 pt-3"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,20,40,0.98) 0%, rgba(5,10,25,0.99) 100%)",
              backdropFilter: "blur(16px)",
              maxHeight: "70vh",
              overflowY: "auto",
              paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            {/* Handle — visual drag affordance */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-white/15" />
            </div>

            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white/80">
                {dict.mapTitle}
              </h3>
              <span className="text-xs font-mono text-cyan-400/70">
                {dict.currentDepth}: {currentDepthMeters}m
              </span>
            </div>

            {/* Zone cards grid */}
            <div className="flex flex-wrap justify-center gap-3">
              {zones.map((zone) => (
                <ZoneCard
                  key={zone.id}
                  zone={zone}
                  status={zone.status}
                  progress={zone.progress}
                  language={language}
                  hasDiscovery={discoveredZones.has(zone.moduleCode)}
                  reduced={reduced}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
