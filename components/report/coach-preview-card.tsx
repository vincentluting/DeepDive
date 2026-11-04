"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";
import { getClientId } from "@/lib/auth/client-id";
import { resolveDominantCompanion } from "@/lib/coaching/companion-mapping";

interface CoachPreviewCardProps {
  archetypeLabel: string;
  archetypeColor?: string;
  /** RIASEC code like "RIA" — drives the companion portrait callback */
  archetypeCode?: string;
  /**
   * Whether the user actually walked the Immersive Dive Round Zero narrative.
   * Only true when this report came from a quickdive run with exploreMode === "immersive"|"narrative".
   * Without this flag, the companion portrait + "You walked Round Zero with..." callback
   * must NOT show — classic Quick Dive users never met the companions.
   */
  walkedRoundZero?: boolean;
  locale: Locale;
  t: Record<string, string>;
  schwartzConflictNarrative?: string | null;
}

/**
 * Zero-token coach preview card — replaces the LLM-generated CoachingIntro.
 *
 * Shows a pre-written template message personalized with the archetype name,
 * plus 3 starter question chips. No API call, no streaming, instant render.
 *
 * Clicking a starter question stores it in localStorage so the coaching page
 * can use it as the opening message.
 */
export function CoachPreviewCard({
  archetypeLabel,
  archetypeColor,
  archetypeCode,
  walkedRoundZero,
  locale,
  t,
  schwartzConflictNarrative,
}: CoachPreviewCardProps) {
  const router = useRouter();
  const avatarColor = archetypeColor || "#0EA5E9";
  const trackedRef = useRef(false);

  // Gate the companion easter egg on actual immersive completion.
  // archetypeCode alone is not enough — classic Quick Dive users have one too,
  // but they never walked Round Zero with the 6 companions.
  const companion = walkedRoundZero
    ? resolveDominantCompanion(archetypeCode)
    : null;
  const companionName = companion ? t[`companion_${companion.id}_name`] : null;
  const walkedWith =
    companion && companionName && t.coachPreviewWalkedWith
      ? interpolate(t.coachPreviewWalkedWith, { companion: companionName })
      : null;

  const message = interpolate(t.coachPreviewMessage, {
    archetype: archetypeLabel,
  });

  const starterQuestions = [
    t.coachStarterQ1,
    t.coachStarterQ2,
    t.coachStarterQ3,
  ].filter(Boolean);

  const handleStartCoaching = (starterQuestion?: string) => {
    // Anchor the coach entry to the "letter" chapter — this is the sole
    // report → coaching entry, and the letter is the most integrative chapter
    // for the user's identity. The coaching page turns this into a Socratic
    // Phase 1 opener anchored to the user's archetype.
    const params = new URLSearchParams({ from: "letter" });
    if (archetypeLabel) {
      params.set("focus", archetypeLabel.slice(0, 100));
    }
    if (starterQuestion) params.set("q", starterQuestion);
    router.push(`/${locale}/coaching?${params.toString()}`);
  };

  return (
    <motion.div
      className="my-8"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      onViewportEnter={() => {
        if (trackedRef.current) return;
        trackedRef.current = true;
        sendAnalyticsSafely("/api/analytics/event", {
          event: "coaching_prompt_shown",
          clientId: getClientId(),
          metadata: { context: "report", locale },
        });
      }}
    >
      <div
        className="rounded-2xl p-5 sm:p-6 transition-shadow duration-300"
        style={{
          background: "var(--sanc-sand)",
          border: "1px solid var(--sanc-rule)",
          borderLeft: "2px solid var(--rev-glow-cold)",
          boxShadow: "0 2px 12px rgba(245, 166, 35, 0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 4px 20px rgba(245, 166, 35, 0.14)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 2px 12px rgba(245, 166, 35, 0.08)";
        }}
      >
        <div className="flex gap-4">
          {/* Coach avatar — companion portrait if available, else archetype-colored badge */}
          {companion ? (
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0">
              <div
                className="w-full h-full rounded-full overflow-hidden relative"
                style={{
                  border: `1px solid ${companion.accentColor}55`,
                  boxShadow: `0 2px 10px ${companion.accentColor}33`,
                }}
              >
                <Image
                  src={companion.portraitUrl}
                  alt={companionName || ""}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              {/* Coach badge anchored bottom-right of portrait */}
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: avatarColor }}
              >
                <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shrink-0 flex items-center justify-center"
              style={{ backgroundColor: avatarColor }}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          )}

          {/* Message content */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium mb-2"
              style={{ color: "var(--sanc-ink-soft)" }}
            >
              {t.aiCareerCoach}
            </p>

            {/* Round Zero callback — narrative continuity */}
            {walkedWith && (
              <p
                className="text-[11px] sm:text-xs italic mb-3"
                style={{ color: "var(--sanc-ink-soft)" }}
              >
                {walkedWith}
              </p>
            )}

            {/* Template message */}
            <div
              className="rounded-xl rounded-tl-sm p-4 mb-4"
              style={{
                background: "var(--sanc-salt)",
                border: "1px solid var(--sanc-rule)",
              }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--sanc-ink)" }}
              >
                {message}
              </p>
            </div>

            {/* Schwartz conflict narrative highlight */}
            {schwartzConflictNarrative && (
              <div
                className="mb-5 p-4 rounded-xl"
                style={{
                  background: "rgba(248, 199, 119, 0.10)",
                  borderLeft: "2px solid var(--sanc-lantern)",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-2"
                  style={{ color: "var(--sanc-lantern)" }}
                >
                  {t.coachPreviewNoticed}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--sanc-ink)" }}
                >
                  {schwartzConflictNarrative}
                </p>
              </div>
            )}

            {/* Starter question chips */}
            {starterQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {starterQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleStartCoaching(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors cursor-pointer"
                    style={{
                      background: "var(--sanc-salt)",
                      border: "1px solid var(--sanc-rule)",
                      color: "var(--sanc-ink)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--sanc-sand-warm)";
                      e.currentTarget.style.borderColor =
                        "var(--sanc-lantern-soft)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--sanc-salt)";
                      e.currentTarget.style.borderColor = "var(--sanc-rule)";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Start Coaching CTA — Sanctuary lantern signals the destination */}
            <button
              onClick={() => handleStartCoaching()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-shadow cursor-pointer"
              style={{
                background: "var(--sanc-lantern)",
                color: "#1a1410",
                boxShadow: "0 2px 12px rgba(245, 166, 35, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 18px rgba(245, 166, 35, 0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 12px rgba(245, 166, 35, 0.25)";
              }}
            >
              <MessageCircle className="w-4 h-4" />
              {t.startCoaching}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
