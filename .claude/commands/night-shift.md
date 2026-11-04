---
disable-model-invocation: true
---

# Night Shift v2 — 睡前一键部署夜间任务

> **v2 设计原则**：Pull > Push, 深 > 广, 闭环 > 开环。从 v1 的 21 任务/周 砍到 ~12 任务/周（-43%），加反向调研、决策日志、KOL 深跟踪、landing page 实验四个真实反馈机制。
> 早上看周报精华即可（每日不再有合并/晨间报告）。

Read CLAUDE.md first.

## 前置检查

1. 启动 `caffeinate -d -i -s &` 防止 Mac 休眠
2. 确认当前时间，如果已过某个任务的时间点则跳过或调整
3. 检测白天是否有代码变更：运行 `git diff --stat HEAD~1` 判断是否需要工程验证任务
4. 检测今天是周几（Mon=1 ... Sun=7），决定加哪些周度任务
5. 检测今天的日期，如果是月 1 日或月 28 日，加对应月度任务
6. **确认 Founder/ 目录存在**：检查 `/Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/` 是否存在；如不存在则提示创始人先按 plan 创建（见 `~/.claude/plans/night-shift-a-i-transient-hopper.md`）

## 每日核心任务（4 个，必跑）

按以下顺序创建，每个用 CronCreate：

### 02:33 — AI 情感陪伴 + 心理科技赛道研究

```
cron: "33 2 * * *"
prompt: AI 情感陪伴 + 心理科技赛道最新动态研究。请深度搜索并整理报告：

1. AI 情感陪伴产品动态：搜索 Replika, Character.AI, Pi (Inflection), Nomi AI, Kindroid, Chai AI, Paradot, Talkie AI, Dot (New Computer), Friend (pendant) 等 AI companion 产品的最近 14 天更新、融资、新功能、用户增长数据、App Store 排名变化
2. AI 心理健康/咨询产品：搜索 Woebot, Wysa, Youper, Talkiatry, Limbic, Koko, Elomia, Mindstrong, Spring Health (AI features), Ginger/Headspace AI, BetterHelp AI, Talkspace AI 的最新动态
3. 新玩家发现：搜索 "AI emotional companion 2026", "AI therapy chatbot startup", "AI mental health funding 2026", "AI counseling tool launch", "情感 AI 创业", "AI 心理咨询 产品" 发现新入场者
4. 学术前沿：搜索最近发布的 "AI emotional support effectiveness", "LLM therapy outcomes", "AI companion mental health impact", "conversational AI wellbeing", "digital mental health intervention AI", "AI counseling ethics" 论文和研究
5. 监管与伦理：搜索 "AI companion regulation 2026", "AI therapy FDA", "AI mental health policy EU", "AI emotional support safety" — 关注各国对 AI 情感/心理产品的监管动向
6. 用户行为洞察：搜索 "why people use AI companions", "AI companion user study", "AI therapy user experience", "lonely economy AI" — 关注用户动机、使用模式、满意度研究
7. 技术突破：搜索 "empathetic AI model", "emotional intelligence LLM", "affective computing 2026", "multimodal emotion recognition" — 关注能增强情感理解的技术进展
8. 幻想 IP + 虚拟角色：搜索 Character.AI (角色生态), Janitor AI, SillyTavern, NovelAI, Spicychat, 猫箱, Talkie (原创角色), 星野, 筑梦岛, Glow (字节) 的最新动态；搜索 "fantasy IP AI 2026", "AI character licensing", "virtual being startup", "AI roleplay app", "fictional character chatbot", "anime AI companion", "digital human IP", "virtual idol AI", "AI 虚拟角色", "二次元 AI", "虚拟偶像 创业", "AI 角色扮演", "IP 授权 AI" — 关注 IP 化情感产品的商业模式、用户增长、角色生态、与心理/职业探索的交叉机会

输出格式：按 8 个类别分段，每段列出发现项 + 来源链接 + 与 Deep Dive 产品的交叉机会。特别标注：哪些情感/心理需求可以融合进职业探索场景（如职业焦虑、转型压力、职场人际关系），以及幻想 IP 在教练人格化、神秘学美学方面的启发。
将报告保存到 ~/Documents/LifeOS/04 Projects/Deep Dive/每日调研/ 目录，文件名格式：YYYY-MM-DD-情感心理赛道.md。报告必须以 YAML frontmatter 开头：
---
type: 情感心理赛道
date: YYYY-MM-DD
source: Night Shift
domains: [AI情感陪伴, AI心理健康, 学术前沿, 监管伦理, 用户行为, 技术突破, 幻想IP]
tags: [deep-dive/调研]
---
```

### 03:13 — AI 职业评测赛道研究

```
cron: "13 3 * * *"
prompt: AI 职业评测赛道最新动态研究。请搜索并整理报告：
1. 竞品动态：搜索 Jobiri, Careerflow, VMock, Jobscan, Huntr, PathwayU, YouScience, JobTest.org, Google Career Dreamer, Indeed Career Scout, CoachHub AIMY, Apt AI, COACH by CareerVillage 等 AI career assessment/coaching 工具的最近 30 天更新、融资、新功能发布
2. 新玩家：搜索 "AI career assessment tool 2026", "AI career coaching startup", "AI personality test" 发现新入场的竞品
3. 学术论文：搜索最近发布的关于 "career assessment AI", "vocational guidance artificial intelligence", "RIASEC machine learning", "personality assessment large language model", "career resilience AI", "cross-cultural career exploration" 的论文
4. 行业趋势：搜索 "future of career coaching AI 2026", "AI coaching market", "EdTech career" 的最新观点文章
5. 巨头动向：搜索 OpenAI, Google, LinkedIn, Indeed 在 career/coaching/assessment 领域的最新动作（收购、新功能、合作）
输出格式：按 5 个类别分段，每段列出发现项 + 来源链接 + 对 Deep Dive 产品的启示。将报告保存到 ~/Documents/LifeOS/04 Projects/Deep Dive/每日调研/ 目录，文件名格式：YYYY-MM-DD-赛道研究.md。报告必须以 YAML frontmatter 开头：
---
type: 赛道研究
date: YYYY-MM-DD
source: Night Shift
domains: [竞品, 学术, 行业趋势, 巨头动向]
tags: [deep-dive/调研]
---
```

### 03:43 — 全领域前沿动态

```
cron: "43 3 * * *"
prompt: 全领域前沿动态扫描。覆盖以下 7 个领域，每个领域搜索最近 7 天的重大新闻/突破/趋势：

1. 🤖 AI / LLM 行业：搜索 "AI breakthrough 2026", "LLM new model", "AI agent", "AI startup funding" — 关注模型发布、重大融资、开源工具、应用创新
2. 🧠 心理学前沿：搜索 "psychology research 2026", "psychometrics AI", "personality assessment new", "vocational psychology" — 关注测评方法论创新、AI+心理学交叉研究
3. 🔮 塔罗/神秘学/身心灵：搜索 "tarot app 2026", "digital divination", "astrology tech", "spiritual wellness app", "塔罗 AI", "占卜 科技" — 关注数字化趋势、新 App、市场增长
4. 🎮 游戏/电竞：搜索 "gaming industry 2026", "esports news", "game AI", "gaming trends" — 关注行业动态、AI 在游戏中的应用、电竞市场
5. 🌍 尖端科技：搜索 "quantum computing 2026", "biotech breakthrough", "space tech", "energy innovation", "robotics" — 关注可能改变职业格局的技术突破
6. 💰 创投/FinTech：搜索 "startup funding 2026", "FinTech trends", "Web3 2026", "creator economy" — 关注融资趋势、新商业模式
7. 🇳🇱 荷兰/欧洲：搜索 "Netherlands tech", "EU AI Act", "Amsterdam startup", "European tech" — 关注本地市场和政策动态

每个领域输出 TOP 3 发现（标题 + 一句话摘要 + 来源链接 + 对个人/产品的潜在影响）。
将报告保存到 ~/Documents/LifeOS/04 Projects/Deep Dive/每日调研/ 目录，文件名格式：YYYY-MM-DD-全领域前沿.md。报告必须以 YAML frontmatter 开头：
---
type: 全领域前沿
date: YYYY-MM-DD
source: Night Shift
domains: [AI, 心理学, 塔罗, 游戏, 尖端科技, 创投, 荷兰欧洲]
tags: [deep-dive/调研]
---
```

### 05:03 — 全网用户需求采集（v2 扩平台 + 扩赛道）

```
cron: "3 5 * * *"
prompt: 全网用户需求采集 v2：扩大平台 + 扩大赛道。请搜索以下内容，务必找到真实用户的原声：

**先读** /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解创始人能力边界，以便在分析维度 7 给出更准确的"我能做"建议。

英文平台（Reddit / Quora / X / ProductHunt / HackerNews / IndieHackers / Twitter Communities / Discord 公开服务器）：
- Reddit: 搜索 r/careerguidance, r/careeradvice, r/jobs, r/ChatGPT, r/ArtificialIntelligence, r/mentalhealth, r/therapy, r/lonely, r/selfimprovement, r/AskWomen, r/AskMen, r/femalefashionadvice, r/FinancialIndependence, r/Entrepreneur, r/sidehustle, r/personalfinance, r/relationships, r/datingoverthirty 中最近 14 天的热门帖子
  - 关键词组 A（职业）: "career confusion", "career assessment", "AI career tool", "career coaching", "don't know what to do with my life", "career change anxiety", "side hustle ideas", "career pivot 30s"
  - 关键词组 B（情感/心理）: "AI companion", "AI therapy", "AI emotional support", "AI friend", "talking to AI about feelings", "AI counselor", "AI for anxiety", "AI for loneliness", "AI for grief"
  - 关键词组 C（交叉需求）: "career anxiety AI", "job stress mental health", "AI help career decision", "AI coaching vs therapy", "burnout recovery"
  - 关键词组 D（女性向）: "women career change", "mom career restart", "female founder loneliness", "women in tech mental health"
  - 关键词组 E（男性向）: "men midlife crisis", "male loneliness epidemic", "men therapy reluctance", "male career identity"
  - 关键词组 F（财务/创业）: "financial anxiety millennial", "solopreneur loneliness", "indie hacker burnout", "side hustle to full time"
  - 关键词组 G（家庭/关系）: "family pressure career choice", "parent expectations career", "career vs relationship balance"
- Quora: 搜索 "best AI for career advice 2026", "AI emotional support", "AI therapy experience"
- X/Twitter: 搜索 "AI companion review", "AI career coach", "AI therapy" 的最新讨论和用户反馈
- ProductHunt: 搜索最近 14 天上线的 AI career / AI companion / AI mental health / AI women's wellness / AI coaching 产品，看用户评论
- IndieHackers: 搜索 forum threads 中关于 AI tool monetization, niche AI products, solo founder pain points
- HackerNews: 搜索 Show HN / Ask HN 中的 AI companion / mental health / career 相关讨论

中文平台（小红书 / 知乎 / 微博 / 即刻 / B站 / 抖音 / 视频号 / TikTok 中文区）：
- 小红书：搜索 "职业迷茫 AI", "AI 职业规划", "职业转型 工具", "AI 心理咨询", "AI 情感陪伴", "AI 树洞", "AI 倾诉", "MBTI 替代", "职业性格测试 准吗", "AI 聊天 治愈", "Character AI 替代", "AI 伴侣", "女性 副业", "宝妈 重返职场", "30岁 职业危机", "不想上班"
- 知乎：搜索同上关键词 + "如何评价 [竞品名]"、"为什么 [需求] 没有好的产品"
- B站：搜索 AI 工具/职业测评/心理咨询/塔罗 相关 UP 主的视频弹幕和评论
- 抖音/视频号：搜索 "AI 职业测评", "AI 心理咨询", "塔罗 解读" 的热门视频评论区
- 即刻：搜索"AI 工具"、"心理"、"职业" 相关圈子的最新动态

分析维度（v2 加 3 个）：
1. **职业探索需求** TOP 5：用户在职业方向上最常遇到的痛点
2. **情感陪伴需求** TOP 5：用户寻求 AI 情感支持的核心场景和动机
3. **心理咨询需求** TOP 5：用户对 AI 心理咨询的期待、担忧和使用反馈
4. **女性向需求** TOP 3 [v2 新增]：女性用户在职业/情感/心理上的差异化痛点
5. **男性向需求** TOP 3 [v2 新增]：男性用户在职业/情感/心理上的差异化痛点
6. **财务/创业焦虑需求** TOP 3 [v2 新增]：副业/创业/财务自由相关的真实痛点
7. **交叉需求洞察**：职业焦虑×情感支持、职场压力×心理咨询、身份认同×职业探索的交叉场景
8. **竞品口碑**：现有工具被吐槽最多的问题 + 被夸赞的亮点
9. **未被满足的需求**：用户明确表达想要但市场上没有的功能
10. **Deep Dive 整合建议**：对照 founder-context.md 中的能力/资源/优先级，每条需求标注"创始人能否做"（能/勉强能/做不了）+ 给出落地方案

输出：结构化报告 + 原始帖子链接（至少 20 条高质量原声，v2 加量）。保存到 ~/Documents/LifeOS/04 Projects/Deep Dive/每日调研/ 目录，文件名：YYYY-MM-DD-用户需求.md。报告必须以 YAML frontmatter 开头：
---
type: 用户需求
date: YYYY-MM-DD
source: Night Shift
domains: [职业需求, 情感陪伴, 心理咨询, 女性向, 男性向, 财务创业, 交叉需求, 竞品口碑, 未满足需求]
tags: [deep-dive/调研]
---
```

## 每日基础设施任务（2 个，必跑）

### 06:30 — 调研归档器（NEW）

```
cron: "30 6 * * *"
prompt: 调研归档器。执行以下步骤：

1. 扫描 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/ 下的所有 .md 文件
2. 把 mtime > 7 天的"单项报告"（文件名匹配 YYYY-MM-DD-{情感心理赛道|赛道研究|全领域前沿|用户需求|增长渠道}.md）移到 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/archive/YYYY-MM/（按月分目录，不存在则创建）
3. 把 mtime > 30 天的"周报精华"和"商业模式护城河"也移到 archive/
4. 更新 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/archive/INDEX.md：
   - 按月分段
   - 每月内按主题列出已归档文件名（带相对链接）
   - 顶部显示总文件数 + 总大小
5. 输出本次归档的统计：移动了多少文件、保留了多少、archive/ 总大小

⚠️ 不删除任何文件，只移动。如果 Founder/archive/ 目录不存在，先创建。
```

### 23:00 — 反向调研槽位（NEW，按需）

```
cron: "0 23 * * *"
prompt: 反向调研处理（Pull 模式）。执行以下步骤：

1. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/问题队列.md
   - 如果文件不存在，输出"问题队列文件不存在，请创始人先创建空文件"，结束
2. 扫描所有"未答"标记的问题（前缀 - [ ] 的行）
   - 如果队列为空，输出"今晚队列为空"，结束
3. 对每个未答问题：
   a. 先读 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解创始人背景
   b. 做深度调研（30 分钟级别）：
      - WebSearch 至少 5 个相关查询，覆盖学术/行业/竞品/用户原声
      - 找数据、引用、案例
      - 不做泛泛回答，给具体决策建议
   c. 输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/答案/YYYY-MM-DD-<问题摘要>.md
      - 摘要长度 6-15 字，反映问题核心
      - 报告 frontmatter:
        ---
        type: 反向调研
        date: YYYY-MM-DD
        source: Night Shift / ask-founder-research
        question: <原问题完整文本>
        status: 已答
        tags: [deep-dive/调研, deep-dive/founder]
        ---
4. 处理完成后，编辑 问题队列.md：
   - 把对应行的 - [ ] 改成 - [x]
   - 在行末追加答案文件链接：` → 答案/YYYY-MM-DD-xxx.md`
5. 输出本次处理统计：处理了 N 个问题，剩余 0 个未答
```

## 条件触发任务（仅当白天有代码变更时添加）

> 前置检查第 3 步如果检测到代码变更，额外添加以下 2 个任务：

### 00:27 — 全面验证（条件触发）

```
cron: "27 0 * * *"
prompt: 运行全面验证：执行 `npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`，记录所有错误和警告，整理成清晰的报告格式。如果全部通过，也明确说明"全部通过"。
```

### 04:17 — 核心旅程 QA 测试（条件触发）

```
cron: "17 4 * * *"
prompt: 核心用户旅程端到端 QA 测试。请执行以下检查：
1. 构建检查：运行 `npm run build`，确认生产构建无错误
2. E2E 冒烟测试：如果有 dev server 可用，运行 `npm run test:e2e`
3. 关键路径代码审查：
   - 检查 Quick Dive → Deep Dive 问卷流程的状态管理 (store/questionnaire-store.ts)
   - 检查评分管道入口 (app/api/score/) 的输入验证和错误处理
   - 检查报告生成 (app/api/generate-report/) 的超时配置和重试逻辑
   - 检查教练聊天 (app/api/coaching-chat/) 的 SSE 流式响应
4. API 健康检查：检查所有 API route 文件是否有 guardRoute + withLogging 模式
5. 响应式检查：检查关键页面组件是否有 375px 断点处理
输出：按通过/警告/失败分类，列出每项检查结果。
```

## 每周一额外任务（5 个）

> 周一晚间部署时，额外添加以下 5 个任务：

### 01:03 — 文档漂移检查（周一）

```
cron: "3 1 * * 1"
prompt: 执行文档漂移检查：检查代码实际状态与文档描述是否一致。重点检查：1) CLAUDE.md 中的表数量、迁移编号是否与 schema.sql 一致 2) 关键文件引用表中的路径是否都存在 3) API endpoint 列表是否完整。输出不一致的清单。
```

### 01:33 — 商业模式 + 护城河 + Strategy 框架反哺（周一，v2 修改）

```
cron: "33 1 * * 1"
prompt: Deep Dive 商业模式创新 + 竞争护城河 + Exit 策略研究 v2。

**先做（v2 新增）**：读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 中列出的 strategy course 框架（如 Porter Five Forces / JTBD / Blue Ocean / Wardley Mapping 等）。本次研究中，每用一个框架，**必须**引用 Deep Dive 的具体数据（1141 条职业方向库 / 12 型原型 / 当前 0 用户状态 / 86 题评估 / 5 章报告结构等）来分析，**不要只是 name-drop 框架名**。

**Part A — 商业模式创新**（用 JTBD 框架分析每条）
1. AI 评测/教练产品定价模式：搜索 "AI coaching pricing model 2026", "AI assessment SaaS pricing", "freemium AI tool conversion rate", "AI companion monetization" — 研究同类产品的收入模式（订阅/按次/B2B/Enterprise/API）
2. 新兴商业模式：搜索 "AI wrapper business model", "AI-native monetization", "vertical AI SaaS revenue", "outcome-based pricing AI" — 发现创新收入模式
3. B2B 机会：搜索 "AI career assessment enterprise", "corporate coaching platform", "HR tech AI assessment", "university career services AI" — 分析 B2B/B2B2C 机会
4. 平台化/生态：搜索 "AI platform marketplace", "coaching marketplace model", "assessment API business" — 分析 API 化/白标/平台化可能性
5. 交叉变现：搜索 "wellness app monetization", "mental health app revenue", "AI companion business model" — 情感/心理方向的变现模式

**Part B — 护城河构建**（用 Porter 5 Forces + Wardley Mapping 分析）
6. 数据护城河：搜索 "AI startup moat 2026", "data moat AI", "network effects AI product", "AI defensibility"
7. 学术护城河：搜索 "psychometric validation competitive advantage", "evidence-based assessment moat", "clinical validation AI tool"
8. 品牌/社区护城河：搜索 "community-led growth AI", "brand moat consumer AI", "trust moat AI health"
9. 技术护城河：搜索 "proprietary AI model advantage", "fine-tuned model defensibility", "AI personalization moat"
10. 跨文化护城河：搜索 "cross-cultural AI product", "localization AI competitive advantage", "multilingual AI assessment" — Deep Dive 的跨文化定位能否成为壁垒

**Part C — Exit 策略研究**（用 Blue Ocean Strategy 分析）
11. 收购动态：搜索 "AI startup acquisition 2026", "EdTech acquisition", "HR tech M&A", "mental health tech acquisition", "career tech buyout"
12. 潜在买家画像：搜索 LinkedIn, Indeed, Coursera, BetterUp, Spring Health, Headspace, 猎聘, Boss直聘, 北森 等在 AI career/coaching/assessment 领域的收购/投资历史
13. 估值基准：搜索 "AI SaaS valuation multiple 2026", "EdTech startup valuation", "mental health startup valuation"

输出格式：
## Strategy 框架应用回顾
- 本次用了哪些框架？每个框架对 Deep Dive 的具体诊断是什么？（每个 3-5 行）
## 商业模式创新（5 个方向 × TOP 3 发现）
## 护城河分析（5 个维度 × Deep Dive 适用性评估）
## Exit 策略（收购案例 + 潜在买家 + 估值基准）
## 本周战略建议
- 短期（本月）：最值得尝试的 1 个商业模式实验
- 中期（本季）：最应加固的 1 个护城河
- 长期（年度）：Exit 准备度评估 + 下一步行动

保存到 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/ 目录，文件名：YYYY-MM-DD-商业模式护城河.md。报告必须以 YAML frontmatter 开头：
---
type: 商业模式+护城河
date: YYYY-MM-DD
source: Night Shift
frameworks: [Porter5F, JTBD, BlueOcean, Wardley, ...]
domains: [商业模式, 护城河, Exit策略, 收购动态, 估值]
tags: [deep-dive/调研, deep-dive/战略]
---
```

### 02:07 — DB schema 一致性（周一）

```
cron: "7 2 * * 1"
prompt: 执行 DB schema 一致性检查：以 scripts/schema.sql 为权威 DDL，检查 scripts/migrations/ 目录中最新的迁移是否已反映在 schema.sql 中，并 scan lib/db/*.ts 的 SQL 语句是否引用了不存在的表/列。输出不一致项清单。
```

### 05:33 — 分发与增长渠道监控（周一，v2 从每日改为每周）

```
cron: "33 5 * * 1"
prompt: 分发与增长渠道监控（v2：周度，渠道变化慢不需要每天扫）。研究同赛道产品如何获客，发现可复用的增长策略。

1. SEO 趋势：搜索 Google Trends 上 "career test", "career assessment", "AI career coach", "personality test", "职业测评", "MBTI 测试", "AI 职业规划" 等核心关键词的搜索量变化和相关查询
2. 内容营销标杆：搜索 "AI career tool marketing", "career coaching content strategy" — 找出同赛道在 YouTube / TikTok / 小红书 / Medium / LinkedIn 上跑得最好的内容（播放量/点赞/转发最高的）
3. 冷启动案例：搜索 "AI product launch strategy 2026", "solo founder first 1000 users", "AI tool ProductHunt launch", "AI SaaS cold start", "indie hacker AI launch" — 收集 AI 产品从 0 到 1 的真实获客故事
4. 渠道创新：搜索 "distribution hack AI product 2026", "growth channel AI tool", "community-led growth AI", "AI product viral loop", "PLG AI product" — 发现非传统获客渠道
5. 付费获客基准：搜索 "AI SaaS CAC 2026", "career tool CPA", "mental health app user acquisition cost"
6. 合作与分发伙伴：搜索 "university career services partnership", "HR platform integration", "career coaching affiliate", "mental health app distribution deal"
7. 中文市场分发：搜索 "AI 产品推广 小红书", "AI 工具 获客", "心理测评 推广策略", "职业工具 增长"

输出格式：
## SEO 关键词趋势（哪些词在涨？哪些在跌？）
## 内容营销 TOP 5（最成功的内容案例 + 为什么有效）
## 冷启动故事 TOP 3（可复用的策略）
## 渠道创新发现
## 获客成本基准
## 合作机会
## 对 Deep Dive 的增长建议
- 论文完成前：可以提前准备什么？
- 论文完成后：Day 1 应该用什么渠道首发？
- 中长期：最适合 Deep Dive 的持续获客引擎

保存到 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/ 目录，文件名：YYYY-MM-DD-增长渠道.md。报告必须以 YAML frontmatter 开头：
---
type: 增长渠道
date: YYYY-MM-DD
source: Night Shift
domains: [SEO, 内容营销, 冷启动, 渠道创新, 获客成本, 合作分发]
tags: [deep-dive/调研, deep-dive/增长]
---
```

### 07:00 — 周报精华（周一，NEW，替代 v1 的每日合并+晨间）

```
cron: "0 7 * * 1"
prompt: 周报精华生成（v2 替代 v1 每日合并+晨间）。

读取过去 7 天 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/ 下的所有报告：
- 7 份 情感心理赛道
- 7 份 赛道研究
- 7 份 全领域前沿
- 7 份 用户需求
- 1 份 增长渠道（周一）
- 1 份 商业模式护城河（周一）

合并归纳，**只保留信号、过滤噪音**。生成 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/周报精华/YYYY-WW.md（YYYY-WW = 年-周序号），结构：

---
type: 周报精华
week: YYYY-WW
date_range: YYYY-MM-DD ~ YYYY-MM-DD
source: Night Shift
tags: [deep-dive/调研, deep-dive/周报]
---

# Deep Dive 周报精华 — 第 WW 周
> 由 Night Shift 自动生成，已过滤每日重复信号

## 一、本周最重要的 3 个信号 ⭐
（不是新闻摘要，是"如果你只看这一节"也能掌握全局的核心）
- 信号 1: <一句话> + 影响 + 证据来源
- 信号 2: ...
- 信号 3: ...

## 二、赛道动态（情感心理 + 职业评测）
### 情感心理科技
- 本周 TOP 3 产品/融资/学术动态（合并 7 天去重）
- 监管/伦理新进展
### 职业评测
- 本周 TOP 3 竞品动作
- 巨头动向

## 三、全领域信号（按 7 个领域，每个 1-2 句）
- 🤖 AI/LLM
- 🧠 心理学
- 🔮 塔罗/身心灵
- 🎮 游戏
- 🌍 尖端科技
- 💰 创投
- 🇳🇱 荷兰/欧洲

## 四、用户需求热点（合并 7 天，按强度排序）
- 职业探索 TOP 5
- 情感陪伴 TOP 5
- 心理咨询 TOP 5
- 女性向 TOP 3
- 男性向 TOP 3
- 财务/创业 TOP 3
- 交叉需求 TOP 3
- 未被满足的需求 TOP 5

## 五、增长 + 商业模式（来自周一两份战略报告）
- 本周最值得尝试的获客策略
- 本周最值得加固的护城河
- 本周战略框架的关键洞察（来自 strategy 反哺）

## 六、产品整合 TOP 3 ⭐
> 本节是周报最重要的部分，给周日 fit-score 任务用
- TOP 1: 需求 + 落地路径 + 与 Deep Dive 现有架构的契合度
- TOP 2: ...
- TOP 3: ...

## 七、本周建议行动
- 1-3 件本周值得动手的事
- 如有需要深挖的，建议用 /ask-founder-research 触发反向调研

## 附录：本周原始报告链接
（列 7 天每日报告的归档路径，方便回溯）
```

## 每周二额外任务（1 个）

> 周二晚间部署时，额外添加以下 1 个任务：

### 01:33 — KOL 5 人深度跟踪（周二，NEW）

```
cron: "33 1 * * 2"
prompt: KOL 深度跟踪（v2 替代 v1 陌生人脉雷达，深 > 广）。

1. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/KOL-名单.md
   - 如文件不存在，输出"KOL 名单未创建，请创始人先在 Founder/KOL-名单.md 列出 5-10 个核心人物（含 Substack/X handle/Podcast 名）"，结束

2. 对名单中每人，搜索过去 7 天的公开输出：
   - Substack 文章
   - X (Twitter) 长推、Thread
   - Podcast 节目（如有）
   - 个人博客
   - LinkedIn 公开 Post（仅公开内容，不爬非公开）
   - ProductHunt / IndieHackers / HackerNews 个人主页动态

3. 输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/KOL周报/YYYY-WW.md：

---
type: KOL周报
week: YYYY-WW
date_range: YYYY-MM-DD ~ YYYY-MM-DD
source: Night Shift
kol_count: N
tags: [deep-dive/调研, deep-dive/人脉]
---

# KOL 周报 — 第 WW 周

## 每人本周输出
### <KOL 名 1>
- 输出 1：<标题> [link] — <2-3 句摘要>
- 输出 2：...
- 本周关注重点：<1 句>

### <KOL 名 2>
...

## 本周共同关注的话题（聚类分析）
- 主题 A：N 人提到（列哪些 KOL），核心观点
- 主题 B：...

## 与 Deep Dive 的交叉机会
- 机会 1: <KOL 名> 在做 X，Deep Dive 可以 Y
- 机会 2: ...

## 建议互动切入点
- 评论：<KOL 名> 的 <某篇文章>，可以补充 <你的观点>
- 引用：<KOL 名> 的 <某个数据>，可以用在 Deep Dive 的 <某处>
- DM 话题：<KOL 名> 最近关心 <X>，你的 Deep Dive 经验可以帮上 <Y>

⚠️ 永远不做：LinkedIn 反爬、邮箱穷举、批量加好友、自动外联。
```

## 每周三额外任务（1 个）

> 周三晚间部署时，额外添加以下 1 个任务：

### 01:33 — 政策与合规雷达（周三）

```
cron: "33 1 * * 3"
prompt: AI 情感/心理/职业产品政策与合规雷达。这是一项高优先级监管风险研究，请深度搜索：

1. EU AI Act 实施动态：搜索 "EU AI Act implementation 2026", "AI Act high-risk classification", "EU AI Act emotional AI", "EU AI Act assessment tool", "AI Act compliance timeline" — 重点关注情感 AI/心理评测类产品的风险分类和合规要求
2. FDA / 美国监管：搜索 "FDA AI mental health 2026", "FDA digital therapeutics", "AI therapy regulation US", "FTC AI companion enforcement" — 关注 AI 心理健康工具是否被归为医疗器械、FTC 对 AI companion 的执法行动
3. AI Companion 安全事件与政策反应：搜索 "AI companion safety incident", "Character AI lawsuit", "AI chatbot harm", "AI companion minor protection", "Replika regulation"
4. 数据隐私（GDPR + 心理数据）：搜索 "GDPR special category data AI", "psychological data protection", "mental health data privacy AI", "biometric data AI assessment"
5. 中国监管：搜索 "中国 AI 生成内容管理", "中国 AI 情感陪伴 监管", "中国 AI 心理咨询 政策", "算法推荐 管理办法"
6. 行业自律与标准：搜索 "AI ethics mental health", "responsible AI companion", "AI coaching ethical guidelines", "psychometric AI standards"
7. 荷兰/本地：搜索 "Netherlands AI regulation", "Dutch AI policy 2026", "Amsterdam AI startup compliance"

输出格式：
## 红色警报（可能直接影响 Deep Dive 的政策变化）
## 橙色关注（同赛道政策动向，需要持续追踪）
## 绿色机会（合规可以成为竞争优势的领域）
## Deep Dive 合规行动建议
- 当前最需要关注的 1 条政策
- 建议的合规准备步骤
- 合规差异化机会（怎么把合规变成卖点）

保存到 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/ 目录，文件名：YYYY-MM-DD-政策合规.md。报告必须以 YAML frontmatter 开头：
---
type: 政策合规
date: YYYY-MM-DD
source: Night Shift
domains: [EU AI Act, FDA, GDPR, 中国监管, AI安全事件, 行业标准, 荷兰本地]
tags: [deep-dive/调研, deep-dive/合规]
---
```

## 每周日额外任务（2 个）

> 周日晚间部署时，额外添加以下 2 个任务：

### 21:00 — 周度 fit-score 筛选（周日，NEW）

```
cron: "0 21 * * 0"
prompt: 周度需求 fit-score 筛选（v2：频次从每日改为每周，信号不会每天变）。

1. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解创始人能力/资源/优先级
2. 读取过去 7 天 ~/Documents/LifeOS/04\ Projects/Deep\ Dive/每日调研/YYYY-MM-DD-用户需求.md 中的所有需求条目
3. 读取上 4 周的 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/fit-score/*.md（如存在），避免重复推荐已经评分过的需求
4. 读取上 4 周的 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/周度决策回顾/*.md（如存在），看哪些 fit-score 推荐已经被创始人忽略 → 自动降权同类需求

对每条需求按 5 维度打分（每个 0-10）：
- **Fit-skill**：创始人能力是否覆盖？（对照 founder-context.md 的"擅长/不擅长"）
- **Fit-platform**：能否融入 Deep Dive 现有架构？（86 题评估 / 12 型 / 报告 / 教练 / 1141 职业库）
- **Demo-feasibility**：能否在 1-3 天做出可演示版本？
- **Monetization**：变现路径是否清晰？（订阅 / 按次 / B2B / 联盟）
- **Moat**：是否能加固 Deep Dive 现有护城河？（学术 / 跨文化 / 12 型 IP / 1141 数据）

输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/fit-score/YYYY-WW.md：

---
type: fit-score
week: YYYY-WW
date_range: YYYY-MM-DD ~ YYYY-MM-DD
source: Night Shift
needs_evaluated: N
top_count: 10
tags: [deep-dive/调研, deep-dive/fit-score]
---

# 周度 Fit-Score 筛选 — 第 WW 周

## TOP 10 ⭐（按总分排序）

### #1 ⭐ <需求名> — 总分 X/50
- Fit-skill: X/10 — <1 句理由>
- Fit-platform: X/10 — <1 句理由 + 复用文件路径>
- Demo-feasibility: X/10 — <1 句理由>
- Monetization: X/10 — <1 句理由>
- Moat: X/10 — <1 句理由>
- **为什么我能做**: <2-3 句>
- **3 步落地路径**: 1) ... 2) ... 3) ...
- **用户原声引用**: "..." [来源链接]

### #2 ⭐ ...

## 中段（11-20 名，仅列名 + 总分，不展开）

## 已降权的需求（来自上周决策回顾的"30 天未动"列表）
- ...

## 给月度 demo 候选任务的预备信号
- 本周 TOP 3 累计总分（与上周对比）
- 是否有需求已经连续 4 周进 TOP 5？（高置信度信号，月底 demo 候选必然命中）
```

### 22:00 — 周度决策日志回顾（周日，NEW）

```
cron: "0 22 * * 0"
prompt: 周度决策日志回顾（v2 给 fit-score 提供真实校准源）。

1. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解创始人优先级
2. 跑 `cd /Users/l/Documents/GitHub/Career-Exploration && git log --since="7 days ago" --oneline --no-merges` 看实际 commit
3. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/决策日志.md
   - 如不存在，输出"决策日志文件不存在，请创始人先创建空文件"
   - 如存在但本周无新条目，提示"本周无手动决策记录"
4. 读取过去 4 周的 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/fit-score/*.md
5. 读取上月 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/demo候选/*.md（如存在）

输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/周度决策回顾/YYYY-WW.md：

---
type: 周度决策回顾
week: YYYY-WW
date_range: YYYY-MM-DD ~ YYYY-MM-DD
source: Night Shift
git_commits: N
manual_decisions: M
tags: [deep-dive/调研, deep-dive/决策回顾]
---

# 周度决策回顾 — 第 WW 周

## 一、本周创始人实际推进的决策
（合并 git log + 决策日志，去重）
- 决策 1: <描述> — 来源: git/手动
- 决策 2: ...

## 二、匹配检查（决策 vs fit-score 推荐）
- 命中：哪些决策对应了之前 fit-score 的 TOP 推荐？
- 未命中：哪些决策是 fit-score 完全没预测到的？（=> AI 思维盲区）

## 三、遗忘检查（fit-score 推过 30 天没动的需求）
- 列出过去 4 周 fit-score TOP 5 中，本周仍未被推进的需求
- 建议：这些需求下周自动降权，或归档？

## 四、意外发现
- 本周创始人做的事中，有哪些是之前没在 fit-score 雷达上的？
- 这些事的共同特征是什么？（用于校准 fit-score 维度权重）

## 五、给下周 fit-score 的校准建议
- 哪些维度权重应该上调？（如：本周创始人都在做 Fit-skill 高的事 → 这个维度权重 +10%）
- 哪些维度权重应该下调？
- 是否需要新增维度？（如：本周决策都集中在论文相关 → 加"Thesis-relevance"维度）

## 六、3 个月后回看的种子
（追加到 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/决策日志.md 的"自动追加"段落）
- YYYY-WW: 本周关键模式 = <1 句>
```

## 月度任务（部署时间检查）

> 仅当部署日期符合时添加：

### 月 1 日 11:00 — Landing Page 实验设计（NEW，白天跑）

```
cron: "0 11 1 * *"
prompt: Landing page 实验设计（v2 解决"需求是否真实"问题，让创始人能立刻看所以选 11:00 而不是夜间）。

1. 读取上月 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/demo候选/YYYY-MM.md
   - 如不存在，输出"上月 demo 候选文件不存在，跳过本次"
2. 取上月 demo 候选 TOP 1
3. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解资源约束

输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/landing-page-实验/YYYY-MM-<demo名>.md：

---
type: landing-page实验
date: YYYY-MM-DD
source: Night Shift
demo_source: <对应的 demo 候选文件>
status: 设计中（待创始人决定是否上线）
tags: [deep-dive/调研, deep-dive/实验]
---

# Landing Page 实验设计 — <demo 名>

## 实验目标
- 验证假设：<1 句>
- 验证标准：<具体数字，如"100 访问中 ≥5 注册 = 真需求；<5 = 假需求，砍掉"></s>

## 假着陆页内容
### H1 主标题
<最多 8 字，直击痛点>
### 副标题
<最多 25 字，承诺解决方案>
### 3 个卖点
1. <特征 → 用户收益>
2. ...
3. ...
### CTA
<动作动词 + 价值，如"免费试用 30 秒测评">

## 3 个 hook variants（A/B/C 测试）
### Variant A: 痛点驱动
<标题 + 副标题>
### Variant B: 收益驱动
<标题 + 副标题>
### Variant C: 好奇心驱动
<标题 + 副标题>

## 跟踪指标
- CTR（点击 CTA 比例）
- 邮箱注册率
- 付费意愿点击率（"了解定价"按钮）
- 访问停留时长

## 验证标准
- 100 访问 ≥ 5 注册 → 真需求，进 demo 阶段
- 100 访问 1-4 注册 → 边缘信号，再投流 100 看
- 100 访问 0 注册 → 假需求，归档

## 最低成本搭建路径
- 工具推荐：Carrd ($19/年) / Framer (免费起) / 直接用 Deep Dive 现有框架加路由
- 流量来源：Reddit r/<相关 sub> 1 帖 + X 1 推 + 朋友圈 1 发 = 100-300 访问
- 时间预算：搭建 2-4 小时 + 跑 1 周

## 创始人决策点
- [ ] GO：本月实验
- [ ] WAIT：等下月再说
- [ ] NO-GO：放弃这个 demo

⚠️ 本任务只出方案，不自动建站、不自动投流。
```

### 月 28 日 23:00 — 月度 Demo 候选 + 上月跟踪（NEW）

```
cron: "0 23 28 * *"
prompt: 月度 Demo 候选生成 + 上月跟踪（v2：从每周改为每月）。

1. 读取 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/founder-context.md 了解资源/优先级
2. 读取本月所有 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/fit-score/*.md（约 4 份）
3. 找累计得分最高的 3 个需求（按 4 周总和）

为每个 TOP 3 需求生成 demo 草案：

### Demo 候选 #N: <需求名>
- **产品定义**：解决谁的什么问题（1 段）
- **技术方案**：
  - 数据流伪代码（mermaid 或文字）
  - 复用 Deep Dive 现有模块（具体到文件路径，如 lib/scoring/, components/profile-panels/identity-hero.tsx）
  - 需要新建的模块（具体到文件名）
- **变现路径**：订阅 / 按次 / B2B / 联盟，预估 ARPU
- **风险**：技术风险 / 法律风险 / 用户风险
- **如果点 GO，第一天该做什么**：3-5 个具体动作

**上月跟踪部分**：
4. 读取上月 demo 候选 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/demo候选/YYYY-MM.md（上一个月的）
5. 读取本月 git log + Founder/决策日志.md
6. 标注上月每个 demo 候选的当前状态：
   - GO（已开始做）：列具体进展
   - NO-GO（明确放弃）：列理由
   - 仍在评估：列原因
   - 被遗忘：列原因（最尴尬的状态，需反思）

输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/demo候选/YYYY-MM.md：

---
type: demo候选
month: YYYY-MM
source: Night Shift
top_count: 3
tags: [deep-dive/调研, deep-dive/demo]
---

# 月度 Demo 候选 — YYYY-MM

## 上月跟踪
| 上月 demo | 当前状态 | 备注 |
|---|---|---|
| ... | GO/NO-GO/评估/遗忘 | ... |

## 本月 TOP 3 候选
### #1 ⭐ ...
### #2 ⭐ ...
### #3 ⭐ ...

## 创始人审批栏
- [ ] #1 GO  [ ] #1 NO-GO  [ ] #1 待定
- [ ] #2 GO  [ ] #2 NO-GO  [ ] #2 待定
- [ ] #3 GO  [ ] #3 NO-GO  [ ] #3 待定

⚠️ 本任务只出方案+技术草稿，不自动 commit / push / 部署。立项必须人工 GO。
```

### 月 28 日 23:30 — 月度精华生成（NEW）

```
cron: "30 23 28 * *"
prompt: 月度精华生成（v2 替代 v1 的散乱归档，给一个能 5 分钟看完的本月总结）。

读取本月所有：
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/周报精华/*.md（约 4 份）
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/fit-score/*.md（约 4 份）
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/周度决策回顾/*.md（约 4 份）
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/demo候选/YYYY-MM.md（1 份）
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/KOL周报/*.md（约 4 份）
- /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/landing-page-实验/*.md（如有）

输出 /Users/l/Documents/LifeOS/04\ Projects/Deep\ Dive/Founder/月度精华/YYYY-MM.md：

---
type: 月度精华
month: YYYY-MM
source: Night Shift
weeks_covered: N
tags: [deep-dive/调研, deep-dive/月报]
---

# Deep Dive 月度精华 — YYYY-MM

## 一、本月最重要的 3 个变化
（对你/产品/赛道而言）
1. ...
2. ...
3. ...

## 二、本月 TOP 5 需求洞察（合并 4 周 fit-score TOP 5）

## 三、本月 TOP 3 竞品动作

## 四、本月 demo 推进复盘
- 上月 demo 候选 GO 了几个？
- 本月新增 demo 候选 TOP 3
- Landing page 实验跑了几个？验证结果？

## 五、本月护城河变化
- 新加固的 / 被竞品威胁的

## 六、KOL 名单本月动态
- 本月最值得关注的 KOL 输出
- 是否有新 KOL 应该加进名单？

## 七、决策模式（来自决策回顾）
- 本月创始人实际推什么 vs AI fit-score 推什么
- 命中率
- 校准建议

## 八、下月最值得关注的 1 个方向
（如果只能选一件事，是什么？）
```

## 设置完成后

输出确认清单：

```
🌙 Night Shift v2 已部署
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

每日核心（4 个）：
  02:33  AI 情感陪伴+心理科技赛道 🧠💜
  03:13  AI 职业评测赛道研究 🎯
  03:43  全领域前沿动态 🌐
  05:03  全网用户需求采集（v2 扩平台+扩赛道） 👥

每日基础设施（2 个）：
  06:30  调研归档器（移 7+ 天报告到 Founder/archive/） 📦 [NEW]
  23:00  反向调研槽位（处理问题队列） ❓ [NEW]

条件触发（有代码变更时）：
  00:27  全面验证 🔧 [if code changed]
  04:17  核心旅程 QA 测试 🧪 [if code changed]

周一额外（5 个，本周是否周一？）：
  01:03  文档漂移检查 📄
  01:33  商业模式+护城河+Strategy 框架反哺 🏰 [v2 修改]
  02:07  DB schema 一致性 🗄️
  05:33  分发与增长渠道监控 📈 [v2 周度]
  07:00  周报精华（替代 v1 每日合并+晨间） 📊 [NEW]

周二额外（1 个，本周是否周二？）：
  01:33  KOL 5 人深度跟踪 👁️ [NEW，替代 v1 陌生人脉雷达]

周三额外（1 个，本周是否周三？）：
  01:33  政策与合规雷达 ⚖️

周日额外（2 个，本周是否周日？）：
  21:00  周度 Fit-Score 筛选（替代 v1 每日 fit-score） 🎯 [NEW]
  22:00  周度决策日志回顾（fit-score 校准源） 📝 [NEW]

月度（按日期触发）：
  月 1 日 11:00  Landing Page 实验设计 🧪 [NEW]
  月 28 日 23:00  月度 Demo 候选 + 上月跟踪 💎 [NEW]
  月 28 日 23:30  月度精华生成 📚 [NEW]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
caffeinate: ✅ 已启动
今晚任务数: N（视星期+月度而定，平均 6-12 个）
有效期: 7 天
v1→v2 任务密度: 21/周 → ~12/周 (-43%)
⚠️ 请保持终端和 Claude Code 会话打开
⚠️ 如 Founder/ 目录尚未创建，请先按 plan 文件准备：
   ~/.claude/plans/night-shift-a-i-transient-hopper.md

下一步建议：
- 白天遇到决策卡点 → /ask-founder-research <你的问题>
- 每周一早上 7:00 看周报精华
- 每周日晚上看 fit-score
- 每月 1 日上午看 landing page 实验设计
- 每月 28 日晚上看 demo 候选 + 月度精华
```
