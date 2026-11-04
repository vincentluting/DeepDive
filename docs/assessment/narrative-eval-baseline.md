---
title: Narrative Eval Baseline
category: assessment
sources:
  - lib/evals/narrative-eval.ts
  - lib/evals/narrative-eval-baseline.ts
  - scripts/narrative-eval.ts
sync_mode: manual
last_verified: 2026-04-03
verified_by: codex
---

# Narrative Eval Baseline

目的: 给 `profile`、`report`、`coaching` 三条叙事链路建立一个可重复跑的最低质量基线，避免继续凭主观感觉调模型。

当前版本是 **v0 deterministic baseline**:

- 不引入新的 judge task
- 不依赖额外 provider 路由
- 可以离线评估本地 JSON，也可以评估 DB 中最新真实输出

## 入口

命令:

```bash
npm run eval:narratives
```

这会运行内置 golden cases。

其他常用方式:

```bash
node --import tsx scripts/narrative-eval.ts --input ./output/profile.json --kind profile
node --import tsx scripts/narrative-eval.ts --db report --user-id USER_ID
node --import tsx scripts/narrative-eval.ts --db all --user-id USER_ID --output ./output/narrative-eval.json
```

长期建议:

- 在仓库内通过 `npm run ...` 或 `node --import tsx ...` 运行
- 不要依赖 `npx tsx ...` 的临时解析行为

## 评估维度

- `specificity`: 是否有场景感、动作感、具体行为，而不是空泛描述
- `integration`: 是否真正把多个线索织在一起，而不是平铺直叙
- `antiBarnum`: 是否避免鸡汤、测量腔、对谁都成立的空话
- `repetition`: 是否有句式/段落重复
- `dialogic`: 仅 coaching 使用，检查是否保持提问式、反映式、非处方式风格

## 数据来源

支持三种输入:

- 内置 golden cases: `lib/evals/narrative-eval-baseline.ts`
- 本地文件: `--input ... --kind profile|report|coaching`
- 数据库最新记录: `--db profile|report|coaching|all [--user-id ...]`

提取逻辑:

- `profile`: 从 `narrativeSnapshots` 提取
- `report`: 从 `careerMatch` / `careerPathway` / `integration` 提取
- `coaching`: 从 `CoachingSession.messagesJson` 中提取 assistant 消息

## 当前阈值

默认通过线:

- `profile` / `report`: overall >= 75
- `coaching`: overall >= 72

Golden cases 使用更高阈值，目的是让样例本身成为“你希望未来模型接近的质量下限”。

## 已知限制

- 这是结构化启发式，不是语义 judge
- 它能拦住“明显变差”，但不能单独证明“已经最优”
- 对英文的词面信号比中文更敏感
- 还没有把人工 blind review 结果写回到同一套评估产物里

## 下一阶段

这套 baseline 的下一步不是继续堆更多规则，而是：

1. 加 10-20 个真实 golden cases
2. 把 blind review 分数并入同一份输出
3. 在不改现有路由的前提下，加一个受控的 LLM-as-judge 模式
