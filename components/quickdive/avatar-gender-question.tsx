// ============================================================
// AvatarGenderQuestion — final Quick Dive avatar-style step.
//
// Sits between values-playing (8 TwIVI items) and generating.
// Purely cosmetic: gender is stored on EngineState.avatarGender and
// forwarded to the save API as avatarGender. It
// never enters `state.answers` and carries no scoring weight.
//
// Visual language matches ClassicExploreQuestion (depthTheme,
// block 0) so the user doesn't see a jarring style shift for
// the final question.
//
// Compliance:
//   - Clear single purpose (archetype avatar matching)
//   - Opt-out available ("Prefer not to say")
//   - Change-later disclosure in footer
// ============================================================

"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { QuickDiveMonographShell } from "./quickdive-monograph-shell";

export type AvatarGender = "male" | "female";

interface AvatarGenderQuestionProps {
  locale: Locale;
  t: Record<string, string>;
  onSubmit: (gender: AvatarGender | null) => void;
}

export function AvatarGenderQuestion({
  locale: _locale,
  t,
  onSubmit,
}: AvatarGenderQuestionProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div data-testid="quickdive-gender-step">
      <QuickDiveMonographShell
        phase="avatar"
        t={t}
        eyebrow={t.avatarGenderEyebrow}
        title={t.avatarGenderTitle}
        description={t.avatarGenderBody}
        side={
          <div className="dd-quickdive-monograph__avatar-side">
            <p className="dd-quickdive-monograph__side-kicker">
              {t.monographAvatarPlate}
            </p>
            <div className="dd-quickdive-monograph__avatar-lens" aria-hidden>
              <span />
              <span />
            </div>
            <p>{t.avatarGenderFooter}</p>
          </div>
        }
      >
        <motion.div
          className="dd-quickdive-monograph__avatar-step"
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
        >
          <div className="dd-quickdive-monograph__choice-grid">
            <GenderOption
              label={t.avatarGenderMale}
              onClick={() => onSubmit("male")}
            />
            <GenderOption
              label={t.avatarGenderFemale}
              onClick={() => onSubmit("female")}
            />
            <GenderOption
              label={t.avatarGenderSkip}
              onClick={() => onSubmit(null)}
              testId="quickdive-gender-skip"
            />
          </div>
        </motion.div>
      </QuickDiveMonographShell>
    </div>
  );
}

function GenderOption({
  label,
  onClick,
  testId,
}: {
  label: string;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className="dd-quickdive-monograph__choice"
    >
      {label}
    </button>
  );
}
