"use client";

import { Pause } from "lucide-react";

interface GracefulExitDict {
  gracefulExitPromptR7?: string;
  gracefulExitPromptR9?: string;
  dismissExitPrompt?: string;
}

interface GracefulExitPromptProps {
  /** Round in which the prompt fires (7 → soft, 9 → firmer copy). */
  round: 7 | 9;
  dict: GracefulExitDict;
  onDismiss: () => void;
}

/**
 * GracefulExitPrompt — CARE Ease-of-Exit hint shown only inside the AI
 * anxiety reframing flow. Appears at round 7 (soft offer) and round 9
 * (firmer "stop here for now"). The user can dismiss; this is an
 * invitation, not a hard limit.
 */
export function GracefulExitPrompt({
  round,
  dict,
  onDismiss,
}: GracefulExitPromptProps) {
  const message =
    round === 9 ? dict.gracefulExitPromptR9 : dict.gracefulExitPromptR7;

  return (
    <div
      className="my-3 rounded-lg border border-stone-300/60 dark:border-stone-700/60 bg-stone-50/80 dark:bg-stone-900/30 px-4 py-3 animate-fade-in"
      data-testid={`graceful-exit-prompt-r${round}`}
    >
      <div className="flex items-start gap-2.5">
        <Pause className="w-4 h-4 mt-0.5 flex-shrink-0 text-stone-500 dark:text-stone-400" />
        <div className="flex-1">
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300 m-0">
            {message}
          </p>
          <button
            onClick={onDismiss}
            className="mt-2 text-xs text-stone-600 dark:text-stone-400 underline underline-offset-2 hover:text-stone-900 dark:hover:text-stone-200 min-h-[36px] flex items-center"
          >
            {dict.dismissExitPrompt}
          </button>
        </div>
      </div>
    </div>
  );
}
