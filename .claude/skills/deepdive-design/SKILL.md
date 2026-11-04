---
name: deepdive-design
description: "UI/UX design system for Deep Dive. Activates for any visual, layout, animation, component, or responsive task — even if user doesn't mention 'design' explicitly."
---

# Sounding(测深)— Deep Dive 设计系统

你正在为 **Deep Dive**(AI Career Self-Discovery Platform)构建 UI。设计语言名为 **Sounding(测深)**:**以严谨的工具,做温柔的下潜。**

> **策略层权威源(为什么 / 总风格):`docs/design/sounding-design-bible.md`。** 本 SKILL 是执行层(怎么做)。
> **身份认领(2026-06-28 重铸):主导血统是「瑞士编辑设计 × 制图 / 博物馆海图档案室」——网格、编号舱格、深度刻度、考察凭证。深海是过程的质感,不是产品的身份;用户离开时记住的是自己,不是海。印象派退为氛围层一张背景画 + grain,不再定义 Light 模式身份。**
> **工程命名沿用历史名 Meridian**(`--md-*` token、`components/design/meridian/`、`lib/design/`);Sounding 是这套地基的审美身份重铸,不是另起炉灶。改名属高风险重构,逐步迁移。

仍然是 **同一片海,两个时辰**:

- **Light = Chart Room Noon 海图室正午** — 奶白海图纸 + 海蓝墨 + 黄铜刻度 + 等深线;印象派光斑退居氛围层
- **Dark = Midnight 子夜深海** — 月光下潜:深海蓝黑、暖米白文字、黄铜细线、一滴磷光青

Dark mode 不是"换肤",是同一个世界的另一个时刻。每一个 light 决策必须有 dark 对等版本。

## 五条不可违背的核心律

1. **双强调色铁律** — 全站只有 2 个强调色:**海蓝**(行动/理性/交互)+ **黄铜 Brass**(航海仪器/海图羊皮/六分仪刻度;= 原"金",色值不变,叙事重铸)。禁止紫色渐变、珊瑚粉、多彩图表。黄铜克制使用:深度标尺当前点、关键数字、编号、落款 — 黄铜一多就廉价。
2. **双层色彩架构** — UI 基底层(文字/控件/卡片,严格 AA 对比度)与氛围层(背景画/光斑/渐变,艺术自由)分离。印象派属于光与空气,不污染控件颜色。
3. **统一骨架,每页变化** — 全站一套排版骨架(Expedition Rail 侧栏 + 编号分区 + footer 三件套),每页靠 Page-Art(独立背景画/裁切/光源/accent)产生变化。变化在氛围,不在骨架。
4. **Hairline 代替重阴影** — 卡片语言 = 纸面/玻璃 + 1px 细线 + 顶部高光线。Dark 模式细线带金(`rgba(214,181,118,.24)`)— 子夜的金色刻线是签名细节。
5. **serif 承载情感,sans 承载操作** — Fraunces 标题 + _italic 情感副题_;DM Sans UI;Caveat 仅落款。

## 设计决策路由

做任何 UI 工作,按此顺序查规范:

| 你要做什么                       | 查阅                                                            |
| -------------------------------- | --------------------------------------------------------------- |
| 用颜色/写 token / 改 globals.css | `references/tokens.md` ★ 唯一 token 词典                        |
| 给页面配背景画/光源/accent       | `references/page-art.md` ★ Page-Art 系统                        |
| 页面排版骨架(侧栏/分区/footer)   | `references/layout-shell.md` ★ 排版主体                         |
| 确认页面所属 Surface 与氛围      | `references/surfaces.md`                                        |
| 字体/字号/中英文排版             | `references/typography.md`                                      |
| 按钮/卡片/面板/输入框样式        | `references/components.md`                                      |
| 动画/过渡/呼吸/性能              | `references/motion.md`                                          |
| 做某个具体页面(对照概念图)       | `references/pages.md` + `docs/design/page-templates/images-v2/` |

**对照稿**: `docs/design/page-templates/images-v2/<page>-{light,dark}.png` 是每页的权威视觉目标(62 张)。落地时打开对应图比对。

## 四深度带(Surface 架构)

Surface 系统(`lib/design/surfaces.ts`)保留,语义重铸为同一世界的四个深度带:

| Surface      | 身份                                 | 签名牌                 | 氛围                                            |
| ------------ | ------------------------------------ | ---------------------- | ----------------------------------------------- |
| `dive`       | **Open Water 远海**                  | D · Descent atlas      | 全幅海洋画布,painted ocean 主场                 |
| `revelation` | **Chart Room 海图室(Sounding 主场)** | R · Monograph plate    | 纸面最纯、细线最多、serif 最重、grain 最重(.26) |
| `sanctuary`  | **Lantern Light 灯下**               | S · Reflection room    | 同色系色温+2,金光斑、暖纸面板                   |
| `utility`    | **Bridge 舰桥**                      | U · Surface instrument | 最克制,细线+小型大写标签,数据感                 |

**深海隐喻是过程的质感,不是产品的身份** — 用户离开时记住的是自己,不是海。

## 五个签名元素(识别度来源,每页 ≤3 个)

1. **Depth Gauge** — 垂直细线深度标尺,金色当前点(0m Surface → 200m Clarity → 400m Direction → 600m Discover)
2. **Numbered Compartments** — `01 YOUR PORTRAIT` 金编号 + 小型大写宽字距 + 细线延伸
3. **Hairline Grid** — 1px 刻线(dark 带金)
4. **Painted Ocean** — Page-Art 背景画系统
5. **Script Coda** — 手写落款 "Go deeper. Live clearer."(Caveat)

## 技术栈

Next.js 16 App Router + React 19 + TS strict · **Tailwind v4**(token 全在 `app/globals.css`,无 tailwind.config)· Radix/shadcn(`components/ui/`)· Framer Motion 12 · 移动优先 375px 基准。

## ⚙️ 工程铁律盒(违反会出 bug,不是风格问题)

- **`app/[locale]/template.tsx` 只动 opacity** — 加 transform 会破坏所有 fixed 浮窗的定位基准
- **AmbientField / PageArtLayer 不全局挂** — 会被各页伪元素背景遮挡;只挂在 route group layout 或无 bespoke 背景的页面
- **CSS animation shorthand 坑** — `var()` 内含 easing 时不能在 shorthand 重复指定 easing;`calc(var())` 在 shorthand 中失效
- **原型 6 色是功能色** — 12 原型的 RIASEC 色相身份不可删,只能在 token 层重新调色
- **冻结 token 区** — `--qd-b0..b4`、`--report-*`、`--exec-*`、`--rev-signal-*`、`--qd-intro-*` 未迁移,改前查 `references/tokens.md §冻结区`
- **`prefers-reduced-motion`** — 所有循环动画必须登记进 globals.css 顶部的 reduced-motion 清单
- **背景图必须 webp** — `public/brand/*.webp`(72-200K),禁止引用同名 .png(2-2.8M)

## 组件开发清单

- [ ] 确认 Surface → 用对应深度带变量,不硬编码色值
- [ ] Light + Dark 双模式皆验证(dark 不是可选项)
- [ ] 375px 可用,触控目标 ≥44px
- [ ] 文本走 i18n 字典(dict prop),零硬编码 `isZh ?`
- [ ] 金色文字必须用 `--md-gold-text`(light 模式 `--md-gold` 仅装饰)
- [ ] 动画有 reduced-motion 回退
- [ ] 复用 `components/ui/` 与 `components/design/meridian/`,不重复造轮子
- [ ] 中文排版(html[lang=zh] 自动覆写 line-height/字距,勿手动覆盖)
- [ ] 不暴露学术术语(RIASEC/Big Five/Schwartz → 品牌语言)

## 关键路径速查

| 资产            | 路径                                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Token 源        | `app/globals.css`(`--md-*` 基底层 → brand 桥 → semantic)                                                                    |
| Page-Art 配置表 | `lib/design/page-art.ts`                                                                                                    |
| Meridian 组件   | `components/design/meridian/`(page-art-layer / expedition-rail / depth-gauge / compartment / script-coda / meridian-footer) |
| Surface 路由    | `lib/design/surfaces.ts`                                                                                                    |
| 氛围组件        | `components/design/ambient/` + `grain-veil.tsx`                                                                             |
| 概念对照稿      | `docs/design/page-templates/images-v2/`                                                                                     |
| 背景画资产      | `public/brand/*.webp` + `public/immersive/scenes/*.webp`                                                                    |
