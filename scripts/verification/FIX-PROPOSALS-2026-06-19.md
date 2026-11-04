# 修复方案(供讨论)— 评分/匹配验证

> 用户已授权:冻结区**起草方案供讨论,不擅自应用**;非冻结安全缺陷已直接修。
> 每条:暴露面(live/休眠)→ 具体改法 → 影响 → 心理测量依据 → 建议。
> 配套证据:`FINDINGS-2026-06-19.md`;仿真 `simulate-scoring.ts`。

## 已直接应用(非冻结,安全)

- **F8 注释纠错** `weights.ts` — 删除"4 个独立维度各来自不同量表"虚假声明,标注 Schwartz 43% 双计为已知局限。纯文档,0 行为变化。✅ tsc 通过。
- **F13 determinism** `meaning-compass.ts:147` — Ikigai RIASEC top-2 加 canonical tiebreak(对齐 buildArchetype)。仅平局排序确定化。✅ tsc + 26 测试通过。

---

## A. 冻结区 lib/scoring(起草,等你授权解冻)

### A1 — 价值取向平局偏倚(F3)`riasec-utils.ts:75` · live ~6% 用户

- **现状**:`enhancement > transcendence ? "enhancement" : "transcendence"` → 平局归 transcendence。仿真实测:随机/连贯均 52.9% 判 transcendence(应 ~50/50),源于 TwIVI 每值仅 2 题→~6% 精确平局全归一侧。
- **改法**(任选):
  1. 平局显式标记 `orientation: null` / `isBoundary: true`,UI 显示"价值取向均衡",不强行二选一(**推荐**,最诚实);
  2. 或平局按 confidence 走低置信分支(archetype 已有 confidence,gap=0→0.4 low);
  3. 最小改动:平局时按更大的单值(如 achievement vs benevolence)二次决胜。
- **影响**:~6% 用户的 archetype code 第二段会变;narrative/报告需处理 null 取向。
- **依据**:Schwartz 高阶维度是连续的,强制二分本就丢信息;平局更应表达为"无明确极性"而非默认一端。
- **建议**:采纳 (1),配合 archetype confidence=low 一起展示。

### A2 — 取向口径分裂:raw vs centered + hedonism(F-cluster)`index.ts:221` vs `meaning-compass.ts:61` · live

- **现状**:archetype orientation 用 **raw** achievement+power vs benevolence+universalism(排除 hedonism,引 Sagiv 2002);meaning-compass 用 **centered** 同四值;`higherOrder.self-enhancement` 又**含** hedonism。三处"自我增强"口径不一,同一用户可在 archetype 与 meaning-compass 得到**相反**极性。
- **改法**:抽出单一 `deriveValueOrientation(schwartz)` SSOT(raw or centered 二选一,文档化理由),archetype + meaning-compass + higherOrder 全部复用;hedonism 归属统一注释。
- **影响**:meaning-compass 极性可能与现状不同;需回归 narrative 测试。
- **依据**:测量不变性要求同一构念单一算法;raw vs centered 各有据(raw 保 QD 不变性,centered 去 acquiescence),但**不能并存两套**。
- **建议**:统一为 raw(与 QD 一致)+ 显式文档;或统一 centered 但 QD 同步改。需你定。

### A3 — PVQ-21 MRAT 污染(F9)`index.ts:202`+`score-ddvq21.ts:86` · **休眠**(无 live 暴露)

- **暴露面更新**:`use-assessment-submission.ts:197` 前端把 pvq→values remap;`api/score:189` 恒传 values。**live web 永不走 pvq 分支**。仅直接 API 传 21-key pvq 才触发。
- **改法**(P3 清理):MRAT 只对 `DDVQ21_VALUE_MAP` 映射到的 item 求均值(而非 `Object.values(answers)` 全部);或删除 deprecated pvq 分支。
- **建议**:低优先级清理,顺手修防御。

### A4 — Collab 平局固定 D(F11-collab)`layer3-derive.ts:174` · live 边界用户

- **现状**:D/I/S/C 全等(完全中点大五)时 `sorted[0]` 按数组顺序固定选 D。仿真:随机 collab primary D 1398 > 其他,有 D 偏。
- **改法**:平局时 `secondary=null` 已有;primary 平局可标 balanced 或按 confidence。
- **建议**:与 A1 同理,平局表达"均衡"。低优先级。

### A5 — SJT secondary 未持久化(F14)`score-sjt.ts:75` · live 数据缺口

- **现状**:SJT-6 secondary domain 的 score/gap 算了只喂 notableTensions,结果只存 `domainSecondary`,论文无法复核 secondary tension 方向/幅度。
- **改法**:`SJTTensionScore` 加 `wouldScoreSecondary/shouldScoreSecondary/gapSecondary` 字段并写入。纯增量。
- **建议**:论文采集前采纳(数据完整性)。低风险。

---

## B. 非冻结但改输出行为(起草,等你拍板方向)

### B1 — Schwartz 43% 双重计入(F8 实质修复)`weights.ts`+`adaptability.ts` · **live 每次匹配** · P1 方法论

- **现状**:valueFit 28% + adaptabilityFit 15% 都来自 Schwartz(adaptability = ipsative stimulation−security)→ 单一量表占 43%,注释已纠正但**权重未改**。
- **改法**(任选):
  1. **降 adaptability 权重并补独立信号**:adaptability 改用职业 AI 暴露 × 非 Schwartz 的个人信号(如大五开放性/尽责性),恢复 4 独立维度(**推荐**,治本);
  2. 或合并 values+adaptability 为单一"Schwartz 块"显式占 43% 并文档化(治标,诚实);
  3. 或保持现状,论文 limitations 明写"values 与 adaptability 共享 Schwartz 方差"。
- **影响**:改权重 = 所有用户匹配排序变动,需重跑仿真对比 + 黄金样本。
- **依据**:加权线性组合假设因子近似独立;共享量表方差会系统性放大 Schwartz、低估 RIASEC/大五。这正是 v2 移除 collabFit 的同类问题。
- **建议**:(1) 为佳,但属 R 类(改匹配输出),需你确认后我出补丁 + 仿真对比。

### B2 — RIASEC interest fit 余弦压缩(F1)`factors/riasec.ts:18` · **live 每次匹配** · 方法论

- **现状**:纯 cosine,全正向量 → 最佳匹配恒 ~98%、全库对中性用户 74-99%。排序有效但展示%虚高、顶部无区分度。
- **改法**(任选):
  1. 展示层把 cosine 重标定(如减去人群基线、percentile rank)使"匹配度%"有区分度(**推荐**,不动排序,仅改 UI 数字);
  2. 或换 Holland 一致性指数(Iachan/C-index)需 RIASEC code 化,改动大;
  3. 或保留 cosine 排序但论文用秩次相关报告效度。
- **影响**:(1) 仅改显示,不动排序,风险低;(2) 改排序,风险高。
- **依据**:见 Layer 3 文献(下一步)。Brown & Gore 2000 C-index、Holland 1997。
- **建议**:先做 (1)(展示重标定)+ Layer 3 文献给论文措辞。

### B3 — client/server resilience 不一致(F10)`client-engine.ts:191` vs `engine.ts:309` · live QD 预览

- **现状**:client 对 resilience=3 加 +2,server 不加 → 同 RIASEC 在 QD 预览与报告可能不同序。
- **改法**:二选一对齐。server(报告权威)不加 → 建议**删 client 的 +2**(对齐到 server,报告路径不变)。
- **影响**:仅 QD 客户端预览排序微变,报告路径不动。
- **建议**:删 client +2,低风险。

### B4 — profile 平局固定默认(F11)`leadership-style.ts:50`/`interpersonal-energy.ts:88`/`meaning-compass.ts:67` · live 边界用户

- **现状**:平局/完全中点按对象 key 顺序固定选 visionary / assured-warm / transcendence。
- **改法**:平局/中点显式表达"均衡/不确定",或标低 confidence;meaning-compass:67 与 A1/A2 一并处理。
- **建议**:与 A1 统一"平局即均衡"策略,批量处理。低优先级。

### B5 — tier 默认带 {4,5}(F5)`engine.ts:246` · live(未传 null 时)

- **现状**:默认对 zone 2-3(46% 库存)施 tier 惩罚。论文已用 `targetTier:null` 规避;产品默认仍带白领假设。
- **建议**:产品决策,非 bug。确认目标人群后决定默认值;论文路径维持 null。

---

## C. 休眠项(0 live 暴露,记录备查)

- **F12** valueFit 自定义标签映射不一致 — 职业库 alignedValues 全为纯 Schwartz(growth/meaning/creation/freedom = 0),`toSchwartz` no-op,当前不可触发。
- **big-five/adaptability 缺标注回退 60** — 实测 0% 职业缺标注,从不触发。
- 三者均为防御性清理,可顺手修但无紧迫性。

---

## D. 🔴 用户实测信号确认 — 认知风格 J/P(及四轴)系统性偏倚(F15)`index.ts:66-94` · **冻结** · live 全体用户

- **现象(用户报告 + 真实数据 N=36 确认)**:网上测 P 的人在 profile 几乎全变 J。实测 **J 86% / P 14%**;同款偏倚 F 92%、N 92%、E 81% → 几乎人人 ~ENFJ。
- **根因**:`deriveCognitiveStyleFromBigFive` 四轴**全部用 `midpoint=3.0`(1-5 量表理论中点)做切分**。但 Big Five 自评因社会赞许性**正偏**(实测均值:尽责 3.46 / 宜人 3.60 / 开放 3.59 / 外向 3.34),用"量表中点"而非"人群中位数"切 → 系统性把多数人推向高极(J/F/N/E)。网上 MBTI 用常模化/强迫选择切点,故接近 50/50。**这是测量设计缺陷,非代码 bug**。
- **改法(冻结区,起草)**:
  1. **常模参照切点**(推荐):每轴用人群均值/中位数(实测≈尽责 3.46、宜人 3.60、开放 3.59、外向 3.34、神经质 2.93,与 IPIP-NEO 公开常模吻合)替代 3.0;或 Z-score 对常模后切 0;
  2. 或累积样本中位数自适应切点(需参考分布,冷启动有 chicken-and-egg);
  3. 配合扩大 `isNear`(near-midpoint 抑制带)宽度,让更多边界用户显示 balanced。
- **影响**:改善后 J/P 接近 50/50,所有用户的认知风格码会变;narrative 需回归;论文若报告认知风格,现状是系统性偏倚必须修。
- **依据**:绝对量表中点 ≠ 人群中位数;Big Five 自评正偏是公认现象。McCrae & Costa:TF/JP 仅中等相关,更应常模化而非绝对切。
- **建议**:**采纳 (1) 常模参照切点**,这是本次审计**对用户最可见的真问题**。冻结区,等你授权解冻。⚠️ 我此前纯随机仿真未发现此项(随机均值压在 3.0),靠用户真实信号才暴露——已记为仿真盲区。

## 优先级建议(我的推荐)

1. **B1 Schwartz 43%**(治本需你授权改权重)+ **B2 余弦展示重标定** — 两个 live 方法论,最影响论文效度与产品可信度。
2. **A1 取向平局** + **A2 口径统一** — 冻结区,影响 archetype 一致性,建议一起改。
3. **A5 SJT secondary**(数据完整性,论文前)+ **B3 client/server**(低风险一致性)。
4. 其余(A3/A4/B4/B5/C)= 低优先级 / 产品决策 / 休眠清理。
