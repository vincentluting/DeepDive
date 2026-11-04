"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { C, T } from "./data";

interface MirrorToastProps {
  toast: { id: number; text: string; accentColor: string } | null;
  onDismiss?: () => void;
}

/**
 * Non-blocking mirror reflection shown after the user answers a question.
 *
 * The outer wrapper is `pointer-events-none` so the toast never intercepts
 * taps meant for the next question's Likert buttons or the chapter-transition
 * advance area. A dismiss control inside the card stays interactive.
 *
 * Sticks until: the user answers the next question (overwritten by new toast),
 * dismisses via the X button, or the host phase leaves playing/chapter-transition.
 */
export function MirrorToast({ toast, onDismiss }: MirrorToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          aria-live="polite"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.35 } }}
          transition={{ duration: T.fast, ease: T.ease }}
          className="immersive-mirror-toast fixed left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100vw-32px)] lg:w-auto lg:max-w-lg pointer-events-none rounded-2xl px-5 py-3 lg:px-6 lg:py-4 flex items-start gap-3"
          style={{
            background: "rgba(12, 10, 6, 0.85)",
            border: `1px solid ${toast.accentColor}40`,
            boxShadow: `0 12px 36px rgba(0,0,0,0.5), 0 0 24px ${toast.accentColor}18`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="flex-1 min-w-0 text-left">
            {toast.text
              .split("\n")
              .filter(Boolean)
              .map((line, i) => (
                <p
                  key={i}
                  className="text-[13px] lg:text-sm leading-[1.7]"
                  style={{ color: C.textPrimary }}
                >
                  {line}
                </p>
              ))}
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="pointer-events-auto shrink-0 -mr-2 -mt-1 grid h-9 w-9 place-items-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: C.textPrimary }}
            >
              <X size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
