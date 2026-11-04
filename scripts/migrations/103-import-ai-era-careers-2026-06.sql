-- Migration 103: Import 48 AI-era career directions (2026-06 batch).
--
-- Source: ai-era-careers-import-2026-06.csv (curated 2026-06-11, web research:
-- WEF Future of Jobs 2025, Mercor/Eightfold 2026 hiring data, 人社部 2025 新工种).
-- Three clusters: business/management (18), cross-functional (18), frontier (12).
-- All rows: source=emerging, annotationSource=ai-assisted,
-- annotationConfidence=expert-estimated, industries use canonical vocabulary ids
-- (requires migration 102 to have normalized the rest of the library first).
-- marketOutlook.trend normalized from CSV draft value "rising" to "growing"
-- (TS enum: growing|stable|transforming|emerging).
-- jobZone/resilienceLevel intentionally NULL — backfill via
-- scripts/backfill-career-job-zone-llm.ts as a follow-up.
--
-- Rollback (short window, before reports reference these rows):
--   DELETE FROM "CareerDirection" WHERE id IN (SELECT ... 48 ids below);
-- After reports exist: UPDATE ... SET "isActive" = FALSE instead.

BEGIN;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-transformation-director', 'emerging', 'AI Transformation Director', 'AI转型总监', '统筹企业级AI转型战略、组织设计与落地路线图',
  '{"R":20,"I":55,"A":35,"S":55,"E":85,"C":50}'::jsonb, ARRAY['achievement','power','self-direction']::text[], '{"openness":{"min":60,"max":100},"extraversion":{"min":55,"max":100},"conscientiousness":{"min":60,"max":100}}'::jsonb, ARRAY['consulting','technology','finance']::text[], ARRAY['bridge','integrate']::text[],
  8, 25, ARRAY['ai-transformation','strategy','change-management','leadership','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-enablement-lead', 'emerging', 'AI Enablement Lead', 'AI赋能与采用负责人', '设计企业内部AI培训、推广与采用体系，弥合技能差距',
  '{"R":15,"I":45,"A":40,"S":75,"E":70,"C":45}'::jsonb, ARRAY['benevolence','achievement','stimulation']::text[], '{"extraversion":{"min":55,"max":100},"agreeableness":{"min":55,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['technology','hr','consulting']::text[], ARRAY['integrate','bridge']::text[],
  3, 15, ARRAY['ai-adoption','enablement','training','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-agent-manager', 'emerging', 'AI Agent Manager', 'AI智能体团队经理', '管理人类与AI智能体混合团队的任务分配、监督与质量',
  '{"R":25,"I":50,"A":25,"S":60,"E":75,"C":65}'::jsonb, ARRAY['achievement','security','conformity']::text[], '{"conscientiousness":{"min":60,"max":100},"extraversion":{"min":50,"max":100},"neuroticism":{"min":0,"max":55}}'::jsonb, ARRAY['technology','ai_ml','logistics']::text[], ARRAY['integrate']::text[],
  3, 15, ARRAY['agent-management','human-ai-teaming','operations','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-workforce-planner', 'emerging', 'AI Workforce Planning Manager', '人机协同编制规划经理', '规划组织中人类岗位与AI智能体的最优配比与转岗路径',
  '{"R":15,"I":60,"A":30,"S":65,"E":65,"C":60}'::jsonb, ARRAY['achievement','benevolence','security']::text[], '{"openness":{"min":55,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['hr','consulting','technology']::text[], ARRAY['bridge','integrate']::text[],
  5, 20, ARRAY['workforce-planning','org-design','people-analytics','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-finops-manager', 'emerging', 'AI FinOps Manager', 'AI成本与FinOps经理', '管理企业LLM与算力支出，优化AI投入产出比',
  '{"R":20,"I":60,"A":15,"S":35,"E":60,"C":85}'::jsonb, ARRAY['security','achievement','conformity']::text[], '{"conscientiousness":{"min":70,"max":100},"openness":{"min":45,"max":90}}'::jsonb, ARRAY['finance','technology','accounting']::text[], ARRAY['global']::text[],
  3, 15, ARRAY['finops','cost-optimization','llm-economics','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-investment-analyst', 'emerging', 'AI Sector Investment Analyst', 'AI赛道投资分析师', '评估AI初创公司、技术路线与商业模式的投资价值',
  '{"R":10,"I":80,"A":25,"S":30,"E":65,"C":60}'::jsonb, ARRAY['achievement','power','stimulation']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['investment','fintech','ai_ml']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['venture-capital','ai-evaluation','market-analysis','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-risk-manager', 'emerging', 'Enterprise AI Risk Manager', '企业AI风险管理经理', '识别、量化并缓解AI系统带来的业务、声誉与合规风险',
  '{"R":15,"I":70,"A":20,"S":45,"E":55,"C":80}'::jsonb, ARRAY['security','conformity','universalism']::text[], '{"conscientiousness":{"min":65,"max":100},"neuroticism":{"min":0,"max":55}}'::jsonb, ARRAY['finance','insurance','consulting']::text[], ARRAY['global','bridge']::text[],
  4, 18, ARRAY['ai-risk','model-risk','compliance','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-compliance-auditor', 'emerging', 'AI Auditor', 'AI审计师', '依据AI法案与行业标准对AI系统进行独立审计与认证',
  '{"R":15,"I":70,"A":15,"S":40,"E":45,"C":90}'::jsonb, ARRAY['conformity','security','universalism']::text[], '{"conscientiousness":{"min":70,"max":100},"openness":{"min":50,"max":95}}'::jsonb, ARRAY['accounting','legal','consulting']::text[], ARRAY['global']::text[],
  3, 15, ARRAY['ai-audit','eu-ai-act','assurance','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-product-marketing-manager', 'emerging', 'AI Product Marketing Manager', 'AI产品营销经理', '制定AI产品的定位、信息传递与上市(GTM)策略',
  '{"R":10,"I":45,"A":60,"S":50,"E":80,"C":45}'::jsonb, ARRAY['achievement','stimulation','hedonism']::text[], '{"extraversion":{"min":55,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['marketing','technology','media']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['product-marketing','gtm','positioning','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-customer-success', 'emerging', 'AI Customer Success Manager', 'AI客户成功经理', '帮助企业客户用好AI产品，实现价值落地与续约增长',
  '{"R":10,"I":40,"A":30,"S":80,"E":75,"C":50}'::jsonb, ARRAY['benevolence','achievement','security']::text[], '{"agreeableness":{"min":55,"max":100},"extraversion":{"min":55,"max":100}}'::jsonb, ARRAY['technology','consulting','retail']::text[], ARRAY['bridge']::text[],
  1, 10, ARRAY['customer-success','saas','relationship','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-partnerships-manager', 'emerging', 'AI Ecosystem Partnerships Manager', 'AI生态合作经理', '构建模型厂商、云平台与行业伙伴的合作与渠道网络',
  '{"R":10,"I":40,"A":35,"S":65,"E":85,"C":40}'::jsonb, ARRAY['power','achievement','stimulation']::text[], '{"extraversion":{"min":65,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['technology','telecom','media']::text[], ARRAY['global','bridge']::text[],
  4, 15, ARRAY['partnerships','bizdev','ecosystem','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-pricing-strategist', 'emerging', 'AI Pricing Strategist', 'AI定价策略师', '为AI产品与智能体服务设计基于结果与用量的定价模型',
  '{"R":5,"I":75,"A":30,"S":30,"E":60,"C":70}'::jsonb, ARRAY['achievement','self-direction','power']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['technology','consulting','finance']::text[], ARRAY['global']::text[],
  3, 12, ARRAY['pricing','monetization','agent-economy','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-change-consultant', 'emerging', 'AI Change Management Consultant', 'AI变革管理顾问', '缓解组织对AI的焦虑与阻力，设计以人为本的转型旅程',
  '{"R":5,"I":45,"A":45,"S":80,"E":70,"C":40}'::jsonb, ARRAY['benevolence','universalism','achievement']::text[], '{"agreeableness":{"min":60,"max":100},"extraversion":{"min":50,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['consulting','hr','education']::text[], ARRAY['bridge','integrate']::text[],
  3, 15, ARRAY['change-management','org-psychology','adoption','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-portfolio-manager', 'emerging', 'AI Program Portfolio Manager', 'AI项目组合经理', '统筹企业多个AI项目的优先级、资源分配与ROI追踪',
  '{"R":15,"I":50,"A":20,"S":50,"E":70,"C":75}'::jsonb, ARRAY['achievement','security','conformity']::text[], '{"conscientiousness":{"min":65,"max":100},"extraversion":{"min":45,"max":95}}'::jsonb, ARRAY['technology','consulting','finance']::text[], ARRAY['integrate']::text[],
  5, 18, ARRAY['program-management','portfolio','roi','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-supply-chain-manager', 'emerging', 'AI Supply Chain Optimization Manager', 'AI供应链优化经理', '用AI重构需求预测、库存策略与物流网络设计',
  '{"R":35,"I":65,"A":10,"S":35,"E":60,"C":70}'::jsonb, ARRAY['achievement','security','self-direction']::text[], '{"conscientiousness":{"min":60,"max":100},"openness":{"min":50,"max":95}}'::jsonb, ARRAY['logistics','retail','engineering']::text[], ARRAY['global']::text[],
  3, 15, ARRAY['supply-chain','forecasting','optimization','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-knowledge-manager', 'emerging', 'Enterprise AI Knowledge Manager', '企业AI知识资产经理', '治理企业知识库与文档资产，让AI检索与生成有据可依',
  '{"R":10,"I":60,"A":35,"S":50,"E":45,"C":75}'::jsonb, ARRAY['self-direction','conformity','security']::text[], '{"conscientiousness":{"min":60,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['technology','consulting','publishing']::text[], ARRAY['integrate']::text[],
  2, 12, ARRAY['knowledge-management','rag','governance','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-revops-manager', 'emerging', 'AI Revenue Operations Manager', 'AI收入运营经理', '用AI驱动销售漏斗诊断、线索评分与收入增长运营',
  '{"R":10,"I":55,"A":20,"S":45,"E":75,"C":65}'::jsonb, ARRAY['achievement','power','security']::text[], '{"extraversion":{"min":55,"max":100},"conscientiousness":{"min":60,"max":100}}'::jsonb, ARRAY['technology','marketing','finance']::text[], ARRAY['global']::text[],
  3, 12, ARRAY['revops','sales-ops','growth','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-data-licensing-manager', 'emerging', 'AI Data Licensing Manager', 'AI数据授权与交易经理', '管理训练数据的授权谈判、定价与合规交易',
  '{"R":5,"I":55,"A":30,"S":40,"E":70,"C":70}'::jsonb, ARRAY['power','security','achievement']::text[], '{"extraversion":{"min":50,"max":100},"conscientiousness":{"min":60,"max":100}}'::jsonb, ARRAY['media','legal','technology']::text[], ARRAY['global']::text[],
  3, 12, ARRAY['data-licensing','ip','negotiation','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-legal-ai-specialist', 'emerging', 'Legal AI Specialist', '法律AI应用专家', '在律所与法务部门部署合同审查、法律检索与起草AI',
  '{"R":5,"I":70,"A":25,"S":45,"E":45,"C":85}'::jsonb, ARRAY['conformity','security','achievement']::text[], '{"conscientiousness":{"min":65,"max":100},"openness":{"min":50,"max":95}}'::jsonb, ARRAY['legal','technology']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['legal-tech','contract-ai','compliance','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-policy-advisor', 'emerging', 'Public Sector AI Policy Advisor', '公共部门AI政策顾问', '为政府与国际组织设计AI监管框架与公共服务应用',
  '{"R":5,"I":70,"A":30,"S":60,"E":55,"C":60}'::jsonb, ARRAY['universalism','power','conformity']::text[], '{"openness":{"min":60,"max":100},"agreeableness":{"min":50,"max":100}}'::jsonb, ARRAY['government','international','nonprofit']::text[], ARRAY['bridge','global']::text[],
  4, 20, ARRAY['policy','regulation','public-sector','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-clinical-ai-specialist', 'emerging', 'Clinical AI Specialist', '临床AI应用专家', '在医疗机构评估、验证与部署诊断辅助和临床决策AI',
  '{"R":20,"I":80,"A":10,"S":65,"E":35,"C":65}'::jsonb, ARRAY['benevolence','universalism','security']::text[], '{"conscientiousness":{"min":60,"max":100},"openness":{"min":55,"max":100},"agreeableness":{"min":50,"max":100}}'::jsonb, ARRAY['healthcare','biotech']::text[], ARRAY['bridge']::text[],
  3, 15, ARRAY['clinical-ai','diagnostics','health-informatics','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-healthcare-ai-implementation', 'emerging', 'Healthcare AI Implementation Manager', '医疗AI落地经理', '协调临床流程、合规要求与厂商，推动医疗AI部署',
  '{"R":15,"I":55,"A":15,"S":75,"E":65,"C":60}'::jsonb, ARRAY['benevolence','achievement','security']::text[], '{"extraversion":{"min":50,"max":100},"agreeableness":{"min":55,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['healthcare','pharma','consulting']::text[], ARRAY['bridge','integrate']::text[],
  4, 15, ARRAY['health-tech','implementation','stakeholder-management','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-financial-model-validator', 'emerging', 'Financial AI Model Validator', '金融AI模型验证师', '独立验证银行与基金的AI模型风险、稳健性与公平性',
  '{"R":10,"I":85,"A":5,"S":25,"E":35,"C":90}'::jsonb, ARRAY['security','conformity','achievement']::text[], '{"conscientiousness":{"min":70,"max":100},"openness":{"min":50,"max":90},"neuroticism":{"min":0,"max":50}}'::jsonb, ARRAY['finance','fintech','insurance']::text[], ARRAY['global']::text[],
  3, 15, ARRAY['model-validation','quant-risk','fairness','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-underwriting-specialist', 'emerging', 'AI Underwriting Specialist', 'AI核保与精算专家', '用AI重塑保险核保、风险定价与理赔自动化流程',
  '{"R":10,"I":75,"A":10,"S":35,"E":45,"C":85}'::jsonb, ARRAY['security','achievement','conformity']::text[], '{"conscientiousness":{"min":65,"max":100}}'::jsonb, ARRAY['insurance','fintech']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['insurtech','underwriting','actuarial','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-fraud-analyst', 'emerging', 'AI Fraud Strategy Analyst', 'AI反欺诈策略分析师', '设计对抗AI驱动欺诈、深度伪造与合成身份的防御策略',
  '{"R":15,"I":80,"A":15,"S":30,"E":40,"C":75}'::jsonb, ARRAY['security','universalism','stimulation']::text[], '{"openness":{"min":55,"max":100},"conscientiousness":{"min":60,"max":100}}'::jsonb, ARRAY['cybersecurity','finance','fintech']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['fraud','deepfake-defense','risk','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-people-analytics-ai', 'emerging', 'People Analytics & AI HR Specialist', 'AI人力分析专家', '用AI做人才画像、保留预测与组织网络分析',
  '{"R":5,"I":70,"A":20,"S":60,"E":50,"C":70}'::jsonb, ARRAY['benevolence','achievement','security']::text[], '{"openness":{"min":55,"max":100},"conscientiousness":{"min":55,"max":100},"agreeableness":{"min":50,"max":100}}'::jsonb, ARRAY['hr','consulting','technology']::text[], ARRAY['integrate']::text[],
  2, 12, ARRAY['people-analytics','hr-tech','retention','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-industrial-ai-engineer', 'emerging', 'Industrial AI Engineer', '工业AI工程师', '在工厂部署预测性维护、质检视觉与产线优化AI',
  '{"R":70,"I":70,"A":10,"S":20,"E":30,"C":60}'::jsonb, ARRAY['achievement','security','self-direction']::text[], '{"conscientiousness":{"min":55,"max":100},"openness":{"min":50,"max":95}}'::jsonb, ARRAY['engineering','automotive','energy']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['industry-4-0','predictive-maintenance','computer-vision','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-precision-agriculture-ai', 'emerging', 'Precision Agriculture AI Specialist', '智慧农业AI专家', '用遥感、传感器与AI优化种植决策与农业资源配置',
  '{"R":75,"I":65,"A":10,"S":25,"E":30,"C":50}'::jsonb, ARRAY['universalism','security','self-direction']::text[], '{"openness":{"min":50,"max":100},"conscientiousness":{"min":50,"max":100}}'::jsonb, ARRAY['agriculture','environmental','technology']::text[], ARRAY['global']::text[],
  1, 12, ARRAY['agritech','remote-sensing','sustainability','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-energy-ai-specialist', 'emerging', 'Energy AI Optimization Specialist', '能源AI优化专家', '用AI调度电网、储能系统与数据中心能耗',
  '{"R":55,"I":75,"A":5,"S":20,"E":35,"C":65}'::jsonb, ARRAY['universalism','achievement','security']::text[], '{"openness":{"min":55,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['energy','environmental','engineering']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['smart-grid','energy-optimization','climate-tech','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-retail-ai-personalization', 'emerging', 'Retail AI Personalization Manager', '零售AI个性化经理', '设计AI驱动的推荐系统、智能选品与全渠道体验',
  '{"R":5,"I":55,"A":45,"S":45,"E":70,"C":50}'::jsonb, ARRAY['achievement','hedonism','stimulation']::text[], '{"extraversion":{"min":50,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['retail','marketing','data_analytics']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['personalization','e-commerce','recommendation','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-news-verification', 'emerging', 'AI News Verification Specialist', 'AI新闻核查专家', '检测深度伪造与AI生成内容，守护公共信息真实性',
  '{"R":10,"I":70,"A":40,"S":50,"E":35,"C":65}'::jsonb, ARRAY['universalism','conformity','self-direction']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['media','publishing','nonprofit']::text[], ARRAY['global','bridge']::text[],
  1, 10, ARRAY['fact-checking','deepfake-detection','journalism','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-conversational-experience-designer', 'emerging', 'AI Contact Center Experience Designer', '智能客服体验设计师', '设计人机协作的客服旅程、语音与对话体验',
  '{"R":5,"I":45,"A":65,"S":65,"E":50,"C":45}'::jsonb, ARRAY['stimulation','benevolence','hedonism']::text[], '{"agreeableness":{"min":50,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['technology','retail','telecom']::text[], ARRAY['bridge']::text[],
  1, 10, ARRAY['cx-design','conversational-ai','service-design','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-for-science-researcher', 'emerging', 'AI for Science Researcher', 'AI科学发现研究员', '用基础模型加速材料、气候与生物科学的发现',
  '{"R":25,"I":95,"A":20,"S":15,"E":15,"C":50}'::jsonb, ARRAY['self-direction','universalism','achievement']::text[], '{"openness":{"min":70,"max":100},"conscientiousness":{"min":50,"max":100}}'::jsonb, ARRAY['education','biotech','energy']::text[], ARRAY['global']::text[],
  3, 20, ARRAY['ai4science','research','foundation-models','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-sustainability-analyst', 'emerging', 'AI Sustainability Analyst', 'AI碳足迹与可持续分析师', '评估AI算力碳足迹，并用AI做ESG与气候分析',
  '{"R":20,"I":70,"A":15,"S":40,"E":40,"C":70}'::jsonb, ARRAY['universalism','security','conformity']::text[], '{"conscientiousness":{"min":55,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['environmental','energy','consulting']::text[], ARRAY['global']::text[],
  1, 10, ARRAY['esg','carbon-accounting','green-ai','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-genai-system-tester', 'emerging', 'Generative AI System Tester', '生成式人工智能系统测试员', '人社部2025新工种：测试生成式AI系统的质量、安全与鲁棒性',
  '{"R":30,"I":70,"A":15,"S":20,"E":20,"C":80}'::jsonb, ARRAY['conformity','security','achievement']::text[], '{"conscientiousness":{"min":65,"max":100}}'::jsonb, ARRAY['technology','ai_ml']::text[], ARRAY['global']::text[],
  0, 8, ARRAY['qa','red-teaming','model-testing','mohrss-2025','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"官方认定新工种，需求快速增长","label_en":"Officially recognized new occupation, fast-growing demand","source":"中国人社部第七批新职业目录 (2025); WEF Future of Jobs 2025","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-animation-producer', 'emerging', 'AI Animation Producer', 'AI动画制作员', '人社部2025新工种：用生成式AI制作动画、分镜与短片',
  '{"R":15,"I":40,"A":85,"S":20,"E":30,"C":40}'::jsonb, ARRAY['stimulation','hedonism','self-direction']::text[], '{"openness":{"min":65,"max":100}}'::jsonb, ARRAY['entertainment','media','design']::text[], ARRAY['global']::text[],
  0, 8, ARRAY['aigc','animation','creative-production','mohrss-2025','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"官方认定新工种，内容产业需求旺盛","label_en":"Officially recognized new occupation, strong content-industry demand","source":"中国人社部第七批新职业目录 (2025); WEF Future of Jobs 2025","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-agent-orchestration-specialist', 'emerging', 'AI Agent Orchestration Specialist', 'AI智能体编排专家', '设计多智能体协作架构、任务路由与权限边界',
  '{"R":30,"I":75,"A":25,"S":25,"E":35,"C":70}'::jsonb, ARRAY['self-direction','achievement','stimulation']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":60,"max":100}}'::jsonb, ARRAY['ai_ml','technology']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['multi-agent','orchestration','architecture','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-agentops-engineer', 'emerging', 'AgentOps Engineer', 'AgentOps运维工程师', '监控、调试与治理生产环境中的AI智能体集群',
  '{"R":45,"I":70,"A":10,"S":20,"E":25,"C":75}'::jsonb, ARRAY['security','achievement','conformity']::text[], '{"conscientiousness":{"min":65,"max":100},"neuroticism":{"min":0,"max":55}}'::jsonb, ARRAY['ai_ml','technology']::text[], ARRAY['global']::text[],
  1, 10, ARRAY['agentops','observability','reliability','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-model-customization-engineer', 'emerging', 'Model Customization Engineer', '模型微调与定制工程师', '为企业垂直场景做模型微调、蒸馏与私有化部署',
  '{"R":35,"I":80,"A":15,"S":15,"E":25,"C":65}'::jsonb, ARRAY['self-direction','achievement','security']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":55,"max":100}}'::jsonb, ARRAY['ai_ml','technology','consulting']::text[], ARRAY['global']::text[],
  1, 12, ARRAY['fine-tuning','distillation','on-prem','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-evaluation-engineer', 'emerging', 'AI Evaluation Engineer', 'AI评测工程师', '构建模型与智能体的评测基准、护栏与质量门禁',
  '{"R":25,"I":80,"A":15,"S":20,"E":20,"C":80}'::jsonb, ARRAY['conformity','achievement','security']::text[], '{"conscientiousness":{"min":65,"max":100},"openness":{"min":55,"max":100}}'::jsonb, ARRAY['ai_ml','technology']::text[], ARRAY['global']::text[],
  1, 10, ARRAY['evals','benchmarking','quality-gates','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-interpretability-researcher', 'emerging', 'AI Interpretability Researcher', 'AI可解释性研究员', '逆向理解模型内部机制，让AI决策透明可审查',
  '{"R":10,"I":95,"A":30,"S":20,"E":10,"C":55}'::jsonb, ARRAY['self-direction','universalism','achievement']::text[], '{"openness":{"min":70,"max":100},"conscientiousness":{"min":50,"max":100}}'::jsonb, ARRAY['ai_ml','education']::text[], ARRAY['global']::text[],
  2, 18, ARRAY['interpretability','mech-interp','transparency','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-alignment-researcher', 'emerging', 'AI Alignment Researcher', 'AI对齐研究员', '研究让AI目标与人类价值保持一致的方法与评估',
  '{"R":10,"I":95,"A":25,"S":25,"E":15,"C":55}'::jsonb, ARRAY['universalism','self-direction','benevolence']::text[], '{"openness":{"min":70,"max":100}}'::jsonb, ARRAY['ai_ml','education','nonprofit']::text[], ARRAY['global']::text[],
  2, 20, ARRAY['alignment','safety-research','interpretability','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-human-ai-interaction-researcher', 'emerging', 'Human-AI Interaction Researcher', '人机交互研究员', '研究人类如何信任、依赖并高效协作于AI系统',
  '{"R":5,"I":85,"A":35,"S":50,"E":25,"C":50}'::jsonb, ARRAY['self-direction','universalism','benevolence']::text[], '{"openness":{"min":65,"max":100},"agreeableness":{"min":45,"max":100}}'::jsonb, ARRAY['education','technology','design']::text[], ARRAY['bridge']::text[],
  2, 15, ARRAY['hci','user-research','trust','emerging-role']::text[], 'augmented',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"需求快速增长","label_en":"Rapidly growing demand","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-embodied-ai-engineer', 'emerging', 'Embodied AI Engineer', '具身智能工程师', '开发机器人感知、运动控制与物理操作的AI系统',
  '{"R":80,"I":80,"A":10,"S":10,"E":20,"C":50}'::jsonb, ARRAY['achievement','stimulation','self-direction']::text[], '{"openness":{"min":60,"max":100},"conscientiousness":{"min":50,"max":100}}'::jsonb, ARRAY['engineering','ai_ml','automotive']::text[], ARRAY['global']::text[],
  1, 12, ARRAY['robotics','embodied-ai','manipulation','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-humanoid-robot-trainer', 'emerging', 'Humanoid Robot Trainer', '人形机器人训练师', '通过动作演示与数据采集训练人形机器人的操作技能',
  '{"R":75,"I":50,"A":25,"S":35,"E":25,"C":55}'::jsonb, ARRAY['stimulation','achievement','security']::text[], '{"conscientiousness":{"min":50,"max":100},"openness":{"min":50,"max":100}}'::jsonb, ARRAY['engineering','ai_ml','logistics']::text[], ARRAY['global']::text[],
  0, 8, ARRAY['robot-training','teleoperation','data-collection','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-ai-character-designer', 'emerging', 'AI Character & Persona Designer', 'AI角色与人格设计师', '为AI产品设计性格、语气、价值边界与人格一致性',
  '{"R":5,"I":45,"A":85,"S":45,"E":35,"C":35}'::jsonb, ARRAY['stimulation','hedonism','benevolence']::text[], '{"openness":{"min":70,"max":100},"agreeableness":{"min":45,"max":100}}'::jsonb, ARRAY['design','entertainment','technology']::text[], ARRAY['bridge']::text[],
  1, 10, ARRAY['persona-design','character','conversational-ux','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-geo-specialist', 'emerging', 'Generative Engine Optimization (GEO) Specialist', '生成引擎优化(GEO)专家', '优化品牌与内容在AI搜索与答案引擎中的可见度',
  '{"R":5,"I":55,"A":50,"S":35,"E":65,"C":50}'::jsonb, ARRAY['achievement','stimulation','power']::text[], '{"openness":{"min":60,"max":100},"extraversion":{"min":45,"max":100}}'::jsonb, ARRAY['marketing','media','technology']::text[], ARRAY['global']::text[],
  1, 10, ARRAY['geo','ai-search','brand-visibility','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"growing","label_zh":"2026 年最热门新兴岗位之一","label_en":"Among the hottest emerging roles of 2026","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "CareerDirection" (
  "id", "source", "titleEn", "titleZh", "subtitleZh",
  "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit",
  "seniorityMin", "seniorityMax", "tags", "aiEraCategory",
  "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt"
) VALUES (
  'emerging-world-model-engineer', 'emerging', 'Simulation & World Model Engineer', '世界模型与仿真工程师', '构建用于机器人与自动驾驶训练的虚拟世界与仿真环境',
  '{"R":55,"I":85,"A":30,"S":10,"E":15,"C":55}'::jsonb, ARRAY['self-direction','stimulation','achievement']::text[], '{"openness":{"min":65,"max":100},"conscientiousness":{"min":50,"max":100}}'::jsonb, ARRAY['ai_ml','engineering','entertainment']::text[], ARRAY['global']::text[],
  2, 12, ARRAY['world-models','simulation','synthetic-environments','emerging-role']::text[], 'ai-native',
  'ai-assisted', 'expert-estimated', '{"trend":"emerging","label_zh":"新兴岗位，需求形成中","label_en":"Emerging role, demand forming","source":"WEF Future of Jobs 2025; industry hiring data 2026","lastUpdated":"2026-06"}'::jsonb, TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

COMMIT;
