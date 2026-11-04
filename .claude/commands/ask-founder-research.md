---
description: 把白天遇到的决策问题追加到 Founder/问题队列.md，今晚 23:00 反向调研任务自动深挖，明早看答案
---

# /ask-founder-research — 反向调研入口（Pull 模式）

> Night Shift v2 的核心 Pull 机制。你白天遇到决策卡点 → 提问 → AI 当晚深挖 30 分钟 → 明早看 6 页答案。

## 用法

```
/ask-founder-research <你的问题>
```

## 例子

```
/ask-founder-research 12 型原型如果做付费墙，应该锁哪几型最不影响留存？
/ask-founder-research 论文里"跨文化职业身份"这个概念，最近 5 年学术圈是怎么发展的？
/ask-founder-research 如果我想做一个面向荷兰女性创业者的细分版本，TAM 大概多大？
/ask-founder-research Deep Dive 的 12 型 IP 化（卡通+周边）参考哪些已有案例？
```

## 命令流程

1. **读取参数**：把 `$ARGUMENTS` 作为完整问题文本
2. **检查 Founder 目录**：
   - 路径：`/Users/l/Documents/LifeOS/04 Projects/Deep Dive/Founder/`
   - 如不存在 → 输出"Founder 目录不存在，请先按 ~/.claude/plans/night-shift-a-i-transient-hopper.md 创建目录和必要文件"，结束
3. **检查 问题队列.md**：
   - 路径：`/Users/l/Documents/LifeOS/04 Projects/Deep Dive/Founder/问题队列.md`
   - 如不存在 → 创建，初始内容：

     ```markdown
     # 反向调研问题队列

     > Night Shift v2 / ask-founder-research 命令追加问题到这里
     > 每晚 23:00 cron 任务自动处理"未答"问题，输出到 Founder/答案/

     ## 未答

     ## 已答
     ```
4. **追加问题**：在"## 未答"段落下追加一行：
   ```
   - [ ] [YYYY-MM-DD HH:MM] <问题文本>
   ```
   时间戳用本地时区，便于追踪问题提出时间
5. **统计未答数量**：扫描"## 未答"段落下的 `- [ ]` 行数
6. **输出确认**：

```
✅ 问题已追加到 Founder/问题队列.md

问题：<问题文本>
追加时间：YYYY-MM-DD HH:MM
当前未答队列：N 个问题

📅 处理时间：今晚 23:00（如未部署 night-shift 则不会自动处理）
📂 答案输出：Founder/答案/YYYY-MM-DD-<问题摘要>.md
🔁 处理后会自动把"- [ ]"改为"- [x]"并追加答案文件链接

提示：
- 如果今晚没部署 night-shift，可以手动跑：cat 问题队列.md 然后用 /research 处理
- 队列累积太多（>5）建议精简，AI 一晚处理太多会失焦
```

## 设计要点

**为什么不立即调研**：

- 白天你只是有"想问的问题"，不是"必须立刻知道答案"
- 立刻调研 = 打断你白天的工作流（一次 30 分钟深挖）
- 攒到夜间批量处理 = 不打断 + 充分使用 Claude API 算力

**为什么把问题追加到文件而不是直接调用 cron**：

- 文件可见、可编辑、可手动取消（你后悔了可以删行）
- cron 任务集中在 23:00 处理，不会触发新 cron
- 队列文件是 fit-score 和 demo 候选任务的潜在输入源（"创始人本月最关心什么"）

**何时不该用这个命令**：

- 简单事实查询 → 直接 WebSearch / `/research`
- 需要立刻看答案 → `/research` 或 `/btw`
- 需要写代码 → `/impact-analysis` 或直接开工

**何时应该用**：

- 战略性问题（市场/护城河/定位）
- 需要交叉数据源的问题（学术 + 行业 + 竞品 + 用户原声）
- 不紧急但重要、值得花 30 分钟深挖的
- 批量积累的问题（比如周末想清空一批问题）

## 维护

- 已答问题超过 30 天 → 可手动从"## 已答"段落归档到 Founder/archive/
- 问题队列.md 不应超过 200 行，超了说明你没看答案，先看完再继续问
