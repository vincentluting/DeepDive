"use client";

import { motion } from "framer-motion";
import { MessageSquareText } from "lucide-react";
import type { CoachMessage } from "@/lib/db/coach-messages";

interface MessageBubbleProps {
  message: CoachMessage;
  locale: string;
  onAction?: (url: string) => void;
}

const TIME_LABELS: Record<
  string,
  Record<string, string | ((n: number) => string)>
> = {
  justNow: {
    en: "Just now",
    zh: "刚刚",
    nl: "Zojuist",
    de: "Gerade eben",
    fr: "À l'instant",
    es: "Ahora mismo",
    pt: "Agora mesmo",
    it: "Proprio ora",
    ru: "Только что",
    ja: "たった今",
    ko: "방금",
  },
  mAgo: {
    en: (n: number) => `${n}m ago`,
    zh: (n: number) => `${n}分钟前`,
    nl: (n: number) => `${n} min geleden`,
    de: (n: number) => `vor ${n} Min.`,
    fr: (n: number) => `il y a ${n} min`,
    es: (n: number) => `hace ${n} min`,
    pt: (n: number) => `${n} min atrás`,
    it: (n: number) => `${n} min fa`,
    ru: (n: number) => `${n} мин. назад`,
    ja: (n: number) => `${n}分前`,
    ko: (n: number) => `${n}분 전`,
  },
  hAgo: {
    en: (n: number) => `${n}h ago`,
    zh: (n: number) => `${n}小时前`,
    nl: (n: number) => `${n}u geleden`,
    de: (n: number) => `vor ${n} Std.`,
    fr: (n: number) => `il y a ${n}h`,
    es: (n: number) => `hace ${n}h`,
    pt: (n: number) => `${n}h atrás`,
    it: (n: number) => `${n}h fa`,
    ru: (n: number) => `${n}ч. назад`,
    ja: (n: number) => `${n}時間前`,
    ko: (n: number) => `${n}시간 전`,
  },
  dAgo: {
    en: (n: number) => `${n}d ago`,
    zh: (n: number) => `${n}天前`,
    nl: (n: number) => `${n}d geleden`,
    de: (n: number) => `vor ${n}T`,
    fr: (n: number) => `il y a ${n}j`,
    es: (n: number) => `hace ${n}d`,
    pt: (n: number) => `${n}d atrás`,
    it: (n: number) => `${n}g fa`,
    ru: (n: number) => `${n}д. назад`,
    ja: (n: number) => `${n}日前`,
    ko: (n: number) => `${n}일 전`,
  },
  view: {
    en: "View →",
    zh: "查看 →",
    nl: "Bekijk →",
    de: "Ansehen →",
    fr: "Voir →",
    es: "Ver →",
    pt: "Ver →",
    it: "Vedi →",
    ru: "Смотреть →",
    ja: "見る →",
    ko: "보기 →",
  },
};

function tl(key: string, locale: string, n?: number): string {
  const map = TIME_LABELS[key];
  if (!map) return key;
  const val = map[locale] ?? map.en;
  if (typeof val === "function") return val(n ?? 0);
  return val;
}

function timeAgo(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return tl("justNow", locale);
  if (diff < 3600) return tl("mAgo", locale, Math.floor(diff / 60));
  if (diff < 86400) return tl("hAgo", locale, Math.floor(diff / 3600));
  return tl("dAgo", locale, Math.floor(diff / 86400));
}

export function MessageBubble({
  message,
  locale,
  onAction,
}: MessageBubbleProps) {
  const content =
    typeof message.content === "object"
      ? ((message.content as Record<string, string>)[locale] ??
        (message.content as Record<string, string>).en ??
        "")
      : String(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${message.isRead ? "opacity-70" : ""}`}
    >
      {/* Avatar */}
      <div className="mt-1 h-8 w-8 shrink-0 rounded-full bg-[var(--primary)]/15 flex items-center justify-center">
        <MessageSquareText className="h-3.5 w-3.5 text-[var(--primary)]" />
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl rounded-tl-sm bg-muted border border-border px-4 py-3">
          <p className="text-sm text-foreground leading-relaxed">{content}</p>
        </div>
        <div className="flex items-center gap-2 mt-1.5 px-1">
          <span className="text-[11px] text-muted-foreground">
            {timeAgo(message.createdAt, locale)}
          </span>
          {message.actionUrl && onAction && (
            <button
              onClick={() => onAction(message.actionUrl!)}
              className="text-[11px] text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              {tl("view", locale)}
            </button>
          )}
        </div>
      </div>

      {/* Unread dot */}
      {!message.isRead && (
        <div className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />
      )}
    </motion.div>
  );
}
