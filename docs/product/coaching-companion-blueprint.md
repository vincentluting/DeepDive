---
title: AI Coaching Companion 陪跑系统蓝图
category: product
sources:
  - lib/coaching-companion/
  - lib/db/action-hub.ts
  - scripts/schema.sql
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Deep Dive — AI Coaching Companion 陪跑系统 完整产品蓝图

> **版本**: 2.0 | **日期**: 2026-03-06
> **定位**: 从"认识自己"到"持续成长"的结构化陪伴系统
> **与 Action Hub 的关系**: Coaching Companion 是 Action Hub 的灵魂引擎，Action Hub 是 Coaching Companion 的行动骨架

---

## 目录

1. [战略重新定位](#一战略重新定位)
2. [统一产品架构](#二统一产品架构)
3. [陪跑计划体系设计](#三陪跑计划体系设计)
4. [每日陪跑引擎 (Daily Engine)](#四每日陪跑引擎)
5. [数据模型设计](#五数据模型设计)
6. [AI 架构深度设计](#六ai-架构深度设计)
7. [前端体验设计](#七前端体验设计)
8. [API 路由设计](#八api-路由设计)
9. [与现有系统的精确集成](#九与现有系统的精确集成)
10. [商业模式与增长飞轮](#十商业模式与增长飞轮)
11. [分阶段实施计划](#十一分阶段实施计划)
12. [长期愿景路线图](#十二长期愿景路线图)

---

## 一、战略重新定位

### 1.1 问题的更深层本质

Action Hub 蓝图已经识别了"报告后断裂"的问题，但更深层的问题是：

```
断裂点不只在报告之后，而是在每一天。

用户不是不知道该做什么（报告告诉了他们），
而是不知道「今天」该做什么、「此刻」该怎么开始、
「遇到阻力时」该怎么继续。

这不是工具问题，这是陪伴问题。
```

竞品（Careerflow、Apt）提供的是**工具**——简历优化器、面试模拟器。这些工具解决的是"效率"问题。但职业探索的核心障碍不是效率，而是**持续性**和**勇气**。

### 1.2 Deep Dive 的终极定位

```
竞品: "我帮你做得更快" (效率工具)
Deep Dive: "我陪你走得更远" (成长陪伴)

竞品是出租车——告诉它目的地，它把你送到。
Deep Dive 是徒步旅行的同伴——一起探索，一起发现，一起成长。
```

### 1.3 产品演进路线（统一版）

```
                    已完成                         本蓝图核心
                 ┌──────────┐              ┌───────────────────┐
Phase 0:         │ 评估专家  │              │                   │
Assessment       │ "我知道   │   Phase 1:   │  行动伙伴          │
Expert           │  自己是   │   Action +   │  "我知道今天该做    │
                 │  谁了"    │   Coaching   │   什么，有人陪我做" │
                 └──────────┘   Companion   │                   │
                                            └───────────────────┘
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                              Phase 2:         Phase 3:         Phase 4:
                              Growth           Career           Community
                              Coach            Navigator        Mentor
                              "我看到自己       "我有持续进化     "我和同路人
                               在成长"          的导航系统"       一起成长"
```

### 1.4 核心洞察：为什么"陪跑"而非"工具"

| 维度     | 工具模式             | 陪跑模式               |
| -------- | -------------------- | ---------------------- |
| 用户关系 | 交易性（用完即走）   | 关系性（每天回来）     |
| 个性化   | 基于输入参数         | 基于累积理解           |
| 留存机制 | 功能依赖             | 情感连接 + 习惯        |
| 竞争壁垒 | 功能可复制           | 关系不可复制           |
| LTV      | 低（一次付费或低频） | 高（订阅制，持续价值） |
| 数据飞轮 | 无                   | 越用越准，越准越用     |

---

## 二、统一产品架构

### 2.1 Coaching Companion × Action Hub 统一视图

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Deep Dive 统一产品架构                             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Coaching Companion (陪跑系统)                    │    │
│  │                                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │ 7天冲刺  │  │ 30天深潜 │  │ 90天航行 │  │ 持续陪伴 │   │    │
│  │  │ Sprint   │  │ Deep     │  │ Voyage   │  │ Ongoing  │   │    │
│  │  │          │  │ Program  │  │          │  │ Companion│   │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │    │
│  │       └──────────────┴──────────────┴──────────────┘        │    │
│  │                          │                                   │    │
│  │  ┌───────────────────────┴───────────────────────────┐      │    │
│  │  │          Daily Engine (每日陪跑引擎)                │      │    │
│  │  │                                                    │      │    │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │      │    │
│  │  │  │ Morning  │  │ Micro    │  │ Evening  │        │      │    │
│  │  │  │ Briefing │  │ Actions  │  │ Reflect  │        │      │    │
│  │  │  │ 晨间导航 │  │ 微行动   │  │ 晚间复盘 │        │      │    │
│  │  │  └──────────┘  └──────────┘  └──────────┘        │      │    │
│  │  └───────────────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                          │                                          │
│  ┌───────────────────────┴───────────────────────────────────┐     │
│  │              Action Hub (行动骨架)                          │     │
│  │                                                            │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │     │
│  │  │ Action   │  │ Toolkit  │  │ Progress │  │ Social   │ │     │
│  │  │ Board    │  │ 工具箱   │  │ Tracker  │  │ Share    │ │     │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │     │
│  └───────────────────────────────────────────────────────────┘     │
│                          │                                          │
│  ┌───────────────────────┴───────────────────────────────────┐     │
│  │              Data Foundation (评估数据基座)                  │     │
│  │                                                            │     │
│  │  RIASEC × Schwartz × Big Five × SJT × Archetype          │     │
│  │  CareerReport × UserMemory × RealConditions × Resume      │     │
│  └───────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 关键设计决策：Coaching Companion 驾驭 Action Hub

```
不是: 用户打开 Action Hub → 看到待办列表 → 自己去做 → 卡住了找教练
而是: 教练每天告诉用户 → "今天做这个" → 工具箱辅助完成 → 教练帮你复盘

Coaching Companion 是司机，Action Hub 是地图，Toolkit 是装备。
```

---

## 三、陪跑计划体系设计

### 3.1 四种计划类型

```
                    免费                              付费
              ┌──────────────┐              ┌──────────────────┐
  短期        │  7天冲刺      │              │  30天深潜         │
  (习惯养成)  │  Sprint       │              │  Deep Program     │
              │  "快速启动"   │              │  "系统探索"       │
              │               │              │                   │
              │  目标: 让用户 │              │  目标: 建立职业   │
              │  体验到价值   │              │  探索的系统方法   │
              └──────────────┘              └──────────────────┘

              ┌──────────────┐              ┌──────────────────┐
  长期        │  持续陪伴     │              │  90天航行         │
  (深度转化)  │  Ongoing      │              │  Voyage           │
              │  "轻量保持"   │              │  "职业转型"       │
              │               │              │                   │
              │  目标: 保持   │              │  目标: 完成实质   │
              │  用户活跃     │              │  性职业行动       │
              └──────────────┘              └──────────────────┘
```

### 3.2 七天冲刺 (7-Day Sprint) — 免费 · 核心转化引擎

**目标人群**: 刚完成报告的用户，对结果感兴趣但不知道下一步怎么做

**设计哲学**: 每天 5-10 分钟，7 天建立"每日职业探索"习惯

```
Day 1: "认识你的报告" (Debrief)
  ├── 晨间 (2min): 教练发来一段基于报告的个性化开场白
  │   "作为[拓路者]，你最大的优势是...但你可能还没意识到..."
  ├── 微行动 (5min): 重读报告中最触动你的一段话，写下 3 个关键词
  └── 晚间 (3min): 教练问 "这3个关键词中，哪个让你最兴奋？"

Day 2: "发现你的方向" (Direction)
  ├── 晨间: 教练呈现 Career Pathway 的 Top 3 方向，用类比解释每个
  │   "[UX 研究员] 就像你的 [Decoder] 原型在数字世界的化身..."
  ├── 微行动: 从 3 个方向中选 1 个，Google 搜索 "一天的日常"
  └── 晚间: 教练问 "搜索之后，你的感受是？" + 引导反思

Day 3: "听听真实的声音" (Real Voices)
  ├── 晨间: 教练生成 3 个 LinkedIn 搜索语句，找相关从业者
  ├── 微行动: 在 LinkedIn 找到 3 个目标方向的从业者，浏览他们的经历
  └── 晚间: 教练问 "谁的经历最吸引你？为什么？"

Day 4: "你的价值观地图" (Values Map)
  ├── 晨间: 教练解读你的 Schwartz 价值观 Top 3
  │   "你最看重[自主性]和[刺激性]——这意味着..."
  ├── 微行动: 写下当前工作/学习中最让你有能量和最消耗你的各 3 件事
  └── 晚间: 教练将你写的与 Career Drain 结果对比，给出洞察

Day 5: "第一次对话" (First Conversation)
  ├── 晨间: 教练帮你生成一封信息访谈邀约消息 (使用 Toolkit)
  ├── 微行动: 发出至少 1 条邀约消息（LinkedIn/Email）
  └── 晚间: 教练鼓励 + 如果被拒绝了怎么处理

Day 6: "你的故事" (Your Story)
  ├── 晨间: 教练帮你构建一个 30 秒的自我介绍 (基于 SelfPortrait)
  ├── 微行动: 对着镜子/录音练习这个自我介绍 3 次
  └── 晚间: 教练问 "说出来的感觉如何？哪个部分最自然？"

Day 7: "你的计划" (Your Plan)
  ├── 晨间: 教练总结 7 天的发现 + 生成个性化 30 天行动建议
  ├── 微行动: 从建议中选 3 个作为下月目标
  └── 晚间: 教练庆祝 + 引导进入 30 天计划 (转化点)
```

**关键设计点**:

- Day 1-2: 纯回顾 + 信息收集（零门槛，建立信任）
- Day 3-4: 轻度外部行动（搜索，不需要和人交流）
- Day 5-6: 中度外部行动（发消息，练习表达）
- Day 7: 承上启下（总结 + 转化为 30 天计划）
- 每天总时间 ≤ 10 分钟（尊重用户的时间，建立微习惯）

### 3.3 三十天深潜 (30-Day Deep Program) — 付费核心

**目标人群**: 完成 7 天冲刺的用户，认真考虑职业探索/转型

**四周主题**:

```
Week 1: "深度认知" (Deep Awareness)
  目标: 将评估结果转化为日常自我觉察
  ┌────────────────────────────────────────────────────────┐
  │ Day 8:  Big Five 日常观察 — 在工作中注意自己的 O/C/E/A/N 表现 │
  │ Day 9:  RIASEC 活动审计 — 记录一天的活动，标注各属于哪个维度  │
  │ Day 10: 价值观冲突日记 — 发现价值观被违背的具体时刻         │
  │ Day 11: Collaboration Style 实验 — 在会议中刻意使用非主导风格 │
  │ Day 12: SJT 张力觉察 — 记录"我想这样做但实际那样做了"的时刻  │
  │ Day 13: 周末任务: 完成一篇 300 字"我的职业自画像"           │
  │ Day 14: 周末复盘: 与教练深度对话，整合一周发现               │
  └────────────────────────────────────────────────────────┘

Week 2: "外部探索" (External Exploration)
  目标: 从内心世界走向外部市场
  ┌────────────────────────────────────────────────────────┐
  │ Day 15: 行业地图绘制 — 用工具箱生成目标行业分析            │
  │ Day 16: 信息访谈 #1 — 准备 + 执行 (教练提供话术)          │
  │ Day 17: 信息访谈复盘 — 与教练讨论收获和意外发现            │
  │ Day 18: 简历/LinkedIn 审视 — 用工具箱优化 (基于评估数据)   │
  │ Day 19: 技能差距分析 — 教练帮你对比评估结果和目标要求       │
  │ Day 20: 学习计划制定 — 选 1 个关键技能，制定 2 周学习计划   │
  │ Day 21: 周末复盘: 目标方向是否需要调整？                   │
  └────────────────────────────────────────────────────────┘

Week 3: "技能构建" (Skill Building)
  目标: 开始补充关键技能 + 继续网络扩展
  ┌────────────────────────────────────────────────────────┐
  │ Day 22: 学习进展检查 — 教练跟进学习计划执行情况             │
  │ Day 23: 信息访谈 #2 — 更有针对性（基于 Week 2 的发现）     │
  │ Day 24: Side Project 启动 — 设计一个 2 周可完成的小项目     │
  │ Day 25: 原型成长边界挑战 — 做一件你的成长边界内的事         │
  │ Day 26: 面试准备开始 — 用工具箱做第一次模拟面试             │
  │ Day 27: 面试复盘 — 教练分析你的回答风格和改进点             │
  │ Day 28: 周末复盘: 中期全面评估 + 计划调整                  │
  └────────────────────────────────────────────────────────┘

Week 4: "行动冲刺" (Action Sprint)
  目标: 将探索转化为具体行动
  ┌────────────────────────────────────────────────────────┐
  │ Day 29: 目标职位锁定 — 从探索模式切换到行动模式             │
  │ Day 30: Cover Letter 工作坊 — 用工具箱生成 + 教练优化       │
  │ Day 31: 申请策略制定 — 教练帮你制定个性化申请策略           │
  │ Day 32: 第一份申请 — 投出去！教练全程陪伴                  │
  │ Day 33: 拓展申请 — 教练帮你调整策略，扩大范围               │
  │ Day 34: Networking Follow-up — 联系信息访谈中的人           │
  │ Day 35: 30天回顾 — 教练生成全面进展报告 + 前后对比          │
  │ Day 36-37: 缓冲日 — 补完未完成的行动 / 深度教练对话         │
  └────────────────────────────────────────────────────────┘
```

### 3.4 九十天航行 (90-Day Voyage) — 高端付费

**目标人群**: 认真进行职业转型的用户

**三月主题**:

```
Month 1: "发现" (Discovery) — 即 30-Day Deep Program
Month 2: "构建" (Building)
  - 深度技能学习 + 作品集/Portfolio 构建
  - 每周 2 次信息访谈
  - 行业活动参与
  - 教练每周一次深度对话 (30min)

Month 3: "启航" (Launch)
  - 密集求职期
  - 每周 3-5 份定制申请 (工具箱辅助)
  - 面试准备 + 复盘循环
  - 薪资谈判准备
  - 教练陪伴到 offer 阶段
```

### 3.5 持续陪伴 (Ongoing Companion) — 免费基础 / 付费增强

**目标人群**: 所有注册用户

```
免费层:
  - 每周一条基于评估结果的洞察推送 (Weekly Insight)
  - 每月一次进度快照 (Monthly Snapshot)
  - 探索深度可视化 (DepthRing 增强版)
  - 社区（如果未来开放）

付费层 (订阅制):
  - 每日微行动 + 教练对话 (无限)
  - 工具箱全功能 (无限次)
  - 季度深度教练会话 (45min)
  - 能力雷达图变化追踪
  - 优先获得新功能
```

---

## 四、每日陪跑引擎 (Daily Engine)

### 4.1 三节点日循环

这是整个陪跑系统的心跳。每天三个触点，总计 ≤ 10 分钟：

```
┌──────────────────────────────────────────────────────┐
│                    一天的陪跑节奏                       │
│                                                       │
│  ☀️ 晨间导航 (Morning Briefing) — 2-3 分钟            │
│  │  "今天的你，适合做这件事"                           │
│  │  基于: 计划日程 + 评估数据 + 昨日反馈 + 天气/日期   │
│  │  形式: 推送通知 → 打开 App → 阅读 + 确认            │
│  │                                                     │
│  ▼                                                     │
│  ⚡ 微行动 (Micro Action) — 5-15 分钟                  │
│  │  "做这一件小事"                                     │
│  │  基于: 今日计划 + Action Board 当前项               │
│  │  形式: 卡片式任务 → 完成标记 → 可选笔记             │
│  │  类型: 阅读/搜索/写作/联系/练习/反思                │
│  │                                                     │
│  ▼                                                     │
│  🌙 晚间复盘 (Evening Reflection) — 2-3 分钟           │
│     "今天你发现了什么？"                               │
│     基于: 今日微行动完成情况                           │
│     形式: 1 个选择题 + 1 个开放文本框                  │
│     教练回应: 即时反馈 + 明天预告                      │
└──────────────────────────────────────────────────────┘
```

### 4.2 每日内容生成算法

```
Morning Briefing 生成:

输入:
  - programDay: number (计划中的第几天)
  - dayTheme: string (今日主题, 来自计划模板)
  - assessmentContext: {
      archetype, riasecTop3, schwartzTop3,
      bigFiveProfile, sjtTensions, careerDrain
    }
  - yesterdayReflection: string | null (昨日复盘内容)
  - completedActions: ActionItem[] (已完成行动列表)
  - streakDays: number
  - locale: 'en' | 'zh'

处理:
  Step 1: 选择今日内容模板 (纯算法, 基于 programDay + dayTheme)
  Step 2: 个性化参数注入 (纯算法, 基于评估数据)
    - 选择与 archetype 匹配的语气和类比
    - 选择与 schwartzTop3 对齐的激励方式
    - 如果有 yesterdayReflection, 提取关键词
  Step 3: LLM 生成自然语言 (callLLM('daily-briefing', ...))
    - 50-100 字的个性化开场
    - 今日微行动的具体说明
    - 一句基于原型的鼓励语

输出:
  {
    greeting: string,          // "早安，[拓路者]。"
    insight: string,           // 基于评估的今日洞察
    todayAction: {             // 今日微行动
      title: string,
      description: string,
      estimatedMinutes: number,
      category: ActionCategory,
      sourceType: string,      // 追溯到评估维度
    },
    encouragement: string,     // 基于原型风格的鼓励
    streakMessage?: string,    // "连续第 5 天探索 🔥"
  }
```

### 4.3 微行动 (Micro Action) 类型库

```typescript
// lib/coaching-companion/micro-actions.ts

// 微行动按认知负荷分级
type ActionIntensity = "passive" | "active" | "social" | "creative";

const MICRO_ACTION_TYPES = {
  // 被动型 (2-5 min) — 建立习惯期
  passive: [
    "read_article", // 阅读一篇相关文章
    "watch_video", // 看一个 5min TED 片段
    "browse_profiles", // 浏览 3 个从业者 LinkedIn
    "review_report_section", // 重读报告某个面板
    "listen_podcast", // 听一段播客 (教练推荐)
  ],

  // 主动型 (5-15 min) — 知识构建期
  active: [
    "journal_prompt", // 写日记 (教练给提示)
    "skill_practice", // 练习一个技能 (教练指导)
    "values_audit", // 价值观日常审计
    "career_drain_log", // 记录消耗时刻
    "strength_exercise", // 优势练习
    "resume_section", // 优化简历一个部分
  ],

  // 社交型 (10-30 min) — 外部探索期
  social: [
    "send_message", // 发一条信息访谈邀约
    "informational_interview", // 进行一次信息访谈
    "attend_event", // 参加一个线上活动
    "networking_followup", // 跟进一位联系人
    "share_discovery", // 与信任的人分享发现
  ],

  // 创造型 (15-45 min) — 作品构建期
  creative: [
    "side_project_step", // Side project 推进一步
    "portfolio_piece", // 制作一个作品集素材
    "elevator_pitch_practice", // 电梯演讲练习
    "cover_letter_draft", // Cover Letter 初稿
    "interview_simulation", // 模拟面试一轮
  ],
};

// 每日推荐算法
// Phase 1 (Day 1-7):   80% passive, 20% active
// Phase 2 (Day 8-14):  40% passive, 40% active, 20% social
// Phase 3 (Day 15-21): 20% active, 40% social, 40% creative
// Phase 4 (Day 22-30): 10% active, 30% social, 60% creative
```

### 4.4 晚间复盘 (Evening Reflection) 设计

```
复盘不是汇报，是自我对话的仪式。

结构:
  1. 快速反馈 (单选, 30s)
     "今天的微行动对你来说..."
     ○ 轻松完成  ○ 有点挑战但做到了  ○ 很难但坚持了  ○ 没能完成

  2. 一句话发现 (自由文本, 1-2min)
     "今天最让你意外/触动/好奇的一件事是什么？"
     (教练根据计划日程给出不同的引导问题)

  3. 教练即时回应 (LLM 生成, 流式)
     基于:
     - 用户的反馈选择
     - 用户写的一句话
     - 今日微行动的类型和来源维度
     - 用户的 Archetype 风格

     回应风格:
     - Pioneer/Trailblazer → 点燃好奇心，引向更远的方向
     - Guardian/Sentinel → 肯定稳定性，鼓励迈出下一小步
     - Vanguard/Storyteller → 用比喻和叙事重构体验
     - Decoder/Advisor → 提供分析性洞察
     - Catalyst/Captain → 连接到更大的影响力

  4. 明日预告 (纯算法, 15s)
     "明天我们来探索 [主题]。晚安 💤"
```

### 4.5 适应性调整机制

```
系统不是按计划机械执行，而是根据用户行为持续调整:

触发调整的信号:
  1. 用户连续 2 天未完成微行动 → 降低难度，切换到 passive 类型
  2. 用户反馈"太简单" → 提前引入下一阶段类型
  3. 用户某方向的信息访谈获得积极反馈 → 加权该方向的后续行动
  4. 用户的复盘中出现负面情绪关键词 → 教练主动关心，调整节奏
  5. 用户 streak 断了 → "回来真好"而非"你落后了"
  6. 用户完成速度远超预期 → 提供加速选项 (每天 2 个微行动)
  7. 周末 → 可选深度任务 (30min+) 或休息日

调整粒度:
  - 微行动类型 (passive ↔ active ↔ social ↔ creative)
  - 微行动难度 (easy → medium → hard)
  - 教练语气 (鼓励程度 ↑↓)
  - 方向聚焦 (从 3 个方向收敛到 1-2 个)
  - 计划节奏 (正常 / 加速 / 放缓)
```

---

## 五、数据模型设计

### 5.1 新增核心表（在 Action Hub 基础上扩展）

```sql
-- ============================================================
-- 迁移 020: Coaching Companion 核心表
-- (迁移 019 为 Action Hub 表，两者配合)
-- ============================================================

-- 1. 陪跑计划 (Coaching Program)
-- 每个用户可以有多个计划，但同时只有一个 active
CREATE TABLE IF NOT EXISTS CoachingProgram (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  reportId UUID REFERENCES CareerReport(id),

  -- 计划类型
  programType TEXT NOT NULL,
  -- 'sprint_7'     7天冲刺 (免费)
  -- 'deep_30'      30天深潜 (付费)
  -- 'voyage_90'    90天航行 (高端付费)
  -- 'ongoing'      持续陪伴 (订阅)

  -- 计划状态
  status TEXT NOT NULL DEFAULT 'active',
  -- 'active'       进行中
  -- 'paused'       暂停 (用户主动暂停, 可恢复)
  -- 'completed'    已完成
  -- 'abandoned'    放弃 (超过 7 天未活跃)
  -- 'graduated'    毕业 (完成所有里程碑, 区别于 completed)

  -- 时间
  startDate DATE NOT NULL DEFAULT CURRENT_DATE,
  expectedEndDate DATE NOT NULL,
  actualEndDate DATE,
  pausedAt TIMESTAMP,
  pausedDays INTEGER NOT NULL DEFAULT 0, -- 累计暂停天数

  -- 进度
  currentDay INTEGER NOT NULL DEFAULT 1,  -- 计划中的第几天 (扣除暂停)
  totalDays INTEGER NOT NULL,             -- 计划总天数
  currentPhase INTEGER NOT NULL DEFAULT 1, -- 当前阶段

  -- 个性化配置 (首次生成后可被适应性调整)
  configJson JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "intensityLevel": "normal",     // "gentle" | "normal" | "intensive"
  --   "focusDirections": ["UX Researcher", "Product Manager"],
  --   "weekdayMinutes": 10,           // 工作日目标时间
  --   "weekendMinutes": 30,           // 周末目标时间
  --   "preferredBriefingTime": "08:00", // 晨间导航时间
  --   "preferredReflectionTime": "21:00", // 晚间复盘时间
  --   "skipWeekends": false,          // 是否跳过周末
  --   "adaptiveAdjustments": []       // 适应性调整记录
  -- }

  -- 成果统计 (冗余字段, 避免频繁聚合查询)
  streakDays INTEGER NOT NULL DEFAULT 0,
  longestStreak INTEGER NOT NULL DEFAULT 0,
  completedActions INTEGER NOT NULL DEFAULT 0,
  totalEngagementMinutes INTEGER NOT NULL DEFAULT 0,

  -- 元数据
  locale TEXT NOT NULL DEFAULT 'en',
  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_program_user_status ON CoachingProgram(userId, status);
CREATE INDEX idx_program_active ON CoachingProgram(status)
  WHERE status = 'active';

-- 2. 每日记录 (Daily Entry)
-- 每天一条记录，是陪跑系统的原子数据单元
CREATE TABLE IF NOT EXISTS DailyEntry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programId UUID NOT NULL REFERENCES CoachingProgram(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- 日期与计划日
  entryDate DATE NOT NULL,
  programDay INTEGER NOT NULL,  -- 计划中的第几天
  dayTheme TEXT NOT NULL,       -- 今日主题 key (映射到模板)

  -- 晨间导航
  briefingGeneratedAt TIMESTAMP,
  briefingContent JSONB,
  -- {
  --   "greeting": "早安，拓路者。",
  --   "insight": "...",
  --   "todayAction": { title, description, category, estimatedMinutes, sourceType },
  --   "encouragement": "...",
  --   "streakMessage": "连续第5天 🔥"
  -- }
  briefingViewedAt TIMESTAMP,

  -- 微行动
  microActionType TEXT,          -- 具体的微行动类型 key
  microActionIntensity TEXT,     -- passive | active | social | creative
  microActionStartedAt TIMESTAMP,
  microActionCompletedAt TIMESTAMP,
  microActionSkipped BOOLEAN DEFAULT false,
  microActionNote TEXT,          -- 用户的行动笔记

  -- 关联到 Action Hub 的 ActionItem (如果微行动对应了一个正式行动)
  actionItemId UUID REFERENCES ActionItem(id),

  -- 晚间复盘
  reflectionCompletedAt TIMESTAMP,
  reflectionFeedback TEXT,       -- 'easy' | 'challenging_done' | 'hard_persisted' | 'not_done'
  reflectionText TEXT,           -- 用户的一句话发现
  reflectionCoachResponse TEXT,  -- 教练的回应
  reflectionCoachResponseAt TIMESTAMP,

  -- 适应性信号
  engagementScore INTEGER,       -- 0-100, 算法计算
  -- 基于: 是否查看 briefing, 是否完成 action, 是否提交 reflection
  -- briefing_viewed: +30, action_completed: +40, reflection_done: +30
  moodSignal TEXT,               -- 从复盘文本提取的情绪信号
  -- 'positive' | 'neutral' | 'struggling' | 'excited' | null

  createdAt TIMESTAMP NOT NULL DEFAULT now(),
  updatedAt TIMESTAMP NOT NULL DEFAULT now(),

  UNIQUE(programId, entryDate)
);

CREATE INDEX idx_daily_user_date ON DailyEntry(userId, entryDate DESC);
CREATE INDEX idx_daily_program ON DailyEntry(programId, programDay);

-- 3. 计划模板 (Program Template)
-- 硬编码在代码中，但可扩展为 DB 驱动
-- 见 lib/coaching-companion/templates/

-- 4. 教练深度对话记录 (扩展现有 CoachingSession)
-- 不创建新表，而是在 CoachingSession 增加字段
-- 通过迁移在 CoachingSession 添加:
ALTER TABLE CoachingSession
  ADD COLUMN IF NOT EXISTS programId UUID REFERENCES CoachingProgram(id),
  ADD COLUMN IF NOT EXISTS sessionType TEXT DEFAULT 'freeform';
  -- sessionType: 'freeform' (原有) | 'weekly_review' | 'monthly_deep' | 'milestone_celebration'

-- 5. 毕业报告 (Graduation Report)
-- 计划完成时生成的总结性报告
CREATE TABLE IF NOT EXISTS GraduationReport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  programId UUID NOT NULL REFERENCES CoachingProgram(id) ON DELETE CASCADE,
  userId UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- 报告内容
  reportJson JSONB NOT NULL,
  -- {
  --   "summary": { zh, en },       // 30天回顾总结
  --   "keyDiscoveries": [           // 关键发现 (3-5个)
  --     { title, description, relatedDimension, dayDiscovered }
  --   ],
  --   "growthMetrics": {
  --     "actionsCompleted": 23,
  --     "reflectionsWritten": 28,
  --     "networkingContacts": 5,
  --     "toolkitUsages": 8,
  --     "totalEngagementMinutes": 320,
  --     "longestStreak": 12,
  --     "depthGained": 800,         // 陪跑期间增加的深度
  --     "explorationDepthBefore": 1200,
  --     "explorationDepthAfter": 2000,
  --   },
  --   "beforeAfterComparison": {    // 前后对比 (如果有 PrePostAssessment)
  --     "cdse": { before, after, change },
  --     "selfEfficacy": { before, after, change },
  --   },
  --   "nextSteps": [                // AI 生成的后续建议
  --     { title, description, priority }
  --   ],
  --   "coachFinalMessage": string,  // 教练的结业寄语 (基于原型风格)
  -- }

  locale TEXT NOT NULL DEFAULT 'en',
  generatedAt TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_graduation_user ON GraduationReport(userId);
```

### 5.2 完整数据关系图

```
User
 ├── QuickDiveResult
 ├── QuestionnaireSession → AssessmentResult
 ├── RealConditions
 ├── CareerReport ────────→ ActionPlan (Action Hub)
 │    ├── Panel1-3            ├── ActionItem[]
 │    ├── CareerDrain          ├── ActionMilestone[]
 │    └── SelfPortrait         └── ToolkitUsage[]
 │
 ├── CoachingProgram ─────→ DailyEntry[] (每天一条)
 │    │                        ├── briefing
 │    │                        ├── microAction → ActionItem (可选关联)
 │    │                        └── reflection
 │    │
 │    ├── CoachingSession[] (深度对话, programId 关联)
 │    └── GraduationReport (毕业时生成)
 │
 ├── PersonalProfile
 ├── UserMemory
 ├── ProgressSnapshot[]
 └── UserExplorationProgress (depth 扩展)
```

---

## 六、AI 架构深度设计

### 6.1 新增 model-router 任务

```typescript
// lib/ai/model-router.ts 新增

// === Coaching Companion 任务 ===

// 叙事任务 → Anthropic Claude Sonnet 4.5
'daily-briefing':    { provider: 'anthropic', temperature: 0.6, maxTokens: 800  },
// 每日晨间导航，需要温暖个性化的语气

'reflection-response': { provider: 'anthropic', temperature: 0.7, maxTokens: 600 },
// 晚间复盘回应，需要同理心和深度

'graduation-report': { provider: 'anthropic', temperature: 0.5, maxTokens: 3000 },
// 毕业报告叙事，需要回顾性洞察

// 结构化任务 → OpenAI GPT-4o-mini
'daily-action-select': { provider: 'openai', temperature: 0.3, maxTokens: 300  },
// 从 Action 池中选择今日微行动 (结构化输出)

'mood-detect':         { provider: 'openai', temperature: 0.1, maxTokens: 100  },
// 从复盘文本检测情绪信号 (分类任务)

'adaptive-adjust':     { provider: 'openai', temperature: 0.2, maxTokens: 200  },
// 适应性调整建议 (结构化输出)

// === Action Hub 任务 (来自 Action Hub 蓝图) ===
'action-plan':         { provider: 'anthropic', temperature: 0.5, maxTokens: 2500 },
'resume-optimize':     { provider: 'anthropic', temperature: 0.4, maxTokens: 2000 },
'cover-letter':        { provider: 'anthropic', temperature: 0.6, maxTokens: 1500 },
'interview-prep':      { provider: 'anthropic', temperature: 0.7, maxTokens: 1500 },
'elevator-pitch':      { provider: 'openai',    temperature: 0.5, maxTokens: 500  },
'linkedin-optimize':   { provider: 'openai',    temperature: 0.4, maxTokens: 1000 },
'networking-script':   { provider: 'openai',    temperature: 0.5, maxTokens: 800  },
'weekly-digest':       { provider: 'openai',    temperature: 0.3, maxTokens: 500  },
'action-feedback':     { provider: 'openai',    temperature: 0.3, maxTokens: 300  },
```

### 6.2 Daily Briefing Prompt 架构

```typescript
// lib/coaching-companion/prompts/daily-briefing.ts

function buildDailyBriefingPrompt(params: {
  locale: "en" | "zh";
  programDay: number;
  dayTheme: string;
  archetype: string;
  riasecTop: string;
  schwartzTop3: string[];
  bigFiveHighlight: string;
  todayAction: MicroActionTemplate;
  yesterdayReflection: string | null;
  streakDays: number;
  completedPercent: number;
  userFirstName?: string;
}): Message[] {
  const systemPrompt = `
You are an AI career coach for Deep Dive.

${
  params.locale === "en"
    ? "Respond entirely in English. Do not use any Chinese characters."
    : "请全程使用中文回复。不要使用任何英文。"
}

## Your Role
You are a warm, perceptive career coach who knows this user deeply.
You are NOT a generic chatbot. You have deep assessment data about this person.

## User Profile
- Archetype: ${params.archetype}
- Top Interest: ${params.riasecTop}
- Core Values: ${params.schwartzTop3.join(", ")}
- Personality Highlight: ${params.bigFiveHighlight}

## Communication Style for ${params.archetype}
${getArchetypeCoachingStyle(params.archetype)}

## Today's Context
- Program Day: ${params.programDay}
- Day Theme: ${params.dayTheme}
- Streak: ${params.streakDays} days
- Progress: ${params.completedPercent}%
${params.yesterdayReflection ? `- Yesterday's reflection: "${params.yesterdayReflection}"` : ""}

## Task
Generate a morning briefing with:
1. A warm, personalized greeting (1 sentence)
2. Today's insight connected to their assessment profile (2-3 sentences)
3. Today's micro-action description (clear, specific, actionable)
4. An encouragement line in their archetype's style

## Constraints
- Total length: 80-120 words
- Never expose psychology terms (RIASEC, Big Five, Schwartz)
- Use brand language: "directions worth exploring" not "best career for you"
- For low-confidence dimensions, use "you tend to..." hedging
- Reference yesterday's reflection naturally if available
`;

  return [{ role: "system", content: systemPrompt }];
}

// 每个原型的教练语气
function getArchetypeCoachingStyle(archetype: string): string {
  const styles: Record<string, string> = {
    Pioneer:
      "Speak with enthusiasm about uncharted possibilities. Use exploration metaphors.",
    Artisan:
      "Speak with respect for craftsmanship. Emphasize mastery and tangible progress.",
    Decoder:
      "Speak with intellectual curiosity. Offer frameworks and patterns to notice.",
    Advisor:
      "Speak with thoughtful warmth. Provide well-reasoned perspectives.",
    Vanguard:
      "Speak with creative energy. Use artistic metaphors and encourage bold moves.",
    Storyteller:
      "Speak with narrative richness. Frame everything as part of their story.",
    Catalyst: "Speak with social warmth. Connect actions to impact on others.",
    Guardian:
      "Speak with steady reassurance. Emphasize stability within growth.",
    Trailblazer: "Speak with bold confidence. Challenge them to think bigger.",
    Captain:
      "Speak with strategic clarity. Connect actions to long-term positioning.",
    Strategist:
      "Speak with analytical precision. Show the logic behind each step.",
    Sentinel:
      "Speak with reliable consistency. Emphasize structure and careful planning.",
  };
  return styles[archetype] || styles["Pioneer"];
}
```

### 6.3 适应性调整算法

```typescript
// lib/coaching-companion/adaptive-engine.ts

interface AdaptiveSignals {
  recentEngagementScores: number[]; // 最近 3 天的 engagement
  reflectionMoods: string[]; // 最近 3 天的情绪信号
  completionRate: number; // 近 7 天完成率
  streakBroken: boolean; // 今天 streak 是否断了
  userFeedbackPattern: string[]; // 近 7 天的复盘反馈
  currentIntensity: ActionIntensity; // 当前行动强度级别
  programDay: number;
  totalDays: number;
}

interface Adjustment {
  type: "intensity" | "difficulty" | "tone" | "focus" | "pace";
  from: string;
  to: string;
  reason: string;
  confidence: number; // 0-1
}

function computeAdaptiveAdjustments(signals: AdaptiveSignals): Adjustment[] {
  const adjustments: Adjustment[] = [];

  // 规则 1: 连续低 engagement → 降低强度
  const avgEngagement = avg(signals.recentEngagementScores);
  if (avgEngagement < 40 && signals.recentEngagementScores.length >= 3) {
    adjustments.push({
      type: "intensity",
      from: signals.currentIntensity,
      to: downgradeIntensity(signals.currentIntensity),
      reason: "Low engagement for 3+ days",
      confidence: 0.8,
    });
  }

  // 规则 2: 用户反馈 "太简单" 连续 2 次 → 提升难度
  if (lastN(signals.userFeedbackPattern, 2).every((f) => f === "easy")) {
    adjustments.push({
      type: "difficulty",
      from: "current",
      to: "harder",
      reason: "User reports easy for 2+ days",
      confidence: 0.9,
    });
  }

  // 规则 3: 负面情绪信号 → 调整教练语气
  if (signals.reflectionMoods.includes("struggling")) {
    adjustments.push({
      type: "tone",
      from: "standard",
      to: "gentle_supportive",
      reason: "User showing signs of struggle",
      confidence: 0.7,
    });
  }

  // 规则 4: streak 断了 → 温暖回来消息，不施加压力
  if (signals.streakBroken) {
    adjustments.push({
      type: "tone",
      from: "standard",
      to: "welcome_back",
      reason: "Streak broken",
      confidence: 1.0,
    });
  }

  // 规则 5: 完成率 > 90% 且 programDay < totalDays * 0.5 → 提供加速选项
  if (
    signals.completionRate > 0.9 &&
    signals.programDay < signals.totalDays * 0.5
  ) {
    adjustments.push({
      type: "pace",
      from: "normal",
      to: "accelerated",
      reason: "High completion rate, ahead of schedule",
      confidence: 0.75,
    });
  }

  return adjustments;
}
```

### 6.4 记忆演化系统

```
现有记忆系统 (generateMemoriesFromAssessment):
  → 基于评估结果的静态记忆 (10-15 条)
  → 一次性生成，不更新

陪跑记忆演化 (新增):
  → 每天从用户的微行动笔记和复盘中提取新记忆
  → 新记忆与旧记忆合并，更新 confidence
  → 教练的上下文随时间变得越来越丰富

记忆来源优先级:
  1. 评估数据 (confidence: 0.7-0.9) — 稳定基线
  2. 教练深度对话 (confidence: 0.6-0.8) — 高质量洞察
  3. 每日复盘 (confidence: 0.4-0.6) — 大量但碎片化
  4. 微行动完成模式 (confidence: 0.3-0.5) — 行为信号

记忆容量管理:
  - 总上限: 50 条 (从 15 条扩展)
  - 注入教练 prompt: Top 20 by confidence
  - 每周自动衰减: 未被引用的低 confidence 记忆 -0.05
  - 被教练引用的记忆: +0.1 confidence
  - 用户在复盘中主动提及的记忆: +0.15 confidence
```

---

## 七、前端体验设计

### 7.1 新增页面路由

```
app/[locale]/
  companion/                          ← 陪跑系统主入口
    page.tsx                            陪跑仪表盘 (当前计划概览 + 今日任务)
  companion/onboarding/               ← 计划选择 + 偏好设置
    page.tsx
  companion/daily/                    ← 每日交互页 (核心体验)
    page.tsx                            晨间/微行动/复盘 三合一
  companion/review/                   ← 周度回顾
    page.tsx
  companion/graduation/               ← 毕业页
    page.tsx
  companion/history/                  ← 历史计划列表
    page.tsx

  action-hub/                         ← (保持 Action Hub 蓝图的页面)
    ...
```

### 7.2 核心页面: 每日交互页 (companion/daily)

```
┌─────────────────────────────────────────────────────────┐
│  ← companion             Day 12 / 30        ⚙️  │
│                                                          │
│  ╭────────────────────────────────────────────────╮      │
│  │  ☀️ 早安，拓路者。                              │      │
│  │                                                │      │
│  │  昨天你说"和那个 UX 设计师聊完后意外地兴奋"。    │      │
│  │  这很像你的价值观中「刺激性」在被满足的感觉——     │      │
│  │  当你接触全新领域时，你的能量是最高的。           │      │
│  │                                                │      │
│  │  今天，让我们把这份兴奋变成更具体的东西。        │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  ── 今日微行动 ──────────────────────────────────        │
│                                                          │
│  ╭────────────────────────────────────────────────╮      │
│  │  📝 写一封信息访谈感谢信                        │      │
│  │                                                │      │
│  │  给昨天的 UX 设计师写一封简短的感谢信，          │      │
│  │  提到一个你从对话中学到的具体洞察。              │      │
│  │                                                │      │
│  │  预计 10 分钟  ·  社交型                        │      │
│  │  来源: 你的职业方向匹配 → UX 研究员               │      │
│  │                                                │      │
│  │  ┌─────────────────────────────────────────┐   │      │
│  │  │ 💡 使用工具箱生成感谢信模板               │   │      │
│  │  └─────────────────────────────────────────┘   │      │
│  │                                                │      │
│  │  [开始行动]              [跳过今天]            │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  ── 你的笔记 ────────────────────────────────────        │
│  ╭────────────────────────────────────────────────╮      │
│  │  写下你在做的过程中的想法...                     │      │
│  │  ____________________________________________   │      │
│  │  ____________________________________________   │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  [✓ 完成今日行动]                                        │
│                                                          │
│  ── 连续探索 12 天 🔥 ──                                  │
│  ████████████████████░░░░░░░░  Day 12/30  (40%)          │
│                                                          │
│  [查看行动计划]  [与教练深度对话]  [打开工具箱]            │
└─────────────────────────────────────────────────────────┘
```

### 7.3 晚间复盘视图

```
┌─────────────────────────────────────────────────────────┐
│  🌙 晚间复盘                            Day 12          │
│                                                          │
│  今天的微行动对你来说...                                  │
│                                                          │
│  ╭──────╮  ╭──────────────╮  ╭──────────────╮  ╭──────╮ │
│  │ 😊   │  │ 💪           │  │ 😤           │  │ 😔   │ │
│  │ 轻松  │  │ 有挑战但做到  │  │ 很难但坚持了  │  │ 没完成│ │
│  ╰──────╯  ╰──────────────╯  ╰──────────────╯  ╰──────╯ │
│                                                          │
│  今天最让你意外或触动的一件事是什么？                      │
│  ╭────────────────────────────────────────────────╮      │
│  │                                                │      │
│  │  写下你的发现... (一句话就够)                    │      │
│  │                                                │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  [提交复盘 →]                                            │
│                                                          │
│  ── 教练回应 ──                                           │
│  ╭────────────────────────────────────────────────╮      │
│  │  [流式打字效果]                                 │      │
│  │                                                │      │
│  │  写感谢信这件事对你来说"意外地自然"，这很有       │      │
│  │  意思。你在与人交流方面的能力可能比你自己认为      │      │
│  │  的要强——这与你在评估中展现的 [催化者] 特质       │      │
│  │  是一致的。                                      │      │
│  │                                                │      │
│  │  明天我们来探索: 如何让"信息访谈"成为你日常       │      │
│  │  的一部分。晚安 💤                               │      │
│  ╰────────────────────────────────────────────────╯      │
└─────────────────────────────────────────────────────────┘
```

### 7.4 计划选择页 (Onboarding)

```
┌─────────────────────────────────────────────────────────┐
│  选择你的探索节奏                                         │
│                                                          │
│  "每一段伟大的旅程都从第一步开始。                         │
│   作为[拓路者]，你天生就有探索未知的冲动。                  │
│   现在，让我们把这份冲动变成日常。"                        │
│                                                          │
│  ╭────────────────────────────────────────────────╮      │
│  │  ⚡ 7天冲刺                          免费      │      │
│  │                                                │      │
│  │  每天 5-10 分钟，7 天建立探索习惯               │      │
│  │  · 每日晨间导航 + 微行动 + 晚间复盘             │      │
│  │  · 体验 AI 教练的个性化陪伴                     │      │
│  │  · 完成至少一次信息访谈                         │      │
│  │                                                │      │
│  │  [开始 7 天冲刺]                                │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  ╭────────────────────────────────────────────────╮      │
│  │  🌊 30天深潜                    ¥99 / $14.99   │      │
│  │                                                │      │
│  │  4 周系统探索，从认知到行动的完整旅程             │      │
│  │  · 7 天冲刺的所有内容 +                         │      │
│  │  · 工具箱完整功能 (简历优化/Cover Letter/面试)   │      │
│  │  · 每周教练深度对话 (30分钟)                    │      │
│  │  · 毕业报告 + 行动计划                          │      │
│  │                                                │      │
│  │  [开始 30 天深潜]                               │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  ╭────────────────────────────────────────────────╮      │
│  │  🚀 90天航行                   ¥249 / $34.99   │      │
│  │                                                │      │
│  │  3 个月深度转型，陪你到拿到 offer                │      │
│  │  · 30 天深潜的所有内容 +                        │      │
│  │  · 无限教练深度对话                             │      │
│  │  · 求职全流程陪伴                               │      │
│  │  · 人工教练 1 次 (如有)                         │      │
│  │                                                │      │
│  │  [开始 90 天航行]                               │      │
│  ╰────────────────────────────────────────────────╯      │
│                                                          │
│  ── 偏好设置 ──                                           │
│  晨间导航时间: [08:00 ▼]                                  │
│  晚间复盘时间: [21:00 ▼]                                  │
│  周末也参与:   [是 / 否]                                  │
│  探索节奏:     [温和 / 正常 / 密集]                       │
└─────────────────────────────────────────────────────────┘
```

### 7.5 组件目录

```
components/
  companion/                          ← 新增
    companion-dashboard.tsx             陪跑仪表盘
    program-selector.tsx                计划选择卡片
    daily-view.tsx                      每日交互主视图
    morning-briefing.tsx                晨间导航卡片
    micro-action-card.tsx               微行动卡片
    action-note-input.tsx               行动笔记输入
    evening-reflection.tsx              晚间复盘组件
    mood-selector.tsx                   情绪选择器 (4 选项)
    coach-response-stream.tsx           教练流式回应
    streak-counter.tsx                  连续天数计数器
    program-progress-bar.tsx            计划进度条
    day-timeline.tsx                    日视图时间线
    weekly-review-card.tsx              周度回顾卡片
    graduation-hero.tsx                 毕业庆祝页
    plan-paused-banner.tsx              计划暂停横幅
    adaptive-notice.tsx                 适应性调整通知
    onboarding-flow.tsx                 计划选择流程
    preference-form.tsx                 偏好设置表单
```

---

## 八、API 路由设计

```
app/api/
  companion/
    programs/
      route.ts                    GET: 获取用户的所有计划
                                  POST: 创建新计划
    programs/[id]/
      route.ts                    GET: 获取计划详情
                                  PATCH: 更新计划 (暂停/恢复/配置)
    programs/[id]/pause/
      route.ts                    POST: 暂停计划
    programs/[id]/resume/
      route.ts                    POST: 恢复计划

    daily/
      route.ts                    GET: 获取今日 DailyEntry (自动创建)
    daily/briefing/
      route.ts                    POST: 生成晨间导航 (LLM)
    daily/briefing/viewed/
      route.ts                    POST: 标记已查看
    daily/action/start/
      route.ts                    POST: 开始微行动
    daily/action/complete/
      route.ts                    POST: 完成微行动
    daily/action/skip/
      route.ts                    POST: 跳过微行动
    daily/reflection/
      route.ts                    POST: 提交晚间复盘 → 触发教练回应 (流式)

    adaptive/
      route.ts                    GET: 获取当前适应性状态
                                  POST: 应用调整 (内部调用)

    graduation/
      route.ts                    POST: 生成毕业报告 (LLM)
      [id]/
        route.ts                  GET: 获取毕业报告

    weekly-review/
      route.ts                    GET: 获取本周回顾数据
                                  POST: 生成周度总结 (LLM)

  -- Action Hub API (保持蓝图设计)
  action-hub/
    ...

  -- Toolkit API (保持蓝图设计)
  toolkit/
    ...

  -- 扩展: Cron
  cron/
    daily-briefing-push/
      route.ts                    POST: 每日晨间推送 (Vercel Cron)
    weekly-digest/
      route.ts                    POST: 周度摘要 (Vercel Cron)
    adaptive-check/
      route.ts                    POST: 每日适应性检查 (Vercel Cron)
```

### 8.1 鉴权矩阵

```typescript
// 陪跑系统 API 的 guard 配置

// 只读 (已登录即可)
{ tier: 'read', requireAuth: true }
// companion/programs, daily, adaptive, graduation/[id], weekly-review

// 写入 (已登录 + 标准限流)
{ tier: 'write', requireAuth: true }
// companion/programs POST/PATCH, daily/action/*, daily/reflection

// AI (已登录 + AI 限流)
{ tier: 'ai', requireAuth: true }
// daily/briefing POST, graduation POST, weekly-review POST

// Cron (Bearer CRON_SECRET)
{ tier: 'admin' }
// cron/daily-briefing-push, cron/adaptive-check

// 付费检查 (在 handler 内)
// 30天/90天计划的 LLM 功能需要验证付费状态
```

---

## 九、与现有系统的精确集成

### 9.1 集成点清单

```
┌──────────────────────────────────────────────────────────────────┐
│ 集成点                    方向      实现方式                      │
├──────────────────────────────────────────────────────────────────┤
│ 报告生成 →                →        报告完成后弹出"开始陪跑"入口   │
│   陪跑计划创建                     不自动创建，用户主动选择       │
│                                                                  │
│ 陪跑微行动 →              →        完成微行动 = 完成 ActionItem   │
│   Action Hub ActionItem            通过 actionItemId 关联        │
│                                                                  │
│ 陪跑微行动 →              →        社交/创造型微行动触发工具箱    │
│   Toolkit 工具箱                   如: "用简历优化器" → 跳转      │
│                                                                  │
│ 陪跑教练对话 ↔            ↔        注入计划进度到教练 prompt      │
│   现有 Coaching System             教练洞察反哺为新记忆           │
│                                                                  │
│ 陪跑进度 →                →        每完成一天 → 更新深度          │
│   Exploration Depth                新增 companion_day 权重       │
│                                                                  │
│ 陪跑复盘 →                →        从复盘文本提取新记忆           │
│   UserMemory 记忆系统              低 confidence, 可被巩固       │
│                                                                  │
│ 陪跑毕业 →                →        触发 ProgressSnapshot         │
│   Progress Tracker                 GraduationReport 保存         │
│                                                                  │
│ 评估数据 →                →        12 原型 → 教练风格             │
│   Daily Briefing                   Schwartz → 激励策略           │
│                                    Big Five → 行动类型偏好       │
│                                    SJT → 张力觉察任务            │
│                                    Career Drain → 脱离任务       │
│                                                                  │
│ 陪跑漏斗事件 →            →        新增 companion_* 事件          │
│   Analytics                        融入现有 UserFunnel 表        │
└──────────────────────────────────────────────────────────────────┘
```

### 9.2 深度系统扩展

```typescript
// lib/exploration/depth-calculator.ts 扩展

const COMPANION_WEIGHTS = {
  // 陪跑系统增量 (最多 1500m, 总深度上限 5000m)
  companionStarted: 100, // 开始任何陪跑计划
  companionDay7: 200, // 完成 7 天
  companionDay14: 200, // 完成 14 天
  companionDay30: 300, // 完成 30 天
  companionGraduated: 300, // 毕业
  firstToolkitUse: 100, // 首次使用工具箱
  firstNetworkingAction: 100, // 首次社交行动
  weeklyReview: 50, // 周度回顾 (可累积, 上限 200m)
};

// 新增深度区域
const EXTENDED_ZONES = [
  { id: "surface", minDepth: 0, label: { en: "Surface", zh: "海面" } },
  { id: "shallows", minDepth: 200, label: { en: "Shallows", zh: "浅水区" } },
  {
    id: "openwater",
    minDepth: 500,
    label: { en: "Open Water", zh: "开阔水域" },
  },
  {
    id: "depths",
    minDepth: 1500,
    label: { en: "The Deep Current", zh: "深流区" },
  },
  {
    id: "abyss",
    minDepth: 3000,
    label: { en: "The Luminous Deep", zh: "发光带" },
  },
  { id: "trench", minDepth: 3500, label: { en: "The Trench", zh: "海沟" } },
  { id: "core", minDepth: 4500, label: { en: "The Core", zh: "地心" } },
];
```

### 9.3 教练 System Prompt 扩展

```typescript
// 在 buildCoachingSystemPrompt() 中新增:

if (programContext) {
  sections.push(`
## User's Coaching Program
Program: ${programContext.programType} (Day ${programContext.currentDay}/${programContext.totalDays})
Phase: ${programContext.currentPhase}
Streak: ${programContext.streakDays} days
Recent mood: ${programContext.recentMoodSignals.join(", ")}

### Recent Daily Reflections (last 3 days):
${programContext.recentReflections
  .map(
    (r) => `Day ${r.programDay}: "${r.reflectionText}" (mood: ${r.moodSignal})`,
  )
  .join("\n")}

### Current Focus Directions:
${programContext.focusDirections.join(", ")}

### Coaching Integration Rules:
- Reference the user's daily progress naturally
- If they mention today's micro-action, celebrate or dig deeper
- If they seem stuck, relate it to their assessment profile
- Suggest adding discovered insights to their action plan
- NEVER repeat what the daily briefing already said
`);
}
```

### 9.4 漏斗事件扩展

```typescript
// 新增 UserFunnel 事件类型

const COMPANION_FUNNEL_EVENTS = [
  "companion_onboarding_started", // 打开计划选择页
  "companion_plan_selected", // 选择了计划类型
  "companion_sprint_started", // 7天冲刺开始
  "companion_deep_started", // 30天深潜开始 (付费转化!)
  "companion_voyage_started", // 90天航行开始
  "companion_day_completed", // 完成一天 (含 programDay 参数)
  "companion_streak_milestone", // streak 里程碑 (3/7/14/21/30)
  "companion_toolkit_from_action", // 从微行动跳转到工具箱
  "companion_coach_from_daily", // 从每日页跳转到教练对话
  "companion_paused", // 暂停计划
  "companion_resumed", // 恢复计划
  "companion_abandoned", // 放弃计划 (7天未活跃)
  "companion_graduated", // 毕业
];
```

---

## 十、商业模式与增长飞轮

### 10.1 定价策略

```
                    免费层                     付费层
              ┌──────────────┐        ┌──────────────────┐
              │ Quick Dive   │        │                  │
  评估层      │ Deep Dive    │        │  (评估保持免费)   │
              │ 报告         │        │                  │
              └──────────────┘        └──────────────────┘

              ┌──────────────┐        ┌──────────────────┐
              │ 7天冲刺      │        │ 30天深潜  ¥99    │
  陪跑层      │ 持续陪伴基础 │        │ 90天航行  ¥249   │
              │              │        │ 持续陪伴增强 ¥29/月│
              └──────────────┘        └──────────────────┘

              ┌──────────────┐        ┌──────────────────┐
              │ 分享卡片     │        │ 对比功能  (含在付费)│
  社交层      │ 基础对比     │        │ 深度对比  (含在付费)│
              └──────────────┘        └──────────────────┘
```

### 10.2 增长飞轮

```
                    ┌─────────────┐
                    │ 深度评估    │ ← 免费，吸引用户
                    │ (护城河)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 个性化报告  │ ← "认识自己"的 wow 时刻
                    │             │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ 7天冲刺     │ ← 免费体验陪跑价值
                    │ (免费)      │   每天 5 分钟建立习惯
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐  ┌─▼──────┐  ┌──▼─────────┐
       │ 30天深潜    │  │ 分享   │  │ 邀请朋友    │
       │ (¥99 转化)  │  │ 卡片   │  │ 对比评估    │
       └──────┬──────┘  └────────┘  └──────┬──────┘
              │                             │
              │    ← 数据飞轮 →              │
              │    越用越准确                 │
              │    越准确越有价值             │
              │                             │
       ┌──────▼──────┐              ┌──────▼──────┐
       │ 毕业报告    │              │ 新用户      │
       │ + 持续订阅  │              │ (病毒传播)  │
       └─────────────┘              └─────────────┘
```

### 10.3 关键转化漏斗指标

```
评估完成率:           目标 > 70%    (Quick Dive → Deep Dive)
报告查看率:           目标 > 90%    (报告生成 → 查看)
7天冲刺启动率:        目标 > 40%    (报告查看 → 开始冲刺)
7天冲刺完成率:        目标 > 60%    (开始 → 完成7天)
付费转化率:           目标 > 15%    (7天完成 → 购买30天)
30天完成率:           目标 > 50%    (购买 → 毕业)
持续订阅转化率:       目标 > 30%    (30天毕业 → 持续订阅)
邀请率:               目标 > 20%    (任何阶段 → 邀请朋友)
```

---

## 十一、分阶段实施计划

### Phase 0: 基础设施 (1 周)

```
目标: 数据模型 + 计划模板 + 骨架

任务:
□ 迁移 019: Action Hub 核心表 (ActionPlan, ActionItem, ActionMilestone, ToolkitUsage, ProgressSnapshot)
□ 迁移 020: Coaching Companion 核心表 (CoachingProgram, DailyEntry, GraduationReport)
□ 迁移 020b: CoachingSession 扩展字段 (programId, sessionType)
□ 更新 schema.sql + schema-init.ts
□ 创建 lib/db/companion.ts (数据访问层)
□ 创建 lib/db/action-hub.ts (数据访问层)
□ 创建 lib/coaching-companion/ 目录结构
□ 创建 7天冲刺的日程模板 (lib/coaching-companion/templates/sprint-7.ts)
□ 添加 i18n 字典 key (companion.* 命名空间)
□ 扩展 depth-calculator.ts
□ 新增 model-router 任务配置
□ 页面骨架 (companion/ 路由)
□ 测试: 迁移 + DB 操作 + depth 计算

估时: 25-30 小时
```

### Phase 1: 7天冲刺 MVP (2.5 周) — 最重要的阶段

```
目标: 完整可用的 7 天免费陪跑体验

任务:
□ 计划 Onboarding 流程 (companion/onboarding)
  - 计划选择 UI
  - 偏好设置 (时间、节奏、周末)
  - 创建 CoachingProgram
□ Daily Engine 核心:
  - 晨间导航生成 (daily-briefing LLM prompt)
  - 微行动模板 (7天冲刺的 7 个具体日程)
  - 晚间复盘 UI + 教练回应 (reflection-response LLM)
  - engagement 评分计算
□ companion/daily 页面:
  - 晨间/微行动/复盘 三合一视图
  - 流式教练回应
  - 完成/跳过/笔记 交互
□ companion 仪表盘:
  - 当前计划进度
  - streak 计数器
  - 今日任务状态
□ API 路由:
  - companion/programs (GET/POST)
  - companion/daily/* (全套)
□ 适应性调整 (基础版):
  - streak 断裂 → 语气调整
  - 连续 easy → 提升难度
□ 与现有教练集成:
  - 注入 programContext 到 buildCoachingSystemPrompt
  - companion/daily 页面的"与教练深度对话"按钮
□ 分析追踪:
  - companion_* 漏斗事件
□ 测试: 7 天完整流程 e2e

估时: 40-50 小时
交付物: 完整可用的 7 天免费陪跑
```

### Phase 2: Action Hub 核心 + Toolkit P0 (2 周)

```
(与 Action Hub 蓝图的 Phase 1+2 合并)

任务:
□ Action 生成算法 (seed-extractor + priority-ranker)
□ Action Plan 生成 (报告完成后)
□ Action Board UI
□ 简历优化器 (Toolkit P0)
□ Cover Letter 生成器 (Toolkit P0)
□ 微行动 → ActionItem 关联
□ 微行动 → Toolkit 跳转

估时: 35-40 小时
```

### Phase 3: 30天深潜 + 付费系统 (2 周)

```
目标: 完整的 30 天付费计划

任务:
□ 30天日程模板 (4 周 × 7 天)
□ 付费检查逻辑 (简单版: 标记 CoachingProgram.isPaid)
□ 支付集成 (Stripe / 支付宝 / 微信支付)
  - 选择最简方案: Stripe Checkout (一次性付费)
□ 周度回顾 (weekly-review)
  - 周数据聚合
  - LLM 生成周总结
  - UI: weekly-review-card
□ 毕业报告 (graduation)
  - 30天数据聚合
  - LLM 生成毕业叙事
  - UI: graduation-hero
□ Toolkit P1: 面试准备 + 电梯演讲
□ 进度追踪增强 (ProgressSnapshot 自动创建)
□ 能力雷达图变化 (前后对比)

估时: 35-40 小时
```

### Phase 4: 适应性系统 + 记忆演化 + 社交 (2 周)

```
任务:
□ 完整适应性调整引擎
  - 情绪检测 (mood-detect LLM)
  - 多维度调整规则
  - 调整通知 UI
□ 记忆演化系统
  - 从复盘提取记忆
  - 记忆 confidence 衰减/增强
  - 记忆容量管理 (50 条上限)
□ 对比分享
  - 邀请朋友做评估
  - 双人雷达图
  - 分享卡片增强
□ Toolkit P2: LinkedIn + Networking
□ 持续陪伴 (Ongoing) 模式
  - 每周洞察推送
  - 轻量每日微行动 (可选)

估时: 30-35 小时
```

### Phase 5: 90天航行 + Polish (2 周)

```
任务:
□ 90天日程模板 (3 个月)
□ 90天特有功能:
  - 月度深度教练会话 (45min)
  - 作品集/Portfolio 构建指导
  - 求职冲刺期全流程
□ Weekly Digest 邮件
  - 邮件服务集成 (Resend)
  - Digest 模板 (HTML 邮件)
□ 全面 UI polish
  - Framer Motion 页面过渡
  - 移动端完美适配
  - 空状态 / 错误状态 / 加载状态
  - 暗色模式适配
□ 性能优化
  - 数据库查询优化 (索引)
  - LLM 调用缓存策略
  - 离线支持 (Service Worker, 基础版)
□ 完整 i18n 审计
□ 安全审计 (新增 API 的 guard + rate limit)

估时: 30-35 小时
```

### 总计

```
Phase 0: 基础设施              25-30h    Week 1
Phase 1: 7天冲刺 MVP           40-50h    Week 2-4    ← 最重要
Phase 2: Action Hub + Toolkit  35-40h    Week 3-5    (部分并行)
Phase 3: 30天 + 付费           35-40h    Week 5-7
Phase 4: 适应性 + 社交         30-35h    Week 7-9
Phase 5: 90天 + Polish         30-35h    Week 9-11

总计: 195-230 小时 (约 10-11 周全职)
MVP (Phase 0+1): 65-80 小时 (约 3-4 周)
付费版 (Phase 0-3): 135-160 小时 (约 7 周)
```

---

## 十二、长期愿景路线图

### 12.1 六个月视野

```
Month 1-2: MVP (7天冲刺 + Action Hub 基础)
  → 核心用户体验验证
  → 7天完成率 > 60% 的目标

Month 3-4: 付费版 (30天深潜 + Toolkit 完整)
  → 付费转化率验证
  → ¥99 × 15% 转化 = 每 100 个用户 ¥1,485 收入

Month 5-6: 成长版 (90天航行 + 适应性 + 社交)
  → 高端用户群体验证
  → 社交传播系数验证 (K-factor)
```

### 12.2 一年视野

```
Q1: 产品基础 (评估 + 陪跑 + 工具箱)
Q2: 社交增长 (对比 + 邀请 + 社区雏形)
Q3: 平台化 (人类教练接入 + 企业版)
Q4: 生态化 (开放 API + 第三方集成 + 国际化扩展)
```

### 12.3 未来功能储备（按潜力排序）

```
1. 人类教练匹配 (P1)
   - AI 教练做 80% 的日常陪伴
   - 人类教练在关键节点介入 (职业决策、薪资谈判)
   - AI 准备教练简报，人类教练更高效
   - 商业模式: 每次 ¥299-599

2. 企业版 (P1)
   - 团队评估 + 团队原型分析
   - 团队协作风格匹配
   - HR 仪表盘 (匿名聚合)
   - 商业模式: 年费 ¥999/人

3. 多模态评估 (P2)
   - 视频自我介绍 → AI 分析表达风格
   - 语音日记 → AI 提取情绪和洞察
   - 补充问卷评估的盲区

4. 实时市场数据 (P2)
   - O*NET API 集成
   - 薪资数据库 (Levels.fyi 风格)
   - 行业趋势追踪

5. 求职 CRM (P2)
   - Chrome 扩展 (LinkedIn + 求职网站)
   - 申请追踪
   - 面试日程管理

6. 同类型社区 (P3)
   - "拓路者"社区 / "守望者"社区
   - 匿名分享 + 互助
   - 行业圈子

7. 终身档案 (P3)
   - 随时间演化的职业档案
   - 每次重新评估 → 对比成长轨迹
   - "你 5 年前 vs 现在" 的对比
```

### 12.4 数据飞轮的终极形态

```
用户使用 →
  产生行为数据 →
    AI 更懂用户 →
      推荐更精准 →
        用户体验更好 →
          用户使用更多 →
            (循环)

同时:
  更多用户 →
    更多行为模式 →
      算法更好 →
        所有用户受益 →
          口碑传播 →
            更多用户 →
              (网络效应)

Deep Dive 的终极形态:
  不是一个工具，是一个"了解你的职业 AI"。
  它比你自己更了解你的职业潜力，
  因为它有你的评估数据 + 数万人的行为模式 + 实时市场数据。
```

---

## 附录 A: 技术债务与风险控制

### A.1 风险矩阵

| 风险               | 概率 | 影响 | 缓解                                                                                  |
| ------------------ | ---- | ---- | ------------------------------------------------------------------------------------- |
| LLM 每日调用成本   | 高   | 中   | 晨间导航 + 复盘 = 2 次/天/用户, GPT-4o-mini 成本极低 (~$0.01/天); 复杂任务才用 Claude |
| 用户 7 天后流失    | 高   | 高   | 7 天冲刺设计为"钩子"，Day 7 的毕业体验必须让用户看到明确价值                          |
| 适应性系统过于复杂 | 中   | 中   | Phase 1 只做 2 条规则，验证后再扩展                                                   |
| 付费意愿不足       | 中   | 高   | ¥99 定价已很低; 7 天免费让用户先体验价值; 30 天 ROI 清晰                              |
| 微行动完成率低     | 中   | 中   | passive 型微行动只需 2 分钟; 适应性降级; "跳过不丢 streak"                            |
| 记忆系统膨胀       | 低   | 中   | 50 条上限 + 自动衰减 + 只注入 Top 20                                                  |
| 国际化挑战         | 低   | 低   | 所有模板双语; prompt 强制语言指令                                                     |

### A.2 兼容性保证

```
✅ 现有用户 (已有报告) 可直接开始 7 天冲刺
✅ 没有 RealConditions 的用户仍可参与 (部分功能降级)
✅ 没有简历的用户仍可参与 (简历相关微行动跳过)
✅ 所有新增表都是增量的，不修改任何现有表
✅ CoachingSession 的扩展是可选字段 (programId, sessionType)
✅ 现有教练系统完全不受影响 (无 programContext 时行为不变)
✅ 冻结区域完全不触碰
✅ model-router 仅新增任务，不修改现有任务配置
```

### A.3 测试策略

```
每个 Phase 的测试清单:

单元测试 (Vitest):
- 日程模板: 7天/30天/90天 的每一天都有完整定义
- 适应性引擎: 各种信号组合 → 正确的调整
- 记忆演化: 新记忆提取 + confidence 衰减/增强
- engagement 评分: 各种完成组合 → 正确分数
- depth 扩展: companion 权重正确计入

集成测试:
- 创建计划 → DailyEntry 自动创建 → briefing 生成
- 完成微行动 → ActionItem 状态更新 → depth 更新
- 提交复盘 → 教练回应 → 记忆提取
- 7天完成 → 计划状态更新 → 转化提示
- 暂停/恢复 → 正确计算 pausedDays + currentDay

测试文件位置:
lib/coaching-companion/__tests__/
lib/action-hub/__tests__/
```

---

## 附录 B: i18n 字典结构

```json
{
  "companion": {
    "dashboard": {
      "title": "Your Exploration Journey",
      "currentProgram": "Current Program",
      "noProgramCta": "Start your first program",
      "streakLabel": "Day Streak",
      "todayStatus": "Today's Status"
    },
    "onboarding": {
      "title": "Choose Your Pace",
      "subtitle": "Every great journey starts with the first step.",
      "sprint7": {
        "title": "7-Day Sprint",
        "price": "Free",
        "description": "5-10 minutes daily, build your exploration habit"
      },
      "deep30": {
        "title": "30-Day Deep Program",
        "price": "$14.99",
        "description": "4 weeks of systematic exploration"
      },
      "voyage90": {
        "title": "90-Day Voyage",
        "price": "$34.99",
        "description": "3 months to career transformation"
      },
      "preferences": {
        "briefingTime": "Morning briefing time",
        "reflectionTime": "Evening reflection time",
        "weekends": "Include weekends",
        "intensity": "Exploration pace"
      }
    },
    "daily": {
      "morningTitle": "Morning Briefing",
      "actionTitle": "Today's Micro-Action",
      "reflectionTitle": "Evening Reflection",
      "startAction": "Start Action",
      "skipToday": "Skip Today",
      "completeAction": "Mark Complete",
      "submitReflection": "Submit Reflection",
      "moodEasy": "Easy",
      "moodChallengingDone": "Challenging but done",
      "moodHardPersisted": "Hard but persisted",
      "moodNotDone": "Didn't complete",
      "reflectionPrompt": "What surprised or moved you today?",
      "notePrompt": "Write your thoughts...",
      "coachResponseTitle": "Coach's Response",
      "tomorrowPreview": "Tomorrow we'll explore..."
    },
    "progress": {
      "dayOf": "Day {{current}} of {{total}}",
      "streakMessage": "{{days}} day streak",
      "weeklyReview": "Weekly Review",
      "graduation": "Graduation"
    }
  }
}
```

---

> **本蓝图是 Deep Dive 从"评估工具"向"陪伴平台"转型的完整技术与产品方案。**
> **核心信念: 最好的职业工具不是告诉你答案的，而是陪你找到答案的。**
