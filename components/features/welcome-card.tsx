"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Compass,
  User,
  FileText,
  MessageCircle,
  X,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

const STORAGE_KEY = "dashboard-welcome-seen";

interface WelcomeCardProps {
  locale: Locale;
  t?: Record<string, string>;
}

const STEP_ICONS = [Compass, User, FileText, MessageCircle] as const;
const STEP_KEYS = [
  { label: "stepQuickDive", desc: "stepQuickDiveDesc" },
  { label: "stepProfile", desc: "stepProfileDesc" },
  { label: "stepReport", desc: "stepReportDesc" },
  { label: "stepCoach", desc: "stepCoachDesc" },
] as const;

/**
 * 首次登录用户的 Welcome Card — 展示 4 步探索旅程。
 * 用 localStorage 记录已关闭状态，只展示一次。
 */
export function WelcomeCard({ locale, t: tProp }: WelcomeCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage 不可用时静默处理
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // 静默处理
    }
  }

  if (!visible) return null;

  // `welcomeCard` is a top-level key in dashboard.json and already declared
  // on the Dictionary type — no cast needed.
  const fullDict = getDictionaryClient(locale);
  const wcDict = fullDict.welcomeCard;
  const a11y = fullDict.a11y;
  const t = tProp ??
    wcDict ?? {
      title: "Welcome to Deep Dive",
      subtitle: "Four steps to explore your career identity",
      startExploring: "Start Exploring",
      gotIt: "Got it",
    };

  return (
    <div className="relative rounded-2xl border border-sky-500/15 p-6 sm:p-8 mb-6 overflow-hidden animate-fade-in-up">
      {/* 背景: 玻璃态 + 深海渐变 */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(6,182,212,0.04) 50%, rgba(14,165,233,0.02) 100%)",
          backdropFilter: "blur(12px)",
        }}
      />
      {/* 光晕装饰 */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-sky-500/8 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-cyan-500/6 rounded-full blur-[50px] pointer-events-none" />

      {/* 关闭按钮 */}
      <button
        onClick={dismiss}
        className="absolute right-3 top-3 z-20 hidden size-11 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-white/5 hover:text-foreground sm:flex"
        aria-label={a11y.dismiss}
      >
        <X className="h-4 w-4" />
      </button>

      {/* 标题区 */}
      <div className="mb-6 pr-12">
        <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight mb-1.5">
          {t.title}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* 4 步旅程 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STEP_KEYS.map((keys, i) => {
          const Icon = STEP_ICONS[i];
          return (
            <div
              key={i}
              className="relative flex flex-col items-center text-center"
            >
              {/* 步骤间连接线 (仅桌面端，非最后一步) */}
              {i < STEP_KEYS.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-sky-500/20 to-sky-500/5 pointer-events-none" />
              )}
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center mb-2">
                <Icon className="h-5 w-5 text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-foreground mb-0.5">
                {t[keys.label] ?? keys.label}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight">
                {t[keys.desc] ?? keys.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* CTA 区域 */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/${locale}/explore`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 text-white font-medium text-sm hover:bg-sky-500/90 transition-colors"
        >
          {t.startExploring}
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={dismiss}
          className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t.gotIt}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
