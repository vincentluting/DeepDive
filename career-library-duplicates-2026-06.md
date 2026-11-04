# 职业库疑似重复条目清单 (2026-06-11)

> 数据来源：`lib/career-matching/static-pool.json`（1,148 条快照）。
> 仅供决策参考，未做任何生产数据修改。建议处理方式：保留一条主条目，其余 `isActive=false`（不要物理删除，避免破坏历史报告引用）。

## 🔴 高置信重复（建议合并）

| 组 | 条目 | 建议 |
|---|---|---|
| AI Product Manager ×3 | `ai-001` · `emerging-ai-biz-033` · `emerging-ai-product-manager`（标题、中文名完全相同） | 保留标注最完整的一条，其余下线。**这是 MBA 用户高频命中 AI PM 的直接放大器** |
| Prompt Engineer ×3 | `ai-003`（/AI Application Developer）· `emerging-ai-004` · `emerging-prompt-engineer`（/AI Interaction Designer） | 三条本质同岗，保留一条 |
| AI Ethics ×3 | `ai-002`（Responsible AI Specialist）· `emerging-ai-biz-036`（Compliance Officer）· `emerging-ai-ethics-officer`（Governance Officer） | 语义高度重叠，建议保留 1-2 条并差异化命名 |
| AI Data Curator ×2 | `emerging-ai-011` · `emerging-ai-data-curator` | 同岗，保留一条 |
| AI Creative Director ×2 | `emerging-ai-creative-019` · `emerging-ai-creative-director`（AI-Augmented） | 同岗，保留一条 |
| Data Scientist ×2 | `tech-002` · `onet-15-2051.00` | curated 与 O*NET 来源重复，保留一条 |
| Learning Experience Designer ×2 | `edu-001` · `emerging-edtech-099` | 同岗，保留一条 |
| Game Designer ×2 | `ent-001` · `onet-15-1255.01`（Video Game Designers） | 中文名相同，建议保留一条或差异化 |
| MLOps / AI Infra ×2 | `emerging-ai-018`（AI Infrastructure Engineer）· `emerging-mlops-engineer`（MLOps / AI Infrastructure Engineer） | 高度重叠，建议合并 |

## 🟡 语义重叠（可保留但建议差异化命名/标注）

- `onet-29-1171.00` Nurse Practitioners 与 `onet-29-2061.00` LPN — 中文名都是「执业护士」，实为不同职业，**建议改中文译名**（如「高级执业护士」vs「执业护士(LPN)」）而非合并
- `emerging-ai-biz-034` AI Strategy Consultant 与 `product-003` Strategy Consultant — 合理共存，确认 RIASEC 画像有差异
- `emerging-ai-creative-028/029` AI Fashion/Game Designer 与对应传统岗 — 合理共存

## ⚠️ 顺带发现的潜在 bug（与去重无关，建议单独核查）

迁移 `045-ai-era-emerging-careers.sql` 写入的 9 条 emerging 职业，`industries` 用的是大写自由文本（如 `Technology`, `Consulting`），而行业 pre-filter（`filterByIndustry` + `INDUSTRY_MAP`）期望小写 id（如 `technology`, `consulting`），**精确字符串匹配会失败**。后果：用户一旦选了目标行业且匹配池 ≥10 条，这批 AI 职业反而会被过滤掉。本次新增的 48 条 CSV 已统一使用 `INDUSTRY_MAP` 小写 id。建议跑一条 SQL 核查全库 `industries` 词表分布。
