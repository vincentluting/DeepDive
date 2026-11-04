"use client"

import { useEffect, useCallback, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Locale } from "@/lib/i18n/config"
import type { ImmersivePhase } from "./use-immersive-engine"
import { INVITATION, RULES, C, T, resolveLocale } from "./data"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"
import { prefersReducedMotion } from "@/lib/device"
import { hapticMedium } from "@/lib/haptic"

// ── Envelope SVG ───────────────────────────────────────────────

function EnvelopeSVG({ locale }: { locale: Locale }) {
  const tNarr = getDictionaryClient(locale).narrativeExplore
  const sealChar = tNarr.sealSymbol
  const ariaLabel = tNarr.sealedEnvelope
  return (
    <svg
      width="180"
      height="130"
      viewBox="0 0 180 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-2xl"
      role="img"
      aria-label={ariaLabel}
    >
      <title>{ariaLabel}</title>
      {/* Envelope body */}
      <rect x="4" y="30" width="172" height="96" rx="4" fill="#1A1816" stroke="#2A2622" strokeWidth="1" />
      {/* Envelope flap */}
      <path d="M4 30 L90 85 L176 30" fill="#1E1C18" stroke="#2A2622" strokeWidth="1" />
      {/* Inner shadow line */}
      <path d="M4 30 L90 75 L176 30" fill="none" stroke="#14120F" strokeWidth="0.5" opacity="0.5" />
      {/* Wax seal */}
      <circle cx="90" cy="78" r="14" fill={C.sealDark} />
      <circle cx="90" cy="78" r="11" fill="none" stroke={C.sealMid} strokeWidth="1" />
      <circle cx="90" cy="78" r="7" fill="none" stroke={C.sealMid} strokeWidth="0.5" />
      {/* Seal character — 零 (zh) or Ø (en) */}
      <text
        x="90"
        y="83"
        textAnchor="middle"
        fill={C.invSealText}
        fontSize="12"
        fontWeight="bold"
        fontFamily="serif"
      >
        {sealChar}
      </text>
    </svg>
  )
}

// ── Seal stamp component ───────────────────────────────────────

function SealStamp({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 justify-end mt-8">
      <span
        className="text-xs font-mono tracking-wider"
        style={{ color: C.textMuted }}
      >
        {text}
      </span>
      <div
        className="w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0"
        style={{
          borderColor: C.sealBorder,
          background: C.sealBg,
        }}
      >
        <span
          style={{ color: C.sealText, fontSize: "14px", fontWeight: 700 }}
        >
          ●
        </span>
      </div>
    </div>
  )
}

// ── Sub-phase: Envelope animation ──────────────────────────────

function EnvelopePhase({ reduced, locale }: { reduced: boolean; locale: Locale }) {
  return (
    <motion.div
      key="envelope"
      className="flex flex-col items-center justify-center min-h-dvh w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Envelope rising from below with rotation correction */}
      <motion.div
        initial={{
          y: reduced ? 0 : 200,
          rotate: reduced ? 0 : -3,
          opacity: 0,
          scale: 0.9,
        }}
        animate={{
          y: 0,
          rotate: 0,
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: reduced ? T.fast : T.dramatic,
          ease: T.ease,
        }}
      >
        <EnvelopeSVG locale={locale} />
      </motion.div>

      {/* Subtle shimmer on seal */}
      {!reduced && (
        <motion.div
          className="absolute"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.sealGlow} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      )}
    </motion.div>
  )
}

// ── Sub-phase: Invitation letter ───────────────────────────────

function InvitationPhase({
  locale,
  reduced,
  onContinue,
}: {
  locale: Locale
  reduced: boolean
  onContinue: () => void
}) {
  const inv = resolveLocale(INVITATION, locale)

  // Memoize staggered animation configs to avoid rebuilding on each render
  const bodyAnimations = useMemo(() =>
    inv.body.map((_, i) => ({
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: T.normal, delay: 0.7 + i * T.staggerItem, ease: T.ease },
    })),
    [inv.body.length]
  )

  const ruleAnimations = useMemo(() =>
    inv.rules.map((_, i) => ({
      initial: { opacity: 0, x: reduced ? 0 : -6 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.4, delay: 1.3 + i * T.staggerNormal, ease: T.ease },
    })),
    [inv.rules.length, reduced]
  )

  return (
    <motion.div
      key="invitation"
      className="flex flex-col items-center justify-center min-h-dvh w-full px-5 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.normal }}
    >
      {/* Letter card */}
      <motion.div
        className="w-full max-w-md lg:max-w-lg rounded-lg p-6 sm:p-8 lg:p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(170deg, #1A1610 0%, #141008 100%)",
          border: `1px solid rgba(80, 68, 50, 0.25)`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(80,68,50,0.1)",
        }}
        initial={{ y: reduced ? 0 : 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: T.slow, ease: T.ease }}
      >
        {/* Paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='transparent'/%3E%3Ccircle cx='1' cy='1' r='0.5' fill='rgba(255,255,255,0.015)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Reference & Date */}
        <motion.div
          className="font-mono text-[10px] sm:text-[11px] lg:text-xs leading-relaxed mb-6"
          style={{ color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.normal, delay: T.fast, ease: T.ease }}
        >
          <div>{inv.ref}</div>
          <div>{inv.date}</div>
        </motion.div>

        {/* Greeting */}
        <motion.div
          className="font-mono text-sm sm:text-[15px] lg:text-base mb-5"
          style={{ color: C.textSecondary }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: T.normal, delay: T.normal, ease: T.ease }}
        >
          {inv.greeting}
        </motion.div>

        {/* Body paragraphs — memoized animations */}
        {inv.body.map((para, i) => (
          <motion.p
            key={i}
            className="font-mono text-xs sm:text-[13px] lg:text-sm leading-[1.8] mb-4 whitespace-pre-line"
            style={{ color: C.textSecondary }}
            {...bodyAnimations[i]}
          >
            {para}
          </motion.p>
        ))}

        {/* Rules title */}
        <motion.div
          className="font-mono text-xs sm:text-[13px] lg:text-sm mt-5 mb-3"
          style={{ color: C.textPrimary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.normal, delay: 1.1, ease: T.ease }}
        >
          {inv.rulesTitle}
        </motion.div>

        {/* Rules list — memoized animations */}
        <div className="pl-2 sm:pl-3 space-y-2.5">
          {inv.rules.map((rule, i) => (
            <motion.p
              key={i}
              className="font-mono text-[11px] sm:text-xs lg:text-sm leading-[1.8] whitespace-pre-line"
              style={{ color: C.textPrimary }}
              {...ruleAnimations[i]}
            >
              {rule}
            </motion.p>
          ))}
        </div>

        {/* Footer */}
        <motion.p
          className="font-mono text-[11px] sm:text-xs lg:text-sm leading-[1.8] mt-6 whitespace-pre-line"
          style={{ color: C.textTertiary }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.normal, delay: 2.0, ease: T.ease }}
        >
          {inv.footer}
        </motion.p>

        {/* Seal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: T.slow, delay: 2.2, ease: T.ease }}
        >
          <SealStamp text={inv.seal} />
        </motion.div>
      </motion.div>

      {/* Continue button */}
      <motion.button
        className="mt-8 px-8 py-3 min-h-[44px] rounded-lg font-mono text-sm tracking-wider cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
        style={{
          background: C.invCardBg,
          border: `1px solid ${C.invCardBorder}`,
          color: C.invText,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: T.normal, delay: 2.5, ease: T.ease }}
        whileHover={{
          background: C.invCardHover,
          color: C.invTextHover,
        }}
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          hapticMedium()
          onContinue()
        }}
      >
        {inv.continueBtn}
      </motion.button>
    </motion.div>
  )
}

// ── Sub-phase: Rules ───────────────────────────────────────────

function RulesPhase({
  locale,
  reduced,
  onContinue,
}: {
  locale: Locale
  reduced: boolean
  onContinue: () => void
}) {
  const rules = resolveLocale(RULES, locale)

  return (
    <motion.div
      key="rules"
      className="flex flex-col items-center justify-center min-h-dvh w-full px-6 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: T.normal }}
    >
      <div className="w-full max-w-md lg:max-w-lg">
        {/* Title */}
        <motion.h2
          className="font-mono text-lg sm:text-xl lg:text-2xl tracking-wider mb-10 text-center"
          style={{ color: C.invText }}
          initial={{ opacity: 0, y: reduced ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: T.slow, ease: T.ease }}
        >
          {rules.title}
        </motion.h2>

        {/* Rules items with staggered fade-in */}
        <div className="space-y-6">
          {rules.items.map((item, i) => (
            <motion.div
              key={i}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: T.normal, delay: T.fast + i * T.staggerRuleItem, ease: T.ease }}
            >
              {/* Number label */}
              <span
                className="font-mono text-[11px] lg:text-xs tracking-wider flex-shrink-0 mt-0.5"
                style={{ color: C.sealMuted }}
              >
                {item.label}
              </span>
              {/* Rule text */}
              <p
                className="font-mono text-sm sm:text-[15px] lg:text-base leading-[1.8]"
                style={{ color: C.textSecondary }}
              >
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <motion.div
          className="w-12 h-px mx-auto mt-10 mb-8"
          style={{ background: C.invCardBorder }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: T.slow, delay: 2.0, ease: T.ease }}
        />

        {/* Start button */}
        <motion.button
          className="w-full py-4 min-h-[48px] rounded-lg font-mono text-[15px] tracking-wider cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60"
          style={{
            background: `linear-gradient(135deg, ${C.rulesGradientFrom}, ${C.rulesGradientTo})`,
            border: `1px solid ${C.rulesBorder}`,
            color: C.rulesText,
            boxShadow: `0 4px 20px ${C.rulesShadow}`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: T.normal, delay: 2.2, ease: T.ease }}
          whileHover={{
            boxShadow: `0 8px 30px ${C.rulesShadowHover}`,
            borderColor: C.rulesBorderHover,
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            hapticMedium()
            onContinue()
          }}
        >
          {rules.startBtn}
        </motion.button>

        {/* Time hint */}
        <motion.p
          className="text-center font-mono text-[11px] tracking-wider mt-4"
          style={{ color: C.textFaint }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 2.5 }}
        >
          {rules.hint}
        </motion.p>

        {/* Footnote — suspense seed */}
        <motion.p
          className="text-center font-mono text-[10px] lg:text-[11px] leading-relaxed mt-6 italic"
          style={{ color: C.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: T.slow, delay: 3.5 }}
        >
          {rules.footnote}
        </motion.p>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────

interface ImmersiveExploreIntroProps {
  locale: Locale
  phase: ImmersivePhase
  setPhase: (p: ImmersivePhase) => void
  onComplete: () => void
}

export function ImmersiveExploreIntro({
  locale,
  phase,
  setPhase,
  onComplete,
}: ImmersiveExploreIntroProps) {
  const reduced = prefersReducedMotion()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-transition from envelope to invitation
  useEffect(() => {
    if (phase === "envelope") {
      timerRef.current = setTimeout(
        () => setPhase("invitation"),
        reduced ? 800 : 2500,
      )
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [phase, setPhase, reduced])

  const handleInvitationContinue = useCallback(() => {
    setPhase("rules")
  }, [setPhase])

  const handleRulesContinue = useCallback(() => {
    onComplete()
  }, [onComplete])

  return (
    <div
      className="h-dvh min-h-dvh w-full relative overflow-y-auto overscroll-contain"
      style={{ background: C.bgSurface }}
    >
      <AnimatePresence mode="wait">
        {phase === "envelope" && (
          <EnvelopePhase key="envelope" reduced={reduced} locale={locale} />
        )}
        {phase === "invitation" && (
          <InvitationPhase
            key="invitation"
            locale={locale}
            reduced={reduced}
            onContinue={handleInvitationContinue}
          />
        )}
        {phase === "rules" && (
          <RulesPhase
            key="rules"
            locale={locale}
            reduced={reduced}
            onContinue={handleRulesContinue}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
