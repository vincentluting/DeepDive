# Meridian Token 词典(唯一权威源)

> Token 实现在 `app/globals.css`。三层结构:**md 基底层**(字面 hex)→ **brand 桥**(旧变量名重映射)→ **semantic 层**(--primary 等)。新代码只允许用 md 层与 semantic 层;brand 桥是兼容层,逐步退役。

## 1. md 基底层(`--md-*`,纯字面 hex,可静态对比度检查)

| Token                  | Light "Monet Noon"    | Dark "Midnight"         | 用途与约束                                 |
| ---------------------- | --------------------- | ----------------------- | ------------------------------------------ |
| `--md-paper`           | `#F9FAF6`             | `#04121F`               | 主背景                                     |
| `--md-card`            | `#FFFFFF`             | `#0A2336`               | 卡片实底                                   |
| `--md-ink`             | `#0C2A44`             | `#EFE2CE`               | 主文字(dark 是暖米白,不是冷白)             |
| `--md-ink-soft`        | `#4D6C82`             | `#9FB6C4`               | 次级文字(light 4.9:1 ✓)                    |
| `--md-ink-faint`       | `#7E96A6`             | `#6E8494`               | 三级,仅 ≥24px 大字/装饰                    |
| `--md-sea`             | `#0B5F91`             | `#76D4E8`               | **主交互色**(light 6.5:1 ✓ / dark 9:1 ✓)   |
| `--md-sea-bright`      | `#0F86B8`             | `#3FA8C9`               | 图形/大字强调(light 文字仅 ≥24px)          |
| `--md-sea-deep`        | `#05375D`             | `#0B5F91`               | 按钮渐变深端                               |
| `--md-gold`            | `#D8B46A`             | `#D8B46A`               | **light 仅装饰**(2.2:1);dark 可文字(8.5:1) |
| `--md-gold-deep`       | `#B8924A`             | `#B8924A`               | 装饰深档(刻度/边)                          |
| `--md-gold-text`       | `#8A6420`             | `#D8B46A`               | AA 文字金(light 5.0:1 ✓)                   |
| `--md-cream`           | `#F4EADB`             | `#2A2418`               | 暖面板(sanctuary)                          |
| `--md-mist`            | `#DCE9EE`             | `#11293C`               | 分隔底纹/弱填充                            |
| `--md-hairline`        | `rgba(11,64,99,.16)`  | `rgba(214,181,118,.24)` | 装饰细线。**dark 带金 = 签名细节**         |
| `--md-hairline-strong` | `rgba(11,64,99,.36)`  | `rgba(214,181,118,.44)` | 表单边框(WCAG 1.4.11 非文字 3:1)           |
| `--md-wash`            | `rgba(11,95,145,.08)` | `rgba(118,212,232,.10)` | 浅水洗层(hover/选中底)                     |

**对等律**: `:root` 与 `.dark` 中 `--md-` 定义数量必须相等(grep 计数检查)。

## 2. 氛围层变量(`--md-atmo-*`,艺术自由区,不用于控件)

| Token             | Light                              | Dark                              |
| ----------------- | ---------------------------------- | --------------------------------- |
| `--md-atmo-sky`   | `#8FB5D3`(莫奈钴蓝天)              | `#10283C`                         |
| `--md-atmo-cloud` | `#EFEFE6`(云白絮)                  | `rgba(216,180,106,.20)`(月光)     |
| `--md-atmo-sun`   | `rgba(255,246,214,.52)`(暖金光斑)  | `rgba(125,222,255,.22)`(磷光斑)   |
| `--md-atmo-ray`   | `rgba(255,253,244,.5)`(丁达尔光带) | `rgba(217,188,122,.10)`(月金光带) |

wash 配方(Page-Art 叠层,详见 `page-art.md`):

- Light: `radial-gradient(circle at 78% 4%, var(--md-atmo-sun), transparent 24%), linear-gradient(180deg, rgba(239,250,252,.48), rgba(220,244,250,.72))`
- Dark: `radial-gradient(circle at 68% 8%, var(--md-atmo-sun), transparent 21%), linear-gradient(180deg, rgba(1,13,24,.12), rgba(1,13,24,.86))`
- Sanctuary 的 radial 用金斑 `rgba(233,196,124,.2)`

## 3. 面板材质 token

| Token               | Light                                                                                                | Dark                          |
| ------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------- |
| `--md-panel-bg`     | `linear-gradient(145deg, rgba(255,255,255,.54), rgba(255,255,255,.2) 58%, rgba(255,255,255,.1))`     | `rgba(2,28,42,.62)`           |
| `--md-panel-border` | `rgba(18,74,106,.18)`                                                                                | `rgba(216,180,106,.22)`       |
| `--md-panel-shadow` | `0 24px 80px rgba(13,57,88,.14)`                                                                     | `0 24px 80px rgba(0,0,0,.42)` |
| 顶部高光线          | `::before` 1px `linear-gradient(90deg, transparent, rgba(255,255,255,.62), transparent)` opacity .52 | 同                            |

## 4. semantic 层映射(改值不改名)

| Semantic                                       | 指向                                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `--background`                                 | `var(--md-paper)`                                                                   |
| `--card`                                       | `var(--md-card)`                                                                    |
| `--foreground` / `--text-primary`              | `var(--md-ink)`                                                                     |
| `--text-secondary`                             | `var(--md-ink-soft)`                                                                |
| `--primary`                                    | `var(--md-sea)`(`--primary-rgb` 同步字面值: light `11,95,145` / dark `118,212,232`) |
| `--border` / `--input`                         | hairline 实色等价                                                                   |
| `--ring`                                       | `var(--md-sea)`                                                                     |
| `--module-report` `--module-coach` `--insight` | `var(--md-sea-deep)`(原紫 #5856d6,已去紫)                                           |
| `--module-profile` `--profile`                 | `var(--md-gold-text)`(原紫 #af52de)                                                 |
| `--chart-1..5`                                 | sea → sea-bright → gold → ink-soft → mist(明度坡道,不靠色相)                        |
| `--warm-amber/coral/gold`                      | gold 系                                                                             |

## 5. brand 桥(兼容层 — 旧变量名 → md 层)

| 旧原语                | 新指向                                                       |
| --------------------- | ------------------------------------------------------------ |
| `--brand-foam`        | `var(--md-paper)`                                            |
| `--brand-pearl`       | `color-mix(in srgb, var(--md-paper) 96%, var(--md-gold) 4%)` |
| `--brand-ink`         | `var(--md-ink)`                                              |
| `--brand-ultramarine` | `var(--md-sea)`                                              |
| `--brand-seaglass`    | light `var(--md-sea-bright)` / dark `var(--md-sea)`          |
| `--brand-lantern`     | `var(--md-gold)`                                             |
| `--brand-sky`         | `var(--md-mist)`                                             |
| `--brand-kelp`        | `color-mix(in srgb, var(--md-sea) 55%, var(--md-ink) 45%)`   |
| `--brand-rule`        | `var(--md-hairline)`                                         |

**新代码禁止引用 `--brand-*`** — 它们只为存量组件续命。

## 6. 原型色(6 RIASEC × 3 档,功能色,只调不删)

色相身份保持(R 琥珀 / I 磷光青 / A 蓝紫 / S 海藻 / E 珊瑚 / C 月银),全部收敛到"海图标注"色度:

- `-dive` 档: 降饱和 ~30%(水彩感,非荧光)
- `-rev` 档: 硬约束 **在 `--md-paper` 上 ≥4.5:1**
- `-sanc` 档: 向 gold/ink 灰化

## 7. ✅ 原冻结区 — 已全部解冻并迁入 Meridian(2026-06-11)

| Token 岛                     | 现状                                                              |
| ---------------------------- | ----------------------------------------------------------------- |
| `--qd-b0..b4`(QD 五块下潜)   | 正午→子夜下潜叙事(light: Monet 天光→暮色→深渊;dark: 月夜,b2=月金灯阈)。注意做题块当前钉死 b0(classic-explore-question.tsx:117) |
| `--report-*`                 | Chart Room 双时辰(noon: 纸面+sea 墨+金 spark;midnight: 墨蓝+月光米+金 hairline+月金 hero) |
| `--exec-*`                   | 海藻绿系(go/completed),keystone 红保留                            |
| `--rev-signal-*`             | attention→gold-text/moon-gold,info→sea/aqua;positive/risk 保留    |
| `--qd-intro-*`               | light 暖光斑+海蓝;dark 早已 Meridian                              |

> 不再有冻结 token 岛。新改动直接走 md 基底层映射,保持双时辰逐行对齐。

## 8. 对比度规则速查

- 正文/链接: ≥4.5:1 → 用 ink / ink-soft / sea / gold-text
- 大字(≥24px 或 ≥18.66px bold): ≥3:1 → 可用 sea-bright / ink-faint
- 非文字控件边框: ≥3:1 → 用 hairline-strong(hairline 仅装饰)
- **light 模式金色永远不做正文**(gold 2.2:1)— 文字金一律 `--md-gold-text`
- 验证: `node --import tsx scripts/check-meridian-contrast.ts`
