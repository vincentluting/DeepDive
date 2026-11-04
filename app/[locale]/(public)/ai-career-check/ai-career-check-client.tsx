"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Shield,
  AlertTriangle,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";

// ── Occupation AI Impact Data ─────────────────────────────────
// Sources: WEF Future of Jobs 2025, PwC AI Jobs Barometer,
// Brookings Institution, ILO Generative AI Index 2025, BLS 2025

interface OccupationEntry {
  id: string;
  name_en: string;
  name_zh: string;
  sector_en: string;
  sector_zh: string;
  /** 0-100: higher = more exposed to AI disruption */
  aiExposure: number;
  /** 0-100: higher = more ability to adapt */
  adaptability: number;
  tasksAtRisk_en: string[];
  tasksAtRisk_zh: string[];
  humanEdge_en: string;
  humanEdge_zh: string;
  aiEraMove_en: string;
  aiEraMove_zh: string;
}

const OCCUPATIONS: OccupationEntry[] = [
  {
    id: "sw-eng",
    name_en: "Software Engineer",
    name_zh: "软件工程师",
    sector_en: "Technology",
    sector_zh: "科技",
    aiExposure: 62,
    adaptability: 85,
    tasksAtRisk_en: [
      "Boilerplate code generation",
      "Code review for standard patterns",
      "Documentation writing",
      "Unit test generation",
    ],
    tasksAtRisk_zh: [
      "模板代码生成",
      "标准模式代码审查",
      "文档编写",
      "单元测试生成",
    ],
    humanEdge_en:
      "System architecture design, cross-team collaboration, understanding ambiguous requirements, creative problem-solving for novel challenges.",
    humanEdge_zh:
      "系统架构设计、跨团队协作、理解模糊需求、为新挑战创造性解决问题。",
    aiEraMove_en:
      "Become an AI-augmented architect — use AI to accelerate implementation while you focus on system design and stakeholder alignment.",
    aiEraMove_zh:
      "成为 AI 增强型架构师 — 用 AI 加速实现，你专注于系统设计和利益相关者对齐。",
  },
  {
    id: "data-analyst",
    name_en: "Data Analyst",
    name_zh: "数据分析师",
    sector_en: "Technology",
    sector_zh: "科技",
    aiExposure: 75,
    adaptability: 78,
    tasksAtRisk_en: [
      "Routine report generation",
      "Data cleaning and formatting",
      "Basic statistical analysis",
      "Dashboard creation",
    ],
    tasksAtRisk_zh: [
      "常规报告生成",
      "数据清洗和格式化",
      "基础统计分析",
      "仪表盘创建",
    ],
    humanEdge_en:
      "Asking the right questions, interpreting results in business context, stakeholder storytelling, identifying causal relationships.",
    humanEdge_zh:
      "提出正确的问题、在业务背景下解读结果、向利益相关者讲故事、识别因果关系。",
    aiEraMove_en:
      "Evolve into a decision scientist — let AI handle data crunching while you focus on framing problems and translating insights into action.",
    aiEraMove_zh:
      "进化为决策科学家 — 让 AI 处理数据运算，你专注于问题框架和将洞察转化为行动。",
  },
  {
    id: "marketing-mgr",
    name_en: "Marketing Manager",
    name_zh: "市场营销经理",
    sector_en: "Marketing",
    sector_zh: "市场营销",
    aiExposure: 58,
    adaptability: 72,
    tasksAtRisk_en: [
      "Ad copy drafting",
      "Social media scheduling",
      "A/B test setup",
      "Market research compilation",
    ],
    tasksAtRisk_zh: [
      "广告文案起草",
      "社交媒体排期",
      "A/B 测试设置",
      "市场调研汇编",
    ],
    humanEdge_en:
      "Brand strategy, emotional storytelling, cultural sensitivity, building authentic community relationships.",
    humanEdge_zh: "品牌战略、情感叙事、文化敏感度、建立真实的社群关系。",
    aiEraMove_en:
      "Become a brand strategist who uses AI for execution velocity — your cultural intuition and creative judgment are irreplaceable.",
    aiEraMove_zh:
      "成为用 AI 加速执行的品牌战略师 — 你的文化直觉和创意判断不可替代。",
  },
  {
    id: "accountant",
    name_en: "Accountant",
    name_zh: "会计师",
    sector_en: "Finance",
    sector_zh: "金融",
    aiExposure: 80,
    adaptability: 65,
    tasksAtRisk_en: [
      "Transaction categorization",
      "Invoice processing",
      "Tax form preparation",
      "Routine auditing",
    ],
    tasksAtRisk_zh: ["交易分类", "发票处理", "税表准备", "常规审计"],
    humanEdge_en:
      "Complex tax strategy, client relationship management, fraud detection judgment, regulatory interpretation in ambiguous situations.",
    humanEdge_zh:
      "复杂税务策略、客户关系管理、欺诈检测判断、模糊情况下的法规解读。",
    aiEraMove_en:
      "Transition to strategic financial advisor — AI handles compliance and processing, you provide judgment and trust.",
    aiEraMove_zh:
      "转型为战略财务顾问 — AI 处理合规和流程，你提供判断力和信任。",
  },
  {
    id: "graphic-designer",
    name_en: "Graphic Designer",
    name_zh: "平面设计师",
    sector_en: "Creative",
    sector_zh: "创意",
    aiExposure: 65,
    adaptability: 70,
    tasksAtRisk_en: [
      "Template-based designs",
      "Image resizing and formatting",
      "Stock asset selection",
      "Basic mockups",
    ],
    tasksAtRisk_zh: [
      "模板化设计",
      "图片尺寸调整和格式化",
      "素材选择",
      "基础原型",
    ],
    humanEdge_en:
      "Original concept development, brand identity creation, emotional resonance in visual storytelling, client collaboration.",
    humanEdge_zh:
      "原创概念开发、品牌视觉识别创建、视觉叙事中的情感共鸣、客户协作。",
    aiEraMove_en:
      "Become an AI-augmented creative director — use AI for rapid iteration while you define the creative vision.",
    aiEraMove_zh: "成为 AI 增强型创意总监 — 用 AI 快速迭代，你定义创意方向。",
  },
  {
    id: "teacher",
    name_en: "Teacher / Educator",
    name_zh: "教师 / 教育工作者",
    sector_en: "Education",
    sector_zh: "教育",
    aiExposure: 35,
    adaptability: 60,
    tasksAtRisk_en: [
      "Grading standardized tests",
      "Lesson plan drafting",
      "Administrative paperwork",
      "Content summarization",
    ],
    tasksAtRisk_zh: ["标准化考试批改", "教案起草", "行政文书", "内容摘要"],
    humanEdge_en:
      "Emotional support, mentorship, adapting to individual learning needs, classroom management, inspiring curiosity.",
    humanEdge_zh: "情感支持、指导、适应个体学习需求、课堂管理、激发好奇心。",
    aiEraMove_en:
      "Become a learning experience designer — use AI to personalize content while you focus on the human connection that transforms students.",
    aiEraMove_zh:
      "成为学习体验设计师 — 用 AI 个性化内容，你专注于改变学生的人际连接。",
  },
  {
    id: "nurse",
    name_en: "Nurse",
    name_zh: "护士",
    sector_en: "Healthcare",
    sector_zh: "医疗",
    aiExposure: 20,
    adaptability: 55,
    tasksAtRisk_en: [
      "Medical record documentation",
      "Medication scheduling",
      "Vital sign monitoring (via sensors)",
    ],
    tasksAtRisk_zh: ["病历记录", "用药排期", "生命体征监测（传感器辅助）"],
    humanEdge_en:
      "Patient comfort, clinical judgment in emergencies, empathetic communication, physical caregiving, team coordination.",
    humanEdge_zh:
      "患者安慰、紧急情况下的临床判断、共情沟通、身体护理、团队协调。",
    aiEraMove_en:
      "Your role is AI-resilient. Use AI tools for documentation efficiency so you can spend more time on what matters most — patient care.",
    aiEraMove_zh:
      "你的职业具有 AI 韧性。用 AI 工具提高文档效率，把更多时间花在最重要的事上 — 照顾患者。",
  },
  {
    id: "lawyer",
    name_en: "Lawyer",
    name_zh: "律师",
    sector_en: "Legal",
    sector_zh: "法律",
    aiExposure: 55,
    adaptability: 75,
    tasksAtRisk_en: [
      "Legal research",
      "Document review",
      "Contract drafting from templates",
      "Case law summarization",
    ],
    tasksAtRisk_zh: ["法律检索", "文件审查", "模板合同起草", "判例法总结"],
    humanEdge_en:
      "Courtroom advocacy, client counseling, complex negotiation, ethical judgment, creative legal strategy.",
    humanEdge_zh: "法庭辩护、客户咨询、复杂谈判、伦理判断、创造性法律策略。",
    aiEraMove_en:
      "Use AI to 10x your research speed and focus on the strategic, persuasive, and relational aspects where you excel.",
    aiEraMove_zh:
      "用 AI 将你的检索速度提升 10 倍，专注于你擅长的战略、说服和关系方面。",
  },
  {
    id: "hr-specialist",
    name_en: "HR Specialist",
    name_zh: "人力资源专员",
    sector_en: "Human Resources",
    sector_zh: "人力资源",
    aiExposure: 60,
    adaptability: 68,
    tasksAtRisk_en: [
      "Resume screening",
      "Interview scheduling",
      "Benefits administration",
      "Onboarding documentation",
    ],
    tasksAtRisk_zh: ["简历筛选", "面试排期", "福利管理", "入职文档"],
    humanEdge_en:
      "Culture building, conflict resolution, employee coaching, organizational development, sensitive conversations.",
    humanEdge_zh: "文化建设、冲突解决、员工辅导、组织发展、敏感对话。",
    aiEraMove_en:
      "Evolve into a people strategist — let AI handle administration while you focus on the human dynamics that drive organizational success.",
    aiEraMove_zh:
      "进化为人才战略师 — 让 AI 处理行政事务，你专注于驱动组织成功的人际动态。",
  },
  {
    id: "sales-rep",
    name_en: "Sales Representative",
    name_zh: "销售代表",
    sector_en: "Sales",
    sector_zh: "销售",
    aiExposure: 45,
    adaptability: 70,
    tasksAtRisk_en: [
      "Lead qualification",
      "Email outreach drafting",
      "CRM data entry",
      "Proposal templating",
    ],
    tasksAtRisk_zh: ["线索筛选", "外联邮件起草", "CRM 数据录入", "提案模板"],
    humanEdge_en:
      "Relationship building, reading customer emotions, complex deal negotiation, trust establishment, handling objections.",
    humanEdge_zh: "关系建立、读取客户情绪、复杂交易谈判、建立信任、处理异议。",
    aiEraMove_en:
      "Become an AI-powered relationship expert — use AI for prospecting and preparation, excel in the human moments that close deals.",
    aiEraMove_zh:
      "成为 AI 驱动的关系专家 — 用 AI 做发掘和准备工作，在促成交易的人际关键时刻发挥优势。",
  },
  {
    id: "customer-svc",
    name_en: "Customer Service Agent",
    name_zh: "客服专员",
    sector_en: "Service",
    sector_zh: "服务",
    aiExposure: 82,
    adaptability: 55,
    tasksAtRisk_en: [
      "FAQ responses",
      "Order status queries",
      "Ticket routing",
      "Standard complaint resolution",
    ],
    tasksAtRisk_zh: ["FAQ 回复", "订单状态查询", "工单分配", "标准投诉处理"],
    humanEdge_en:
      "Empathetic de-escalation, complex problem resolution, building customer loyalty, handling emotionally charged situations.",
    humanEdge_zh: "共情安抚、复杂问题解决、建立客户忠诚度、处理情绪化场景。",
    aiEraMove_en:
      "Transition to customer experience specialist — focus on the complex, emotional interactions that create loyal advocates.",
    aiEraMove_zh: "转型为客户体验专家 — 专注于创造忠实拥护者的复杂、情感互动。",
  },
  {
    id: "electrician",
    name_en: "Electrician",
    name_zh: "电工",
    sector_en: "Skilled Trades",
    sector_zh: "技术工种",
    aiExposure: 12,
    adaptability: 50,
    tasksAtRisk_en: ["Routine inspection logging", "Parts inventory tracking"],
    tasksAtRisk_zh: ["常规检查记录", "零件库存跟踪"],
    humanEdge_en:
      "Physical diagnosis and repair, navigating unpredictable environments, safety judgment, on-site problem-solving.",
    humanEdge_zh: "物理诊断和修复、应对不可预测环境、安全判断、现场问题解决。",
    aiEraMove_en:
      "Your trade is among the most AI-resilient. Consider specializing in smart home / EV charging systems — growing 11% annually.",
    aiEraMove_zh:
      "你的行业是最具 AI 韧性的领域之一。考虑专注于智能家居/电动车充电系统 — 年增长 11%。",
  },
  {
    id: "product-mgr",
    name_en: "Product Manager",
    name_zh: "产品经理",
    sector_en: "Technology",
    sector_zh: "科技",
    aiExposure: 48,
    adaptability: 82,
    tasksAtRisk_en: [
      "User research synthesis",
      "Competitive analysis drafting",
      "PRD writing",
      "Metrics dashboard setup",
    ],
    tasksAtRisk_zh: [
      "用户调研整理",
      "竞品分析起草",
      "PRD 编写",
      "指标仪表盘搭建",
    ],
    humanEdge_en:
      "Product vision, cross-functional leadership, customer empathy, prioritization under ambiguity, stakeholder alignment.",
    humanEdge_zh:
      "产品愿景、跨职能领导力、客户同理心、模糊条件下的优先级排序、利益相关者对齐。",
    aiEraMove_en:
      "Become an AI product strategist — understand how AI changes user needs and lead teams in building AI-augmented products.",
    aiEraMove_zh:
      "成为 AI 产品战略师 — 理解 AI 如何改变用户需求，领导团队构建 AI 增强型产品。",
  },
  {
    id: "writer",
    name_en: "Content Writer / Copywriter",
    name_zh: "内容写手 / 文案",
    sector_en: "Creative",
    sector_zh: "创意",
    aiExposure: 72,
    adaptability: 70,
    tasksAtRisk_en: [
      "SEO blog posts",
      "Product descriptions",
      "Social media captions",
      "Email newsletter drafts",
    ],
    tasksAtRisk_zh: [
      "SEO 博客文章",
      "产品描述",
      "社交媒体标题",
      "邮件通讯初稿",
    ],
    humanEdge_en:
      "Original storytelling, brand voice development, emotional connection, cultural nuance, investigative journalism.",
    humanEdge_zh: "原创叙事、品牌声音塑造、情感连接、文化细微差别、深度调查。",
    aiEraMove_en:
      "Elevate to narrative strategist — use AI for first drafts and research, make your unique voice and depth the differentiator.",
    aiEraMove_zh:
      "升级为叙事战略师 — 用 AI 完成初稿和调研，让你的独特声音和深度成为差异化优势。",
  },
  {
    id: "consultant",
    name_en: "Management Consultant",
    name_zh: "管理咨询师",
    sector_en: "Professional Services",
    sector_zh: "专业服务",
    aiExposure: 50,
    adaptability: 80,
    tasksAtRisk_en: [
      "Market sizing calculations",
      "Slide deck formatting",
      "Data compilation for cases",
      "Benchmarking research",
    ],
    tasksAtRisk_zh: ["市场规模测算", "幻灯片排版", "案例数据整理", "标杆调研"],
    humanEdge_en:
      "Client relationship, executive influence, organizational change management, synthesizing ambiguous information into strategy.",
    humanEdge_zh: "客户关系、高管影响力、组织变革管理、将模糊信息综合为战略。",
    aiEraMove_en:
      "AI makes you faster, not obsolete. Focus on the trust-based advisory work that clients pay premium for.",
    aiEraMove_zh:
      "AI 让你更快，而不是过时。专注于客户愿意为之支付溢价的基于信任的咨询工作。",
  },
];

type OccupationLocalizedView = {
  name: string;
  sector: string;
  tasksAtRisk: string[];
  humanEdge: string;
  aiEraMove: string;
};

const OCCUPATION_NL: Record<string, OccupationLocalizedView> = {
  "sw-eng": {
    name: "Software engineer",
    sector: "Technologie",
    tasksAtRisk: [
      "Genereren van standaardcode",
      "Codebeoordeling voor standaardpatronen",
      "Documentatie schrijven",
      "Unit tests genereren",
    ],
    humanEdge:
      "Systeemarchitectuur ontwerpen, samenwerken tussen teams, dubbelzinnige eisen begrijpen en creatieve oplossingen vinden voor nieuwe uitdagingen.",
    aiEraMove:
      "Word een AI-versterkte architect — gebruik AI om implementatie te versnellen terwijl jij focust op systeemontwerp en afstemming met stakeholders.",
  },
  "data-analyst": {
    name: "Data-analist",
    sector: "Technologie",
    tasksAtRisk: [
      "Routinematige rapportage",
      "Data opschonen en formatteren",
      "Basisstatistische analyses",
      "Dashboards maken",
    ],
    humanEdge:
      "De juiste vragen stellen, resultaten in bedrijfscontext interpreteren, inzichten overtuigend vertellen en causale verbanden herkennen.",
    aiEraMove:
      "Groei door naar beslissingswetenschapper — laat AI het rekenwerk doen terwijl jij problemen kadert en inzichten vertaalt naar actie.",
  },
  "marketing-mgr": {
    name: "Marketingmanager",
    sector: "Marketing",
    tasksAtRisk: [
      "Advertentieteksten opstellen",
      "Socialmediaplanning",
      "A/B-tests opzetten",
      "Marktonderzoek samenstellen",
    ],
    humanEdge:
      "Merkstrategie, emotionele storytelling, culturele sensitiviteit en authentieke relaties met communities bouwen.",
    aiEraMove:
      "Word een merkstrateeg die AI gebruikt voor uitvoeringssnelheid — jouw culturele intuïtie en creatieve oordeel blijven onvervangbaar.",
  },
  accountant: {
    name: "Accountant",
    sector: "Financiën",
    tasksAtRisk: [
      "Transacties categoriseren",
      "Facturen verwerken",
      "Belastingformulieren voorbereiden",
      "Routinematige audits",
    ],
    humanEdge:
      "Complexe belastingstrategie, klantrelaties, fraude-inschatting en regelgeving interpreteren in ambigue situaties.",
    aiEraMove:
      "Schakel door naar strategisch financieel adviseur — AI handelt compliance en verwerking af, jij levert oordeel en vertrouwen.",
  },
  "graphic-designer": {
    name: "Grafisch ontwerper",
    sector: "Creatief",
    tasksAtRisk: [
      "Template-gebaseerde ontwerpen",
      "Afbeeldingen schalen en formatteren",
      "Stockmateriaal selecteren",
      "Basale mock-ups",
    ],
    humanEdge:
      "Originele conceptontwikkeling, merkidentiteit creëren, emotionele resonantie in visuele verhalen en klantcollaboratie.",
    aiEraMove:
      "Word een AI-versterkte creative director — gebruik AI voor snelle iteratie terwijl jij de creatieve visie bepaalt.",
  },
  teacher: {
    name: "Docent / opleider",
    sector: "Onderwijs",
    tasksAtRisk: [
      "Gestandaardiseerde toetsen nakijken",
      "Lesplannen opstellen",
      "Administratief papierwerk",
      "Inhoud samenvatten",
    ],
    humanEdge:
      "Emotionele steun, mentorschap, inspelen op individuele leerbehoeften, klassenmanagement en nieuwsgierigheid aanwakkeren.",
    aiEraMove:
      "Word ontwerper van leerervaringen — gebruik AI om inhoud te personaliseren terwijl jij focust op de menselijke verbinding die leerlingen verandert.",
  },
  nurse: {
    name: "Verpleegkundige",
    sector: "Zorg",
    tasksAtRisk: [
      "Medische dossiers documenteren",
      "Medicatieschema's plannen",
      "Vitale functies monitoren via sensoren",
    ],
    humanEdge:
      "Patiëntcomfort, klinisch oordeel in noodsituaties, empathische communicatie, fysieke zorg en teamcoördinatie.",
    aiEraMove:
      "Je rol is AI-bestendig. Gebruik AI-tools voor efficiëntere documentatie, zodat je meer tijd hebt voor wat het belangrijkst is: patiëntenzorg.",
  },
  lawyer: {
    name: "Jurist",
    sector: "Recht",
    tasksAtRisk: [
      "Juridisch onderzoek",
      "Documentreview",
      "Contracten opstellen op basis van templates",
      "Jurisprudentie samenvatten",
    ],
    humanEdge:
      "Pleiten, cliënten adviseren, complexe onderhandelingen, ethisch oordeel en creatieve juridische strategie.",
    aiEraMove:
      "Gebruik AI om je onderzoeksnelheid sterk te verhogen en focus op de strategische, overtuigende en relationele aspecten waarin jij uitblinkt.",
  },
  "hr-specialist": {
    name: "HR-specialist",
    sector: "Human resources",
    tasksAtRisk: [
      "Cv's screenen",
      "Sollicitatiegesprekken plannen",
      "Arbeidsvoorwaarden beheren",
      "Onboardingdocumentatie",
    ],
    humanEdge:
      "Cultuur bouwen, conflicten oplossen, medewerkers coachen, organisatieontwikkeling en gevoelige gesprekken voeren.",
    aiEraMove:
      "Groei door naar people strategist — laat AI administratie doen terwijl jij focust op de menselijke dynamiek die organisaties laat slagen.",
  },
  "sales-rep": {
    name: "Salesmedewerker",
    sector: "Sales",
    tasksAtRisk: [
      "Leads kwalificeren",
      "Outreach-e-mails opstellen",
      "CRM-gegevens invoeren",
      "Voorstellen templatiseren",
    ],
    humanEdge:
      "Relaties bouwen, klantemoties lezen, complexe deals onderhandelen, vertrouwen opbouwen en bezwaren hanteren.",
    aiEraMove:
      "Word een AI-gedreven relatie-expert — gebruik AI voor prospecting en voorbereiding, en blink uit in de menselijke momenten die deals sluiten.",
  },
  "customer-svc": {
    name: "Klantenservicemedewerker",
    sector: "Dienstverlening",
    tasksAtRisk: [
      "FAQ-antwoorden",
      "Vragen over orderstatus",
      "Tickets routeren",
      "Standaardklachten oplossen",
    ],
    humanEdge:
      "Empathisch de-escaleren, complexe problemen oplossen, klantloyaliteit bouwen en emotioneel beladen situaties hanteren.",
    aiEraMove:
      "Schakel door naar customer experience specialist — focus op de complexe, emotionele interacties die trouwe ambassadeurs creëren.",
  },
  electrician: {
    name: "Elektricien",
    sector: "Vakwerk",
    tasksAtRisk: [
      "Routinematige inspectielogs",
      "Onderdelenvoorraad bijhouden",
    ],
    humanEdge:
      "Fysieke diagnose en reparatie, navigeren in onvoorspelbare omgevingen, veiligheidsoordeel en problemen ter plekke oplossen.",
    aiEraMove:
      "Je vak behoort tot de meest AI-bestendige. Overweeg specialisatie in smart home- of EV-laadsystemen — een markt die jaarlijks sterk groeit.",
  },
  "product-mgr": {
    name: "Productmanager",
    sector: "Technologie",
    tasksAtRisk: [
      "Gebruikersonderzoek samenvatten",
      "Concurrentieanalyse opstellen",
      "PRD's schrijven",
      "Metricsdashboards opzetten",
    ],
    humanEdge:
      "Productvisie, crossfunctioneel leiderschap, klantempathie, prioriteren onder onzekerheid en stakeholders op één lijn krijgen.",
    aiEraMove:
      "Word AI-productstrateeg — begrijp hoe AI gebruikersbehoeften verandert en leid teams bij het bouwen van AI-versterkte producten.",
  },
  writer: {
    name: "Contentschrijver / copywriter",
    sector: "Creatief",
    tasksAtRisk: [
      "SEO-blogposts",
      "Productbeschrijvingen",
      "Socialmediacaptions",
      "Nieuwsbriefconcepten",
    ],
    humanEdge:
      "Originele storytelling, merkstem ontwikkelen, emotionele verbinding, culturele nuance en onderzoeksjournalistiek.",
    aiEraMove:
      "Groei naar narratief strateeg — gebruik AI voor eerste concepten en onderzoek, en maak je unieke stem en diepgang het verschil.",
  },
  consultant: {
    name: "Managementconsultant",
    sector: "Professionele dienstverlening",
    tasksAtRisk: [
      "Marktomvang berekenen",
      "Slide decks formatteren",
      "Data voor cases verzamelen",
      "Benchmarkonderzoek",
    ],
    humanEdge:
      "Klantrelaties, invloed op executives, organisatieverandering begeleiden en ambigue informatie synthetiseren tot strategie.",
    aiEraMove:
      "AI maakt je sneller, niet overbodig. Focus op het vertrouwensgerichte advieswerk waarvoor klanten graag extra betalen.",
  },
};

function getOccupationView(
  occupation: OccupationEntry,
  locale: Locale,
): OccupationLocalizedView {
  if (locale === "zh") {
    return {
      name: occupation.name_zh,
      sector: occupation.sector_zh,
      tasksAtRisk: occupation.tasksAtRisk_zh,
      humanEdge: occupation.humanEdge_zh,
      aiEraMove: occupation.aiEraMove_zh,
    };
  }
  if (locale === "nl") {
    return OCCUPATION_NL[occupation.id];
  }
  return {
    name: occupation.name_en,
    sector: occupation.sector_en,
    tasksAtRisk: occupation.tasksAtRisk_en,
    humanEdge: occupation.humanEdge_en,
    aiEraMove: occupation.aiEraMove_en,
  };
}

// ── Component ──────────────────────────────────────────────────

function getExposureLevel(
  score: number,
  t: Record<string, string>,
): { label: string; color: string } {
  if (score >= 70)
    return { label: t.exposureHigh, color: "text-red-600 dark:text-red-400" };
  if (score >= 40)
    return {
      label: t.exposureModerate,
      color: "text-amber-700 dark:text-amber-300",
    };
  return {
    label: t.exposureLow,
    color: "text-emerald-700 dark:text-emerald-300",
  };
}

function getAdaptabilityLevel(
  score: number,
  t: Record<string, string>,
): { label: string; color: string } {
  if (score >= 70)
    return {
      label: t.adaptabilityHigh,
      color: "text-emerald-700 dark:text-emerald-300",
    };
  if (score >= 50)
    return {
      label: t.adaptabilityModerate,
      color: "text-amber-700 dark:text-amber-300",
    };
  return {
    label: t.adaptabilityNeedsDev,
    color: "text-red-600 dark:text-red-400",
  };
}

interface Props {
  locale: string;
}

export function AiCareerCheckClient({ locale }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<OccupationEntry | null>(null);
  const loc = locale as Locale;
  const t = getDictionaryClient(locale as Locale).aiCareerCheck;

  const filtered = useMemo(() => {
    if (!query.trim()) return OCCUPATIONS;
    const q = query.toLowerCase();
    return OCCUPATIONS.filter((o) => {
      const nl = OCCUPATION_NL[o.id];
      return (
        o.name_en.toLowerCase().includes(q) ||
        o.name_zh.includes(q) ||
        nl.name.toLowerCase().includes(q) ||
        o.sector_en.toLowerCase().includes(q) ||
        o.sector_zh.includes(q) ||
        nl.sector.toLowerCase().includes(q)
      );
    });
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 lg:py-20">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-md-sea/10 dark:bg-md-sea/15 text-md-sea px-3 py-1.5 rounded-full text-xs font-medium mb-4">
          <Sparkles size={14} />
          {t.badge}
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-3">
          {t.title}
        </h1>
        <p className="text-muted-foreground text-sm lg:text-base max-w-lg mx-auto">
          {t.subtitle}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          data-testid="ai-career-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder={t.searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-md-sea/30 focus:border-md-sea"
        />
      </div>

      {/* Occupation list / Results */}
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="space-y-5"
          >
            {/* Back button */}
            <button
              data-testid="ai-career-back"
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.backToList}
            </button>

            {/* Title + scores */}
            <div className="rounded-2xl border border-border p-5 lg:p-7">
              <h2 className="text-xl font-bold text-foreground mb-1">
                {getOccupationView(selected, loc).name}
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                {getOccupationView(selected, loc).sector}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-5">
                {/* AI Exposure */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t.aiExposureLabel}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {selected.aiExposure}
                    </span>
                    <span
                      className={`text-xs font-medium ${getExposureLevel(selected.aiExposure, t).color}`}
                    >
                      {getExposureLevel(selected.aiExposure, t).label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
                    <div
                      className="h-full rounded-full bg-red-400"
                      style={{ width: `${selected.aiExposure}%` }}
                    />
                  </div>
                </div>
                {/* Adaptability */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {t.adaptabilityLabel}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {selected.adaptability}
                    </span>
                    <span
                      className={`text-xs font-medium ${getAdaptabilityLevel(selected.adaptability, t).color}`}
                    >
                      {getAdaptabilityLevel(selected.adaptability, t).label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted mt-1.5">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${selected.adaptability}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks at risk */}
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-amber-500"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1.5">
                    {t.tasksAtRisk}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {getOccupationView(selected, loc).tasksAtRisk.map(
                      (task) => (
                        <li key={task} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                          {task}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              {/* Human edge */}
              <div className="flex items-start gap-3 mb-4">
                <Shield
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-emerald-500"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 mb-1.5">
                    {t.humanEdge}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {getOccupationView(selected, loc).humanEdge}
                  </p>
                </div>
              </div>

              {/* AI-era move */}
              <div className="flex items-start gap-3">
                <Compass
                  size={15}
                  className="mt-0.5 flex-shrink-0 text-md-sea"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-md-sea mb-1.5">
                    {t.aiEraMove}
                  </p>
                  <p className="text-sm text-foreground/85 leading-relaxed font-medium">
                    {getOccupationView(selected, loc).aiEraMove}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-2xl border border-md-sea/20 bg-md-sea/5 dark:bg-md-sea/10 dark:border-md-sea/25 p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">{t.ctaText}</p>
              <Link
                data-testid="ai-career-quickdive-cta"
                href={`/${locale}/quickdive`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {t.ctaButton}
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Source */}
            <p className="text-[10px] text-muted-foreground/60 text-center">
              {t.source}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                {t.noResults}
              </p>
            ) : (
              filtered.map((occ) => {
                const exposure = getExposureLevel(occ.aiExposure, t);
                const occView = getOccupationView(occ, loc);
                return (
                  <button
                    data-testid={`ai-career-occupation-${occ.id}`}
                    key={occ.id}
                    onClick={() => setSelected(occ)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:border-md-sea/40 hover:bg-md-sea/5 dark:hover:bg-md-sea/10 transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {occView.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {occView.sector}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {t.listExposureLabel}
                        </p>
                        <p
                          className={`text-sm font-semibold ${exposure.color}`}
                        >
                          {occ.aiExposure}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
