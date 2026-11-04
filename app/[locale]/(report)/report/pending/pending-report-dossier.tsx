"use client";

import { motion } from "framer-motion";

interface PendingReportDossierProps {
  label: string;
  archetypeName: string;
  tagline: string;
  chapterCards: Array<{ title: string; caption: string }>;
  activeChapterIndex: number;
  resolved: boolean;
}

export function PendingReportDossier({
  label,
  archetypeName,
  tagline,
  chapterCards,
  activeChapterIndex,
  resolved,
}: PendingReportDossierProps) {
  const completedCount = resolved
    ? chapterCards.length
    : Math.min(activeChapterIndex, chapterCards.length - 1);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute inset-x-10 top-8 h-[86%] rounded-[28px] bg-black/28 blur-xl" />

      <motion.div
        aria-hidden="true"
        className="absolute inset-x-4 top-6 h-[92%] rounded-[30px] border border-white/8 bg-white/[0.04]"
        animate={{ rotate: -5, y: [0, -4, 0] }}
        transition={{
          rotate: { duration: 0.5 },
          y: { duration: 7, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-2 top-3 h-[95%] rounded-[30px] border border-white/10 bg-white/[0.05]"
        animate={{ rotate: 4, y: [0, 3, 0] }}
        transition={{
          rotate: { duration: 0.5, delay: 0.06 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
      />

      <motion.div
        className="relative overflow-hidden rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-5 sm:p-6 shadow-[0_28px_80px_-32px_rgba(0,0,0,0.7)]"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_36%)] pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]" />
        <div className="absolute right-5 top-5 w-14 h-14 rounded-full border border-white/16 bg-white/[0.06] backdrop-blur-sm" />
        <div className="absolute right-8 top-8 w-8 h-8 rounded-full border border-white/14" />

        <div className="relative z-10">
          <div className="mb-7">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/48 mb-3">
              {label}
            </p>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white">
              {archetypeName}
            </h3>
            <p className="text-sm text-white/66 mt-2 leading-relaxed max-w-xs">
              {tagline}
            </p>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-black/18 p-4 sm:p-5">
            <div className="space-y-3.5">
              {chapterCards.map((chapter, index) => {
                const isDone = resolved || index < activeChapterIndex;
                const isActive = !resolved && index === activeChapterIndex;

                return (
                  <motion.div
                    key={chapter.title}
                    className={`rounded-2xl border px-4 py-3 ${
                      isDone
                        ? "border-emerald-400/20 bg-emerald-400/[0.08]"
                        : isActive
                          ? "border-sky-300/20 bg-sky-300/[0.07]"
                          : "border-white/8 bg-white/[0.04]"
                    }`}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 + index * 0.08 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`relative w-2.5 h-2.5 rounded-full ${
                          isDone
                            ? "bg-emerald-300"
                            : isActive
                              ? "bg-sky-200"
                              : "bg-white/18"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute inset-0 rounded-full bg-sky-200/65 animate-ping" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white/92 truncate">
                          {chapter.title}
                        </p>
                        <p className="text-[11px] text-white/55 truncate">
                          {chapter.caption}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <div className="h-1.5 w-36 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,rgba(125,211,252,0.85),rgba(255,255,255,0.95))]"
                  initial={{ width: "18%" }}
                  animate={{
                    width: `${((completedCount + 1) / chapterCards.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>

            <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-white/14 bg-white/[0.06] backdrop-blur-sm">
              <motion.div
                className="absolute inset-1 rounded-full border border-sky-200/25"
                animate={{ scale: [1, 1.05, 1], opacity: [0.45, 0.8, 0.45] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="text-center">
                <p className="text-sm font-semibold text-white">
                  {resolved ? chapterCards.length : activeChapterIndex + 1}/
                  {chapterCards.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
