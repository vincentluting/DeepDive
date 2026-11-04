# 组件 — Meridian 形态

> 基础组件在 `components/ui/`(shadcn),Meridian 签名件在 `components/design/meridian/`。改组件先查此表,不重复造轮子。

## 1. Button(`components/ui/button.tsx`)

| 变体              | Light                                                                                                                                                | Dark                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| primary           | 渐变 `linear-gradient(135deg, var(--md-sea-deep), var(--page-accent, var(--md-sea)))` + 白字 + 边 `color-mix(in srgb, var(--md-sea) 26%, white 28%)` | 渐变深端收敛 + `--md-cream` 字 + **金混边** `color-mix(in srgb, var(--page-accent) 60%, var(--md-gold) 18%)` |
| secondary/outline | 透明底 + hairline-strong 边 + ink 字                                                                                                                 | 同构                                                                                                         |
| ghost             | 无边,hover `--md-wash`                                                                                                                               | 同构                                                                                                         |
| 金色场景          | **金底必配 ink 字**(白字对比不足)                                                                                                                    | dark 金可做文字                                                                                              |

按住缩放 `active:scale(.98)`;radius 6-7px;高度 ≥40px(触控 44px)。

## 2. 卡片族

| 组件/类             | 用途         | 形态                                                                                |
| ------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `.md-panel`         | 玻璃主面板   | panel-bg 渐变 + panel-border + blur(15px) + 顶部高光线 + radius 10                  |
| `.md-card` / `Card` | 纸面数据卡   | md-card 实底 + hairline + radius 8,无 blur                                          |
| `glow-card.tsx`     | hover 光晕卡 | 光晕减档(`--md-sea` 16%),仅 dive 带                                                 |
| `rev-card.tsx`      | 报告纸卡     | 保留,引 md token                                                                    |
| 圆形 orb/seal       | 字母印章     | hairline 圆环 + Fraunces 字母 + `rgba(255,255,255,.34)` 底(dark `.04`)+ accent 内光 |

卡片**不再用重 box-shadow 作为主要分层手段** — 层次靠 hairline + 材质差。大柔影(`--md-panel-shadow`)仅 hero 级面板。

## 3. 表单

- Input/Textarea/Select: md-card 底 + **hairline-strong 边**(1.4.11 合规)+ focus ring `--md-sea` 2px + radius 7px
- placeholder: ink-faint;label: 12px ink-soft
- Checkbox/Switch: 选中态 `--md-sea` 实底;Switch 轨道 mist
- 错误态: 仅此处允许语义红 `#C24343`(不入强调色预算)

## 4. 聊天(sanctuary)

- 对方气泡: `rgba(255,255,255,.48)`(dark `.06`)+ hairline + radius 10 + ink-soft 字
- 用户气泡: 渐变 `linear-gradient(135deg, rgba(13,143,208,.78), rgba(8,112,174,.78))` 白字,右对齐
- composer 输入条: 42px,hairline 边,`rgba(255,255,255,.56)`(dark `.06`)
- ⚠️ coaching 内容区组件冻结中(会话 D 迁移),仅外层骨架换装

## 5. 数据可视化

- 进度条: 2px hairline 轨 + `--md-sea` 填充(不用粗胖圆角条)
- 指标: Fraunces 24px 数字 + 10.5px 大写标签;高亮数字用 gold-text
- 环形进度: 7px 环,轨 `rgba(79,129,155,.2)`,值弧 `--md-gold`
- 图表系列色: `--chart-1..5` 明度坡道(sea → sea-bright → gold → ink-soft → mist),**靠明度+形状区分,不靠色相**
- sparkline: 1.5px 线 + 终点小圆

## 6. Header 族(`components/layout/`)

- AppHeader/BrandHeader/ReportHeader/MinimalHeader 架构保留
- 品牌区: serif "Deep Dive" + 圆形 mark(hairline 环 + D)
- 导航链接: 11px 大写字距 .14em ink;active 下划 hairline-strong
- 移动 sheet/popover: 玻璃 `.glass-*`(浮层是玻璃态的合法领地)
- MobileTabBar: 保留,active 色 `--md-sea`

## 7. 玻璃态使用边界

✅ 浮层(popover/sheet/dialog/mobile menu)、`.md-panel`、rail、journey-band
❌ 数据密集卡、表单卡、报告正文容器(用纸面)

## 8. 既有品牌组件处置

| 组件                                 | 处置                             |
| ------------------------------------ | -------------------------------- |
| ShimmerButton                        | 保留,光环色改 `--md-sea`/gold 系 |
| NumberTicker                         | 保留(utility/dive 数字)          |
| AnimatedGradientText                 | 渐变改海蓝双色标(去紫)           |
| SancBubble/JournalEntry              | 保留,引 md token(会话 D 精修)    |
| DepthRail/MonographPanel/SurfaceWash | 调色复用                         |
