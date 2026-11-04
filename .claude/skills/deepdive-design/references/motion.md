# 动效 — 层级与性能

> 动效 token 在 globals.css(`--motion-l0..l5`、`--ease-*`、`--duration-*`)。原四层体系保留,Meridian 增加"两个时辰"的氛围差。

## 1. 动效层级(沿用)

| 层          | 时长                            | 用途              | easing             |
| ----------- | ------------------------------- | ----------------- | ------------------ |
| L1 微反馈   | 150-250ms                       | hover/press/focus | `--ease-spring`    |
| L2 标准过渡 | 300ms                           | 淡入淡出/展开     | `--ease-out-quint` |
| L3 入场     | 500ms                           | 卡片级联进场      | `--ease-out-quint` |
| L4 仪式     | 700ms                           | 揭晓/完成场景     | `--ease-out-expo`  |
| L5 页级     | 600ms (`--motion-l5`)           | 跨 surface 过渡   | `--ease-out-expo`  |
| ambient     | 8s/16s/18s (`--motion-ambient`) | 潮汐呼吸循环      | ease-in-out        |

## 2. Meridian 签名动效

- **潮汐呼吸**(保留): 背景 glow/wash 的 8-18s opacity 循环,幅度 ≤.06
- **入场级联**: 编号分区依序 fade+rise(`@keyframes ddReveal`,L3,stagger 60-90ms)
- **金点显形**: depth gauge 当前点 box-shadow 2s 一次的轻微脉动(±20% 强度)
- **粒子时辰差**: canvas light `opacity:.5` / dark `.75` — 静态 CSS,非动画
- **rail 锚点高亮**: IntersectionObserver 切换,L2 过渡

## 3. 工程铁律

- **template.tsx 只动 opacity** — transform 会破坏 fixed 浮窗定位
- **animation shorthand 坑**: `var()` 含 easing 时不能重复指定 easing;`calc(var())` 在 shorthand 失效 → 拆开写 `animation-name/-duration/-timing-function`
- 所有循环动画登记 globals.css 顶部 `prefers-reduced-motion` 清单;Framer 组件包 `<MotionConfig reducedMotion="user">`
- 只动 `opacity`/`transform`(合成器属性);禁止动 width/height/top

## 4. 性能预算

- grain: 预烘焙 SVG tile 背景,**静态**,`contain: paint`,禁止 blur 动画
- PageArtLayer: 图片 `priority` 仅 hero 页;其余 lazy;移动端可配置 wash-only 降级
- blur 总预算: 同屏 backdrop-filter 元素 ≤3(rail + 1 panel + 浮层)
- iOS Safari 验证: 375px 滚动帧率,卡顿先砍 blur 再砍粒子

## 5. Revelation 特例

报告/档案页:只 crossfade,不 translate(翻页不是滑动);无粒子;grain 最重但静态。
