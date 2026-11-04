"use client";

import type { AnswerValue } from "@/lib/types";
import type { TextTheme, QuestionInfo } from "@/store/questionnaire-store";
import {
  SJT_SCENARIOS,
  DDVQ21_ITEMS,
  DDVQ_SCALE_LABELS,
  IPIP_60_ITEMS,
} from "@/lib/questionnaire";
import { SJTChatBubble } from "./questions/sjt-chat-bubble";
import { PVQLikert6 } from "./questions/pvq-likert-6";
import { IPIPLikert5 } from "./questions/ipip-likert-5";

// ============================================================
// Question Renderer v3.0 — Routes to 3 question type components
// Module A: SJT, Module B: DDVQ-21, Module C: IPIP-60
// ============================================================

export interface QuestionRendererProps {
  questionInfo: QuestionInfo;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  language: string;
  textTheme: TextTheme;
  /** Called by SJT component when both selections are made */
  onComplete?: () => void;
}

export function QuestionRenderer({
  questionInfo,
  value,
  onChange,
  language,
  textTheme,
}: QuestionRendererProps) {
  switch (questionInfo.module) {
    case "A": {
      // Module A: SJT Chat Bubble
      const scenario = SJT_SCENARIOS.find((s) => s.id === questionInfo.itemId);
      if (!scenario)
        return (
          <div className="text-red-500">
            SJT scenario {questionInfo.itemId} not found
          </div>
        );

      const sjtValue = value?.type === "sjt" ? value : undefined;
      return (
        <SJTChatBubble
          scenario={scenario}
          value={
            sjtValue
              ? {
                  wouldChoice: sjtValue.wouldChoice,
                  shouldChoice: sjtValue.shouldChoice,
                }
              : undefined
          }
          onChange={onChange}
          language={language}
          textTheme={textTheme}
        />
      );
    }

    case "B": {
      // Module B (v3.0): DDVQ-21 Likert-6 — gender-neutral original items
      const ddvqItem = DDVQ21_ITEMS.find((i) => i.id === questionInfo.itemId);
      if (!ddvqItem)
        return (
          <div className="text-red-500">
            DDVQ item {questionInfo.itemId} not found
          </div>
        );

      // Adapt DDVQItem to PVQItem-compatible shape (gender-neutral: same text for both pronouns)
      const adaptedItem = {
        id: ddvqItem.id,
        text_en: ddvqItem.text.en,
        text_en_female: ddvqItem.text.en,
        text_zh: ddvqItem.text.zh,
        valueType: ddvqItem.valueType,
      };

      const pvqValue = value?.type === "pvq" ? value.rating : undefined;
      return (
        <PVQLikert6
          item={adaptedItem}
          value={pvqValue}
          onChange={onChange}
          language={language}
          textTheme={textTheme}
          scaleLabels={DDVQ_SCALE_LABELS}
        />
      );
    }

    case "C": {
      // Module C: IPIP Likert-5 (Maples-Keller IPIP-NEO-60)
      const item = IPIP_60_ITEMS.find((i) => i.id === questionInfo.itemId);
      if (!item)
        return (
          <div className="text-red-500">
            IPIP item {questionInfo.itemId} not found
          </div>
        );

      const ipipValue = value?.type === "ipip" ? value.rating : undefined;
      return (
        <IPIPLikert5
          item={item}
          value={ipipValue}
          onChange={onChange}
          language={language}
          textTheme={textTheme}
        />
      );
    }

    default:
      return null;
  }
}
