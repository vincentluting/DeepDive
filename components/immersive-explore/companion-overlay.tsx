"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Locale } from "@/lib/i18n/config";
import { CHARACTERS, pickText } from "./data";
import type { BilingualText } from "./data";
import { prefersReducedMotion } from "@/lib/device";

interface CompanionOverlayProps {
  characterId: string;
  reaction: BilingualText;
  accentColor: string;
  locale: Locale;
  /** Optional pulse trigger — when changed, re-runs the gentle highlight animation. */
  pulseKey?: string | number;
}

/**
 * Sticky companion presence in the question page corner. Appears when the question's
 * companionBeat field is set. Pure decoration — never interferes with the Likert area
 * or answer flow (Quick Dive equivalence is preserved for the research instrument).
 *
 * Layout:
 *  - Mobile: bottom-left fixed, hugging the safe-area
 *  - Desktop: in the left scene column, anchored low
 */
export function CompanionOverlay({
  characterId,
  reaction,
  accentColor,
  locale,
  pulseKey,
}: CompanionOverlayProps) {
  const reduced = prefersReducedMotion();
  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character?.portraitUrl) return null;

  const name = pickText(character.name, locale);
  const line = pickText(reaction, locale);

  return (
    <motion.div
      key={`${characterId}-${pulseKey ?? "static"}`}
      className="pointer-events-none flex items-end gap-3 max-w-[280px] lg:max-w-[320px]"
      initial={{ opacity: 0, y: reduced ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.18 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Portrait — pulses subtly when pulseKey changes (mirror feedback echo) */}
      <motion.div
        className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden flex-shrink-0"
        style={{
          border: `1px solid ${accentColor}66`,
          boxShadow: `0 2px 14px ${accentColor}44`,
        }}
        animate={
          reduced
            ? undefined
            : {
                scale: [1, 1.06, 1],
                boxShadow: [
                  `0 2px 14px ${accentColor}44`,
                  `0 2px 22px ${accentColor}88`,
                  `0 2px 14px ${accentColor}44`,
                ],
              }
        }
        transition={{ duration: 0.55, ease: "easeInOut" }}
      >
        <Image
          src={character.portraitUrl}
          alt={name}
          fill
          sizes="56px"
          className="object-cover"
        />
      </motion.div>

      {/* Speech bubble — name + reaction */}
      <div
        className="relative px-3 py-2 rounded-lg rounded-bl-sm backdrop-blur-md"
        style={{
          background: "rgba(20, 16, 12, 0.72)",
          border: `1px solid ${accentColor}33`,
        }}
      >
        <p
          className="text-[10px] font-mono tracking-[0.1em] uppercase mb-0.5"
          style={{ color: `${accentColor}cc` }}
        >
          {name}
        </p>
        <p
          className="text-[12px] lg:text-[13px] leading-snug"
          style={{ color: "rgba(232, 220, 200, 0.92)" }}
        >
          {line}
        </p>
      </div>
    </motion.div>
  );
}
