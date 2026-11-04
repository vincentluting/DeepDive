# /journey-test — 全链路用户旅程体验测试 v2.0

> 业内顶级实践：13 大测试维度 × 32 页面 × 双语双视口。
> 像真实用户操控浏览器，同时以工程师视角系统性检查功能、无障碍、性能、安全、韧性。
> 所有输出使用中文。

## 触发条件

用户说 "journey test"、"旅程测试"、"走一遍用户流程"、"全链路测试"、"体验测试"、"browser test full"、"操控浏览器测试" 时激活。

## 核心理念

**你不是在跑脚本 — 你是一个有安全意识的真实用户 + 一个有工程直觉的 QA 工程师。**

每到一个页面，执行**标准 8 项检查协议**（见下方 Section E）。

## 可用工具（优先级从高到低）

| 工具                      | 何时使用                               | 设置方式                                                  |
| ------------------------- | -------------------------------------- | --------------------------------------------------------- |
| **Playwright MCP**        | 首选。交互式浏览器控制 + 截屏 + 控制台 | `claude mcp add playwright -- npx @playwright/mcp@latest` |
| **Bash + Playwright CLI** | MCP 不可用时回退                       | 项目已安装 `@playwright/test`                             |
| **Claude Preview**        | 开发中快速单页验证，零配置             | Claude Code 内置 `preview_*` 工具                         |
| **Claude in Chrome**      | 需要真实登录态时                       | `claude --chrome` 启动                                    |

---

## Section A — 模式总览

| 模式         | 命令                          | 覆盖维度                      | 预估耗时  |
| ------------ | ----------------------------- | ----------------------------- | --------- |
| **完整旅程** | `/journey-test full`          | 全部 13 维度 × 7 旅程         | ~45-60min |
| **快速冒烟** | `/journey-test smoke`         | 功能 + 控制台 + 渲染          | ~10min    |
| **问卷专测** | `/journey-test questionnaire` | 问卷交互 + 状态恢复 + 性能    | ~20min    |
| **视觉审计** | `/journey-test visual`        | 视觉回归 + 响应式 + i18n 布局 | ~15min    |
| **认证流程** | `/journey-test auth`          | 认证 + 安全 + 负面路径        | ~10min    |
| **报告测试** | `/journey-test report`        | 报告生成 + LLM 输出 + 分享    | ~15min    |
| **教练测试** | `/journey-test coaching`      | SSE 流式 + 记忆 + 危机检测    | ~10min    |
| **无障碍**   | `/journey-test a11y`          | WCAG 2.1 AA + 键盘导航        | ~15min    |
| **性能**     | `/journey-test perf`          | Core Web Vitals + 内存 + 加载 | ~15min    |
| **安全**     | `/journey-test security`      | 输入注入 + 认证 + 并发 + CSRF | ~15min    |
| **韧性**     | `/journey-test chaos`         | 故障注入 + 状态恢复 + 降级    | ~15min    |
| **SEO**      | `/journey-test seo`           | Meta tags + OG + 结构化数据   | ~10min    |
| **指定页面** | `/journey-test <URL>`         | 该页全部维度                  | ~5min     |

---

## Section B — Phase 0 环境检查（所有模式共用）

### Step 1: 检查工具链

```bash
# Playwright MCP
grep -q "playwright" ~/.claude.json 2>/dev/null && echo "MCP_READY" || echo "MCP_NOT_FOUND"

# axe-core (无障碍模式需要)
ls node_modules/@axe-core/playwright 2>/dev/null && echo "AXE_READY" || echo "AXE_NOT_FOUND"
```

如果 MCP 未配置 → 提示安装。如果 axe-core 未安装且要跑 a11y 模式 → 提示 `npm install -D @axe-core/playwright`。

### Step 2: 检查 Dev Server

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Step 3: 创建工作目录

```bash
mkdir -p .journey-test-reports/{screenshots,baselines,logs,perf}
```

### Step 4: 生成测试用户

```bash
TEST_EMAIL="journey-test-$(date +%s)@test.deepdive.dev"
TEST_PASSWORD="TestPass123!"
TEST_NICKNAME="JourneyTester"
```

---

## Section C — 13 大测试维度

> `full` 模式执行全部。其他模式执行对应子集（见模式总览的覆盖维度列）。

### C1. 功能旅程（Functional Journeys）

**7 条核心旅程**，按管道顺序串行执行：

#### Journey 1 — 新用户首次探索（着陆→Quick Dive→注册）

模拟人物: 第一次访问的好奇用户

| 步骤 | 操作                         | 检查点                               |
| ---- | ---------------------------- | ------------------------------------ |
| 1.1  | 打开 `localhost:3000/en`     | 着陆页渲染、CTA 可见、无控制台错误   |
| 1.2  | 截屏: 桌面(1440) + 手机(375) | 响应式布局                           |
| 1.3  | 点击主 CTA                   | 导航到 Quick Dive                    |
| 1.4  | 逐题作答 30 RIASEC + 8 TwIVI | 选项可点、进度条更新、无卡顿         |
| 1.5  | 提交问卷                     | 结果页渲染、RIASEC 图表              |
| 1.6  | 检查内联注册面板 → 填写注册  | 注册成功、自动登录、重定向 Dashboard |

#### Journey 2 — Deep Dive（86 题）

前置: J1 完成

| 步骤 | 操作                       | 检查点              |
| ---- | -------------------------- | ------------------- |
| 2.1  | Dashboard → Deep Dive 入口 | 按钮可见            |
| 2.2  | Module A: SJT 6 scenarios  | would/should 双选   |
| 2.3  | Module B: DDVQ21 20 items  | 6 点量表            |
| 2.4  | Module C: IPIP-60 60 items | 5 点 Likert、分页   |
| 2.5  | 提交 → Profile 生成        | 12 型原型、图表渲染 |

#### Journey 3 — 报告生成

前置: J2 完成

| 步骤 | 操作                | 检查点                 |
| ---- | ------------------- | ---------------------- |
| 3.1  | 触发报告生成        | 按钮可点               |
| 3.2  | 等待（最长 180s）   | 进度指示器、无超时崩溃 |
| 3.3  | 报告页 5 章逐章检查 | 渲染完整、交互正常     |
| 3.4  | 分享功能            | 链接生成、公开页可访问 |

#### Journey 4 — AI 教练

前置: J3 完成

| 步骤 | 操作       | 检查点                    |
| ---- | ---------- | ------------------------- |
| 4.1  | 打开教练页 | 欢迎消息                  |
| 4.2  | 发送消息   | SSE 流式响应              |
| 4.3  | 3-5 轮对话 | 上下文连贯、引用报告/档案 |

#### Journey 5 — Immersive Dive

需要新用户或重置

| 步骤 | 操作            | 检查点                   |
| ---- | --------------- | ------------------------ |
| 5.1  | 沉浸模式 7 章   | 叙事渲染、同伴出现、动画 |
| 5.2  | 揭晓场景        | 原型揭晓动画             |
| 5.3  | Post Assessment | 问卷调查渲染             |

#### Journey 6 — 功能页巡检

逐页测试: Explore Hub → Action Hub → Reports 列表 → Settings → AI Career Check → Pricing

#### Journey 7 — i18n 切换

| 步骤 | 操作                             | 检查点       |
| ---- | -------------------------------- | ------------ |
| 7.1  | `/zh` 着陆页、Dashboard、Profile | 零英文残留   |
| 7.2  | 中文版 Quick Dive 前几题         | 题目中文化   |
| 7.3  | 未登录访问受保护页               | 重定向 login |
| 7.4  | 404 页 + 法律页                  | 渲染完整     |

---

### C2. 问卷状态持久化与恢复（State Persistence）

> 对 38-86 题问卷，状态丢失 = 用户永远流失。

| 测试场景       | 方法                           | 期望                |
| -------------- | ------------------------------ | ------------------- |
| **刷新恢复**   | 答 10 题 → F5 刷新             | 进度保持、答案不丢  |
| **Tab 切换**   | 答题中切到其他 tab → 切回      | 状态完好            |
| **浏览器后退** | 答到中途 → 浏览器后退 → 前进   | 不丢失已答内容      |
| **崩溃恢复**   | 答 30 题 → 关闭 tab → 重新打开 | localStorage 恢复   |
| **服务端同步** | 答题 → 关闭 → 另一设备打开     | 服务端 session 恢复 |

实现：

```
1. browser_navigate → 问卷页
2. 答 10-15 题
3. browser_run_code → 读取 localStorage 快照
4. 关闭页面 / 刷新
5. 重新打开 → 验证状态恢复
```

---

### C3. 负面路径与输入验证（Negative Path）

| 测试场景         | 输入                               | 期望                |
| ---------------- | ---------------------------------- | ------------------- |
| **空提交**       | 注册表单全空提交                   | 验证错误提示        |
| **邮箱格式**     | `not-an-email`, `a@b`, `test@.com` | 拒绝 + 明确提示     |
| **密码强度**     | `123`, `aaa`, 1 字符               | 拒绝 + 规则提示     |
| **超长输入**     | 1000 字符昵称                      | 截断或拒绝，不崩溃  |
| **特殊字符**     | `<script>alert(1)</script>`        | 转义，无 XSS        |
| **Unicode 边缘** | emoji 昵称 `🧑‍💻`, ZWJ 序列          | 正确存储显示        |
| **SQL 注入**     | `'; DROP TABLE users; --`          | 无效果              |
| **重复注册**     | 相同邮箱再次注册                   | 友好错误提示        |
| **问卷跳题**     | 跳过必答题提交                     | 拒绝 + 定位到未答题 |

---

### C4. 无障碍（Accessibility — WCAG 2.1 AA）

> 用 axe-core 自动扫描 + 键盘导航手动检查。

#### 自动扫描（每页执行）

```javascript
// 使用 @axe-core/playwright
const { AxeBuilder } = require("@axe-core/playwright");
const results = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  .analyze();
// 记录 violations
```

等效 Playwright MCP 操作：

```
1. browser_navigate → 目标页
2. browser_run_code → 注入 axe-core CDN + 执行 axe.run()
3. 收集 violations 到报告
```

#### 键盘导航测试（关键页面）

| 页面      | 检查项                                             |
| --------- | -------------------------------------------------- |
| 问卷页    | Tab 在选项间切换、Enter/Space 选择、进度可键盘推进 |
| 教练页    | Tab 到输入框、Enter 发送、上下键浏览历史           |
| 报告页    | Tab 在章节间导航、Esc 关闭弹窗                     |
| 登录/注册 | Tab 顺序正确、表单可纯键盘完成                     |
| 模态框    | 焦点陷阱（Tab 不逃出模态框）、Esc 关闭             |

#### 检查清单

- [ ] 所有图片有 alt 文本（或 aria-hidden）
- [ ] 颜色对比度 ≥ 4.5:1（正文）/ ≥ 3:1（大文字）
- [ ] 表单元素有关联 label
- [ ] 焦点指示器可见
- [ ] heading 层级正确（h1→h2→h3，不跳级）
- [ ] ARIA 属性正确使用
- [ ] 动态内容更新有 aria-live 通知

---

### C5. 视觉回归（Visual Regression）

> 像素级对比，捕捉 CSS 改动导致的隐性回归。

#### 基线模式（首次运行）

```
对 32 个页面 × 3 视口（1440/768/375）× 2 语言（en/zh）拍摄基线截图
存储到 .journey-test-reports/baselines/
命名: {page}-{viewport}-{locale}.png
例: landing-1440-en.png, dashboard-375-zh.png
```

#### 对比模式（后续运行）

```
1. 截取当前截图
2. 与基线像素对比（容差: maxDiffPixelRatio 0.01）
3. 有差异 → 生成 diff 图（红色标注差异区域）
4. 记录到报告
```

#### 关键注意

- **mask 动态内容**: 时间戳、用户名、随机 ID
- **等待字体加载**: `document.fonts.ready` 后再截图
- **禁用动画**: 截图时 `prefers-reduced-motion: reduce`
- **中文宽度**: 中文字符比英文宽，重点检查按钮和卡片溢出

---

### C6. 性能（Performance）

#### Core Web Vitals（关键页面）

通过 Playwright + Chrome DevTools Protocol 收集：

| 指标                                | 阈值（Good） | 测试页面                               |
| ----------------------------------- | ------------ | -------------------------------------- |
| **LCP** (Largest Contentful Paint)  | ≤ 2.5s       | 着陆页、报告页、Dashboard              |
| **INP** (Interaction to Next Paint) | ≤ 200ms      | 问卷页（点击选项）、教练页（发送消息） |
| **CLS** (Cumulative Layout Shift)   | ≤ 0.1        | 所有页面                               |

收集方法：

```javascript
// 在 browser_run_code 中执行
const paint = performance.getEntriesByType("paint");
const lcp = await new Promise((r) => {
  new PerformanceObserver((l) => r(l.getEntries().pop())).observe({
    type: "largest-contentful-paint",
    buffered: true,
  });
});
```

#### 长会话内存监控

| 检查项       | 方法                                              |
| ------------ | ------------------------------------------------- |
| 问卷内存增长 | Q1 时 heap snapshot → Q86 时 heap snapshot → 对比 |
| 教练对话内存 | 第 1 轮 → 第 20 轮 → 内存增长应 < 50%             |
| 路由切换泄漏 | 导航 10 个不同页面 → 返回首页 → 检查 detached DOM |

#### 页面加载时间

| 页面   | 可接受                | 需改善 |
| ------ | --------------------- | ------ |
| 着陆页 | < 2s                  | > 3s   |
| 问卷页 | < 3s                  | > 5s   |
| 报告页 | < 5s（不含 LLM 生成） | > 8s   |
| 教练页 | < 3s                  | > 5s   |

---

### C7. 安全（Security）

#### 认证安全

| 测试                | 方法                         | 期望             |
| ------------------- | ---------------------------- | ---------------- |
| **CSRF 保护**       | POST 请求不带 csrf-token     | 403              |
| **Session 有效性**  | 过期 cookie 访问受保护页     | 401/重定向 login |
| **guardRoute 分级** | 不同 tier 的未授权访问       | 正确拦截         |
| **密码安全**        | 登录 API 返回中不含密码 hash | 无泄露           |

#### 输入注入测试

对所有用户输入字段（注册、教练聊天、设置）测试：

```
XSS: <script>alert(1)</script>, <img onerror=alert(1)>, javascript:alert(1)
SQL: ' OR 1=1 --, '; DROP TABLE --, UNION SELECT
Path: ../../../etc/passwd, %00
Header: \r\nX-Injected: true
```

验证：所有注入被转义或拒绝，无 500 错误。

#### 并发竞态测试

```javascript
// 同时发 5 个 claim 请求
const results = await Promise.all([
  fetch('/api/quickdive/claim', { method: 'POST', ... }),
  fetch('/api/quickdive/claim', { method: 'POST', ... }),
  fetch('/api/quickdive/claim', { method: 'POST', ... }),
  fetch('/api/quickdive/claim', { method: 'POST', ... }),
  fetch('/api/quickdive/claim', { method: 'POST', ... }),
]);
// 应该只有 1 个成功, 其余 409 或幂等返回
```

#### 速率限制

```
对 /api/generate-report 快速发送 20 次请求
期望: 第 N 次后返回 429 + Retry-After header
```

---

### C8. SSE 流式韧性（Streaming Resilience）

> 教练对话使用 SSE，必须测试各种中断场景。

| 场景         | 方法                        | 期望                     |
| ------------ | --------------------------- | ------------------------ |
| **正常流式** | 发送消息                    | 逐 token 渲染            |
| **中途断网** | `page.route()` 模拟网络断开 | 错误提示 + 重连选项      |
| **慢速响应** | 延迟每个 chunk 500ms        | 不超时、不重复请求       |
| **停止生成** | 点击停止按钮                | 流立即终止、部分内容保留 |
| **超时**     | 模拟 60s 无响应             | 超时提示、可重试         |

---

### C9. 混沌/故障注入（Chaos Engineering）

> 系统性验证每个外部依赖失败时的降级行为。

| 故障场景              | 注入方式                                                             | 期望行为               |
| --------------------- | -------------------------------------------------------------------- | ---------------------- |
| **LLM 全挂**          | `page.route('**/api/generate-report', r => r.fulfill({status:500}))` | 错误提示 + 重试按钮    |
| **评分 API 500**      | 拦截 `/api/score` 返回 500                                           | 友好错误 + 答案不丢失  |
| **Profile API 超时**  | 延迟 30s 响应                                                        | 超时提示               |
| **教练 API 畸形响应** | 返回非 SSE 格式                                                      | 不白屏、显示错误       |
| **分析 API 失败**     | 拦截 analytics 请求                                                  | 用户流程不受影响       |
| **图片 CDN 挂**       | 拦截图片请求返回 404                                                 | 优雅降级、alt 文本显示 |

验证标准：

- **不白屏** — 页面始终有内容
- **不丢数据** — 问卷进度不丢失
- **可恢复** — 用户有明确的重试/刷新路径
- **不级联** — 非核心服务挂不影响核心流程

---

### C10. 状态恢复（State Recovery）

| 场景               | 步骤                             | 期望                             |
| ------------------ | -------------------------------- | -------------------------------- |
| **问卷中途崩溃**   | 答 30 题 → 关闭 tab → 重开       | 恢复到第 30 题                   |
| **报告生成中断**   | 点击生成 → 关闭 tab → 重开       | 不重复生成 / 恢复进度            |
| **多 Tab 冲突**    | 两个 tab 同时打开问卷            | 不产生矛盾状态                   |
| **Auth 过期**      | 操作中 session 过期              | 友好提示 → 重新登录 → 恢复上下文 |
| **浏览器前进后退** | Dashboard → Report → 后退 → 前进 | 页面状态正确、无重复请求         |

---

### C11. i18n 跨语言验证（Internationalization）

#### 翻译完整性（已有 lint:i18n 覆盖）

```bash
npm run lint:i18n
```

#### 布局完整性（视觉回归扩展）

| 页面      | 检查项                       |
| --------- | ---------------------------- |
| 着陆页    | 中文标题不溢出 hero 区域     |
| 按钮/卡片 | 中英文版按钮宽度一致或自适应 |
| 问卷      | 长中文题目不截断             |
| 报告      | 章节标题不换行破坏布局       |
| 导航栏    | 菜单项不溢出                 |

方法: 对比 `/en` 和 `/zh` 同页面截图，检查布局差异。

#### LLM 输出语言验证

| 功能       | 检查                                            |
| ---------- | ----------------------------------------------- |
| 英文站报告 | 不含中文字符（`/[\u4e00-\u9fff]/` 匹配 = 失败） |
| 中文站报告 | 不含纯英文段落（短术语允许）                    |
| 教练回复   | 语言匹配当前 locale                             |

---

### C12. SEO 与 Meta（搜索引擎优化）

> 公开页面的可发现性和可分享性。

#### 逐页检查（公开页面）

| 页面                      | 必需 meta                                                         |
| ------------------------- | ----------------------------------------------------------------- |
| 着陆页 `/en`              | title, description, og:title, og:description, og:image, canonical |
| QD 结果 `/result/qd/[id]` | og:title, og:description, og:image（分享预览）                    |
| 分享页 `/share/[code]`    | og:title, og:image（社交分享）                                    |
| 公开档案 `/p/[username]`  | title, og:title, og:image                                         |
| 法律页                    | title, noindex（如适用）                                          |

检查方法：

```javascript
const title = await page.title();
const ogTitle = await page.$eval(
  'meta[property="og:title"]',
  (el) => el.content,
);
const description = await page.$eval(
  'meta[name="description"]',
  (el) => el.content,
);
const canonical = await page.$eval('link[rel="canonical"]', (el) => el.href);
// 验证不为空、长度合理
```

#### robots.txt 和 sitemap

```bash
curl localhost:3000/robots.txt   # 验证存在 + 合理规则
curl localhost:3000/sitemap.xml  # 验证包含公开页面
```

---

### C13. 分析追踪验证（Analytics Tracking）

> 拦截分析请求，验证关键漏斗事件正确触发。

| 事件                 | 触发点       | 验证方式            |
| -------------------- | ------------ | ------------------- |
| `page_view`          | 每次导航     | 拦截 analytics 请求 |
| `quickdive_start`    | 开始 QD      | 拦截验证 payload    |
| `quickdive_complete` | 完成 QD      | 验证带有结果数据    |
| `register`           | 注册成功     | 验证 userId         |
| `deepdive_start`     | 开始 DD      | 拦截验证            |
| `report_generate`    | 触发报告     | 验证                |
| `coaching_start`     | 首次教练对话 | 验证                |

方法：

```
page.route('**/api/analytics/**', route => {
  // 记录请求 payload
  analyticsEvents.push(route.request().postDataJSON());
  route.continue();
});
```

---

## Section D — 问卷作答策略

> 模拟真实用户的多样化答题行为。

### Quick Dive (38 题)

```
RIASEC 30 题: 模拟 I/A 偏高的混合型用户
  R: 3,4,3,2,4  I: 5,4,5,4,3  A: 4,5,4,3,4
  S: 2,3,2,3,2  E: 3,2,3,4,3  C: 1,2,2,1,2

TwIVI 8 题: 3,4,5,3,4,2,5,3
```

### Deep Dive (86 题)

```
Module A - SJT (6 scenarios): 每场景不同 would/should 组合
Module B - DDVQ21 (20 items): 3,5,2,4,6,3,1,4,5,2,4,3,5,2,4,6,3,2,5,4
Module C - IPIP-60 (60 items): 分散 1-5 分布
  前 20: 4,2,3,5,1,3,4,2,5,3,2,4,3,1,5,4,2,3,4,3
  中 20: 3,5,2,4,1,3,2,5,4,3,1,4,5,2,3,4,2,3,5,4
  后 20: 2,3,5,4,1,3,4,2,5,3,4,1,3,5,2,4,3,2,4,5
```

### Immersive Dive

```
同 QD 38 题，配合叙事节奏：
  每章等待转场动画完成 → 同伴对话点击推进
```

---

## Section E — 每页标准 8 项检查协议

> 每个页面到达后，按顺序执行。`smoke` 模式执行 1-3，`full` 执行全部。

### E1. 渲染完整性 ✅

```
- 页面标题不含 "500" 或 "Error"
- body 可见、主内容区非空
- 无 "Loading..." 卡住超 10s
- 无 broken image (naturalWidth === 0)
```

### E2. 控制台监控 ✅

```
- 收集 console.error / console.warn
- 记录未捕获 JS 异常
- 检查 React hydration 错误
- 检查网络请求 4xx/5xx
- 排除已知无害警告 (Next.js dev warnings, Turbopack HMR)
```

### E3. 交互验证 ✅

```
- 按钮可点击（非 disabled）
- 表单可聚焦
- 链接指向正确目标
- 模态框可开关
```

### E4. 无障碍扫描 ♿

```
- axe-core WCAG 2.1 AA 扫描（或等效 a11y snapshot 检查）
- Tab 顺序合理
- 焦点指示器可见
```

### E5. 响应式布局 📱

```
- 1440px: 桌面正常
- 768px: 平板无溢出
- 375px: 手机可用、按钮可触达
```

### E6. 性能观测 ⚡

```
- 页面加载 < 5s
- 无明显布局偏移 (CLS)
- 交互响应 < 200ms
```

### E7. 安全抽检 🔒

```
- 受保护页未登录 → 重定向
- 控制台无敏感信息泄露
- 表单无 autocomplete=off 缺失的密码字段
```

### E8. i18n 抽检 🌐

```
- en 页面无中文字符泄露
- zh 页面无纯英文 UI 文本（术语除外）
```

---

## Section F — 问题分级与报告

### 严重级别

| 级别        | 定义                   | 示例                                 | 处理               |
| ----------- | ---------------------- | ------------------------------------ | ------------------ |
| **P0 致命** | 崩溃/数据丢失/安全漏洞 | 白屏、答案丢失、XSS、未授权访问      | 立即报告，停止测试 |
| **P1 严重** | 核心功能不可用         | 提交失败、报告不渲染、SSE 断开无恢复 | 详细记录，阻塞发布 |
| **P2 中等** | 功能有缺陷             | 样式错位、a11y 违规、性能超标        | 记录截屏           |
| **P3 轻微** | 体验不佳               | 动画卡顿、间距不均、SEO 缺失         | 记录备查           |

### 问题记录模板

```
### [P级别] [维度标签] 问题标题
- **页面**: URL
- **维度**: C1-功能 / C4-无障碍 / C6-性能 / C7-安全 / ...
- **步骤**: 做了什么
- **期望**: 应该发生什么
- **实际**: 实际发生了什么
- **截图**: [文件名]
- **控制台**: [错误信息]
- **设备/视口**: 1440 / 768 / 375
- **语言**: en / zh
- **WCAG 规则** (仅无障碍): [规则 ID]
- **性能数据** (仅性能): [LCP/INP/CLS 值]
```

---

## Section G — 最终报告格式

```markdown
# 用户旅程测试报告 v2.0

**测试时间**: YYYY-MM-DD HH:MM
**测试模式**: full / smoke / ...
**工具**: Playwright MCP / CLI / Chrome
**测试用户**: [email]

## 执行摘要

| 维度          | 检查数          | 通过 | 问题   | 评分   |
| ------------- | --------------- | ---- | ------ | ------ |
| C1 功能旅程   | 7               | 6    | 1      | 86     |
| C2 状态持久化 | 5               | 5    | 0      | 100    |
| C3 负面路径   | 9               | 8    | 1      | 89     |
| C4 无障碍     | 32 pages        | 28   | 4      | 88     |
| C5 视觉回归   | 192 screenshots | 190  | 2      | 99     |
| C6 性能       | 12 metrics      | 10   | 2      | 83     |
| C7 安全       | 15              | 15   | 0      | 100    |
| C8 SSE 韧性   | 5               | 4    | 1      | 80     |
| C9 混沌/降级  | 6               | 5    | 1      | 83     |
| C10 状态恢复  | 5               | 4    | 1      | 80     |
| C11 i18n      | 32+32           | 62   | 2      | 97     |
| C12 SEO       | 8               | 7    | 1      | 88     |
| C13 分析追踪  | 7               | 7    | 0      | 100    |
| **综合**      |                 |      | **16** | **90** |

## 健康评分: 90/100 🟢 PASS

### 四级门控

| 评分   | 等级        | 含义           |
| ------ | ----------- | -------------- |
| 90-100 | 🟢 PASS     | 可安全发布     |
| 70-89  | 🟡 CONCERNS | 有注意事项     |
| 50-69  | 🟠 REWORK   | 需修复重测     |
| 0-49   | 🔴 FAIL     | 严重问题，阻塞 |

## 问题详情

### P0 — 致命 (0)

### P1 — 严重 (2)

### P2 — 中等 (8)

### P3 — 轻微 (6)

## 维度深度报告

### 无障碍报告

[axe-core violations 详情 + 修复建议]

### 性能报告

| 页面 | LCP | INP | CLS | 评级 |
| ---- | --- | --- | --- | ---- |

### 安全报告

[注入测试结果 + 并发测试结果]

### 视觉回归报告

[有差异的截图 diff 列表]

## 建议优先级

1. [P0] 立即: ...
2. [P1] 本周: ...
3. [P2] 下迭代: ...
4. [P3] 有空: ...
```

---

## Section H — 报告存储

```
.journey-test-reports/
├── screenshots/       # 当前运行截图
├── baselines/         # 视觉回归基线
├── diffs/             # 视觉差异高亮图
├── logs/
│   ├── console-errors.json
│   ├── network-errors.json
│   ├── a11y-violations.json
│   └── analytics-events.json
├── perf/
│   ├── web-vitals.json
│   └── memory-snapshots/
└── report-YYYY-MM-DD.md
```

---

## Section I — 测试后清理（⛔ 强制执行，不可跳过）

> **无论测试成功、失败还是中断，都必须在最后执行清理。**
> 测试用户残留会污染 admin 面板和数据库。

### 自动清理流程

测试结束后（包括因 P0 中断），立即执行：

```javascript
// 通过 Playwright MCP 或 fetch 调用
await fetch("http://localhost:3000/api/test/cleanup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}`,
  },
  body: JSON.stringify({ email: TEST_EMAIL }),
});
```

如果单个清理失败，使用批量清理兜底：

```javascript
// 删除所有 @test.deepdive.dev 和 @deepdive.test 测试用户
await fetch("http://localhost:3000/api/test/cleanup", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-csrf-token": csrfToken,
    cookie: `csrf-token=${csrfToken}`,
  },
  body: JSON.stringify({ all: true }),
});
```

### 清理检查点

在报告末尾必须包含：

```
## 🧹 清理状态
- [ ] 测试用户 `{email}` 已删除
- [ ] 关联数据 (profile/report/session) 已级联清除
```

如果清理失败，**必须在报告中标红警告**并告知用户手动处理。

---

## Section J — 与其他 Skill 联动

| 发现的问题类型 | 推荐联动           |
| -------------- | ------------------ |
| UI/样式        | `/deepdive-design` |
| API 错误       | `/qa api`          |
| 性能瓶颈       | `/perf-audit`      |
| 安全漏洞       | `/security-audit`  |
| 无障碍         | `/ux-audit`        |
| 文案/i18n      | `/copywriting`     |
| 边缘场景       | `/edge-audit`      |
| 业务逻辑       | `/biz-audit`       |
| 需要修复       | `/fix-bug`         |

---

## Section K — 关键规则

1. **截屏是证据** — 每个发现必须有截图，无截图不记录
2. **控制台零容忍** — console.error 就是 bug（排除已知 Next.js dev 警告）
3. **真实用户视角** — 不看源码找 bug，看页面体验找问题
4. **双语必测** — full/visual/i18n 模式必须 en + zh
5. **三视口必测** — full/visual 模式必须 1440 + 768 + 375
6. **不自动修复** — 只记录报告，修复需用户确认
7. **管道顺序** — QD→注册→Claim→DD→评分→Profile→报告→教练
8. **LLM 超时** — 报告 180s、教练 60s
9. **中文输出** — 全部报告用中文
10. **失败不放过** — P0 立即报告停测，P1 记录继续，不跳过
11. **⛔ 测试用户必删** — 无论成功/失败/中断，最后一步必须调用 cleanup API 删除测试用户，邮箱域名统一用 `@test.deepdive.dev`
