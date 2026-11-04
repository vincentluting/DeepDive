// ============================================================
// Informed Consent — Research Participant Agreement
//
// Displayed before T0 (pre-experience) survey.
// User must check the consent box to proceed.
// Digital consent — no physical signature required.
//
// Based on UvA Faculty of Economics & Business ethics guidelines.
// Spec: Research_Survey_Final.md v5.2 (2026-04-06)
// ============================================================

export const RESEARCH_CONSENT = {
  en: {
    title: "Research Participation — Informed Consent",
    sections: [
      {
        heading: "About This Study",
        body: "You are invited to participate in a research study conducted by Ting Lu as part of the MBA in AI, Data & Analytics program at Amsterdam Business School, University of Amsterdam. This study examines users' experiences with an AI-powered career exploration platform and its association with career self-understanding. Your participation is voluntary.",
      },
      {
        heading: "What Will You Do?",
        body: "You have used an invite code to access the Deep Dive platform. Based on your invite code, you have already been randomly assigned to one of two presentation styles: 'classic' (a structured, question-by-question survey) or 'immersive' (a narrative-guided experience). The questions you answer are the same in both styles. After this Quick Dive section, you will continue to the longer Deep Dive assessment, then receive a personal profile, a personalized career report, and AI coaching — these later steps are identical for both groups. The full experience completes in a single session of approximately 60-80 minutes. You will complete three short surveys: one now, before you start the Quick Dive (~4 min); one immediately after the AI coaching (~9 min); and one approximately one week later (~4 min).",
      },
      {
        heading: "Data & Privacy",
        body: "Your survey responses will be stored securely and analyzed in aggregate. Your identity will not be revealed in any publication or report. The platform uses AI services to generate personalized career insights. Your assessment data is processed through their commercial API endpoints. Specifically: (1) OpenAI API: by default does not use API customer data to train models (verified April 2026); (2) Anthropic API: by default does not use commercial API inputs/outputs to train models unless explicitly opted in (verified April 2026); (3) Google Gemini API: under paid service terms with active billing, prompts and responses are not used to improve Google products (verified April 2026); Google retains abuse-monitoring and safety-logging rights per its terms of service. Survey data is stored on Neon (PostgreSQL) cloud infrastructure. The processing of your personal data is conducted in accordance with the General Data Protection Regulation (GDPR). You may request access to, correction of, or deletion of your data at any time.",
      },
      {
        heading: "Risks & Benefits",
        body: "This study involves minimal risk. Some career reflection questions may prompt personal introspection. As a benefit, you receive full access to the Deep Dive career exploration experience at no cost. In addition, you will receive a monetary compensation of €15 (or equivalent) upon completion of the full study (main session + one-week follow-up survey). Compensation is issued after T2 completion. If you withdraw before completing the full study, no compensation will be provided.",
      },
      {
        heading: "Your Rights",
        body: "Your participation is entirely voluntary. You may withdraw at any time without giving a reason and without any consequences. If you withdraw, your data will be deleted upon request. You have the right to access, correct, or request deletion of your personal data.",
      },
      {
        heading: "Contact",
        body: "For questions about this study, contact the researcher Ting Lu at vincentluting@gmail.com. This study is conducted as part of the MBA in AI, Data & Analytics program at Amsterdam Business School, University of Amsterdam.",
      },
    ],
    consentCheckbox:
      "I have read and understood the above information. I voluntarily agree to participate in this study and consent to the processing of my data as described.",
    proceedButton: "I Agree — Continue to Survey",
    declineButton: "I Do Not Wish to Participate",
  },
  zh: {
    title: "研究参与 — 知情同意书",
    sections: [
      {
        heading: "关于本研究",
        body: "您受邀参与一项由陆挺 (Ting Lu) 主持的研究项目，该项目是阿姆斯特丹大学 Amsterdam Business School MBA in AI, Data & Analytics 项目的一部分。本研究考察用户使用 AI 驱动的职业探索平台的体验及其与职业自我认知的关联。您的参与完全自愿。",
      },
      {
        heading: "您需要做什么？",
        body: "您已使用邀请码访问 Deep Dive 平台。根据您的邀请码，您已被随机分配到两种呈现方式之一：「经典」(classic, 结构化逐题问卷) 或「沉浸」(immersive, 叙事引导式体验)。两种方式回答的问题相同。完成 Quick Dive 部分后，您将继续进行更长的 Deep Dive 评测，随后获得个人档案、个性化职业报告和 AI 教练对话——这些后续步骤两组完全相同。整个体验在一次约 60-80 分钟的 session 中完成。您将完成三次简短问卷：现在一次，开始 Quick Dive 之前（约 4 分钟）；AI 教练结束后立即一次（约 9 分钟）；约一周后一次（约 4 分钟）。",
      },
      {
        heading: "数据与隐私",
        body: "您的问卷回答将被安全存储并以汇总形式分析。您的身份不会在任何出版物或报告中被披露。平台使用 AI 服务生成个性化职业洞察，您的评测数据通过其商用 API 端点处理。具体而言：(1) OpenAI API：默认不将 API 客户数据用于模型训练（2026 年 4 月核实）；(2) Anthropic API：默认不将商用 API 输入/输出用于模型训练，除非用户明确选择加入（2026 年 4 月核实）；(3) Google Gemini API：在付费服务条款下，提示和响应不用于改进 Google 产品（2026 年 4 月核实）；Google 保留滥用监控和安全日志记录的权利。问卷数据存储在 Neon (PostgreSQL) 云数据库中。您的个人数据处理遵循《通用数据保护条例》(GDPR)。您可以随时要求访问、更正或删除您的数据。",
      },
      {
        heading: "风险与收益",
        body: "本研究涉及的风险极低。部分职业反思问题可能引发个人思考。作为参与收益，您将免费获得 Deep Dive 职业探索体验的完整访问权限。此外，您将在完成全部研究流程（主体验 + 一周后回访问卷）后获得 €15（或等值货币）的参与补偿。补偿在 T2 完成后统一发放。若在完成全部流程前退出，则不发放补偿。",
      },
      {
        heading: "您的权利",
        body: "您的参与完全自愿。您可以在任何时候退出研究，无需说明理由，且不会产生任何后果。如果您退出，您的数据将在您要求后被删除。您有权访问、更正或要求删除您的个人数据。",
      },
      {
        heading: "联系方式",
        body: "如对本研究有任何疑问，请联系研究者陆挺，邮箱 vincentluting@gmail.com。本研究是阿姆斯特丹大学 Amsterdam Business School MBA in AI, Data & Analytics 项目的一部分。",
      },
    ],
    consentCheckbox:
      "我已阅读并理解以上信息。我自愿同意参与本研究，并同意按上述方式处理我的数据。",
    proceedButton: "我同意 — 继续填写问卷",
    declineButton: "我不希望参与",
  },
} as const;
