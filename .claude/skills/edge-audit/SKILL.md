# /edge-audit — 边缘场景审计

> 弱网、超时、浏览器兼容、并发 session、状态恢复等真实用户环境的边缘 case 审计。
> 专为 Deep Dive 的 180s 报告生成、SSE 教练流、双语切换等高风险场景定制。
> 所有输出使用中文。

## 触发条件

用户说 "边缘审计"、"edge audit"、"edge case"、"弱网测试"、"兼容性"、"超时场景" 时激活。

## 可用工具

Bash, Read, Write, Edit, Glob, Grep, Agent

## 模式总览

| 模式         | 命令                  | 做什么                             | 预估耗时 |
| ------------ | --------------------- | ---------------------------------- | -------- |
| **快速扫描** | `/edge-audit quick`   | 关键超时处理 + 错误边界 + 明显缺失 | ~3min    |
| **完整审计** | `/edge-audit` (默认)  | 6 维度全面边缘场景审计             | ~15min   |
| **网络专项** | `/edge-audit network` | 弱网、断网、超时、重试             | ~10min   |
| **状态专项** | `/edge-audit state`   | 状态恢复、并发、竞态条件           | ~10min   |
| **兼容专项** | `/edge-audit compat`  | 浏览器兼容、响应式边界、设备适配   | ~10min   |
| **全量**     | `/edge-audit full`    | 以上全部                           | ~25min   |

---

## 维度 1 — 网络异常

> 最高风险场景：报告生成 180s + 教练 SSE 长连接。

### 1.1 LLM 调用超时 (P0)

| 场景                      | 文件                             | 检查项                              |
| ------------------------- | -------------------------------- | ----------------------------------- |
| 报告生成 60s 单次调用超时 | `lib/report-generation/`         | AbortController + timeout 配置存在  |
| 报告生成 180s 总超时      | 同上                             | 总流程有 deadline，非单纯叠加       |
| 教练响应超时              | `app/api/coaching-chat/route.ts` | SSE 发送超时信号？客户端如何处理？  |
| Failover 触发             | `lib/ai/model-router.ts`         | 主模型超时 → 备选模型是否正确切换？ |

```bash
# 查找超时处理
grep -rn "AbortController\|AbortSignal\|timeout\|TIMEOUT\|deadline" lib/ai/ lib/report-generation/ app/api/coaching-chat/ --include="*.ts"

# 查找 catch/error 处理
grep -rn "catch\|\.catch\|onError\|on.*error" lib/report-generation/ app/api/coaching-chat/ --include="*.ts" | head -20
```

### 1.2 SSE 连接中断 (P0)

| 场景                        | 文件                                    | 检查项                                     |
| --------------------------- | --------------------------------------- | ------------------------------------------ |
| 网络断开后 SSE 行为         | `components/features/coaching-chat.tsx` | EventSource onerror 处理                   |
| 自动重连逻辑                | 同上                                    | 断开后是否尝试重连？指数退避？             |
| 重连后上下文恢复            | 同上                                    | 重连后继续之前的对话还是丢失？             |
| 服务端 SSE 写入客户端已断开 | `app/api/coaching-chat/route.ts`        | try-catch 包裹 write，不因客户端断开而崩溃 |

```bash
# 查找 SSE 错误处理
grep -rn "onerror\|onclose\|error.*event\|reconnect\|retry" components/features/coaching-chat.tsx

# 查找服务端 SSE 写入保护
grep -rn "try.*write\|catch.*write\|controller\.enqueue" app/api/coaching-chat/ --include="*.ts"
```

### 1.3 API 请求失败 (P1)

| 场景               | 检查项                                |
| ------------------ | ------------------------------------- |
| fetch 失败         | 全局错误处理？每个 fetch 都有 catch？ |
| 网络恢复后自动重试 | 重要操作（如评分提交）有重试机制？    |
| 离线指示           | 断网时 UI 有提示？                    |
| 请求去重           | 快速重复点击不会发多个请求？          |

```bash
# 查找 fetch 调用的错误处理
grep -rn "fetch(" lib/ components/ app/ --include="*.ts" --include="*.tsx" -A3 | grep -v "node_modules" | head -40

# 查找防抖/去重
grep -rn "debounce\|throttle\|isSubmitting\|isLoading\|disabled" components/ --include="*.tsx" | head -20
```

---

## 维度 2 — 状态管理边缘

### 2.1 问卷状态恢复 (P0)

| 场景               | 文件                            | 检查项                                     |
| ------------------ | ------------------------------- | ------------------------------------------ |
| 页面刷新后恢复进度 | `store/questionnaire-store.ts`  | 状态持久化到 localStorage/sessionStorage？ |
| Session resume API | `app/api/session/resume/`       | 服务端存储的进度与客户端一致？             |
| 部分答案丢失       | 同上                            | 只答了一半时刷新/关闭浏览器                |
| Immersive 章节中断 | `components/immersive-explore/` | 第 4 章中退出，回来从第 4 章继续？         |

```bash
# 查找状态持久化
grep -rn "localStorage\|sessionStorage\|persist\|rehydrate" store/ components/immersive-explore/ --include="*.ts" --include="*.tsx"

# 查找 session resume 逻辑
grep -rn "resume\|restore\|recover" app/api/session/ lib/ --include="*.ts"
```

### 2.2 并发 Session (P1)

| 场景                 | 检查项                                                |
| -------------------- | ----------------------------------------------------- |
| 多标签页同时答题     | Zustand store 跨 tab 同步？还是最后一个覆盖前者？     |
| 多设备登录           | 同一账号在手机和电脑同时操作会怎样？                  |
| 报告生成期间关闭页面 | 180s 内关闭页面，报告还会生成完成吗？下次打开能看到？ |

```bash
# 查找跨 tab 同步
grep -rn "BroadcastChannel\|storage.*event\|addEventListener.*storage" store/ --include="*.ts"

# 查找后台任务完成
grep -rn "background\|async.*generate\|queue" lib/report-generation/ --include="*.ts"
```

### 2.3 竞态条件 (P1)

| 场景                | 检查项                                  |
| ------------------- | --------------------------------------- |
| 快速切换问卷题目    | 动画完成前切到下一题，状态正确？        |
| 同时点击多个 CTA    | 多个 API 同时发出，后端处理正确？       |
| SSE 消息乱序        | 教练回复的 chunk 乱序到达？             |
| i18n 切换中重新请求 | 语言切换瞬间发出的请求使用哪个 locale？ |

```bash
# 查找可能的竞态
grep -rn "race condition\|mutex\|lock\|semaphore\|queue" lib/ --include="*.ts"

# 查找异步操作无保护的
grep -rn "async.*=>\|async function" app/api/ --include="*.ts" | head -30
```

---

## 维度 3 — 输入边界

### 3.1 评分输入边界 (P0)

| 场景                    | 检查项                          |
| ----------------------- | ------------------------------- |
| 全部选最低分 (1)        | 评分算法不崩溃？原型分配正确？  |
| 全部选最高分 (5/7)      | 同上                            |
| 所有维度分数相同        | RIASEC 全部平分，原型如何决定？ |
| 只答了 29/30 题就提交   | API 拒绝还是允许？              |
| 答题数据被篡改 (客户端) | 提交超出范围的分数 (0 或 10)    |

```bash
# 查找评分边界处理
grep -rn "Math\.max\|Math\.min\|clamp\|boundary\|validate" lib/scoring/ --include="*.ts"

# 查找提交前验证
grep -rn "answers\.length\|completedCount\|allAnswered" store/ lib/ --include="*.ts"
```

### 3.2 文本输入边界 (P1)

| 场景             | 检查项                           |
| ---------------- | -------------------------------- |
| 教练对话超长输入 | 最大字符限制？UI 提示？          |
| 教练对话空消息   | 空字符串 / 纯空格提交            |
| 特殊字符         | emoji, HTML 标签, SQL 注入字符串 |
| 邀请码格式边界   | 全空格、超长、特殊字符           |

---

## 维度 4 — 浏览器兼容与响应式

### 4.1 CSS 兼容性 (P1)

| 检查项                     | 验证方法                            |
| -------------------------- | ----------------------------------- |
| Tailwind v4 CSS 变量兼容   | Safari 14+, Chrome 90+, Firefox 88+ |
| `backdrop-filter` (玻璃态) | Safari 需要 `-webkit-` 前缀？       |
| CSS `container` queries    | 如使用，兼容性如何？                |
| `color-mix()`              | 如使用，较新的 CSS 特性             |
| `@starting-style`          | Next.js 15+ 可能使用                |

```bash
# 查找可能的兼容性问题
grep -rn "backdrop-filter\|color-mix\|container-type\|@starting-style\|@layer" app/ components/ --include="*.css" --include="*.tsx"

# 查找 vendor prefix
grep -rn "webkit\|moz\|ms-" app/globals.css
```

### 4.2 响应式边界 (P1)

| 断点    | 检查场景                       |
| ------- | ------------------------------ |
| 320px   | 最小 iPhone SE，文字是否溢出？ |
| 375px   | 基准移动端，所有元素可见？     |
| 768px   | iPad 竖屏，布局是否断裂？      |
| 1024px  | iPad 横屏 / 小笔记本           |
| 1440px+ | 大屏，内容是否居中且不过宽？   |

**重点页面**：

- 问卷页（选项卡片在小屏上不溢出？）
- 报告页 5 章（长文本 + 图表在移动端？）
- 教练对话（输入框在移动键盘弹出时？）

```bash
# 查找硬编码宽度
grep -rn "width:\s*[0-9].*px\|min-width.*px\|max-width.*px" components/ --include="*.tsx" | grep -v "tailwind\|className" | head -20

# 查找响应式断点使用
grep -rn "sm:\|md:\|lg:\|xl:\|2xl:" components/ --include="*.tsx" | wc -l
```

### 4.3 JavaScript 运行时 (P2)

| 检查项                    | 验证方法                     |
| ------------------------- | ---------------------------- |
| `?.` (optional chaining)  | 所有目标浏览器支持           |
| `??` (nullish coalescing) | 所有目标浏览器支持           |
| `structuredClone`         | 需 Chrome 98+ / Safari 15.4+ |
| `Array.at()`              | 需 Chrome 92+ / Safari 15.4+ |
| `crypto.randomUUID`       | 需 HTTPS + Chrome 92+        |

```bash
# 查找可能的新 API 使用
grep -rn "structuredClone\|Array\.at\|randomUUID\|Array\.findLast\|Object\.groupBy" lib/ components/ --include="*.ts" --include="*.tsx"
```

---

## 维度 5 — i18n 切换边缘

### 检查清单

| 场景               | 检查项                                    |
| ------------------ | ----------------------------------------- |
| 问卷中途切换语言   | 已答的答案保留？题目正确切换？进度不丢？  |
| 报告生成后切换语言 | 报告内容是否按新语言重新生成？            |
| 教练对话中切换语言 | 教练是否切换到新语言回复？历史消息？      |
| RTL 语言（未来）   | 布局是否会因 RTL 崩溃？                   |
| URL locale 篡改    | `/en/xxx` 改为 `/fr/xxx` → 404 还是回退？ |

```bash
# 查找 locale 切换处理
grep -rn "locale.*change\|switchLocale\|setLocale\|i18n.*redirect" lib/ components/ middleware.ts --include="*.ts" --include="*.tsx"

# 查找 locale 验证
grep -rn "supportedLocales\|validLocale\|locale.*check" middleware.ts lib/i18n/ --include="*.ts"
```

---

## 维度 6 — 极端用户行为

### 检查清单

| 场景                   | 检查项                         | 风险级别 |
| ---------------------- | ------------------------------ | -------- |
| 浏览器后退键           | 从报告页后退到问卷，状态如何？ | P1       |
| 浏览器前进键           | 前进到已过期的页面？           | P2       |
| 直接输入 URL 跳转      | 跳过问卷直接访问报告页？       | P0       |
| 禁用 JavaScript        | 页面有 graceful 降级？         | P2       |
| 禁用 Cookie            | 无法登录时有明确提示？         | P1       |
| 超级慢设备 (CPU 节流)  | Framer Motion 动画是否 jank？  | P2       |
| 超长 session (>24h)    | token 续期正确？还是突然登出？ | P1       |
| 大量教练消息 (>100 轮) | 页面性能是否退化？内存？       | P1       |

```bash
# 查找路由守卫
grep -rn "redirect\|router\.push\|useRouter\|guardRoute" app/\[locale\]/ --include="*.tsx" | head -20

# 查找 prefers-reduced-motion
grep -rn "prefersReducedMotion\|prefers-reduced-motion\|reducedMotion" components/ --include="*.tsx" --include="*.css"
```

---

## 输出格式

```
🔍 边缘场景审计报告

## 维度评分

| 维度 | 评分 | 关键发现 |
|------|------|----------|
| 网络异常 | 🟡 6/10 | SSE 断连无自动重连 |
| 状态管理 | 🟢 8/10 | 问卷进度有服务端存储 |
| 输入边界 | 🟡 7/10 | 全平分场景未特殊处理 |
| 浏览器兼容 | 🟢 8/10 | 基本兼容良好 |
| i18n 切换 | 🟡 6/10 | 问卷中途切语言未测试 |
| 极端行为 | 🟡 7/10 | URL 直接跳转有守卫 |

## P0/P1 发现

| # | 级别 | 维度 | 场景 | 描述 | 文件 |
|---|------|------|------|------|------|
| 1 | P0 | 网络 | SSE 断连 | 教练对话断网后无恢复机制 | coaching-chat.tsx |
| 2 | P1 | 状态 | 并发 tab | 多标签页答题状态可能冲突 | questionnaire-store.ts |

## 修复建议

| # | 优先级 | 描述 | 复杂度 |
|---|--------|------|--------|
| 1 | 高 | SSE 添加指数退避自动重连 | 中 |
| 2 | 中 | 添加 BroadcastChannel 跨 tab 同步 | 高 |

🟡 边缘场景综合评分: 70/100
```

---

## 关键规则

1. **只读审计** — 审计过程中不修改文件，只报告发现和建议
2. **真实用户思维** — 每个场景都想象真实用户会遇到什么
3. **概率排序** — 优先报告高概率发生的边缘 case（如弱网），而非理论上可能但极罕见的场景
4. **中文输出** — 所有报告使用中文
5. **可复现** — 每个发现附带复现步骤
6. **修复成本估算** — 每个建议附带复杂度评估（低/中/高）
