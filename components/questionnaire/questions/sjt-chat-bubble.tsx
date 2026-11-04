"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SJTScenario, SJTOption, AnswerValue } from "@/lib/types";
import type { TextTheme } from "@/store/questionnaire-store";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import type { Locale } from "@/lib/i18n/config";

// ============================================================
// SJT Chat Bubble — WhatsApp-style scenario with Should/Would
// ============================================================
// Module A: 6 dual SJT scenarios
// Three-step interaction:
//   1. Chat messages animate in (read-only)
//   2. WOULD selection ("What would you actually do?")
//   3. SHOULD selection ("What do you think is ideal?")
// After both selections, micro-insight shown inline.
//
// Mobile optimization: chat auto-collapses after reading phase
// to maximize screen space for option selection.
// ============================================================

interface SJTChatBubbleProps {
  scenario: SJTScenario;
  value: { wouldChoice: string; shouldChoice: string } | undefined;
  onChange: (value: AnswerValue) => void;
  language: string;
  textTheme: TextTheme;
}

type Phase = "reading" | "would" | "should" | "insight";

const FIRST_VISIBLE_MESSAGES = 1;

// Avatar color mapping
const AVATAR_COLORS: Record<string, string> = {
  pm: "bg-sky-600",
  member: "bg-indigo-500",
  boss: "bg-amber-600",
  lead: "bg-teal-600",
  system: "",
};

function getInitials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

export function SJTChatBubble({
  scenario,
  value,
  onChange,
  language,
  textTheme: _textTheme,
}: SJTChatBubbleProps) {
  const t = getDictionaryClient(language as Locale).sjtChatBubble;
  const [phase, setPhase] = useState<Phase>(() => {
    if (value?.wouldChoice && value?.shouldChoice) return "insight";
    if (value?.wouldChoice) return "should";
    return "reading";
  });
  const [visibleMessages, setVisibleMessages] = useState(
    FIRST_VISIBLE_MESSAGES,
  );
  const [wouldChoice, setWouldChoice] = useState<string | undefined>(
    value?.wouldChoice,
  );
  const [shouldChoice, setShouldChoice] = useState<string | undefined>(
    value?.shouldChoice,
  );
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNudge, setShowNudge] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(() => {
    // Start collapsed if we're resuming a previously answered question
    return phase !== "reading";
  });

  // Stagger chat messages on mount
  useEffect(() => {
    if (phase !== "reading") {
      setVisibleMessages(scenario.messages.length);
      return;
    }
    setChatCollapsed(false);
    setVisibleMessages(
      Math.min(FIRST_VISIBLE_MESSAGES, scenario.messages.length),
    );
    let count = FIRST_VISIBLE_MESSAGES;
    const interval = setInterval(() => {
      count++;
      setVisibleMessages(count);
      if (count >= scenario.messages.length) {
        clearInterval(interval);
        // Auto-transition to 'would' phase — keep chat visible for reference
        setTimeout(() => {
          setPhase("would");
        }, 400);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [scenario.id]);

  // Scroll to bottom as messages appear — scroll the container, not the whole page
  useEffect(() => {
    if (chatCollapsed) return;
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMessages, phase, chatCollapsed]);

  const handleChatScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    setIsAtBottom(atBottom);
  }, []);

  // Gentle nudge if user hesitates 15s on would/should phase
  useEffect(() => {
    if (phase !== "would" && phase !== "should") {
      setShowNudge(false);
      return;
    }
    setShowNudge(false);
    const timer = setTimeout(() => setShowNudge(true), 15000);
    return () => clearTimeout(timer);
  }, [phase]);

  const channelName =
    getLocalizedField(scenario, "channelName", language as Locale) ||
    scenario.channelName;

  // Get last non-system message for collapsed preview
  const lastMessage = [...scenario.messages].reverse().find((m) => !m.isSystem);
  const previewText = lastMessage
    ? getLocalizedField(lastMessage, "content", language as Locale)
    : "";
  const truncatedPreview =
    previewText && previewText.length > 50
      ? previewText.slice(0, 50) + "…"
      : previewText;

  const handleOptionSelect = (optionId: string) => {
    if (phase === "would") {
      setWouldChoice(optionId);
      // Transition to should phase after brief delay
      setTimeout(() => setPhase("should"), 200);
    } else if (phase === "should") {
      setShouldChoice(optionId);
      const answer: AnswerValue = {
        type: "sjt",
        wouldChoice: wouldChoice!,
        shouldChoice: optionId,
      };
      onChange(answer);
      setPhase("insight");
    }
  };

  const hasTension =
    wouldChoice && shouldChoice && wouldChoice !== shouldChoice;

  const microInsight = scenario.microInsight;
  const insightText = hasTension
    ? getLocalizedField(microInsight, "tension", language as Locale)
    : getLocalizedField(microInsight, "consistent", language as Locale);

  // Check for special micro-insight (e.g. SJT-4 option D)
  const specialInsight =
    microInsight.special && shouldChoice === microInsight.special.trigger
      ? getLocalizedField(microInsight.special, "message", language as Locale)
      : null;

  return (
    <div className="space-y-4">
      {/* Channel header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
          <span className="text-[10px] text-white/65">#</span>
        </div>
        <span className="text-sm lg:text-base font-medium text-white/85">
          {channelName}
        </span>
      </div>

      {/* Chat messages — collapsible on mobile after reading phase */}
      <AnimatePresence mode="wait">
        {chatCollapsed ? (
          /* Collapsed summary bar */
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setChatCollapsed(false)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
              bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07]
              transition-colors duration-200 text-left group"
          >
            {/* Stacked mini avatars */}
            <div className="flex -space-x-1.5 flex-shrink-0">
              {scenario.messages
                .filter((m) => !m.isSystem)
                .slice(0, 3)
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white ring-1 ring-black/30 ${AVATAR_COLORS[msg.avatar] || "bg-gray-500"}`}
                  >
                    {getInitials(msg.sender)}
                  </div>
                ))}
            </div>

            {/* Preview text */}
            <span className="flex-1 text-xs text-white/45 truncate">
              {truncatedPreview}
            </span>

            {/* Expand hint */}
            <span className="text-[10px] text-white/45 group-hover:text-white/65 transition-colors flex-shrink-0">
              {t.tapToReview}
            </span>

            {/* Chevron */}
            <svg
              className="w-3.5 h-3.5 text-white/45 group-hover:text-white/60 transition-colors flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.button>
        ) : (
          /* Expanded chat messages */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative">
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="space-y-3 max-h-[45vh] md:max-h-[400px] overflow-y-auto pr-1 scrollbar-thin overscroll-contain"
              >
                {scenario.messages.map((msg, idx) => {
                  if (idx >= visibleMessages) return null;

                  if (msg.isSystem) {
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mx-4 my-2 px-4 py-3 rounded-lg border border-dashed border-sky-400/20 bg-sky-500/5"
                      >
                        <p className="text-sm lg:text-base text-sky-200/80 italic leading-relaxed">
                          {getLocalizedField(
                            msg,
                            "content",
                            language as Locale,
                          )}
                        </p>
                      </motion.div>
                    );
                  }

                  const content = getLocalizedField(
                    msg,
                    "content",
                    language as Locale,
                  );
                  const avatarColor =
                    AVATAR_COLORS[msg.avatar] || "bg-gray-500";

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-start gap-2.5"
                    >
                      {/* Avatar */}
                      <div
                        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-medium ${avatarColor}`}
                      >
                        {getInitials(msg.sender)}
                      </div>

                      {/* Message bubble */}
                      <div className="max-w-[280px] md:max-w-[360px] lg:max-w-[440px]">
                        <span className="text-[11px] text-white/70 mb-0.5 block">
                          {msg.sender}
                        </span>
                        <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-white/[0.08] border border-white/[0.06]">
                          <p className="text-sm lg:text-base text-white/85 leading-relaxed">
                            {content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Scroll indicator gradient — visible when content overflows and not scrolled to bottom */}
              {!isAtBottom && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(10, 10, 20, 0.7))",
                  }}
                />
              )}
            </div>

            {/* Collapse button — only show after reading phase */}
            {phase !== "reading" && (
              <button
                onClick={() => setChatCollapsed(true)}
                className="mt-2 flex items-center gap-1.5 text-[11px] text-white/55 hover:text-white/70 transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                {t.hideConversation}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase indicator + Options */}
      <AnimatePresence mode="wait">
        {(phase === "would" || phase === "should") && (
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="pt-3 border-t border-white/[0.08]"
          >
            {/* Phase prompt */}
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <div
                className={`w-2 h-2 rounded-full ${phase === "would" ? "bg-sky-400" : "bg-amber-400"}`}
              />
              <p className="text-sm lg:text-base font-medium text-white/80">
                {phase === "would" ? t.wouldPrompt : t.shouldPrompt}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-3 md:mb-4">
              <div
                className={`h-1 flex-1 rounded-full ${phase === "would" ? "bg-sky-400/40" : "bg-sky-400/60"}`}
              />
              <div
                className={`h-1 flex-1 rounded-full ${phase === "should" ? "bg-amber-400/40" : "bg-white/10"}`}
              />
            </div>

            {/* Options — tighter spacing on mobile */}
            <div className="space-y-2 md:space-y-2.5">
              {scenario.options.map((option: SJTOption, idx: number) => {
                const label = getLocalizedField(
                  option,
                  "label",
                  language as Locale,
                );
                const isSelected =
                  phase === "would"
                    ? wouldChoice === option.id
                    : shouldChoice === option.id;

                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.25 }}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`w-full text-left px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-sm lg:text-base leading-relaxed transition-all duration-200
                      ${
                        isSelected
                          ? phase === "would"
                            ? "bg-sky-500/20 border border-sky-400/30 text-white"
                            : "bg-amber-500/20 border border-amber-400/30 text-white"
                          : "bg-white/[0.04] border border-white/[0.06] text-white/70 hover:bg-white/[0.08] hover:border-white/[0.12]"
                      }`}
                  >
                    <span className="font-medium text-white/75 mr-2">
                      {option.id}.
                    </span>
                    {label}
                  </motion.button>
                );
              })}
            </div>

            {/* Gentle nudge after 15s hesitation */}
            <AnimatePresence>
              {showNudge && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-3 text-xs text-white/40 text-center"
                >
                  {t.nudge}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Back to revise would-do (only in should phase) */}
            {phase === "should" && (
              <button
                onClick={() => {
                  setShouldChoice(undefined);
                  setPhase("would");
                }}
                className="mt-1 py-2 px-2 -mx-2 block text-xs text-white/60 hover:text-white/80 transition-colors"
              >
                {t.reviseWould}
              </button>
            )}
          </motion.div>
        )}

        {/* Micro-insight after both selections */}
        {phase === "insight" && (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="pt-3 border-t border-white/[0.08]"
          >
            {/* Selection summary */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 px-3 py-2 rounded-lg bg-sky-500/10 border border-sky-400/15">
                <span className="text-[10px] text-sky-300/60 uppercase tracking-wider">
                  {t.wouldLabel}
                </span>
                <p className="text-sm text-white/70 mt-0.5">
                  {wouldChoice}.{" "}
                  {getLocalizedField(
                    scenario.options.find((o) => o.id === wouldChoice),
                    "label",
                    language as Locale,
                  )}
                </p>
              </div>
              <div className="flex-1 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-400/15">
                <span className="text-[10px] text-amber-300/60 uppercase tracking-wider">
                  {t.shouldLabel}
                </span>
                <p className="text-sm text-white/70 mt-0.5">
                  {shouldChoice}.{" "}
                  {getLocalizedField(
                    scenario.options.find((o) => o.id === shouldChoice),
                    "label",
                    language as Locale,
                  )}
                </p>
              </div>
            </div>

            {/* Insight card */}
            <div
              className={`px-4 py-3 rounded-xl ${hasTension ? "bg-amber-500/8 border border-amber-400/15" : "bg-emerald-500/8 border border-emerald-400/15"}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${hasTension ? "bg-amber-400" : "bg-emerald-400"}`}
                />
                <span
                  className={`text-xs font-medium ${hasTension ? "text-amber-300/70" : "text-emerald-300/70"}`}
                >
                  {hasTension ? t.tensionDetected : t.consistent}
                </span>
              </div>
              <p className="text-sm lg:text-base text-white/60 leading-relaxed">
                {specialInsight || insightText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
