# Sounding(测深)— Deep Dive UI 总风格设计圣经

> **Canonical 设计宪章。** 本文档是 Deep Dive 视觉总风格的单一权威源(策略层 / "为什么")。
> 执行细则(token 词典 / 组件 / page-art / 动效)见 `.claude/skills/deepdive-design/` 的 `references/`。
> 工程命名沿用历史名 **Meridian**(`--md-*` token、`components/design/meridian/`、`lib/design/`);Sounding 是这套地基的**审美身份重铸**,不是另起炉灶。改名属高风险重构,逐步迁移,非一次性。
>
> 立项:2026-06-28 · 研究基础:11 次全网检索 + 6 篇技术源深度 fetch + 2 路总监级研究 + 现有 Meridian 代码实测。

---

## 一句话

> **Sounding —— 以严谨的工具,做温柔的下潜。**
> _Rigorous instruments, for a tender descent._ · 「每一次下潜,都有刻度。」

Deep Dive 是一个以「深海下潜」为隐喻的跨文化职业自我发现平台(问卷 → 个人档案 → 职业报告 → AI 教练)。它的视觉总风格不是"科技极简"(Apple),也不是"文艺繁复"(Notion),而是 **用海图档案室的严谨,包装一次对自我的下潜测量**。主导血统是 **瑞士编辑设计 × 制图 / 博物馆档案美学**;深海是过程的质感,不是产品的身份——用户离开时记住的是自己,不是海。

---

## Context — 为什么是 Sounding

现有设计系统 **Meridian**(「同一片海,两个时辰」)战略方向正确——深海光学 + 双时辰 + 双强调色 + serif/sans 分工 + 双层色彩架构,是 2026 全网顶级审美的交汇点。但它有一处**自我认知错位**:它自称"莫奈印象派油画"(全网几乎零成功"绘画感 UI"先例,且与极简天然矛盾),而代码里真正的签名资产(Depth Gauge 深度标尺、`01` 编号分区、Chart Room 海图室、Descent atlas)**全是制图 / 档案 / 瑞士编辑的血统**。

**Sounding = 重铸审美身份 + 复用工程地基。** 给系统一个更诚实、更狠、更独特的灵魂,同时最大化复用已验证的资产(对比度已过 CI 的色值、深度带、组件)。预期:用户不会感到"换了系统",只会感到"突然更高级、更轻、更像一份值得收藏的考察报告"。

---

## 全网研究综述(硬支撑)

- **Neo-Minimalism with Warmth / Quiet Luxury**(2026 主流)— 瑞士骨架 + 暖意(奶白替纯白、grain 纸感、heritage serif、克制品牌色)。
- **Tactile Craft「Texture Check」** — 纸纹、织物、雾面玻璃回归。
- **Editorial Luxury** — 杂志网格、thin-line motif、serif + 手写副、戏剧化留白。
- **Bio-Luxe / 生物发光** — 把深海磷光重塑为高端设计语言(Iris Van Herpen 生物发光裙为顶级参照)。
- **Glassmorphism 2.0 / Apple Liquid Glass** — 克制使用 + 深度层次。
- **Restraint beats spectacle** — 顶级 scrollytelling 共识:不是每段都要动画。
- **深海光学物理宪法** — 水对长波吸收快,**蓝绿光 440–510nm 传播最远**(深海永远蓝绿主调的物理原因);生物光罕见地出现青绿 / 品红 / 电蓝。→ 主色锁 440–510nm,磷光做"罕见即珍贵"的点缀。
- **竞品坐标** — 16Personalities"像一段体验"、Truity"干净但不令人难忘";**设计差异直接决定病毒传播**。目标位:比 16P 更高级、更艺术、更沉浸,且具备 16P 没有的学术可信度。

---

## 五条不可违背的核心律(Sounding Constitution)

1. **深海光学宪法** — 主色锁 440–510nm 蓝绿光谱;**下潜必单调变暗,绝不回亮**(滚动 = 深度,色从浅蓝→蓝绿→近黑线性推进)。
2. **双层色彩架构(保留并强化)** — UI 基底层(文字 / 控件 / 卡片,严格 AA ≥4.5:1)与氛围层(背景画 / 光斑 / 渐变,艺术自由)彻底分离。质感不毁可读性的护城河。
3. **磷光关在笼子里** — 强调光(磷光青 / 黄铜金)只做**点光**:深度标尺当前点、关键数据、编号、揭晓时刻。绝不满屏氛围——一多就从"高级"滑向"占卜 App / 加密官网"。
4. **海图档案室是身份,深海是质感** — 主导视觉语汇是制图 / 编号 / 刻度 / 凭证(瑞士 × 档案);深海是过程质感,不是产品身份。
5. **严肃与沉浸分流** — 主产品线 = 静、轻、可信(瑞士 + 档案 + grain,纯 CSS,零 WebGL 负担);Immersive Dive / 落地页 = 动、重、一次性(电影感 + WebGL)。两条线井水不犯河水。

---

## 流派配方(主导 + 辅助)

| 角色                       | 流派                                 | 职责                                                              | 契合度 |
| -------------------------- | ------------------------------------ | ----------------------------------------------------------------- | ------ |
| **主导(骨架)**             | 瑞士编辑设计 × 制图 / 博物馆档案美学 | 网格、字体即设计、编号分区、深度刻度、凭证感;跨 11 语言零文化口音 | 9/10   |
| **辅助 A(皮肤温度)**       | 新极简带暖意 / Quiet Luxury          | grain 纸感、heritage serif、奶白柔灰、慢叙事;焐热冷骨架           | 8.5/10 |
| **辅助 B(灵魂点睛)**       | Bio-Luxe 磷光(关在笼子里)            | dark 点光 + 揭晓时刻;唯一独特视觉钩子,当香水一滴                  | 7/10   |
| **哲学注脚(不进视觉外观)** | 侘寂 Ma 留白 + 东方泥色温度          | 留白纪律 + "energized calm" 情绪温度;兼顾中文用户审美             | 7.5/10 |
| **隔离区**                 | Cinematic / 新印象派绘画感           | 只活在 Immersive Dive + 落地页一张背景画,不进主产品骨架           | 6–7/10 |

---

## 配色系统(深海光学宪法)

> 复用 Meridian 已验证色值(对比度已过 CI),**叙事正当性重铸,不是换色板**。

### 基底层(UI,严格 AA)

| 角色                | Light     | Dark      | Sounding 叙事          |
| ------------------- | --------- | --------- | ---------------------- |
| 主文字 ink          | `#0C2A44` | `#EFE2CE` | 海图墨 / 羊皮档案字    |
| 次文字              | `#4D6C82` | `#9FB6C4` | —                      |
| 主背景 paper        | `#F9FAF6` | `#04121F` | 海图纸 / 子夜水        |
| 卡片 card           | `#FFFFFF` | `#0A2336` | 凭证纸 / 仪器面板      |
| 理性交互色 sea      | `#0B5F91` | `#76D4E8` | 测深蓝(440–510nm 核心) |
| 图形强调 sea-bright | `#0F86B8` | `#3FA8C9` | 等深线亮调             |

### 强调色重铸(关键)

- **金 → 黄铜(Brass)** — 弃"正午阳光"叙事,认领为**航海黄铜仪器 / 古海图羊皮 / 六分仪刻度的金**(`#D8B46A` 装饰 / `#8A6420` light 文字金 / dark `#D8B46A`)。色值不变,正当性更硬,与"严谨工具"哲学咬合。用途:深度标尺当前点、编号、关键数字、落款。
- **磷光青 Phosphor `#76D4E8`** — dark 专属点光,呼应"深海里罕见的光 = 你身上珍贵的特质"。仅点缀,禁满屏。
- **禁区** — 紫色渐变、珊瑚粉、霓虹蓝紫、多彩图表。图表用**明度坡道**(sea → sea-bright → brass → ink-soft → mist),不靠色相。

### 氛围层(下潜光谱)

深度色阶严格单调变暗(已有 `--depth-*`):`#F9FAF6` → `#0B5F91` → `#022A4A` → `#011828` → `#010E1A`。滚动驱动连续插值,永不回亮。

---

## 字体与 Editorial 排版

- **Fraunces**(variable wonky serif)— 情感与权威:hero / 章节标题 / 揭晓文案 / _italic 副题_。
- **DM Sans** — 操作:正文 / 按钮 / 表单 / 导航 / 数据界面。
- **Noto Serif SC / Noto Sans SC** — 中文标题 / 正文。
- **Caveat** — 仅手写落款。

Editorial 硬规则:正文行宽 **60–75 字符**;display 标题 48–96px × 正文 16–19px;长文行高 1.5–2.0、标题 1.05–1.2;1px 发丝线(= 等深线)分区;非对称网格 + 模块化区块,报告正文两侧大留白居中收窄。

---

## 材质与质感

1. **Grain 噪声(最高杠杆)** — `feTurbulence` 叠底,opacity 3–8%(revelation 可到 .26)。冷数字界面瞬间变印刷纸。
2. **Hairline 代重阴影** — 纸面 / 玻璃 + 1px 等深线 + 顶部高光线;dark 细线带黄铜 = 签名。
3. **Liquid Glass 2.0(克制)** — 仅浮层 / 导航 / 揭晓卡;绝不 glass-on-glass、不全站铺;深色站玻璃**蓝绿染色**`rgba(120,180,200,.08)`;半透明区下方正文必垫实色保 ≥4.5:1。
4. **背景画必须 webp**(72–200K),禁同名 .png。

---

## 动效与沉浸节奏

- 慢 = 高级:主曲线 **expo-out `cubic-bezier(0.16,1,0.3,1)`**,叙事级 600–1200ms(复用 `--motion-l0..l5`)。
- 下潜电影视差:前景 1.0x / 中景 0.6x / 远景 0.3x;远景轻 blur 制景深。
- 呼吸脉动 4s 张 / 6s 缩(Headspace 式),用于加载 / 过渡 / 揭晓。
- 滚动驱动单图自演化(The Pudding 式):散点图 / 雷达图随滚动逐步点亮。
- 一个关键揭晓时刻用粒子汇聚仪式(Active Theory 式),**只此一处**。
- 铁律:`prefers-reduced-motion` 全循环动画有回退;单 scroll listener;滚动驱动用 `getBoundingClientRect()`;滚动容器用 `overflow-x: clip`。

---

## 签名识别元素(每页 ≤3 个)

1. **Sounding Gauge(测深标尺)** — 垂直等深线刻度 + 黄铜当前点(0m → 200m → 400m → 600m)。图腾。
2. **Numbered Compartments(编号舱格)** — `01 YOUR PORTRAIT` 黄铜编号 + 小型大写宽字距 + 细线延伸。
3. **Hairline / Isobath Grid(等深线网格)** — 1px 刻线(dark 带黄铜)。
4. **Chart Plate(海图凭证)** — 报告 / 档案做成"考察凭证":纸面 + 编号 + 落款。
5. **Script Coda(手写落款)** — "Go deeper. Live clearer."(Caveat)。

---

## 四深度带 Surface(语义对齐)

复用 `lib/design/surfaces.ts`:

| Surface      | 身份                                 | 氛围                                              | 用于                                                 |
| ------------ | ------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| `dive`       | Open Water 远海                      | 全幅 painted ocean,玻璃高比例,wash 薄             | landing / explore / quickdive / deepdive / immersive |
| `revelation` | **Chart Room 海图室(Sounding 主场)** | 纸面最纯、等深线最密、serif 最重、grain 最重(.26) | report / result / profile / share                    |
| `sanctuary`  | Lantern Light 灯下                   | 色温 +2、黄铜光斑、暖纸面板                       | coaching / action-hub / companions                   |
| `utility`    | Bridge 舰桥                          | 最克制、数据感、小型大写标签 + 等深线网格         | dashboard / settings / admin                         |

---

## Sounding vs Meridian — 升华 vs 保留

**保留(一字不改):** 双层色彩架构 · 双强调色铁律 + 克制律 · Hairline 代重阴影 / 四深度带 / Depth Gauge / 编号分区 · serif 承情感 / sans 承操作 · light/dark 同源双时辰。

**三刀减法:**

1. **印象派降级** — 从"定义 Light 身份"退到"氛围层一张画 + grain"。Light 身份回归奶白纸感 + 海图 hairline。
2. **认领海图档案室做主导身份** — 印象派退为情绪点缀。0 成本最高杠杆。
3. **严肃与沉浸分流** — 主产品纯 CSS;电影感 / WebGL 隔离到 Immersive + 落地页,避免同屏打架 + 性能爆炸。

---

## 落地优先级路线图

- **P0(0 代码)** — 本文档(✅ canonical)+ 改写 SKILL 身份段。
- **P1(概念验证)** — 报告封面 / Profile 做 Sounding A/B 概念稿,Light + Dark + 375px 截图验收。
- **P2(质感铺底)** — 全站 grain 3% + editorial 行宽 60–75 字符纳入 `globals.css`;Liquid Glass 浮层蓝绿染色。
- **P3(签名强化)** — Sounding Gauge / Chart Plate / 编号舱格视觉强度统一提升;散点图滚动自演化;揭晓粒子仪式。
- **P4(清扫)** — `components/questionnaire/` 硬编码 `sky-400` → 氛围 token;解冻 coaching / profile 内容区。

---

## 验证方法

1. 概念稿双模式比对(Sounding vs Meridian,Light + Dark + 375px,`/preview` 或 Playwright MCP 出图)。
2. 对比度门:CI 16 项 WCAG,基底层 ≥4.5:1、强调 ≥5:1(dark)。
3. 跨语言:11 语言抽查 hero / 报告 / 问卷无文化口音、无溢出。
4. 性能:主产品零新增 WebGL;`prefers-reduced-motion` 全覆盖。
5. 回归:`npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n`。

---

## Sources(主要)

设计趋势:[Figma 2026](https://www.figma.com/resource-library/web-design-trends/) · [Envato](https://elements.envato.com/learn/graphic-design-trends) · [Wix](https://www.wix.com/blog/web-design-trends) · [Quiet Luxury 2026](https://www.schweitzerdesigns.com/post/luxury-branding-trends-2026)
深海 / 沉浸:[The Sea We Breathe](https://www.awwwards.com/inspiration/the-sea-we-breathe-dive-into-3-immersive-underwater-journeys) · [The Deep Sea — FlowingData](https://flowingdata.com/2019/12/05/scroll-scroll-scroll-through-the-depths-of-the-ocean/) · [Convex Seascape](https://www.awwwards.com/inspiration/underwater-convex-seascape-survey)
流派:[Swiss Web Design 2026](https://www.pixeldarts.com/en/post/swiss-style-web-design-a-comprehensive-guide) · [NatGeo Museum of Exploration](https://www.nationalgeographic.com/culture/article/inside-new-museum-of-exploration) · [Wabi-Sabi](https://silphiumdesign.com/wabi-sabi-web-design-understanding-imp-prin/) · [Iris Van Herpen](https://www.digitalfashionweek.com/2025/07/bioluminescent-algae-dress-by-iris-van-herpen-when-fashion-becomes-a-living-light-source/)
质感:[Apple Liquid Glass — CSS-Tricks](https://css-tricks.com/getting-clarity-on-apples-liquid-glass/) · [Liquid Glass Pure CSS](https://dev.to/kevinbism/recreating-apples-liquid-glass-effect-with-pure-css-3gpl) · [Easing — Josh Collinsworth](https://joshcollinsworth.com/blog/easing-curves)
内省产品:[Headspace — Raw.Studio](https://raw.studio/blog/how-headspace-designs-for-mindfulness/) · 工作室:[Active Theory](https://activetheory.net/) · [The Pudding](https://pudding.cool/)
