"use client";

import { useState, useEffect, useCallback } from "react";
import { Trophy, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types (mirror API response) ─────────────────────────────

interface AchievementInfo {
  key: string;
  name: string;
  description: string;
  rarity: "common" | "uncommon" | "rare" | "epic";
  hidden: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
}

interface AchievementGalleryProps {
  locale: string;
  dict: Record<string, string>;
}

// ── Rarity visual config ────────────────────────────────────

const RARITY_STYLES: Record<
  string,
  { border: string; bg: string; text: string; icon: string }
> = {
  common: {
    border: "border-zinc-500/20",
    bg: "bg-zinc-500/8",
    text: "text-zinc-400",
    icon: "text-zinc-400",
  },
  uncommon: {
    border: "border-blue-500/20",
    bg: "bg-blue-500/8",
    text: "text-blue-400",
    icon: "text-blue-400",
  },
  rare: {
    border: "border-md-gold/25",
    bg: "bg-md-gold/8",
    text: "text-md-gold-text",
    icon: "text-md-gold-text",
  },
  epic: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    text: "text-amber-400",
    icon: "text-amber-400",
  },
};

const RARITY_DICT_KEYS: Record<string, string> = {
  common: "rarityCommon",
  uncommon: "rarityUncommon",
  rare: "rarityRare",
  epic: "rarityEpic",
};

const STORAGE_KEY = "dd_achievement_count";

// ── Toast Component ─────────────────────────────────────────

function AchievementToast({
  achievement,
  dict,
  onDismiss,
}: {
  achievement: AchievementInfo;
  dict: Record<string, string>;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const style = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`pointer-events-auto max-w-sm w-full rounded-xl border ${style.border} bg-card/95 backdrop-blur-lg shadow-lg p-4`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}
        >
          <Trophy className={`h-5 w-5 ${style.icon}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">
            {achievement.hidden && (
              <>
                <Sparkles className="inline h-3 w-3 mr-1" />
                {dict.achievementSurprise}{" "}
              </>
            )}
            {!achievement.hidden && dict.achievementUnlocked}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {achievement.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {achievement.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Gallery Component ───────────────────────────────────────

export function AchievementGallery({ locale, dict }: AchievementGalleryProps) {
  const [registry, setRegistry] = useState<AchievementInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements", {
      headers: { "x-locale": locale },
    })
      .then((r) => r.json())
      .then((data) => {
        setRegistry(data.registry ?? []);
        setTotal(data.total ?? 0);
        setUnlockedCount(data.unlocked ?? 0);

        // Detect newly unlocked achievements (compare with localStorage)
        const prevCount = parseInt(
          localStorage.getItem(STORAGE_KEY) ?? "0",
          10,
        );
        const currentCount = data.unlocked ?? 0;
        if (currentCount > prevCount && prevCount > 0) {
          // Find the new ones (most recently unlocked)
          const unlocked = (data.registry ?? []).filter(
            (a: AchievementInfo) => a.unlocked,
          );
          const newOnes = unlocked.slice(0, currentCount - prevCount);
          setNewAchievements(newOnes);
        }
        localStorage.setItem(STORAGE_KEY, String(currentCount));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setRegistry([]);
      });
  }, [locale]);

  const dismissToast = useCallback((key: string) => {
    setNewAchievements((prev) => prev.filter((a) => a.key !== key));
  }, []);

  if (loading) return null;
  if (registry.length === 0 && total === 0) return null;

  const unlocked = registry.filter((a) => a.unlocked);
  const locked = registry.filter((a) => !a.unlocked);

  const progressText = dict.achievementsProgress
    .replace("{{unlocked}}", String(unlockedCount))
    .replace("{{total}}", String(total));

  return (
    <>
      {/* Toast notifications — fixed bottom-right */}
      <AnimatePresence>
        {newAchievements.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {newAchievements.map((a) => (
              <AchievementToast
                key={a.key}
                achievement={a}
                dict={dict}
                onDismiss={() => dismissToast(a.key)}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Gallery card */}
      <div className="bg-card border border-border rounded-2xl p-6 card-inset-highlight animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            {dict.achievementsTitle}
          </h3>
          <span className="text-xs text-muted-foreground">{progressText}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-secondary rounded-full mb-5 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{
              width: `${total > 0 ? (unlockedCount / total) * 100 : 0}%`,
            }}
          />
        </div>

        {unlockedCount === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-secondary flex items-center justify-center">
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {dict.achievementsEmpty}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
            {/* Unlocked achievements first */}
            {unlocked.map((a) => {
              const style = RARITY_STYLES[a.rarity] || RARITY_STYLES.common;
              const rarityLabel =
                dict[RARITY_DICT_KEYS[a.rarity] ?? "rarityCommon"];
              return (
                <div
                  key={a.key}
                  className={`group relative p-3 rounded-xl border ${style.border} ${style.bg} text-center transition-colors`}
                  title={a.description}
                >
                  <Trophy className={`h-5 w-5 mx-auto mb-1.5 ${style.icon}`} />
                  <p className="text-xs font-medium text-foreground truncate">
                    {a.name}
                  </p>
                  <p className={`text-[10px] ${style.text}`}>{rarityLabel}</p>
                </div>
              );
            })}
            {/* Locked achievements (dimmed) */}
            {locked.slice(0, 6).map((a) => (
              <div
                key={a.key}
                className="p-3 rounded-xl border border-border bg-secondary/30 text-center opacity-40"
                title={a.description}
              >
                <Lock className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {a.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {dict[RARITY_DICT_KEYS[a.rarity] ?? "rarityCommon"]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
