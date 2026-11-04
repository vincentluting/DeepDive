// ============================================================
// ImmersiveAvatarGender — final avatar-style picker for the
// immersive flow. Mirrors classic AvatarGenderQuestion in
// behaviour (i18n keys, skip option, localStorage write) but
// renders in the archive-ceremony visual language so the user
// doesn't see a jarring style break before the seal animation.
//
// Visual palette: archive chapter (warm taupe/sepia) — same
// gradient and tokens used by the generating phase, so this
// screen reads as "the very last beat of the questionnaire."
// ============================================================

"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { hapticLight } from "@/lib/haptic";
import { useAvatarGender } from "@/components/quickdive/use-avatar-gender";
import type { AvatarGender } from "@/components/quickdive/archetype-avatar-asset";
import { CHAPTERS, C, T } from "./data";

interface ImmersiveAvatarGenderProps {
  locale: Locale;
  onSubmit: (gender: AvatarGender | null) => void;
  onPrevious?: () => void;
}

export function ImmersiveAvatarGender({
  locale,
  onSubmit,
  onPrevious,
}: ImmersiveAvatarGenderProps) {
  const prefersReducedMotion = useReducedMotion();
  const dict = getDictionaryClient(locale);
  const t = dict.quickDive as Record<string, string>;
  const tNarr = dict.narrativeExplore;
  const { setGender: setAvatarGenderLocal } = useAvatarGender();

  const handlePick = (gender: AvatarGender | null) => {
    if (gender) setAvatarGenderLocal(gender);
    onSubmit(gender);
  };

  return (
    <div
      className="h-dvh min-h-dvh overflow-y-auto overscroll-contain flex flex-col relative"
      style={{ background: CHAPTERS.archive.bgGradient }}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: prefersReducedMotion ? 0 : T.slow }}
        style={{
          background: `radial-gradient(circle at 50% 35%, ${C.ceremonySealGlow} 0%, transparent 60%)`,
        }}
      />

      {onPrevious && (
        <button
          type="button"
          onClick={() => {
            hapticLight();
            onPrevious();
          }}
          aria-label={tNarr.previousQuestion}
          title={tNarr.previousQuestion}
          className="fixed top-4 left-4 z-20 grid h-9 w-9 place-items-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
          style={{
            color: C.ceremonyText,
            background: C.blackLight,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: `1px solid ${C.whiteMid}`,
          }}
        >
          <ChevronLeft size={17} strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-start sm:justify-center px-6 py-16">
        <motion.div
          className="w-full max-w-md"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : T.normal }}
        >
          <p
            className="text-center text-[10px] font-mono tracking-[0.3em] uppercase mb-5"
            style={{ color: C.ceremonyText }}
          >
            {t.avatarGenderEyebrow}
          </p>

          <h1
            className="text-center font-semibold mb-5"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 6.5vw, 38px)",
              lineHeight: 1.18,
              color: C.ceremonySealBright,
            }}
          >
            {t.avatarGenderTitle}
          </h1>

          <div
            className="mx-auto mb-7"
            style={{
              width: 32,
              height: 1,
              background: C.ceremonySeal,
              opacity: 0.6,
            }}
            aria-hidden="true"
          />

          <p
            className="text-center leading-relaxed mb-10 max-w-sm mx-auto"
            style={{
              fontSize: "15px",
              color: C.ceremonyText,
              lineHeight: 1.7,
              fontFamily: "var(--font-body)",
            }}
          >
            {t.avatarGenderBody}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <GenderOption
              label={t.avatarGenderMale}
              onClick={() => handlePick("male")}
            />
            <GenderOption
              label={t.avatarGenderFemale}
              onClick={() => handlePick("female")}
            />
          </div>

          <button
            type="button"
            onClick={() => handlePick(null)}
            className="w-full text-sm tracking-wide py-3 transition-opacity hover:opacity-100 cursor-pointer"
            style={{
              color: C.ceremonyText,
              opacity: 0.75,
              fontFamily: "var(--font-body)",
            }}
          >
            {t.avatarGenderSkip}
          </button>

          <p
            className="text-[11px] text-center mt-4"
            style={{
              color: C.ceremonyText,
              opacity: 0.55,
              fontFamily: "var(--font-body)",
            }}
          >
            {t.avatarGenderFooter}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/** @deprecated Use ImmersiveAvatarGender. */
export const ImmersiveDemographicGender = ImmersiveAvatarGender;

function GenderOption({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="py-6 rounded-2xl font-medium text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      style={{
        background: "rgba(80, 68, 50, 0.18)",
        border: `1px solid ${C.ceremonySeal}`,
        color: C.ceremonySealBright,
        fontFamily: "var(--font-body)",
        minHeight: 56,
      }}
    >
      {label}
    </button>
  );
}
