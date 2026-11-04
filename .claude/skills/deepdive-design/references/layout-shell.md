# 排版骨架 — Expedition Rail + 编号分区 + Footer 三件套

> 全站统一排版骨架,转译自 v2 模板的 `.page-main / .side / .panel / .footer` 语法。组件在 `components/design/meridian/`。

## 1. 页面解剖(app 页标准结构)

```
┌─ AppHeader(顶部导航,现有,保持)──────────────────┐
├─ PageArtLayer(fixed 背景画,见 page-art.md)        │
├─────────────┬───────────────────────────────────────┤
│ Expedition  │  main 内容区                          │
│ Rail        │  ┌ content-head(serif 大标题开场)    │
│ (lg+ 显示,  │  ├ 01 编号分区(md-panel)             │
│  ~250px)    │  ├ 02 编号分区                        │
│             │  └ 03 ...                             │
├─────────────┴───────────────────────────────────────┤
│ MeridianFooter(三件套)                              │
└─────────────────────────────────────────────────────┘
移动端(<lg): rail 隐藏,保持 AppHeader + MobileTabBar
```

Landing/marketing 页无 rail(全幅 hero + 分区);auth 页为居中 md-panel 卡 + PageArt。

## 2. Expedition Rail(`expedition-rail.tsx`)

桌面左侧栏,宽 250px,玻璃材质(`linear-gradient(180deg, rgba(255,255,255,.26), rgba(255,255,255,.12))` + blur(18px);dark `rgba(1,22,34,.48)`),右侧 hairline 分界。自上而下:

1. **Surface kicker** — 小型大写宽字距,如 `UTILITY SURFACE`(accent 色)
2. **页面标题** — Fraunces 400,~30-34px,line-height 1.04
3. **一句简介** — ink-soft,13px
4. **签名牌 signature-card** — 圆形 instrument(serif 大字母 D/R/S/U,hairline 圆环,内侧 accent 微光 `inset 0 0 18px`)+ 右侧两行:粗体名称 + kicker
   - dive=`D · Descent atlas` / revelation=`R · Monograph plate` / sanctuary=`S · Reflection room` / utility=`U · Surface instrument`
5. **页内章节锚点 side-nav** — 编号列表(`Overview 01 / Reports 02 / ...`),40px 行高,active 行: hairline 边 + accent 渐变底 `linear-gradient(90deg, color-mix(in srgb, var(--page-accent) 24%, white 36%), rgba(255,255,255,.18))`(dark: `rgba(255,255,255,.05)`)。IntersectionObserver 高亮(复用 Settings 页已有模式)
6. **可选 DepthGauge**(旅程页)

Props: `{ kicker, title, intro, sections?: {id,label}[], showDepthGauge? }`。**锚点是页内章节,不是全站导航**(避免与 AppHeader 重复)。

## 3. 编号分区(`compartment.tsx` + `.md-compartment`)

每个内容区块的标准头:

```
01 ─── YOUR PORTRAIT ──────────────────────────
```

- 编号: 11px,字距 .18em,`--md-gold-text`
- 标签: 11px 小型大写,字距 .18em,`--md-ink-soft`
- 细线: flex-1 hairline 延伸到右缘
- 分区标题(可选): Fraunces 400 21-28px + 一句 ink-soft 简介

## 4. 面板(`.md-panel` / `.md-card`)

| 类          | 用途             | 配方                                                                                                                           |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `.md-panel` | 主内容面板(玻璃) | `background: var(--md-panel-bg)` + `border: 1px solid var(--md-panel-border)` + blur(15px) + 顶部高光线 ::before + radius 10px |
| `.md-card`  | 数据密集卡(纸面) | `background: var(--md-card)` + hairline 边 + 无 blur + radius 8px                                                              |

并排面板之间用 hairline 分隔(`border-right`)而非 gap 留白 — 这是 v2 的"仪表盘格"语法。圆形元素(orb/seal/ring)统一: hairline 圆环 + serif 字母 + `rgba(255,255,255,.34)` 底(dark `.04`)。

## 5. Footer 三件套(`meridian-footer.tsx`)

70px 高,三列 grid,顶部 hairline:

| 左                                                                                          | 中                                                                   | 右                                                                                                   |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| orb `A` + "Built for depth. Designed for you.<br/>Your journey is private and yours alone." | orb `E` + "Evidence-based<br/>Real data. Real people. Real insight." | **Script Coda**: "Go deeper. Live clearer."(Caveat ~20-26px,light 用 gold-text / dark 用 gold)+ 金点 |

文案走 i18n 字典(`common.json` 或新 `meridianFooter` namespace)。landing + (app) 共用。

## 6. 深度标尺(`depth-gauge.tsx`)

垂直 1px hairline-strong 线 + 刻度点:

- 非当前: 8px 空心圆(1.5px ink-soft 环)
- 当前: 10px 金实心 + `box-shadow: 0 0 10px var(--md-gold)` + 标签 gold-text 加粗
- 标签: 10.5px,字距 .08em(`0m Surface / 200m Clarity / 400m Direction / 600m Discover`)
- Props: `{ stations: {label,depth}[], activeIndex }`;旅程页从 journey state 推导 activeIndex

## 7. 响应式律

- rail: `hidden lg:block`;主内容 `lg:grid-cols-[250px_1fr]`
- 375px: 编号分区头保持,面板转单列堆叠,hairline 分隔转水平
- 触控 ≥44px;rail 锚点行 40px(鼠标)但移动端不出现
- footer 移动端转两行(coda 居右保留)

## 8. 用量克制

- 每页签名元素 ≤3(rail 签名牌 + 编号分区 + footer coda 已是 3 个)
- DepthGauge 只出现在旅程语义页(landing hero / dashboard / explore / 问卷),不进 settings/admin
- 金色出现次数 = 编号 + 当前点 + coda;再多即超标
