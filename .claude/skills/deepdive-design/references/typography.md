# 排版 — 字体语法

> 字体加载在 `app/[locale]/layout.tsx`(localFont from @fontsource node_modules)。四个家族各司其职,**永远不要用 Inter/Poppins 替代**。

## 1. 字体家族与角色

| 变量                                      | 字体               | 角色                                                                                      | 字重                                    |
| ----------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------- |
| `--font-display`                          | **Fraunces**       | display/标题。**400 是默认**(v2 模板的标题全是 regular serif — 优雅来自字体本身,不是加粗) | 400 / 600 / 700 / 900 + **400i / 600i** |
| `--font-body`                             | **DM Sans**        | UI 文字、按钮、表单                                                                       | 400 / 500 / 600 / 700                   |
| `--font-serif`                            | **Source Serif 4** | 报告长文阅读                                                                              | 400 / 400i / 500 / 500i                 |
| `--font-script`                           | **Caveat**         | **仅 Script Coda 落款**,禁止其他用途                                                      | 500 / 600                               |
| `--font-noto-sc` / `--font-noto-serif-sc` | Noto Sans/Serif SC | 中文回退链                                                                                | —                                       |

## 2. Fraunces italic = 情感副题签名用法 ★

Meridian 的标志性排版:serif 大标题 + *italic 情感副题*紧随:

```
The world is accelerating.        ← Fraunces 400, 38-56px, --md-ink
You get to choose your course.    ← Fraunces 400 italic, 60% 标题字号, --md-sea-deep(dark: --md-sea)
```

- italic 行只用于**情感语句**(选择、勇气、自我),不用于功能性副标题
- 中文无 italic: `html[lang=zh]` 下副题走 Noto Serif SC 直立 + 颜色区分(已在 CSS 处理,勿手动 skew)

## 3. 字号阶梯

| 层级           | 字号/行高                      | 字体                  |
| -------------- | ------------------------------ | --------------------- |
| Hero H1        | 38-56px / 1.08-1.12            | Fraunces 400          |
| 页面标题(rail) | 30-34px / 1.04                 | Fraunces 400          |
| 分区标题       | 21-28px / 1.08                 | Fraunces 400          |
| 数字大字(指标) | 24px                           | Fraunces 400          |
| 正文           | 13.5-14px / 1.6-1.65           | DM Sans 400           |
| 次级/说明      | 12-12.5px / 1.45               | DM Sans 400, ink-soft |
| eyebrow/kicker | 11px / 字距 .18-.22em / 全大写 | DM Sans 500           |
| 标尺/刻度标签  | 10.5px / 字距 .08em            | DM Sans 400           |
| Script Coda    | 20-26px                        | Caveat 500            |

## 4. 小型大写 eyebrow 语法

```css
font-size: 11px;
letter-spacing: 0.18em;
text-transform: uppercase;
```

- Surface kicker(rail 顶): accent 色
- 编号分区标签: ink-soft(编号本身 gold-text)
- 导航链接: ink,字距 .14em

## 5. 中文排版(html[lang=zh] 自动覆写,勿手动重复)

- body line-height 1.8 / 字距 .02em;段落 1.9;标题 1.3
- 标题字重: 中文 Fraunces 缺字 → Noto Serif SC 600/700 接管
- Caveat 无 CJK: `.md-coda` 在 zh 走 `"Kaiti SC", "STKaiti", cursive` 栈
- 中英混排数字/专名保持西文字体(自动 fallback 处理)

## 6. 禁律

- 不在正文用 display 字体(Fraunces 小于 16px 可读性差)
- 不给 serif 标题加 700+(v2 语法是 400;900 仅 landing hero 可选)
- light 模式金色文字一律 `--md-gold-text`(见 tokens.md §8)
- 行宽: 长文 ≤68ch;报告正文区已有约束
