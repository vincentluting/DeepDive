---
title: Visual Intensity Specification
category: design
sources:
  - app/globals.css
sync_mode: manual
last_verified: 2026-03-20
verified_by: claude-code
---

# Visual Intensity Specification

> ⚠️ **Meridian 设计系统上线后 (2026-06)**，权威设计源为 [`.claude/skills/deepdive-design/SKILL.md`](../../.claude/skills/deepdive-design/SKILL.md)。本文档保留为历史规范，如与 Meridian 冲突以 skill 为准。

**Status:** Active
**Created:** 2026-03-07
**Purpose:** 所有页面的视觉强度分级标准。新建或修改页面时必须对照此文档确认 intensity level。

---

## 设计哲学

> **Poetic Depth Product Design** — 有心理深度、有海洋叙事、有仪式感，但最终仍然是高完成率、高理解度、高行动感的产品。

核心原则：**不是所有页面都该发光。** 视觉强度必须服务于当前页面的单一主任务。

---

## 四级视觉强度模型

### Level 1 — Pure Utility 「纯净功能」

**主任务：** 完成一个操作，零干扰。

**Depth 对齐：** `depth-sky` / `depth-surface`（最浅层）

**允许：**

- 纯净背景（`depth-sky` 或白色）
- 标准 card 容器
- Body font (DM Sans) only
- 基础品牌色 accent（按钮、链接）
- 简洁 icon（Lucide 即可）

**禁止：**

- 粒子 / canvas 动效
- 渐变背景
- Display font (Fraunces)
- 玻璃材质 (glassmorphism)
- 装饰性动画
- 品牌叙事文案

**适用页面：**

| 路由                       | 页面         | 主任务   |
| -------------------------- | ------------ | -------- |
| `/login`                   | 登录         | 输入凭证 |
| `/register`                | 注册         | 创建账户 |
| `/settings`                | 设置         | 修改配置 |
| `/settings/privacy`        | 隐私设置     | 管理数据 |
| `/legal/privacy`           | 隐私政策     | 阅读条款 |
| `/admin`                   | 管理后台     | 数据管理 |
| `/admin/user-journey/[id]` | 用户旅程详情 | 查看数据 |
| `/post-assessment`         | 后测问卷     | 完成评估 |

---

### Level 2 — Guided Product 「引导产品」

**主任务：** 理解当前状态，找到下一步。

**Depth 对齐：** `depth-surface` / `depth-shallow`（浅层）

**允许：**

- 轻微氛围背景（subtle gradient 或 `depth-shallow`）
- 一处品牌符号（如海洋图标或 archetype 色块）
- 卡片层级清晰，信息密度中等
- DM Sans 为主，Fraunces 限制在页面标题（最多 1 处）
- 轻微 hover 动效
- 自定义海洋图标（accent 用途）

**禁止：**

- Canvas 粒子系统
- 全屏渐变 hero
- 叙事性长文案
- 多个 Fraunces 标题
- 过渡动画超过 300ms

**核心约束：** 首屏 3 秒内必须让用户知道「今天该做什么」。

**适用页面：**

| 路由                  | 页面           | 主任务             |
| --------------------- | -------------- | ------------------ |
| `/dashboard`          | 仪表板         | 找到下一步行动     |
| `/reports`            | 报告列表       | 选择一份报告查看   |
| `/profile`            | 个人档案首页   | 了解自己的整体画像 |
| `/profile/[id]`       | 档案详情       | 深入某个维度       |
| `/coaching`           | 教练首页       | 开始对话           |
| `/companion`          | Companion 首页 | 查看计划进度       |
| `/companion/daily`    | 每日任务       | 完成今日行动       |
| `/action-hub`         | 行动中心       | 管理行动计划       |
| `/action-hub/toolkit` | 工具箱         | 使用工具           |

---

### Level 3 — Narrative Experience 「叙事体验」

**主任务：** 传递含义，引发共鸣。

**Depth 对齐：** `depth-mid` / `depth-deep`（中深层）

**允许：**

- 更强的情绪设计（渐变、光晕）
- 象征性图形元素（archetype 色彩、原型图标）
- Storytelling card（带叙事文案的卡片）
- Fraunces 用于 section 标题（最多 2-3 处）
- Framer Motion 入场动画（stagger, fade-in-up）
- 玻璃材质用于重点内容容器
- 自定义海洋图标系统

**禁止：**

- 全屏 canvas 粒子（仅允许局部装饰）
- 自动播放动画超过 5 秒
- 首屏信息密度超过 3 个焦点

**核心约束：** 情绪服务于理解。用户看完首屏必须记住一个核心洞察。

**适用页面：**

| 路由                     | 页面              | 主任务                 |
| ------------------------ | ----------------- | ---------------------- |
| `/explore`               | Explore Hub       | 选择探索深度           |
| `/quickdive` (result)    | Quick Dive 结果页 | 理解自己的 RIASEC 类型 |
| `/report/[id]`           | 报告详情          | 理解三板块洞察         |
| `/report/[id]/d/[dim]`   | 维度详情          | 深入某个维度           |
| `/report/quick/[id]`     | Quick 报告        | 快速理解结果           |
| `/share/[code]`          | 分享页            | 展示发现给他人         |
| `/companion/[programId]` | Companion 计划    | 跟随叙事式教练         |
| `/companion/graduation`  | Companion 毕业    | 回顾成长旅程           |
| `/companion/onboarding`  | Companion 入门    | 理解教练计划           |

---

### Level 4 — Cinematic Ritual 「影院仪式」

**主任务：** 创造难忘的情感瞬间。

**Depth 对齐：** `depth-abyss` / `depth-void`（最深层）

**允许：**

- 全屏 canvas / 粒子系统
- OceanCanvas 7 层光效
- 最大艺术表达：caustic light、bioluminescence glow
- Fraunces 作为主视觉焦点
- 全屏沉浸式动画
- 视觉序列叙事（淡入 → 揭示 → 定格）

**硬性约束：**

- **时间限制：** Cinematic 瞬间必须 ≤ 15 秒，不可无限循环
- **不可常驻：** 用户进入后必须能自然过渡到内容区
- **单一焦点：** 首屏只允许 1 个视觉焦点 + 1 个 CTA
- **性能预算：** Canvas 动效必须在低端设备可降级（`prefers-reduced-motion`）

**适用页面：**

| 路由                            | 页面                | 主任务              |
| ------------------------------- | ------------------- | ------------------- |
| `/` (hero)                      | Landing 首屏        | 第一印象 + 进入探索 |
| `/quickdive` (reveal)           | Quick Dive 揭示动画 | 类型揭晓的情感高峰  |
| `/deepdive` (completion)        | Deep Dive 完成仪式  | 完成 86 题的成就感  |
| `/quickdive/narrative` (reveal) | 沉浸式揭示          | 叙事探索的终点      |

**注意：** Landing 页整体是 L4 首屏 + L3 中段 + L2 底部的渐变结构，不是全程 L4。

---

## Depth Spectrum × Visual Intensity 对照表

```
深  ┌──────────────┐
度  │  depth-void   │  ← L4 Cinematic: Landing hero, Reveal
    │  depth-abyss  │  ← L4/L3 边界: Report hero, Completion
    │  depth-deep   │  ← L3 Narrative: Report body, Explore Hub
    │  depth-mid    │  ← L3/L2 边界: Module transitions
    │  depth-reef   │  ← accent layer (不直接做背景)
    │  depth-shallow│  ← L2 Guided: Dashboard, Profile
    │  depth-surface│  ← L2/L1 边界: Settings
浅  │  depth-sky    │  ← L1 Pure Utility: Login, Admin
    └──────────────┘
```

---

## 字体使用法则

| 字体                    | 允许场景                                                                                             | 禁止场景                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Fraunces** (display)  | Landing hero 标题, Report hero 标题, 结果揭示标题, Explore Hub section title, 关键仪式性文案 (L3-L4) | 表单标签, 按钮文字, 导航, 卡片内容, Dashboard 列表, 任何 L1 页面, 高频操作界面 |
| **DM Sans** (body)      | 正文, 按钮, 表单, 卡片内容, 导航, 数据界面, 所有 L1-L2 页面正文                                      | —                                                                              |
| **Inter** (system)      | 系统 UI fallback                                                                                     | 不主动使用                                                                     |
| **Noto Sans SC** (中文) | 所有中文文本                                                                                         | —                                                                              |

**中文特殊规则：** 中文站没有对等的 display 衬线体，标题区使用 Noto Sans SC bold + 增大字号 + 增大 letter-spacing 来近似英文站的仪式感。不要让中文勉强走英文 display 风格。

---

## 材质使用法则

| 材质                     | L1      | L2             | L3      | L4  |
| ------------------------ | ------- | -------------- | ------- | --- |
| 纯色卡片 (card-solid)    | ✅ 主用 | ✅             | ✅      | —   |
| 提升卡片 (card-elevated) | ✅      | ✅ 主用        | ✅      | —   |
| 玻璃材质 (glass)         | ❌      | ⚠️ 限 1 处     | ✅      | ✅  |
| 渐变背景                 | ❌      | ⚠️ subtle only | ✅      | ✅  |
| Canvas 粒子              | ❌      | ❌             | ❌      | ✅  |
| Caustic light            | ❌      | ❌             | ⚠️ 局部 | ✅  |

---

## 动效使用法则

| 动效类型              | L1        | L2           | L3         | L4       |
| --------------------- | --------- | ------------ | ---------- | -------- |
| 页面过渡 (fade)       | ✅ 150ms  | ✅ 200ms     | ✅ 300ms   | ✅ 500ms |
| 入场动画 (fade-in-up) | ❌        | ✅ 首屏 1 处 | ✅ stagger | ✅ 序列  |
| Hover 微交互          | ✅ subtle | ✅           | ✅         | ✅       |
| 滚动触发动画          | ❌        | ❌           | ✅         | ✅       |
| 全屏动画序列          | ❌        | ❌           | ❌         | ✅ ≤15s  |
| Lottie / 粒子         | ❌        | ❌           | ❌         | ✅       |

---

## 图标使用法则

| 图标系统           | L1      | L2        | L3        | L4        |
| ------------------ | ------- | --------- | --------- | --------- |
| Lucide (通用)      | ✅ 主用 | ✅ 功能性 | ✅ 功能性 | —         |
| 自定义海洋图标     | ❌      | ✅ accent | ✅ 主用   | ✅        |
| Archetype 色块头像 | ❌      | ✅ 小尺寸 | ✅ 中尺寸 | ✅ 大尺寸 |

---

## 执行检查清单

新建或修改页面时，按以下步骤检查：

1. **确认 Level** — 这个页面的主任务是什么？对照上方表格确认 intensity level
2. **检查 Depth** — 背景色是否在对应 depth 范围内？
3. **检查字体** — Fraunces 是否只在允许的场景使用？
4. **检查材质** — 玻璃/渐变/粒子是否在允许范围内？
5. **检查动效** — 动画类型和时长是否符合该 level 规则？
6. **检查图标** — 是否用了对应 level 的图标系统？
7. **单一焦点测试** — 首屏是否只有一个主任务？用户 3 秒内能找到吗？

---

## 附录：与现有 globals.css 的映射

现有 CSS 中已经有 depth utility classes（`.depth-void`, `.depth-abyss` 等），可以直接用于页面背景。建议新增以下 CSS 注释标记以便维护：

```css
/* ═══ Visual Intensity: Level 1 (Pure Utility) ═══ */
/* 背景: depth-sky / depth-surface, 无装饰 */

/* ═══ Visual Intensity: Level 2 (Guided Product) ═══ */
/* 背景: depth-surface / depth-shallow, 轻微氛围 */

/* ═══ Visual Intensity: Level 3 (Narrative Experience) ═══ */
/* 背景: depth-mid / depth-deep, 允许情绪设计 */

/* ═══ Visual Intensity: Level 4 (Cinematic Ritual) ═══ */
/* 背景: depth-abyss / depth-void, 最大艺术表达 */
```
