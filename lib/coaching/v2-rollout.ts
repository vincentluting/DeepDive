export type CoachingV2Variant = "legacy" | "shadow" | "v2";

interface ResolveCoachingV2RolloutParams {
  sessionId: string;
  enabledSetting?: string;
  rolloutPercentSetting?: string;
}

function hashToPercent(identifier: string): number {
  let hash = 5381;
  for (let index = 0; index < identifier.length; index += 1) {
    hash = ((hash << 5) + hash + identifier.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
}

export function resolveCoachingV2Rollout({
  sessionId,
  enabledSetting = process.env.COACHING_V2_ENABLED,
  rolloutPercentSetting = process.env.COACHING_V2_ROLLOUT_PERCENT,
}: ResolveCoachingV2RolloutParams): {
  variant: CoachingV2Variant;
  promptEnabled: boolean;
  rolloutPercent: number;
} {
  if (enabledSetting === "false") {
    return { variant: "legacy", promptEnabled: false, rolloutPercent: 0 };
  }

  if (enabledSetting === "shadow") {
    return { variant: "shadow", promptEnabled: false, rolloutPercent: 0 };
  }

  const parsedPercent = Number(rolloutPercentSetting ?? 100);
  const rolloutPercent = Number.isFinite(parsedPercent)
    ? Math.max(0, Math.min(100, Math.round(parsedPercent)))
    : 100;
  const promptEnabled =
    rolloutPercent === 100 ||
    (rolloutPercent > 0 &&
      hashToPercent(`coaching-v2:${sessionId}`) < rolloutPercent);

  return {
    variant: promptEnabled ? "v2" : "shadow",
    promptEnabled,
    rolloutPercent,
  };
}
