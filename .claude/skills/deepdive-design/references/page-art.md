# Page-Art 系统 — "统一骨架,每页变化"的引擎

> 每个页面 = 资产池中一张背景画 × 独立的 `裁切位置 / 滤镜 / 光斑 wash / accent 色`。骨架全站统一,变化全部来自这一层。配置表在 `lib/design/page-art.ts`,渲染组件是 `components/design/meridian/page-art-layer.tsx`。

## 1. 资产池(只用 webp)

| 资产         | 路径                                                       | 气质               | 适用                                        |
| ------------ | ---------------------------------------------------------- | ------------------ | ------------------------------------------- |
| 莫奈正午海面 | `/brand/sunlit-descent-day.webp`(2560w)+ `-md.webp`(1280w) | 印象派蓝天云白阳光 | light 主力                                  |
| 深海月光     | `/brand/monograph-hero-ocean.webp` + `-md`                 | 子夜深海           | dark 主力                                   |
| 灯塔         | `/brand/monograph-lighthouse.webp` + `-md`                 | 暖光指引(竖构图)   | auth / profile / reports                    |
| 等候室       | `/immersive/scenes/waiting.webp`                           | 暖金室内           | coaching / sanctuary                        |
| 档案馆       | `/immersive/scenes/archive.webp`                           | 卷宗暖褐           | dashboard-dark / action-hub / settings-dark |
| 剧场         | `/immersive/scenes/theater.webp`                           | 深邃舞台           | immersive-dive                              |
| 实验室       | `/immersive/scenes/laboratory.webp`                        | 冷静仪器           | deepdive / research                         |
| 零号房间     | `/immersive/scenes/zeroroom.webp`                          | 静谧空白           | post-assessment / pending / privacy         |
| 机械舱       | `/immersive/scenes/mechanical.webp`                        | 运转中             | processing / ai-career-check                |
| 谈判厅       | `/immersive/scenes/negotiation.webp`                       | 群像暖光           | companions                                  |

## 2. 每页配置表(转译自 v2 gallery,key = 真实路由段)

```ts
// lib/design/page-art.ts — PageArt = { light, dark, posLight, posDark, accent }
landing:        sunlit-day / hero-ocean,  "center 7%" / "center top",  #0B6F9D
explore:        sunlit-day / hero-ocean,  "58% 12%"  / "45% top",     #0870AE
dashboard:      sunlit-day / archive,     "42% 18%"  / "center 48%",  #2C8395
quickdive:      sunlit-day / hero-ocean,  "62% 14%"  / "58% top",     #0B86B2
immersive-dive: theater    / theater,     "center 45%" ×2,            #6FB9CC
deepdive:       laboratory / hero-ocean,  "center 44%" / "center top",#42A9C6
post-assessment:zeroroom   / zeroroom,    "center 48%" ×2,            #4D8FA0
profile:        lighthouse / hero-ocean,  "24% 42%"  / "54% top",     #2B708F
profile-reveal: lighthouse / archive,     "22% 42%"  / "center 46%",  #8A7B56
reports:        lighthouse / archive,     "18% 42%"  / "center 48%",  #3F768D
report-detail:  sunlit-day / hero-ocean,  "50% 14%"  / "center top",  #296F91
processing:     mechanical / mechanical,  "center 44%" ×2,            #5D94A6
action-hub:     archive    / archive,     "center 48%" ×2,            #B39150
coaching:       waiting    / waiting,     "center 48%" ×2,            #B89455
companions:     negotiation/ negotiation, "center 48%" ×2,            #AE8A58
settings:       sunlit-day / archive,     "32% 18%"  / "center 48%",  #287D93
login:          lighthouse / hero-ocean,  "18% 42%"  / "center top",  #276D8D
register:       sunlit-day / hero-ocean,  "60% 16%"  / "center top",  #0B7FA8
forgot-password:waiting    / hero-ocean,  "center 48%" / "center top",#6E8F9B
reset-password: zeroroom   / hero-ocean,  "center 48%" / "center top",#6C8FA0
pricing:        sunlit-day / hero-ocean,  "70% 12%"  / "center top",  #0C759B
```

完整原始配置见 `docs/design/page-templates/template-gallery-v2.html` 的 `pageArt` 映射(~1589 行)。

## 3. 滤镜配方(per 资产类型 × 模式)

| 资产类型        | Light filter                                    | Dark filter                                    |
| --------------- | ----------------------------------------------- | ---------------------------------------------- |
| brand 海面图    | `saturate(.96) contrast(1.02) brightness(1.04)` | `saturate(1.04) contrast(1.06) brightness(.9)` |
| scene/角色/灯塔 | `saturate(.76) contrast(.92) brightness(1.26)`  | `saturate(.82) contrast(1.06) brightness(.5)`  |

scene 图在 light 模式必须提亮去饱和(变成"水彩远景"),dark 模式压暗(变成"深夜舞台")。

## 4. Wash 叠层(背景画之上、内容之下)

| Surface    | Light wash                                               | Dark wash                                             |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------- |
| dive       | 右上暖金斑 `rgba(255,246,214,.5)` + 纸白渐变罩 `.48→.72` | 右上磷光斑 `rgba(125,222,255,.22)` + 深海罩 `.12→.86` |
| revelation | 金斑 `.58` + 罩 `.62→.7`(最不透,纸感最强)                | 同 dive dark                                          |
| sanctuary  | **金斑** `rgba(246,224,179,.52)` + 暖罩                  | **金斑** `rgba(233,196,124,.2)` + 深罩                |
| utility    | 金斑 `.46` + 清透罩 `.72→.68`                            | 同 dive dark                                          |

Wash 保证内容可读性:背景画永远隔着一层纸/夜色。**直接把文字放在裸图上是违规**(hero 大标题除外,且需验证对比)。

## 5. grain 噪声(画布质感)

- Light: opacity `.16`(revelation `.26` — 纸感最重)
- Dark: opacity `.07`(sanctuary `.10`)
- 实现: 预烘焙 SVG turbulence tile,`contain: paint`,`pointer-events: none`,z 低于 modal,不参与动画

## 6. PageArtLayer 组件契约

```tsx
<PageArtLayer route="dashboard" /> // 从 page-art.ts 读配置
// 渲染: fixed inset-0 -z-10 →
//   next/image (fill, object-cover, objectPosition=posLight/posDark, sizes="100vw",
//               quality=75, priority 仅 hero 页) 双图按 .dark 切换显隐
//   + wash 叠层 div + grain div
```

- **不全局挂**(工程铁律): 只挂 route group layout;已有 bespoke 伪元素背景的页面二选一,不叠两套
- 移动端(<lg)可配置 `mobileMode: "wash-only"` 降级为纯渐变(省流量/性能)
- accent 色通过 `style={{"--page-accent": art.accent}}` 注入,供按钮渐变/active 态引用

## 7. 新页面接入流程

1. 在 `lib/design/page-art.ts` 加一行配置(选资产池里的图 + 裁切 + accent)
2. 该页所属 layout 已挂 PageArtLayer 则自动生效;否则在 layout 挂一次
3. 对照 `images-v2/<page>-{light,dark}.png` 调 position/filter
4. 验证: light/dark 截图 + 文字可读性
