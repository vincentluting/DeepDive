// ============================================================
// Report Generation — Main Entry Point
//
// v3.0: Profile and report are generated separately.
// Report pipeline focuses on career matching + reality pathway only.
// Personality profile now lives in PersonalProfile.
//
// Pipeline: All algo → [Career Match Narrative ‖ Career Pathway] + Career Drain (algorithmic)
//           → Integration (LLM)
// Total: 2-3 LLM calls (1-2 parallel + 1 sequential)
// ============================================================

// Use crypto.randomUUID() to avoid uuid type resolution issues
const generateId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
const __DEV__ = process.env.NODE_ENV === "development";
import type {
  AssessmentInput,
  ProfileAlgorithmOutput,
  RealConditions,
  CareerReport,
  CareerAnchor,
  CareerDirection,
  ReportHeader,
  Panel1CareerMatch,
  Panel3Pathway,
  AiEraPersonalInsight,
} from "../types";
import type { ResumeMatchRow } from "../db/resume-match";
import { isAnthropicAvailable } from "../ai/model-router";
import { withLLMUserId } from "../ai/llm-request-context";
import { getReportLLMProvenance } from "../db/llm-usage";
import { buildReportHeader } from "./header";
import type { ProfileNarrativeOutput } from "./types";
import { computeProfileAlgorithm } from "../profile-generation/profile-algorithm";
import { getArchetypeContent } from "../content";
import { computeCareerMatchAlgorithm } from "./career-match-algorithm";
import { generateCareerMatchNarrative } from "./career-match-narrative";
import {
  generateCareerPathway,
  buildPathwayPlaceholder,
} from "./career-pathway";
import { generateIntegration } from "./integration";
import { generateCareerDrainAlgorithmic } from "./career-drain-algorithmic";
import { getExplorationNoteTemplate } from "./common-rules";
import type {
  CareerMatchAlgorithmOutput,
  CareerMatchNarrativeOutput,
  MatchInsight,
} from "./types";

/**
 * Build a lightweight whySuitable text from pre-computed MatchInsight strengths.
 * Zero LLM cost — pure string composition from algorithm data.
 */
function buildAlgorithmicWhySuitable(
  insights: MatchInsight | undefined,
  locale: string,
): string {
  if (!insights || insights.strengths.length === 0) return "";
  const top2 = insights.strengths.slice(0, 2);
  if (locale === "zh") {
    return top2.map((s) => s.detail_zh).join("；") + "。";
  }
  return top2.map((s) => s.detail_en).join(". ") + ".";
}

/** Overall pipeline timeout — must be shorter than the route's maxDuration (300s) */
const PIPELINE_TIMEOUT_MS = 180_000; // 180 seconds

/** Per-LLM-call timeout — prevents one slow call from blocking Promise.all() indefinitely */
const PER_CALL_TIMEOUT_MS = 90_000; // 90 seconds

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise.then(
      (result) => {
        clearTimeout(timer);
        return result;
      },
      (err) => {
        clearTimeout(timer);
        throw err;
      },
    ),
    new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(`[report-gen] ${label} timed out after ${ms / 1000}s`),
          ),
        ms,
      );
    }),
  ]);
}

/**
 * Progress callback for report generation pipeline.
 * Fired at each pipeline stage so callers (e.g. SSE endpoints) can stream
 * real-time status to the frontend.
 */
export type ReportProgressStage =
  | "preparing"
  | "algorithms"
  | "career_match"
  | "integration"
  | "complete";

export type ReportProgressCallback = (
  stage: ReportProgressStage,
  detail?: string,
) => void;

/**
 * Generate a complete career report from AssessmentResult.
 *
 * Pipeline:
 * Step 0: Build report header (archetype from Quick Dive)
 * Step 1: Compute Profile + Career Match algorithms
 * Step 2: PARALLEL — Career Match Narrative (LLM) ‖ Career Pathway (LLM) + Career Drain (algo)
 * Step 3: Integration (LLM)
 */
export async function generateCareerReport(
  assessment: AssessmentInput,
  realConditions: RealConditions | null,
  locale: string = "en",
  profileAlgoSnapshot?: Omit<ProfileAlgorithmOutput, "archetypeContent">,
  profileNarratives?: ProfileNarrativeOutput | null,
  onProgress?: ReportProgressCallback,
  resumeMatch?: ResumeMatchRow | null,
  userId?: string | null,
): Promise<CareerReport> {
  // Bind userId into AsyncLocalStorage so all downstream callLLM →
  // logLLMUsage calls record the userId, even though model-router is a
  // frozen zone and cannot accept userId in CallLLMOptions.
  // See lib/ai/llm-request-context.ts for the rationale.
  return withLLMUserId(userId ?? null, () =>
    Promise.race([
      generateCareerReportInternal(
        assessment,
        realConditions,
        locale,
        profileAlgoSnapshot,
        profileNarratives ?? null,
        onProgress,
        resumeMatch ?? null,
        userId ?? null,
      ),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Report generation pipeline timed out")),
          PIPELINE_TIMEOUT_MS,
        ),
      ),
    ]),
  );
}

async function generateCareerReportInternal(
  assessment: AssessmentInput,
  realConditions: RealConditions | null,
  locale: string,
  profileAlgoSnapshot?: Omit<ProfileAlgorithmOutput, "archetypeContent">,
  profileNarratives?: ProfileNarrativeOutput | null,
  onProgress?: ReportProgressCallback,
  resumeMatch?: ResumeMatchRow | null,
  userId?: string | null,
): Promise<CareerReport> {
  const startTime = Date.now();
  const reportId = generateId();
  let llmCallCount = 0;

  // ── Validate critical fields ──────────────────────────────
  if (!assessment.archetype && !assessment.riasecNormalized)
    throw new Error("Assessment missing archetype and riasecNormalized");
  if (!assessment.riasecNormalized)
    throw new Error("Assessment missing riasecNormalized (from Quick Dive)");
  if (!assessment.bigFive) throw new Error("Assessment missing bigFive");
  if (!assessment.schwartz) throw new Error("Assessment missing schwartz");

  // ── Step 0: Report Header ─────────────────────────────────
  onProgress?.("preparing");
  const header: ReportHeader = buildReportHeader(assessment);

  // ── Step 1: Algorithm layers ─────────────────────────────
  onProgress?.("algorithms");
  // Use profile's cached algo snapshot if available; otherwise compute fresh.
  // computeCareerMatchAlgorithm → explore() internally awaits ensureCareerPoolLoaded(),
  // so career pool is guaranteed loaded before scoring (no cold-start empty pool).
  const profileAlgo: ProfileAlgorithmOutput = profileAlgoSnapshot
    ? {
        ...profileAlgoSnapshot,
        archetypeContent:
          getArchetypeContent(profileAlgoSnapshot.archetype.code) ?? null,
      }
    : computeProfileAlgorithm(assessment);
  // Resume-inferred target tier overrides the white-collar default {4,5}
  // — gives the engine.tierPenalty signal for users who uploaded a resume.
  const userTargetTier = resumeMatch?.matchResult?.userTargetTier
    ? {
        min: resumeMatch.matchResult.userTargetTier.min,
        max: resumeMatch.matchResult.userTargetTier.max,
      }
    : undefined;

  const careerMatchAlgo = await computeCareerMatchAlgorithm(
    assessment,
    profileAlgo,
    realConditions,
    userTargetTier ? { targetTier: userTargetTier } : undefined,
  );

  // ── Step 2: Parallel LLM calls + algorithmic career drain ───────────────────────────
  // v3.0: Profile narrative is no longer generated here — it lives in PersonalProfile.
  // Career Pathway only uses algorithm-derived fields (rank, title, matchScore) from Career Match,
  // so it can run in parallel with Career Match narrative.
  onProgress?.("career_match");
  const careerMatchLite: Panel1CareerMatch = assembleCareerMatchLite(
    careerMatchAlgo,
    locale,
  );

  const resumeEvidence = resumeMatch?.matchResult ?? null;

  const parallelTasks: Promise<unknown>[] = [
    withTimeout(
      generateCareerMatchNarrative(
        assessment,
        profileAlgo,
        careerMatchAlgo,
        realConditions,
        locale,
        resumeEvidence,
        userId,
      ),
      PER_CALL_TIMEOUT_MS,
      "CareerMatchNarrative",
    ),
  ];

  // Career Pathway joins the parallel batch when realConditions exist.
  // Pass resumeEvidence so the 30-day plan + jobDirections calibrate
  // against the user's actual prior experience instead of defaulting to
  // junior-tier introductory tasks.
  let pathwayPromise: Promise<Panel3Pathway> | null = null;
  if (realConditions) {
    pathwayPromise = withTimeout(
      generateCareerPathway(
        assessment,
        careerMatchLite,
        profileAlgo,
        realConditions,
        locale,
        userId,
        resumeEvidence,
      ),
      PER_CALL_TIMEOUT_MS,
      "Panel3Pathway",
    );
    parallelTasks.push(pathwayPromise);
  }

  // Resolve parallel batch. model-router handles retries + provider failover
  // internally (up to 3 retries + 1 failover chain per call). If it still
  // fails, degrade immediately — an extra 10s sleep won't help.
  // allSettled (not Promise.all): the career-match narrative and the career
  // pathway have INDEPENDENT failure domains. With Promise.all, a pathway
  // rejection would discard an already-successful narrative and needlessly
  // degrade career match to Lite. allSettled also awaits both here, so a
  // pathway rejection is handled (no unhandled rejection) before its own
  // dedicated await below.
  const degradedSections: string[] = [];
  let careerMatchNarratives: Awaited<
    ReturnType<typeof generateCareerMatchNarrative>
  > | null = null;
  const settled = await Promise.allSettled(parallelTasks);
  const narrativeResult = settled[0];
  if (narrativeResult.status === "fulfilled") {
    careerMatchNarratives = narrativeResult.value as Awaited<
      ReturnType<typeof generateCareerMatchNarrative>
    >;
    llmCallCount += 1;
  } else {
    if (__DEV__)
      console.warn(
        "[report-gen] Career match narrative failed, degrading to algorithmic:",
        narrativeResult.reason instanceof Error
          ? narrativeResult.reason.message
          : narrativeResult.reason,
      );
    degradedSections.push("careerMatch");
  }

  // Career drain is algorithmic — no LLM call. realConditions only shifts
  // the framing tone (urgent filter / long-term self-knowledge / default);
  // the drain DATA itself is unchanged.
  const careerDrainOutput = generateCareerDrainAlgorithmic(
    assessment,
    profileAlgo,
    locale,
    profileAlgo.bigFivePrecision,
    realConditions,
  );

  // Assemble career match — LLM narratives when available, algorithmic fallback otherwise
  const careerMatch: Panel1CareerMatch = careerMatchNarratives
    ? assembleCareerMatch(careerMatchAlgo, careerMatchNarratives, locale)
    : assembleCareerMatchLite(careerMatchAlgo, locale);

  // AI-era personal insight (pure algorithm, 0 LLM)
  careerMatch.aiEraPersonalInsight = computeAiEraPersonalInsight(profileAlgo);

  // ── Resolve career pathway ────────────────────────────────────────
  let careerPathway;
  try {
    if (pathwayPromise) {
      careerPathway = await pathwayPromise;
      llmCallCount++;
    } else {
      careerPathway = buildPathwayPlaceholder(locale);
    }
  } catch (err) {
    if (__DEV__)
      console.error(
        "[report-gen] Career pathway generation failed, using placeholder:",
        err,
      );
    careerPathway = buildPathwayPlaceholder(locale);
    degradedSections.push("careerPathway");
  }

  // ── Step 3: Integration (only sequential step) ──────────────────────
  // model-router handles retries + failover internally. integration.ts has
  // a 2-attempt validation loop for incomplete JSON / repetitive text.
  // If all attempts fail, degrade to algorithmic integration.
  onProgress?.("integration");
  let integration: Awaited<ReturnType<typeof generateIntegration>>;
  try {
    integration = await withTimeout(
      generateIntegration(
        assessment,
        profileAlgo,
        careerMatch,
        profileNarratives ?? null,
        careerPathway,
        locale,
        resumeEvidence,
        realConditions,
        userId,
      ),
      PER_CALL_TIMEOUT_MS,
      "Integration",
    );
    llmCallCount++;
  } catch (intErr) {
    if (__DEV__)
      console.warn(
        "[report-gen] Integration failed, degrading to algorithmic:",
        intErr instanceof Error ? intErr.message : intErr,
      );
    degradedSections.push("integration");
    // Last-resort algorithmic integration
    integration = {
      coreInsight:
        locale === "zh"
          ? `你的探索呈现出${assessment.archetype?.label_zh ?? "独特"}的模式。这份报告是你职业探索之旅的起点。`
          : locale === "nl"
            ? "Je verkenning laat een herkenbaar patroon zien: je zoekt richting zonder jezelf vast te zetten in één definitief antwoord."
            : `Your exploration reveals a ${assessment.archetype?.label_en ?? "unique"} pattern. This report is the starting point of your career exploration.`,
      transitions: {
        profileToPathway:
          locale === "zh"
            ? "了解了自己之后，让我们结合现实来规划——"
            : locale === "nl"
              ? "Nu je jezelf scherper ziet, kunnen we de stap naar de realiteit maken —"
              : "Now that you know yourself better, let's map the real-world path —",
      },
      letterToUser:
        locale === "zh"
          ? `你好。\n\n在深度探索中，你展现出「${assessment.archetype?.label_zh ?? ""}」的特质——${assessment.archetype?.tagline_zh ?? ""}。\n\n你不只是这个标签——这份报告是此刻的快照，而你是一个持续进化的人。如果你想更深入地理解这些发现，教练对话是一个值得尝试的下一步。`
          : locale === "nl"
            ? "Hallo.\n\nJe rapport wijst niet naar één vaststaand antwoord, maar naar een herkenbare manier waarop jij keuzes benadert: je wilt richting voelen zonder je eigen beoordelingsvermogen uit handen te geven.\n\nDeze momentopname hoeft je niet vast te zetten. Ze mag dienen als werkmateriaal: iets om aan te scherpen, te toetsen en soms ook tegen te spreken.\n\nAls je deze lijnen verder wilt onderzoeken, kan het coachgesprek helpen om ze naar concrete situaties te vertalen."
            : `Hello.\n\nAcross your deep exploration, you show the qualities of a "${assessment.archetype?.label_en ?? ""}" — ${assessment.archetype?.tagline_en ?? ""}.\n\nYou are more than this label — this report is a snapshot, not a sentence. If you want to understand these findings more deeply, a coaching conversation is a worthwhile next step.`,
    };
  }

  const generationTimeMs = Date.now() - startTime;
  if (__DEV__) {
    console.log(
      `[report-gen] Pipeline completed in ${generationTimeMs}ms (${llmCallCount} LLM calls)`,
    );
  }

  // ── Career Anchors (pure algorithm, no LLM) ──
  const careerAnchors = computeCareerAnchors(profileAlgo, locale);

  onProgress?.("complete");

  // ── Migration 094: build LLM provider map + quality score ────────
  // Query LLMUsageLog for this user's calls since report generation
  // started. Fire-and-forget logging is eventually consistent, but by
  // the time we get here all LLM calls have already awaited completion,
  // so their log rows are committed. Anonymous reports (userId null)
  // skip this step — JSONB column stays NULL.
  //
  // totalLLMSections = 3 (careerMatch + careerPathway + integration).
  // qualityScore = 1 - degradedSections.length / totalLLMSections.
  // Phase 2 will downgrade qualityScore further when output fails
  // gates (length/field/locale/repetition), via a `gatesPassed` count.
  let llmProviderMap:
    | Record<string, { provider: string; model: string }>
    | undefined;
  if (userId) {
    try {
      const provenance = await getReportLLMProvenance({
        userId,
        startedAt: startTime,
        // Caller knows how many LLM calls fired (llmCallCount). Wait for
        // fire-and-forget INSERTs to commit at least that many tasks
        // before giving up — otherwise the last call (integration) often
        // misses the snapshot.
        expectMinTasks: llmCallCount,
        maxWaitMs: 1500,
      });
      llmProviderMap = {};
      for (const taskName of Object.keys(provenance.taskProviders)) {
        llmProviderMap[taskName] = {
          provider: provenance.taskProviders[taskName],
          model: provenance.taskModels[taskName] ?? "unknown",
        };
      }
    } catch (provErr) {
      if (__DEV__)
        console.warn(
          "[report-gen] Failed to build llmProviderMap (non-fatal):",
          provErr instanceof Error ? provErr.message : provErr,
        );
      // Non-fatal: report still saves; admin dashboard just sees null.
    }
  }

  const totalLLMSections = 3; // careerMatch / careerPathway / integration
  const qualityScore = Math.max(
    0,
    Math.min(1, 1 - degradedSections.length / totalLLMSections),
  );

  return {
    id: reportId,
    assessmentId: assessment.id,
    locale,
    header,
    careerAnchors,
    careerMatch,
    // v3.0: profile data lives in PersonalProfile
    careerPathway,
    integration,
    careerDrainWarning: careerDrainOutput,
    meta: {
      generatedAt: Date.now(),
      version: "3.0",
      llmModel: isAnthropicAvailable()
        ? "claude-sonnet-4-5-20250929 + gpt-4o-mini"
        : "gpt-4o-mini",
      generationTimeMs,
      llmCalls: llmCallCount,
      realConditionsProvided: !!realConditions,
      ...(resumeMatch && {
        resumeEnhanced: true,
        resumeMatchId: resumeMatch.id,
        resumeMatchAt: resumeMatch.createdAt.getTime(),
      }),
      // Sections that exhausted all retry+fallback attempts and fell back
      // to algorithmic text. Frontend uses this to show "Enhance" button.
      ...(degradedSections.length > 0 && {
        degradedSections,
      }),
      // Migration 094: per-section LLM provenance (Phase 1 of 99%+ plan).
      ...(llmProviderMap &&
        Object.keys(llmProviderMap).length > 0 && {
          llmProviderMap,
        }),
      qualityScore,
    },
    ...(resumeMatch && {
      resumeEvidence: {
        alignedDimensions: resumeMatch.matchResult.alignedDimensions,
        conflictingDimensions: resumeMatch.matchResult.conflictingDimensions,
        summary_zh: resumeMatch.matchResult.summary_zh,
        summary_en: resumeMatch.matchResult.summary_en,
        // Persist experience signals into the report snapshot so
        // regenerate-pathway rehydrates the same data the original
        // generation saw (codex P1 fix 2026-05-23). Without these,
        // buildResumeEvidenceBlock had no years/seniority/industries to
        // ground the Career Pathway "seniority MUST match" prompt rule.
        ...(resumeMatch.matchResult.userTargetTier && {
          userTargetTier: resumeMatch.matchResult.userTargetTier,
        }),
        ...(resumeMatch.matchResult.autoFillRealConditions && {
          autoFillRealConditions:
            resumeMatch.matchResult.autoFillRealConditions,
        }),
      },
    }),
  };
}

// ── AI-Era Personal Insight (pure algorithm, 0 LLM) ──────────

/** Map brand radar keys to RIASEC codes */
const RADAR_TO_RIASEC: Record<string, string> = {
  build: "R",
  decode: "I",
  create: "A",
  connect: "S",
  drive: "E",
  structure: "C",
};

/** AI-era moat narratives keyed by top RIASEC code */
const AI_ERA_MOATS: Record<string, { zh: string; en: string }> = {
  R: {
    zh: "你的动手实操能力和物理环境中的创造性问题解决，是当前 AI 最难复制的领域。技术型工种正以每年 11% 增速扩张——你的直觉判断力是这条赛道的核心壁垒。",
    en: "Your hands-on skill and creative problem-solving in physical environments remain among the hardest capabilities for AI to replicate. Technical trades are growing at 11% annually — your intuitive judgment is the core barrier to entry.",
  },
  I: {
    zh: "你定义研究问题、构建假设和解读复杂因果关系的能力，是 AI 最需要人类参与的环节。AI 能处理数据，但提出正确的问题仍然属于人类。",
    en: "Your ability to define research questions, form hypotheses, and interpret complex causal relationships is where AI needs human involvement most. AI processes data, but asking the right questions remains human territory.",
  },
  A: {
    zh: "你的原创性、审美判断和情感叙事直觉，在 AI 生成内容泛滥的时代变得更加稀缺。WEF 将创造性思维列为 2025-2030 增速最快的人类核心技能。",
    en: "Your originality, aesthetic judgment, and emotional narrative intuition become more scarce as AI-generated content floods the market. The WEF ranks creative thinking as the fastest-growing core human skill for 2025-2030.",
  },
  S: {
    zh: '你的同理心和深度人际洞察力是 AI 无法触及的领域。在数字化加深的世界里，"被真正理解"的需求只会更加稀缺和珍贵。',
    en: 'Your empathy and deep interpersonal insight occupy territory AI cannot reach. In an increasingly digital world, the need to be "truly understood" only grows more scarce and valuable.',
  },
  E: {
    zh: "你的战略判断力、跨团队谈判能力和在不确定性中做决策的魄力，构成了 AI 时代的「人类护城河」。AI 提供数据，但让人和资源朝一个方向前进，仍然需要你。",
    en: 'Your strategic judgment, cross-team negotiation skills, and decisiveness under uncertainty form the "human moat" of the AI era. AI provides data, but aligning people and resources toward a goal still requires someone like you.',
  },
  C: {
    zh: "你对系统和流程的深度理解，在 AI 工具需要被精确配置、监控和优化的时代，变成了独特优势。你的结构化思维是让 AI 真正高效运转的关键。",
    en: "Your deep understanding of systems and processes becomes a unique advantage when AI tools need precise configuration, monitoring, and optimization. Your structured thinking is the key to making AI truly effective.",
  },
};

/** AI-era watch-out narratives keyed by top RIASEC code */
const AI_ERA_WATCHOUTS: Record<string, { zh: string; en: string }> = {
  R: {
    zh: '重复性操作和标准化流程正在被自动化系统接管。向"人机协作"方向演进，让你的判断力指挥机器而非与机器竞争。',
    en: "Repetitive operations and standardized processes are being taken over by automation. Evolve toward human-AI collaboration, directing machines with your judgment rather than competing against them.",
  },
  I: {
    zh: '基础数据分析和信息检索正在被 AI 自动化。从"执行研究"升级为"设计研究框架"，让 AI 成为你的研究助手。',
    en: "Basic data analysis and information retrieval are being automated by AI. Evolve from executing research to designing research frameworks — make AI your research assistant.",
  },
  A: {
    zh: "AI 生成内容正在冲击模板化设计和入门级创意工作。专注于概念突破和情感共鸣——这是机器做不到的。",
    en: "AI-generated content is disrupting template-based design and entry-level creative work. Focus on conceptual breakthroughs and emotional resonance — these are beyond machine capability.",
  },
  S: {
    zh: "标准化客服和信息传递角色正在被 AI 助手替代。向深度人类体验和转化性互动方向发展。",
    en: "Standardized service and information-delivery roles are being replaced by AI assistants. Move toward deep human experiences and transformative interactions.",
  },
  E: {
    zh: "AI 驱动的扁平化管理正在压缩纯信息传递型的中层管理岗位。从管理流程转向引领变革。",
    en: "AI-driven organizational flattening is compressing middle management roles focused on information relay. Shift from managing processes to leading transformation.",
  },
  C: {
    zh: "纯数据录入和文书处理是 AI 自动化的首要目标。从执行流程升级为设计和优化人机协作流程。",
    en: "Pure data entry and document processing are the primary targets of AI automation. Evolve from executing processes to designing and optimizing human-AI collaboration workflows.",
  },
};

/** AI-era positioning based on top RIASEC + Big Five openness level */
const AI_ERA_POSITIONING: Record<
  string,
  { high: { zh: string; en: string }; low: { zh: string; en: string } }
> = {
  R: {
    high: {
      zh: "将你的实操直觉与 AI 新工具快速结合——成为团队中最先把新技术转化为实际成果的人。",
      en: "Rapidly combine your hands-on intuition with emerging AI tools — become the first on your team to turn new technology into tangible results.",
    },
    low: {
      zh: "在你擅长的物理领域深耕精进，逐步引入 AI 辅助来放大你已有的专业优势。",
      en: "Deepen your expertise in your physical domain, gradually introducing AI assistance to amplify the professional strengths you already possess.",
    },
  },
  I: {
    high: {
      zh: "用 AI 加速你的研究效率，专注于提出更深层的假设和跨学科的洞察——这是纯 AI 系统到达不了的层次。",
      en: "Use AI to accelerate your research efficiency while focusing on deeper hypotheses and cross-disciplinary insights — a level pure AI systems cannot reach.",
    },
    low: {
      zh: "在你的专业领域建立深厚的方法论护城河，让 AI 处理数据采集而你专注于解读和理论构建。",
      en: "Build a deep methodological moat in your specialty — let AI handle data collection while you focus on interpretation and theory-building.",
    },
  },
  A: {
    high: {
      zh: "用 AI 放大你的创意产出效率，同时不断探索新媒介和表达形式——你的实验精神是最大的竞争优势。",
      en: "Use AI to amplify your creative output while continuously exploring new media and forms of expression — your experimental spirit is your greatest competitive advantage.",
    },
    low: {
      zh: "深耕你独特的创意风格和叙事深度，让 AI 处理技术执行，你专注于只有你能创造的原创概念。",
      en: "Deepen your unique creative style and narrative depth — let AI handle technical execution while you focus on the original concepts only you can create.",
    },
  },
  S: {
    high: {
      zh: '探索用 AI 工具增强你的服务范围和深度——成为"AI 赋能的人类专家"，用技术放大你的同理心影响力。',
      en: 'Explore AI tools to enhance your service range and depth — become an "AI-empowered human expert," using technology to amplify your empathic impact.',
    },
    low: {
      zh: "专注于深度一对一的人际互动，这是 AI 最难替代的场景。让你的陪伴和洞察力成为不可替代的核心价值。",
      en: "Focus on deep one-on-one human interaction — the scenario hardest for AI to replace. Let your presence and insight become your irreplaceable core value.",
    },
  },
  E: {
    high: {
      zh: "成为 AI 时代的变革领导者——帮助组织理解和拥抱 AI 转型，把你的战略敏锐性和适应力转化为领导力优势。",
      en: "Become an AI-era transformation leader — help organizations understand and embrace AI transformation, turning your strategic acuity and adaptability into leadership advantage.",
    },
    low: {
      zh: "在你熟悉的行业和领域深耕领导力，用行业专业知识和人脉网络构建 AI 无法复制的领导根基。",
      en: "Deepen your leadership in familiar industries, building a foundation of domain expertise and professional networks that AI cannot replicate.",
    },
  },
  C: {
    high: {
      zh: "成为 AI 流程架构师——用你的系统思维设计人机协作的最优工作流，让 AI 在你设计的框架中高效运转。",
      en: "Become an AI workflow architect — use your systems thinking to design optimal human-AI collaboration workflows, making AI operate effectively within your framework.",
    },
    low: {
      zh: "在你的专业领域成为质量标准的守护者——AI 输出需要人类把关，你的精确性是最后一道防线。",
      en: "Become the guardian of quality standards in your domain — AI output needs human oversight, and your precision is the last line of defense.",
    },
  },
};

/**
 * Compute AI-era personal insight from profile algorithm output.
 * Pure algorithm (0 LLM calls), based on RIASEC top dimension + Big Five openness.
 */
function computeAiEraPersonalInsight(
  profileAlgo: ProfileAlgorithmOutput,
): AiEraPersonalInsight {
  // Find top RIASEC dimension
  const radarEntries = Object.entries(profileAlgo.riasecRadar) as [
    string,
    number,
  ][];
  radarEntries.sort((a, b) => b[1] - a[1]);
  const topRadarKey = radarEntries[0][0];
  const topRiasec = RADAR_TO_RIASEC[topRadarKey] ?? "R";

  // Big Five openness drives adaptability; conscientiousness drives execution reliability
  const openness = profileAlgo.bigFiveDomains.openness;
  const conscientiousness = profileAlgo.bigFiveDomains.conscientiousness;
  // Weighted: openness (60%) + conscientiousness (40%) → 0-100
  const adaptabilityScore = Math.round(
    openness * 0.6 + conscientiousness * 0.4,
  );

  const isHighOpenness = openness >= 55;

  const moat = AI_ERA_MOATS[topRiasec] ?? AI_ERA_MOATS.R;
  const watchOut = AI_ERA_WATCHOUTS[topRiasec] ?? AI_ERA_WATCHOUTS.R;
  const positioning = isHighOpenness
    ? (AI_ERA_POSITIONING[topRiasec]?.high ?? AI_ERA_POSITIONING.R.high)
    : (AI_ERA_POSITIONING[topRiasec]?.low ?? AI_ERA_POSITIONING.R.low);

  return {
    moat_zh: moat.zh,
    moat_en: moat.en,
    watchOut_zh: watchOut.zh,
    watchOut_en: watchOut.en,
    positioning_zh: positioning.zh,
    positioning_en: positioning.en,
    adaptabilityScore,
  };
}

// ── Career Anchors (Ch1: Profile → Career bridge) ────────────

/**
 * Derive 3 career anchors from profile algorithm output.
 * Each anchor is a binary preference pair that translates a personality dimension
 * into career-relevant language. Pure algorithm, no LLM.
 *
 * Logic:
 * 1. RIASEC anchor — top RIASEC dimension → what kind of work energizes you
 * 2. Schwartz anchor — top value → what you optimize for in career decisions
 * 3. Big Five cross-dimension anchor — highest-signal Big Five pattern → how you work
 */
function computeCareerAnchors(
  profileAlgo: ProfileAlgorithmOutput,
  _locale: string,
): CareerAnchor[] {
  const anchors: CareerAnchor[] = [];

  // ── Anchor 1: RIASEC — what energizes you ──
  const riasecEntries = Object.entries(profileAlgo.riasecRadar) as [
    string,
    number,
  ][];
  riasecEntries.sort((a, b) => b[1] - a[1]);
  const topRiasec = riasecEntries[0][0]; // brand name: build/decode/create/connect/drive/structure
  const bottomRiasec = riasecEntries[riasecEntries.length - 1][0];

  const riasecLabels: Record<string, { zh: string; en: string }> = {
    build: { zh: "动手建造", en: "Hands-on building" },
    decode: { zh: "深度探究", en: "Deep investigation" },
    create: { zh: "创造性表达", en: "Creative expression" },
    connect: { zh: "人际连接", en: "Human connection" },
    drive: { zh: "引领推动", en: "Leading & driving" },
    structure: { zh: "系统构建", en: "Systematic organizing" },
  };
  const riasecAntiLabels: Record<string, { zh: string; en: string }> = {
    build: { zh: "纯理论工作", en: "Purely theoretical work" },
    decode: { zh: "重复执行", en: "Repetitive execution" },
    create: { zh: "标准化流程", en: "Standardized processes" },
    connect: { zh: "独立作业", en: "Solo operations" },
    drive: { zh: "被动执行", en: "Passive execution" },
    structure: { zh: "即兴发挥", en: "Improvisation" },
  };

  const topR = riasecLabels[topRiasec];
  const bottomR = riasecAntiLabels[bottomRiasec];
  if (topR && bottomR) {
    anchors.push({
      label_zh: `${topR.zh} > ${bottomR.zh}`,
      label_en: `${topR.en} > ${bottomR.en}`,
      positive_zh: topR.zh,
      positive_en: topR.en,
      negative_zh: bottomR.zh,
      negative_en: bottomR.en,
      source: "riasec",
      strength: Math.round(
        riasecEntries[0][1] - riasecEntries[riasecEntries.length - 1][1],
      ),
    });
  }

  // ── Anchor 2: Schwartz — what you optimize for ──
  const top1Value = profileAlgo.schwartz.ranking[0];
  const bottomValue =
    profileAlgo.schwartz.ranking[profileAlgo.schwartz.ranking.length - 1];

  const schwartzCareerLabels: Record<string, { zh: string; en: string }> = {
    achievement: { zh: "成就与认可", en: "Achievement & recognition" },
    power: { zh: "影响力与地位", en: "Influence & status" },
    stimulation: { zh: "新鲜感与挑战", en: "Novelty & challenge" },
    "self-direction": { zh: "自主与自由", en: "Autonomy & freedom" },
    hedonism: { zh: "愉悦与享受", en: "Enjoyment & fulfillment" },
    benevolence: { zh: "助人与关怀", en: "Helping & caring" },
    universalism: { zh: "公正与普世关怀", en: "Justice & universal care" },
    conformity: { zh: "规范与秩序", en: "Norms & order" },
    tradition: { zh: "使命与传承", en: "Mission & legacy" },
    security: { zh: "安全与稳定", en: "Safety & stability" },
  };
  const schwartzAntiLabels: Record<string, { zh: string; en: string }> = {
    achievement: { zh: "薪资天花板", en: "Salary ceiling" },
    power: { zh: "层级攀爬", en: "Hierarchy climbing" },
    stimulation: { zh: "一成不变", en: "Monotony" },
    "self-direction": { zh: "被动服从", en: "Passive compliance" },
    hedonism: { zh: "苦行主义", en: "Asceticism" },
    benevolence: { zh: "冷漠效率", en: "Cold efficiency" },
    universalism: { zh: "狭隘利己", en: "Narrow self-interest" },
    conformity: { zh: "混乱无序", en: "Chaos" },
    tradition: { zh: "断裂割裂", en: "Disconnection" },
    security: { zh: "高风险赌博", en: "High-risk gambling" },
  };

  const topV = schwartzCareerLabels[top1Value];
  const bottomV = schwartzAntiLabels[bottomValue];
  if (topV && bottomV) {
    // Use centered score difference for strength
    const topScore = profileAlgo.schwartz.centered[top1Value] ?? 0;
    const bottomScore = profileAlgo.schwartz.centered[bottomValue] ?? 0;
    anchors.push({
      label_zh: `${topV.zh} > ${bottomV.zh}`,
      label_en: `${topV.en} > ${bottomV.en}`,
      positive_zh: topV.zh,
      positive_en: topV.en,
      negative_zh: bottomV.zh,
      negative_en: bottomV.en,
      source: "schwartz",
      strength: Math.round(
        Math.min(100, Math.abs(topScore - bottomScore) * 50),
      ),
    });
  }

  // ── Anchor 3: Big Five cross-dimension — how you work ──
  const bf = profileAlgo.bigFiveDomains;
  // Find the most decisive Big Five signal (furthest from 50)
  const bfEntries = Object.entries(bf) as [string, number][];
  bfEntries.sort((a, b) => Math.abs(b[1] - 50) - Math.abs(a[1] - 50));
  const topBf = bfEntries[0];
  const [topDomain, topScore] = topBf;
  const isHigh = topScore > 50;

  const bfAnchorMap: Record<
    string,
    {
      high: { zh: string; en: string };
      low: { zh: string; en: string };
      anti: { zh: string; en: string };
    }
  > = {
    openness: {
      high: { zh: "探索未知", en: "Exploring the unknown" },
      low: { zh: "深耕已知", en: "Deepening the known" },
      anti: { zh: "固守常规", en: "Sticking to routine" },
    },
    conscientiousness: {
      high: { zh: "计划驱动", en: "Plan-driven approach" },
      low: { zh: "灵活应变", en: "Flexible adaptation" },
      anti: { zh: "随性混沌", en: "Unstructured chaos" },
    },
    extraversion: {
      high: { zh: "协作共创", en: "Collaborative co-creation" },
      low: { zh: "深度独处", en: "Deep solo focus" },
      anti: { zh: "持续社交消耗", en: "Constant social drain" },
    },
    agreeableness: {
      high: { zh: "和谐共赢", en: "Harmonious collaboration" },
      low: { zh: "独立判断", en: "Independent judgment" },
      anti: { zh: "对抗性竞争", en: "Adversarial competition" },
    },
    neuroticism: {
      high: { zh: "敏锐感知", en: "Acute perception" },
      low: { zh: "稳定从容", en: "Steady composure" },
      anti: { zh: "高压消耗", en: "High-pressure burnout" },
    },
  };

  const bfMapping = bfAnchorMap[topDomain];
  if (bfMapping) {
    const positive = isHigh ? bfMapping.high : bfMapping.low;
    anchors.push({
      label_zh: `${positive.zh} > ${bfMapping.anti.zh}`,
      label_en: `${positive.en} > ${bfMapping.anti.en}`,
      positive_zh: positive.zh,
      positive_en: positive.en,
      negative_zh: bfMapping.anti.zh,
      negative_en: bfMapping.anti.en,
      source: "bigfive",
      strength: Math.round(Math.abs(topScore - 50) * 2),
    });
  }

  return anchors;
}

// ── Assembly Helpers ──────────────────────────────────────────

/**
 * Calculate cross-cultural barrier level from fit types.
 * - high: primary type is 'root', or contains 'root' without 'global'/'bridge'
 * - medium: contains 'root' and also contains 'bridge' or 'integrate'
 * - low: only 'global' and/or 'bridge', no 'root'
 */
function calculateBarrierLevel(
  crossCulturalFit: string[],
): "low" | "medium" | "high" {
  const hasRoot = crossCulturalFit.includes("root");
  const hasGlobal = crossCulturalFit.includes("global");
  const hasBridge = crossCulturalFit.includes("bridge");
  const hasIntegrate = crossCulturalFit.includes("integrate");

  if (!hasRoot) return "low";
  if (crossCulturalFit[0] === "root") return "high";
  if (hasRoot && !hasGlobal && !hasBridge) return "high";
  if (hasRoot && (hasBridge || hasIntegrate)) return "medium";
  return "medium";
}

/**
 * Compute the differential impact of reality constraints on ideal directions.
 * Compares unfiltered ideal directions vs filtered directions and categorizes each.
 */
function computeRealityImpact(
  idealDirections: CareerDirection[],
  filteredDirections: CareerDirection[],
): Panel1CareerMatch["realityImpact"] {
  // Build rank maps for comparison
  const idealRankMap = new Map(
    idealDirections.map((d) => [d.title_en, d.rank]),
  );
  const filteredRankMap = new Map(
    filteredDirections.map((d) => [d.title_en, d.rank]),
  );

  const strengthened: string[] = [];
  const weakened: string[] = [];
  const newOpportunities: string[] = [];

  // Check each filtered direction
  for (const dir of filteredDirections) {
    const idealRank = idealRankMap.get(dir.title_en);
    if (idealRank === undefined) {
      // Direction appeared in filtered but not in ideal top 8 → new opportunity
      newOpportunities.push(dir.title_en);
    } else if (dir.rank < idealRank) {
      // Rank improved (lower number = better) → strengthened
      strengthened.push(dir.title_en);
    }
  }

  // Check each ideal direction that's not in filtered top 5 or dropped in rank
  for (const dir of idealDirections) {
    const filteredRank = filteredRankMap.get(dir.title_en);
    if (filteredRank === undefined) {
      // Dropped out of filtered top 5 → weakened
      weakened.push(dir.title_en);
    } else if (filteredRank > dir.rank) {
      // Rank worsened → weakened
      weakened.push(dir.title_en);
    }
  }

  return { strengthened, weakened, newOpportunities };
}

/**
 * Assemble a lightweight career match from algorithm data only (no LLM narratives).
 * Used to feed Career Pathway prompt in parallel with narrative generation.
 * Career Pathway only reads rank, title, and matchScore from directions.
 */
function assembleCareerMatchLite(
  algo: CareerMatchAlgorithmOutput,
  locale: string,
): Panel1CareerMatch {
  const directions: CareerDirection[] = algo.candidates.map((c, i) => ({
    rank: i + 1,
    title_zh: c.direction.title_zh,
    title_en: c.direction.title_en,
    matchScore: c.score.total,
    matchBreakdown: c.score.breakdown,
    whySuitable: "",
    challenges: "",
    explorationNote: getExplorationNoteTemplate(locale),
    alignedValues: c.direction.alignedValues,
    industries: c.direction.industries,
    crossCulturalFit: c.direction.crossCulturalFit,
    crossCulturalBarrierLevel: calculateBarrierLevel(
      c.direction.crossCulturalFit,
    ),
    aiEraCategory: c.direction.aiEraCategory,
    aiExposureScore: c.direction.aiExposureScore,
    aiImpactLabel: c.direction.aiImpactLabel,
    annotationConfidence: c.direction.annotationConfidence,
    marketOutlook: c.direction.marketOutlook,
    resilienceLevel: c.direction.resilienceLevel,
    jobZone: c.direction.jobZone ?? null,
    inTargetTier: c.inTargetTier,
    tierGap: c.tierGap,
  }));

  const exploratoryDirections: CareerDirection[] =
    algo.exploratoryCandidates.map((c, i) => ({
      rank: i + 4,
      title_zh: c.direction.title_zh,
      title_en: c.direction.title_en,
      matchScore: c.score.total,
      matchBreakdown: c.score.breakdown,
      whySuitable: "",
      challenges: "",
      explorationNote: getExplorationNoteTemplate(locale),
      alignedValues: c.direction.alignedValues,
      industries: c.direction.industries,
      crossCulturalFit: c.direction.crossCulturalFit,
      crossCulturalBarrierLevel: calculateBarrierLevel(
        c.direction.crossCulturalFit,
      ),
      aiEraCategory: c.direction.aiEraCategory,
      annotationConfidence: c.direction.annotationConfidence,
      marketOutlook: c.direction.marketOutlook,
      resilienceLevel: c.direction.resilienceLevel,
      jobZone: c.direction.jobZone ?? null,
      inTargetTier: c.inTargetTier,
      tierGap: c.tierGap,
    }));

  return {
    directions,
    exploratoryDirections,
    summary: "",
    idealDirections: [],
    aiEraDirections: [],
    realityImpact: { strengthened: [], weakened: [], newOpportunities: [] },
  };
}

/**
 * Assemble career match from algorithm + LLM narratives.
 * 3+2 architecture: 3 primary directions (deep LLM narratives) + 2 exploratory (algorithm-only).
 */
function assembleCareerMatch(
  algo: CareerMatchAlgorithmOutput,
  narratives: CareerMatchNarrativeOutput,
  locale: string,
): Panel1CareerMatch {
  // 3 primary directions with deep LLM narratives
  const directions: CareerDirection[] = algo.candidates.map((c, i) => ({
    rank: i + 1,
    title_zh: c.direction.title_zh,
    title_en: c.direction.title_en,
    matchScore: c.score.total,
    matchBreakdown: c.score.breakdown,
    whySuitable: narratives.directions[i]?.whySuitable ?? "",
    challenges: narratives.directions[i]?.challenges ?? "",
    explorationNote: getExplorationNoteTemplate(locale),
    alignedValues: c.direction.alignedValues,
    industries: c.direction.industries,
    crossCulturalFit: c.direction.crossCulturalFit,
    crossCulturalBarrierLevel: calculateBarrierLevel(
      c.direction.crossCulturalFit,
    ),
    aiEraCategory: c.direction.aiEraCategory,
    aiExposureScore: c.direction.aiExposureScore,
    aiImpactLabel: c.direction.aiImpactLabel,
    annotationConfidence: c.direction.annotationConfidence,
    actionableInsights: narratives.directions[i]?.actionableInsights,
    marketOutlook: c.direction.marketOutlook,
    resilienceLevel: c.direction.resilienceLevel,
    jobZone: c.direction.jobZone ?? null,
    inTargetTier: c.inTargetTier,
    tierGap: c.tierGap,
  }));

  // 2 exploratory directions — algorithm-only, lightweight reasons from MatchInsight
  const exploratoryDirections: CareerDirection[] =
    algo.exploratoryCandidates.map((c, i) => ({
      rank: i + 4, // rank continues after 3 primary
      title_zh: c.direction.title_zh,
      title_en: c.direction.title_en,
      matchScore: c.score.total,
      matchBreakdown: c.score.breakdown,
      whySuitable: buildAlgorithmicWhySuitable(c.insights, locale),
      challenges: "",
      explorationNote: getExplorationNoteTemplate(locale),
      alignedValues: c.direction.alignedValues,
      industries: c.direction.industries,
      crossCulturalFit: c.direction.crossCulturalFit,
      crossCulturalBarrierLevel: calculateBarrierLevel(
        c.direction.crossCulturalFit,
      ),
      aiEraCategory: c.direction.aiEraCategory,
      annotationConfidence: c.direction.annotationConfidence,
      marketOutlook: c.direction.marketOutlook,
      resilienceLevel: c.direction.resilienceLevel,
      jobZone: c.direction.jobZone ?? null,
      inTargetTier: c.inTargetTier,
      tierGap: c.tierGap,
    }));

  // Build ideal directions from unfiltered candidates (no LLM narratives for extra directions)
  const idealDirections: CareerDirection[] = algo.idealCandidates.map(
    (c, i) => ({
      rank: i + 1,
      title_zh: c.direction.title_zh,
      title_en: c.direction.title_en,
      matchScore: c.score.total,
      matchBreakdown: c.score.breakdown,
      // Reuse narrative from primary directions if same direction exists there
      whySuitable:
        directions.find((d) => d.title_en === c.direction.title_en)
          ?.whySuitable ?? "",
      challenges:
        directions.find((d) => d.title_en === c.direction.title_en)
          ?.challenges ?? "",
      explorationNote: getExplorationNoteTemplate(locale),
      alignedValues: c.direction.alignedValues,
      industries: c.direction.industries,
      crossCulturalFit: c.direction.crossCulturalFit,
      crossCulturalBarrierLevel: calculateBarrierLevel(
        c.direction.crossCulturalFit,
      ),
      aiEraCategory: c.direction.aiEraCategory,
      annotationConfidence: c.direction.annotationConfidence,
      actionableInsights: directions.find(
        (d) => d.title_en === c.direction.title_en,
      )?.actionableInsights,
      marketOutlook: c.direction.marketOutlook,
      resilienceLevel: c.direction.resilienceLevel,
      jobZone: c.direction.jobZone ?? null,
      inTargetTier: c.inTargetTier,
      tierGap: c.tierGap,
    }),
  );

  // Build AI-era opportunity directions (with LLM narratives when available)
  const aiEraNarratives = narratives.aiEraDirections ?? [];
  const aiEraDirections: CareerDirection[] = algo.aiEraCandidates.map(
    (c, i) => ({
      rank: i + 1,
      title_zh: c.direction.title_zh,
      title_en: c.direction.title_en,
      matchScore: c.score.total,
      matchBreakdown: c.score.breakdown,
      whySuitable: aiEraNarratives[i]?.whySuitable ?? "",
      challenges: aiEraNarratives[i]?.challenges ?? "",
      explorationNote: getExplorationNoteTemplate(locale),
      alignedValues: c.direction.alignedValues,
      industries: c.direction.industries,
      crossCulturalFit: c.direction.crossCulturalFit,
      crossCulturalBarrierLevel: calculateBarrierLevel(
        c.direction.crossCulturalFit,
      ),
      aiEraCategory: c.direction.aiEraCategory,
      annotationConfidence: c.direction.annotationConfidence,
      marketOutlook: c.direction.marketOutlook,
      resilienceLevel: c.direction.resilienceLevel,
      jobZone: c.direction.jobZone ?? null,
      inTargetTier: c.inTargetTier,
      tierGap: c.tierGap,
    }),
  );

  // Compute reality impact by comparing ideal vs filtered directions
  const realityImpact = computeRealityImpact(idealDirections, directions);

  return {
    directions,
    exploratoryDirections,
    summary: narratives.summary,
    idealDirections,
    aiEraDirections,
    realityImpact,
  };
}

// Re-export key functions for external use
export { buildReportHeader } from "./header";
export { buildPathwayPlaceholder } from "./career-pathway";
