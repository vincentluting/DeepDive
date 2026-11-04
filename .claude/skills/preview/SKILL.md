# /preview — Claude Preview 实时视觉验证

> 内置浏览器预览，开发时实时验证 UI 效果。AI 驱动自适应检查，零配置开箱即用。
> 与 Playwright E2E 互补：Preview 做开发时验证，Playwright 做回归时自动化。
> 所有输出使用中文。

## 触发条件

用户说 "preview"、"预览"、"看看效果"、"截图看一下"、"视觉验证"、"页面检查"、"看看页面" 时激活。

## 可用工具

仅使用 Claude Preview MCP 工具：

| 工具 | 用途 |
|------|------|
| `preview_start` | 启动 dev server（从 `.claude/launch.json`） |
| `preview_screenshot` | 截取页面截图 |
| `preview_snapshot` | 获取无障碍树（文本、角色、元素 UID） |
| `preview_inspect` | 检查元素 CSS 属性（颜色、字体、间距） |
| `preview_click` | 点击元素 |
| `preview_fill` | 填写表单 |
| `preview_eval` | 在页面执行 JS（仅调试用） |
| `preview_console_logs` | 读取控制台消息 |
| `preview_network` | 检查网络请求 |
| `preview_resize` | 切换视口大小（mobile/tablet/desktop） |

---

## 模式总览

| 模式 | 命令 | 做什么 | 预估耗时 |
|------|------|--------|----------|
| **快速查看** | `/preview` 或 `/preview <URL>` | 单页：截图+快照+控制台+网络 | ~1min |
| **差异巡检** | `/preview diff` | git diff → 受影响页面逐个验证 | ~3-5min |
| **响应式** | `/preview responsive [URL]` | mobile+tablet+desktop 三视口截图 | ~2-3min |
| **认知走查** | `/preview walkthrough` | 着陆→QD→Dashboard→报告 全流程体验 | ~5-10min |
| **全页扫描** | `/preview full` | 32 页面桌面 + 关键页面三视口 | ~15-20min |
| **交互验证** | `/preview interact [URL]` | 点击交互元素、填表单、验证响应 | ~3-5min |

---

## Phase 0 — 启动 Server

```
preview_start("Next.js Dev")
```

等待 server 就绪。如果启动失败，检查端口 3000 是否被占用：

```bash
lsof -i :3000
```

---

## 标准 6 项检查协议（每页必执行）

> 到达任意页面后，按顺序执行以下 6 项检查。快速查看模式执行 P1-P4，其他模式执行全部。

### P1. 截图审查

```
preview_screenshot(serverId)
```

AI 判断视觉异常：
- 布局是否正确（无溢出、无重叠、无空白区域）
- 内容是否渲染完整（非 Loading 卡住）
- 深海视觉主题是否一致
- 中文/英文排版是否自然

### P2. 无障碍快照

```
preview_snapshot(serverId)
```

验证：
- 页面标题存在且有意义
- 主内容区有文本（非空容器）
- 按钮/链接有可读标签
- heading 层级合理

### P3. 控制台检查

```
preview_console_logs(serverId, level: "error")
```

记录所有 `error` 级别消息。过滤已知无害噪音：
- Next.js Fast Refresh / Turbopack HMR
- `[HMR]` 开头的热更新消息
- Chrome 扩展注入

有 error → 标记为问题。

### P4. 网络请求检查

```
preview_network(serverId, filter: "failed")
```

检查是否有 4xx/5xx 请求。API 404/500 → 标记为 P1 问题。

### P5. 元素检查（关键页面）

```
preview_inspect(serverId, selector: "h1", styles: ["font-size", "color", "font-family"])
preview_inspect(serverId, selector: "button.primary", styles: ["background-color", "padding", "border-radius"])
```

对照设计规范验证：
- 标题字体和颜色
- CTA 按钮样式
- 卡片间距和圆角

### P6. 响应式检查

```
preview_resize(serverId, preset: "mobile")    # 375×812
preview_screenshot(serverId)
preview_resize(serverId, preset: "tablet")    # 768×1024
preview_screenshot(serverId)
preview_resize(serverId, preset: "desktop")   # 1280×800
preview_screenshot(serverId)
```

三视口截图，AI 判断：
- mobile: 按钮可触达、文字不截断、无水平滚动
- tablet: 布局自适应、无大面积空白
- desktop: 正常展示

---

## 模式 1 — 快速查看（默认）

> 对单个页面执行标准 P1-P4 检查。最常用模式。

**无 URL 参数时**：检查 `http://localhost:3000/en`（着陆页）。

**有 URL 参数时**：检查指定 URL。

**输出格式：**

```
🔍 Preview 快速查看: /en/dashboard

P1 截图: ✅ 布局正常，内容渲染完整
P2 快照: ✅ 标题 "Dashboard"，3 个卡片组件，导航完整
P3 控制台: ✅ 0 错误
P4 网络: ✅ 0 失败请求

🟢 页面状态正常
```

或：

```
🔍 Preview 快速查看: /en/dashboard

P1 截图: ❌ 侧边栏溢出视口右侧
P2 快照: ✅ 内容存在
P3 控制台: ❌ 2 个错误 (TypeError: Cannot read property 'map' of undefined)
P4 网络: ❌ GET /api/user/achievements → 500

🔴 发现 3 个问题 — 详见下方
```

---

## 模式 2 — 差异巡检

> 分析 git diff，自动映射到受影响页面，逐个验证。

### Step 1: 获取改动文件

```bash
git diff --name-only HEAD
git diff --name-only --cached
```

### Step 2: 映射到页面路由

| 改动文件模式 | 受影响页面 |
|-------------|-----------|
| `app/[locale]/(marketing)/page.tsx` | `/en`（着陆页） |
| `app/[locale]/(app)/dashboard/**` | `/en/dashboard` |
| `app/[locale]/(app)/coaching/**` | `/en/coaching` |
| `app/[locale]/(immersive)/quickdive/**` | `/en/quickdive` |
| `app/[locale]/(immersive)/deepdive/**` | `/en/deepdive` |
| `app/[locale]/(immersive)/immersive-dive/**` | `/en/immersive-dive` |
| `app/[locale]/(report)/report/**` | `/en/report/latest` |
| `app/[locale]/(app)/profile/**` | `/en/profile` |
| `app/[locale]/(app)/explore/**` | `/en/explore` |
| `app/[locale]/(app)/settings/**` | `/en/settings` |
| `app/[locale]/(auth)/**` | `/en/login`, `/en/register` |
| `app/[locale]/(public)/ai-career-check/**` | `/en/ai-career-check` |
| `components/questionnaire/**` | `/en/quickdive`, `/en/deepdive` |
| `components/report/**` | `/en/report/latest` |
| `components/features/coaching-chat.tsx` | `/en/coaching` |
| `components/immersive-explore/**` | `/en/immersive-dive` |
| `lib/i18n/dictionaries/**` | 对应页面 en + zh 版本 |
| `globals.css` 或 tailwind 相关 | 全站关键页面 |

### Step 3: 逐页执行标准 6 项检查

### Step 4: 输出差异巡检报告

```
📂 检测到 3 个文件变更 → 映射到 2 个页面

/en/dashboard:
  P1 截图: ✅  P2 快照: ✅  P3 控制台: ✅  P4 网络: ✅

/en/explore:
  P1 截图: ⚠️ 卡片间距比之前更紧凑（是否有意？）
  P2 快照: ✅  P3 控制台: ✅  P4 网络: ✅

🟡 1 个需确认项 — 建议查看
```

---

## 模式 3 — 响应式

> 对指定页面（或着陆页）拍摄三视口截图。

```
preview_resize(serverId, preset: "desktop")
preview_screenshot(serverId)

preview_resize(serverId, preset: "tablet")
preview_screenshot(serverId)

preview_resize(serverId, preset: "mobile")
preview_screenshot(serverId)
```

输出三张截图 + AI 对比分析。

---

## 模式 4 — 认知走查

> 模拟新用户走完核心流程，每一步截图 + 体验评估。

### 走查路径

| 步骤 | 页面 | 操作 | 检查 |
|------|------|------|------|
| 1 | `/en` | 查看着陆页 | CTA 是否明显？产品定位清晰？ |
| 2 | `/en` | 点击主 CTA | 导航是否正确？ |
| 3 | `/en/quickdive` | 查看问卷起始页 | 用户知道要做什么？预计多久？ |
| 4 | `/en/quickdive` | 点选前 3 题 | 选项可点？进度更新？ |
| 5 | `/en/dashboard` | 查看 Dashboard | 知道接下来做什么？ |
| 6 | `/en/coaching` | 查看教练页 | 欢迎消息是否温暖？ |
| 7 | `/en/reports` | 查看报告列表 | 报告入口清晰？ |

每步执行 P1 截图 + P3 控制台检查，并从用户体验角度评估：
- **可发现性**: 下一步操作是否明显？
- **可理解性**: 用户知道在做什么？
- **反馈**: 操作后有即时反馈？
- **情绪**: 用户此刻感受？（好奇/困惑/兴奋/焦虑）

---

## 模式 5 — 全页扫描

> 逐一访问所有页面，桌面截图 + 标准检查。

### 页面分级

**Tier 1 — 核心流程（P1-P6 全检查 + 三视口）：**
`/en`, `/en/quickdive`, `/en/dashboard`, `/en/coaching`, `/en/reports`

**Tier 2 — 重要页面（P1-P4 + 桌面视口）：**
`/en/login`, `/en/register`, `/en/profile`, `/en/explore`, `/en/action-hub`, `/en/deepdive`, `/en/immersive-dive`, `/en/settings`

**Tier 3 — 公开/静态（P1-P3 桌面视口）：**
`/en/pricing`, `/en/ai-career-check`, `/en/legal/privacy`, `/en/legal/terms`

**Tier 4 — Admin/边缘（P1-P2 桌面视口）：**
`/en/admin`, `/en/forgot-password`, `/en/reset-password`

如需要中文站，对 Tier 1 页面额外检查 `/zh` 版本。

---

## 模式 6 — 交互验证

> 对指定页面的交互元素进行点击/填写/验证。

### Step 1: 获取可交互元素

```
preview_snapshot(serverId)
```

从快照中识别按钮、链接、表单输入。

### Step 2: 逐元素操作

```
preview_click(serverId, selector: "button.cta-primary")
preview_screenshot(serverId)  # 验证点击结果

preview_fill(serverId, selector: "input[name='email']", value: "test@example.com")
preview_screenshot(serverId)  # 验证填写效果
```

### Step 3: 记录交互结果

每个交互记录：操作 → 期望结果 → 实际结果 → 截图。

---

## 问题分级

| 级别 | 定义 | 示例 |
|------|------|------|
| **P0 致命** | 白屏/崩溃/数据丢失 | 页面 500、JS 异常导致无内容 |
| **P1 严重** | 核心功能不可用 | 按钮不可点、API 500、表单无法提交 |
| **P2 中等** | 体验有缺陷 | 布局错位、响应式问题、样式异常 |
| **P3 轻微** | 美化建议 | 间距不均、颜色微调、动画缺失 |

---

## 最终报告格式

```
# Preview 视觉验证报告

**时间**: YYYY-MM-DD HH:MM
**模式**: quick / diff / responsive / walkthrough / full / interact
**Server**: Next.js Dev (localhost:3000)

## 执行摘要

| 页面 | P1 截图 | P2 快照 | P3 控制台 | P4 网络 | P5 元素 | P6 响应式 |
|------|---------|---------|-----------|---------|---------|-----------|
| /en  | ✅      | ✅      | ✅        | ✅      | ✅      | ✅        |
| /en/dashboard | ✅ | ✅ | ❌ 1 error | ✅ | — | — |

## 问题详情

### [P1] Dashboard 控制台错误
- **页面**: /en/dashboard
- **错误**: TypeError: Cannot read property 'map' of undefined
- **截图**: [已附]

## 建议

1. [P1] 修复 Dashboard 组件数据处理
2. [P2] ...
```

---

## 与其他 Skill 的分工

| 需求 | 用 `/preview` | 用其他 |
|------|--------------|--------|
| 改了 UI 看看效果 | ✅ `/preview` | |
| 系统化全流程测试 | | `/journey-test` |
| 可重复回归测试 | | `/qa full` (Playwright) |
| 像素级视觉对比 | | `/journey-test visual` |
| axe-core 无障碍扫描 | | `/journey-test a11y` |
| 网络拦截/故障注入 | | `/journey-test chaos` |
| API 管道验证 | | `/qa api` |
| 性能指标采集 | | `/perf-audit` |
| 认知走查（快速） | ✅ `/preview walkthrough` | |
| 认知走查（深度） | | `/ux-audit walkthrough` |
| CI/CD 自动化 | | `npx playwright test` |

---

## 关键规则

1. **截图是证据** — 每个发现至少附一张截图
2. **不自动修复** — 只报告问题，修复需用户确认
3. **过滤噪音** — Next.js dev 警告、HMR 消息不算错误
4. **中文输出** — 报告全部用中文
5. **参考设计规范** — 视觉判断参照 `.claude/skills/deepdive-design/SKILL.md`
6. **先启动后检查** — 必须 `preview_start` 成功后再执行检查
7. **适时升级** — 发现复杂问题时建议用 `/journey-test` 或 `/qa browser` 深入验证
