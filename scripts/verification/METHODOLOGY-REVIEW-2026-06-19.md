# Layer 3 方法论评审 — 评分/匹配设计的学术合理性

> 用户授权"审到设计层":对照心理测量学/职业心理学文献评估每个核心设计选择。
> 每条:现状 → 文献立场 → 判定(稳健/争议)→ 论文局限措辞。引用见末尾 Sources。
> ⚠️ 这是设计合理性评估,非代码 bug。冻结区只报告。

## 1. RIASEC interest-fit 用余弦相似度(F1/B2)— 判定:**排序稳健,展示需校准**

- **现状**:`factors/riasec.ts` 用用户与职业 RIASEC 向量的 cosine × 100。仿真:最佳匹配恒 ~98%、全库对中性用户 74-99%。
- **文献立场**:Holland 一致性指数众多(Iachan 1984、C-index、Z-S、首字母一致),但**彼此 r 从 0.05 到 0.98 高度不一致,且"缺乏明确实证支持、存在概念与方法论缺陷"**。关键:**已有研究提出"用 cosine 拟合 RIASEC 剖面"定义 consistency/differentiation,并证明其在预测 15 年职业稳定性与职业满意度上优于传统表示**。
- **判定**:余弦作为**相似度/排序**度量是**文献支持的合法选择**,我此前对"度量本身有问题"的担忧**被文献缓和**。真问题仅是:全正向量使**展示的绝对匹配度%虚高、顶部压缩**(无区分度),且不等价于 Holland 的 code-based congruence。
- **论文措辞**:"Interest fit is operationalized as cosine similarity between the respondent's and the occupation's RIASEC profile vectors, a profile-based approach with demonstrated predictive validity (career stability and satisfaction). Because all RIASEC components are non-negative, absolute similarity values are right-shifted and compressed at the top; we therefore interpret interest fit ordinally (rank) rather than as a calibrated percentage, and report it after population-baseline recalibration."
- **建议(B2)**:保留余弦排序;展示层做人群基线/percentile 重标定,使"匹配度%"有区分度。不必换度量。

## 2. 因子权重 32/25/28/15 + Schwartz 43% 双计(F8/B1)— 判定:**争议(独立性假设被违反)**

- **现状**:加权线性组合;valueFit 28% 与 adaptabilityFit 15% **都来自 Schwartz**(adaptability=ipsative stimulation−security)→ 单一量表占 43%。权重为专家判断,无实证推导。
- **文献立场**:加权线性组合隐含因子近似独立;同一量表派生的两因子共享方差,会**系统性放大该量表、低估其他**。这与产品 v2 移除 collabFit(因其 RIASEC 派生造成污染)的逻辑**自相矛盾**——同样的问题在 Schwartz 上未处理。
- **判定**:**真实方法论缺陷**(Codex 独立命中)。权重本身用专家判断在应用工具中常见,但"4 独立维度"的表述与 43% 共享方差不符(注释已纠正)。
- **论文措辞**:"Factor weights reflect expert judgment rather than empirical derivation. Two factors (values 28%, adaptability 15%) are both derived from the Schwartz instrument and are therefore not statistically independent; the Schwartz instrument drives 43% of the composite. This shared-variance limitation is acknowledged; future work should decouple adaptability from the value instrument or estimate weights empirically."
- **建议(B1)**:adaptability 改用非 Schwartz 个人信号(如开放性/尽责性)× 职业 AI 暴露,恢复独立;或显式合并为单一 43% Schwartz 块。R 类改动,需你授权 + 重跑仿真对比。

## 3. 价值取向二分 + raw/centered + hedonism(F3/A1/A2)— 判定:**部分稳健,内部不一致需统一**

- **现状**:archetype orientation = enhancement(成就+权力)vs transcendence(仁爱+普世),用 **raw** 均值、排除 hedonism、平局归 transcendence;meaning-compass 同概念却用 **centered**;`higherOrder.self-enhancement` 含 hedonism。
- **文献立场**:Self-Enhancement=Achievement+Power、Self-Transcendence=Benevolence+Universalism ✓ **与 Schwartz 规范一致**。**hedonism"不明确归属、横跨 openness-to-change 与 self-enhancement"** → 排除 hedonism **有理论依据**;但把 hedonism 并入 self-enhancement 也是另一常见惯例,故两套并存是"两个合法惯例"而非错误,但**同一代码库内不一致**会让解释打架。
- **判定**:二分本身丢失连续信息(Schwartz 是 circumplex);raw vs centered 各有据(raw 保 QD 测量不变性;centered 去 acquiescence)但**不能并存两套口径**。
- **论文措辞**:"Value orientation dichotomizes Schwartz's continuous self-enhancement/self-transcendence axis; this is a deliberate simplification for archetype assignment and is reported with a confidence flag. Hedonism is excluded from the binary given its ambiguous higher-order placement (Schwartz). We note a residual inconsistency between raw-score (archetype) and ipsatively-centered (meaning compass) operationalizations of the same axis, to be unified in future work."
- **建议(A1/A2)**:抽单一 SSOT;平局显式标"均衡/低置信"而非默认 transcendence。冻结区,等你授权。

## 4. 认知风格 大五→MBTI 字母(cognitive style)— 判定:**方向对,弱轴 + 类型论本身存疑,缓解到位**

- **现状**:EI←外向、SN←开放、TF←宜人、JP←尽责;近中点≥2 轴 → balanced 抑制码;丢弃神经质;标"非 MBTI"。
- **文献立场**:McCrae & Costa 1989:E-I↔外向 r=−.74、N(intuition)↔开放 r=.72(**强**),F↔宜人 r=.44、P↔尽责 r=−.49(**仅中等**);"MBTI 非真二分、无一对一映射、字母 5 周内约 50% 翻转"。
- **判定**:映射**方向与文献一致**,但 **TF/JP 两字母弱支撑**;MBTI 类型论本身效度差。产品的 **balanced 抑制(仿真:真实被试仅 18% 抑制)+ "非 MBTI"标注**是**恰当缓解**(印证 S10)。神经质无 MBTI 轴,丢弃合理。
- **论文措辞**:"Cognitive style re-expresses Big Five scores as a familiar four-letter heuristic (E/I≈Extraversion, S/N≈Openness — both strong; T/F≈Agreeableness, J/P≈Conscientiousness — moderate). It is presented as a heuristic, not a validated type: low-confidence (near-midpoint) profiles are suppressed, and MBTI branding is avoided. Neuroticism, which has no MBTI axis, is retained separately."

## 5. 协作风格 大五→DISC(collab style)— 判定:**呈现层稳健(规避了 DISC 主缺陷)**

- **现状**:facet→D/I/S/C 信号,归一化为百分比分布(和=100),标"近似仅供参考、非 DISC"。
- **文献立场**:DISC D/I↔外向、S↔宜人+低神经质、C↔尽责(与产品 facet 映射一致);但 **DISC"构念效度弱于大五"(Lyons & Reid 2020),且强制四分箱与连续特质相悖**。
- **判定**:产品**保留连续大五基础 + 分布呈现 + 非 DISC 标注**,恰好**规避 DISC 最大问题**(强制类型)。是合理的呈现层。注意:百分比和=100 是 ipsative,只能相对解读(不能四项都高)。
- **论文措辞**:"Collaboration style maps Big Five facets onto DISC-style labels as a presentation layer, retaining the continuous Big Five basis and reporting a normalized distribution rather than a discrete type — avoiding DISC's principal validity weakness (forced typology). Scores are ipsative (sum to 100) and interpreted relatively."

## 6. 适应性构念:stimulation−security × AI 暴露(F-adapt)— 判定:**原创/探索性,效度未建立**

- **现状**:用户"刺激−安全"(Schwartz ipsative)× 职业 AI 暴露度(Anthropic Economic Index)→ 适应性 fit。
- **文献立场**:无直接先例。把"个人价值"与"职业 AI 暴露"相乘是产品**原创构念**;且与引擎对 transformed 职业 −10、排除 resilience-0 存在张力(适应性奖励高暴露、其他惩罚又压低)。
- **判定**:**探索性**,效度未经独立验证。
- **论文措辞**:"Adaptability fit is an exploratory construct crossing the respondent's stimulation−security balance with the occupation's AI-exposure score; it has no established psychometric precedent and is reported as exploratory."

---

## 论文 Limitations 段落(可直接用,EN)

> The matching algorithm makes several deliberate simplifications whose limits we acknowledge. (a) Interest fit uses cosine similarity over non-negative RIASEC vectors, which yields ordinally valid but absolutely right-shifted, top-compressed scores; values are interpreted as ranks, not calibrated percentages. (b) Two of four factors (values, adaptability) derive from a single instrument (Schwartz), so the composite is not factor-independent and weights are expert-set rather than empirically estimated. (c) The self-enhancement/self-transcendence axis is dichotomized from continuous data and operationalized inconsistently (raw vs. ipsative) across modules. (d) Cognitive-style and collaboration-style outputs re-express Big Five scores in MBTI-/DISC-style heuristics; the weakly-loaded axes (Thinking/Feeling, Judging/Perceiving; DISC construct validity) are presented as heuristics with low-confidence suppression and no claim of typological validity. (e) Adaptability is an exploratory construct without established precedent. None of these affects the determinism, scale-consistency, or data integrity of the pipeline, which were verified empirically (N≥10k synthetic respondents).

## Sources

- [A comparison of indices of differentiation for Holland's model (J. Vocational Behavior)](https://www.sciencedirect.com/science/article/abs/pii/000187919090022T)
- [Examining the duality of Holland's RIASEC types: implications for measurement and congruence (2017)](https://www.researchgate.net/publication/321467157_Examining_the_duality_of_Holland's_RIASEC_types_Implications_for_measurement_and_congruence)
- [Iachan (1984) congruence index — `holland` R package](https://search.r-project.org/CRAN/refmans/holland/html/con_iachan_holland.html)
- [McCrae & Costa (1989), Reinterpreting the MBTI from the FFM perspective (J. Personality)](https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1467-6494.1989.tb00759.x)
- [An Overview of the Schwartz Theory of Basic Values (Schwartz, ORPC)](https://scholarworks.gvsu.edu/cgi/viewcontent.cgi?article=1116&context=orpc)
- [Measuring the Four Higher-Order Values in Schwartz's Theory (J. Personality Assessment, 2024)](https://www.tandfonline.com/doi/full/10.1080/00223891.2024.2311193)
- [DISC vs Big Five concurrent validation (123test)](https://www.123test.com/content/disc-vs-big-five-123test.pdf)
- [Is DISC a Valid Personality Test? (Lyons & Reid 2020 meta-analysis summary)](https://jobcannon.io/blog/is-disc-a-valid-personality-test)

---

## Post-B1 + codex cross-review update (2026-06-19, night run)

B1 (commit `142c557c`) plus the codex A2/A3 cross-review change two claims above:

1. **The weighted composite IS now factor-independent.** B1 set `adaptabilityFit`
   weight = 0 in `WEIGHT_PRESETS.full`. The match is now 3 INDEPENDENT instruments —
   Interest (RIASEC) 38% · Values (Schwartz) 33% · Personality (Big Five) 29% — each
   contributing once. The values/adaptability double-count described in the
   double-count section and Limitations (b) above is **resolved**, not a live limit.

2. **AI-era risk in matching is DISCRETE, not continuous.** With `adaptabilityFit`
   weight = 0, the continuous "stimulation−security × AI-exposure" score no longer
   enters the ranking. AI risk is carried only by (i) the engine's AI-disruption
   penalty (`aiEraCategory === "transformed"` → −10) and (ii) the resilience
   pre-filter (resilience 0/1 excluded). `adaptabilityFit.score` is still computed
   and shown for transparency but contributes 0. → Paper text must describe AI
   exposure as a discrete penalty + pre-filter, NOT a continuous weighted factor.

3. **Cognitive-style cut = population MEAN.** The norm-referenced dichotomy splits at
   the IPIP-NEO population mean (≈ the median under normality), not an empirical sample
   median. IPIP's own guidance favours LOCAL norms; the public IPIP-NEO norms are a
   WEIRD self-selected sample, so cross-cultural percentiles are indicative, not
   calibrated. Two-item IPIP-60 facets are scored against IPIP-NEO-120 four-item facet
   norms (measurement non-equivalence — documented).

4. **Positioning (per psychometric review).** Deep Dive is a FORMATIVE / exploratory
   self-reflection instrument that re-expresses public scales, NOT a validated clinical
   or selection test. Stating this in the abstract converts most "limitations" into
   disclosed design choices. All derived labels are presented as continuous scores +
   confidence bands, never hard types or single probabilities.

### Revised Limitations paragraph (supersedes the version above, EN)

> The matching algorithm makes several deliberate simplifications whose limits we
> acknowledge. (a) Interest fit uses cosine similarity over non-negative RIASEC
> vectors, which yields ordinally valid but absolutely right-shifted, top-compressed
> scores; values are interpreted as ranks, not calibrated percentages. (b) The
> weighted composite combines three independent instruments (RIASEC, Big Five,
> Schwartz) with expert-set rather than empirically estimated weights; a deliberately
> non-weighted adaptability signal (stimulation−security × occupational AI exposure)
> is reported for transparency but excluded from ranking to preserve factor
> independence, and AI-era risk instead enters ranking as a discrete penalty plus a
> resilience pre-filter. (c) The self-enhancement/self-transcendence axis is
> dichotomized from continuous data. (d) Cognitive-style and collaboration-style
> outputs re-express Big Five scores as MBTI-/DISC-style heuristics, cut at population
> means (not validated typologies), with low-confidence suppression. (e) Norms are
> public IPIP-NEO reference samples (WEIRD, indicative rather than locally calibrated),
> and two-item IPIP-60 facets are mapped onto four-item facet norms. None of these
> affects the determinism, scale-consistency, or data integrity of the pipeline,
> verified empirically (N≥10k synthetic respondents + targeted unit/invariant tests).
