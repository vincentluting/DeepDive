-- Migration 045: Add AI-era emerging career directions
-- Source: WEF Future of Jobs 2025, industry research, Deep Dive product strategy
-- These are 'emerging' source, 'ai-native' or 'augmented' aiEraCategory careers
-- that represent new roles created or transformed by the AI revolution.

-- AI Ethics & Governance Officer
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-ai-ethics-officer', 'emerging',
  'AI Ethics & Governance Officer', 'AI 伦理与治理官',
  '确保 AI 系统的公平性、透明度和合规性',
  '{"R": 20, "I": 75, "A": 30, "S": 60, "E": 55, "C": 50}',
  ARRAY['universalism', 'self-direction', 'benevolence'],
  '{"openness": {"min": 65, "max": 100}, "conscientiousness": {"min": 60, "max": 100}, "agreeableness": {"min": 55, "max": 100}}',
  ARRAY['Technology', 'Government', 'Consulting', 'Healthcare'],
  ARRAY['bridge', 'global'],
  3, 15,
  ARRAY['ai-governance', 'ethics', 'policy', 'compliance', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 15000, "salaryRange": {"min": 90000, "max": 180000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- AI Product Manager
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-ai-product-manager', 'emerging',
  'AI Product Manager', 'AI 产品经理',
  '定义和推动 AI 驱动产品的战略与用户体验',
  '{"R": 25, "I": 60, "A": 40, "S": 55, "E": 75, "C": 35}',
  ARRAY['achievement', 'self-direction', 'stimulation'],
  '{"openness": {"min": 60, "max": 100}, "extraversion": {"min": 50, "max": 100}, "conscientiousness": {"min": 55, "max": 100}}',
  ARRAY['Technology', 'SaaS', 'Fintech', 'Healthcare Tech'],
  ARRAY['bridge', 'global', 'integrate'],
  2, 12,
  ARRAY['product-management', 'ai-product', 'strategy', 'user-experience', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 25000, "salaryRange": {"min": 100000, "max": 200000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Prompt Engineer / AI Interaction Designer
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-prompt-engineer', 'emerging',
  'Prompt Engineer / AI Interaction Designer', 'Prompt 工程师 / AI 交互设计师',
  '设计和优化人与 AI 系统之间的交互方式',
  '{"R": 30, "I": 65, "A": 60, "S": 35, "E": 30, "C": 45}',
  ARRAY['self-direction', 'stimulation', 'achievement'],
  '{"openness": {"min": 70, "max": 100}, "conscientiousness": {"min": 50, "max": 100}}',
  ARRAY['Technology', 'AI/ML', 'Creative Agency', 'Enterprise Software'],
  ARRAY['global', 'bridge'],
  0, 8,
  ARRAY['prompt-engineering', 'ai-interaction', 'nlp', 'creative-tech', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 30000, "salaryRange": {"min": 80000, "max": 160000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- AI-Human Workflow Architect
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-ai-workflow-architect', 'emerging',
  'AI-Human Workflow Architect', 'AI-人类工作流架构师',
  '设计人与 AI 协作的最优工作流程和组织结构',
  '{"R": 35, "I": 55, "A": 30, "S": 50, "E": 60, "C": 65}',
  ARRAY['achievement', 'self-direction', 'conformity'],
  '{"openness": {"min": 55, "max": 100}, "conscientiousness": {"min": 65, "max": 100}, "extraversion": {"min": 45, "max": 100}}',
  ARRAY['Consulting', 'Technology', 'Enterprise', 'Operations'],
  ARRAY['bridge', 'integrate'],
  3, 15,
  ARRAY['workflow-design', 'ai-ops', 'organizational-design', 'process-optimization', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 12000, "salaryRange": {"min": 95000, "max": 175000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- AI Training Data Curator
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-ai-data-curator', 'emerging',
  'AI Training Data Curator', 'AI 训练数据策展师',
  '策划、标注和质控 AI 模型训练所需的高质量数据集',
  '{"R": 45, "I": 60, "A": 25, "S": 30, "E": 20, "C": 70}',
  ARRAY['conformity', 'achievement', 'security'],
  '{"conscientiousness": {"min": 65, "max": 100}, "openness": {"min": 45, "max": 100}}',
  ARRAY['AI/ML', 'Technology', 'Research', 'Data Services'],
  ARRAY['global', 'root'],
  0, 8,
  ARRAY['data-curation', 'annotation', 'quality-control', 'ai-training', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 50000, "salaryRange": {"min": 45000, "max": 95000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- AI-Augmented Creative Director
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-ai-creative-director', 'emerging',
  'AI-Augmented Creative Director', 'AI 增强型创意总监',
  '用 AI 工具放大创意产出，专注于概念突破和情感叙事',
  '{"R": 20, "I": 35, "A": 85, "S": 40, "E": 55, "C": 25}',
  ARRAY['self-direction', 'stimulation', 'achievement'],
  '{"openness": {"min": 75, "max": 100}, "extraversion": {"min": 45, "max": 100}}',
  ARRAY['Advertising', 'Media', 'Entertainment', 'Brand Strategy'],
  ARRAY['global', 'bridge'],
  3, 15,
  ARRAY['creative-direction', 'ai-creative', 'brand-strategy', 'content-innovation', 'emerging-role'],
  'augmented', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 8000, "salaryRange": {"min": 85000, "max": 180000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- Human Experience Designer (AI-era evolution of UX)
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-human-experience-designer', 'emerging',
  'Human Experience Designer', '人类体验设计师',
  '在 AI 自动化的世界中设计深度人际连接和转化性体验',
  '{"R": 15, "I": 40, "A": 65, "S": 75, "E": 45, "C": 25}',
  ARRAY['benevolence', 'self-direction', 'universalism'],
  '{"openness": {"min": 60, "max": 100}, "agreeableness": {"min": 60, "max": 100}, "extraversion": {"min": 40, "max": 100}}',
  ARRAY['Healthcare', 'Education', 'Hospitality', 'Social Enterprise'],
  ARRAY['bridge', 'integrate', 'root'],
  1, 10,
  ARRAY['experience-design', 'human-centered', 'service-design', 'empathy', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 10000, "salaryRange": {"min": 70000, "max": 140000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;

-- MLOps / AI Infrastructure Engineer
INSERT INTO "CareerDirection" ("id", "source", "titleEn", "titleZh", "subtitleZh", "idealRiasec", "alignedValues", "idealBigFive", "industries", "crossCulturalFit", "seniorityMin", "seniorityMax", "tags", "aiEraCategory", "annotationSource", "annotationConfidence", "marketOutlook", "isActive", "lastReviewedAt")
VALUES (
  'emerging-mlops-engineer', 'emerging',
  'MLOps / AI Infrastructure Engineer', 'MLOps / AI 基础设施工程师',
  '构建和维护 AI 模型的生产化部署、监控和扩展基础设施',
  '{"R": 70, "I": 65, "A": 15, "S": 20, "E": 25, "C": 60}',
  ARRAY['achievement', 'self-direction', 'conformity'],
  '{"conscientiousness": {"min": 60, "max": 100}, "openness": {"min": 55, "max": 100}}',
  ARRAY['Technology', 'AI/ML', 'Cloud Computing', 'Enterprise'],
  ARRAY['global'],
  1, 10,
  ARRAY['mlops', 'infrastructure', 'devops', 'model-deployment', 'emerging-role'],
  'ai-native', 'ai-assisted', 'expert-estimated',
  '{"demandTrend": "rising", "estimatedOpenings": 35000, "salaryRange": {"min": 110000, "max": 220000, "currency": "USD"}}',
  TRUE, NOW()
) ON CONFLICT ("id") DO NOTHING;
