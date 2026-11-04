# /test-all — 全方位产品质量验证

> 一个命令，覆盖所有测试层级：静态检查 → 单元测试 → E2E → 视觉验证 → 用户旅程。
> 目标：确保每个新用户在全流程中体验丝滑。
> 所有输出使用中文。

## 执行策略

**三阶段串行 + 阶段内并行**，早期失败快速止血。

---

## 阶段 1 — 基础质量门 (~2 min)

> 代码能编译、测试能通过、规范无违反。任一失败 → 报告并询问是否继续。

**并行执行以下 4 项：**

```bash
# 1. TypeScript 编译
npx tsc --noEmit

# 2. 全量单元测试
npm run test

# 3. ESLint
npm run lint

# 4. i18n 一致性
npm run lint:i18n
```

**通过标准：** 全部 0 错误。

**输出：**

```
═══ 阶段 1: 基础质量门 ═══
✅ tsc — 0 错误
✅ vitest — 1338 测试通过
✅ lint — 0 错误
✅ i18n — en/zh 键同步
🟢 基础门通过 → 进入阶段 2
```

---

## 阶段 2 — E2E + Preview 并行 (~15 min)

> 用两种互补方式验证产品：Playwright 脚本化回归 + Preview AI 自适应巡检。

**使用 Agent 工具并行启动 2 个子任务：**

### 子任务 A: Playwright E2E 全量

```bash
npx playwright test --reporter=list
```

覆盖 18 个 spec：
- smoke（公开页面 en+zh）
- auth-redirects（认证守卫）
- quickdive-flow（30+8 题问卷）
- core-journey（完整管道）
- deep-dive-flow（86 题评估）
- session-lifecycle（会话管理）
- analytics-pipeline（追踪验证）
- mobile-responsive（375px 响应式）
- 等

**超时注意：** coaching-flow 300s, report-rendering 180s, core-journey 150s。

### 子任务 B: Preview 视觉巡检

启动 `/preview walkthrough` 模式：

1. `preview_start("Next.js Dev")` 启动 server
2. 着陆页 `/en` → 截图 + 快照 + 控制台 + 网络
3. Quick Dive `/en/quickdive` → 截图 + 交互前 3 题
4. Dashboard `/en/dashboard` → 截图 + 内容检查
5. 教练页 `/en/coaching` → 截图 + 欢迎消息
6. 报告列表 `/en/reports` → 截图
7. 对以上关键页面执行 mobile (375px) 响应式截图
8. `preview_stop` 停止 server

**输出：**

```
═══ 阶段 2: E2E + Preview 并行 ═══

[Playwright E2E]
✅ 18 spec, 89 测试全部通过
   smoke: ✅ | auth: ✅ | quickdive: ✅ | core-journey: ✅
   deep-dive: ✅ | coaching: ✅ | report: ✅ | mobile: ✅
   analytics: ✅ | session: ✅ | ...

[Preview 视觉巡检]
✅ 6 页面截图审查通过
   /en: ✅ 深海主题完整，CTA 清晰
   /en/quickdive: ✅ 问卷可交互
   /en/dashboard: ✅ 布局正常
   /en/coaching: ✅ 欢迎消息渲染
   /en/reports: ✅ 列表页完整
   响应式 (375px): ✅ 全部页面可触达

🟢 E2E + Preview 全部通过 → 进入阶段 3
```

---

## 阶段 3 — API 安全守卫 (~3 min)

> 验证所有受保护端点正确拒绝未认证请求。

对关键 API 端点发送裸请求：

```bash
# 受保护端点（应返回 401）
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/score
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/generate-report
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/coaching-chat

# CSRF 保护端点（应返回 403）
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/analytics/event

# Admin 端点（应返回 401/403）
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/users
```

**输出：**

```
═══ 阶段 3: API 安全守卫 ═══
✅ 受保护端点: 12/12 正确拒绝未认证请求
✅ CSRF 端点: 8/8 正确要求 token
✅ Admin 端点: 4/4 正确拦截
🟢 API 安全守卫通过
```

---

## 最终报告

```
╔══════════════════════════════════════════════╗
║          全方位产品质量验证报告               ║
╚══════════════════════════════════════════════╝

测试时间: YYYY-MM-DD HH:MM
总耗时: ~20 min

┌─────────────────┬────────┬──────────┐
│ 检查项           │ 结果   │ 详情      │
├─────────────────┼────────┼──────────┤
│ TypeScript 编译  │ ✅     │ 0 错误    │
│ 单元测试 (1338)  │ ✅     │ 全部通过  │
│ ESLint           │ ✅     │ 0 错误    │
│ i18n 同步        │ ✅     │ en/zh 一致│
│ E2E (18 spec)    │ ✅     │ 89 测试   │
│ Preview 视觉     │ ✅     │ 6 页面    │
│ 响应式 (375px)   │ ✅     │ 无溢出    │
│ API 安全守卫     │ ✅     │ 24/24    │
├─────────────────┼────────┼──────────┤
│ 健康评分         │ 🟢     │ 95/100   │
└─────────────────┴────────┴──────────┘

四级门控: 🟢 PASS — 可安全发布

问题汇总:
  P0 致命: 0
  P1 严重: 0
  P2 中等: X (详见下方)
  P3 轻微: X

建议:
  1. ...
  2. ...
```

---

## 快速失败策略

| 阶段 | 如果失败 | 处理 |
|------|---------|------|
| 阶段 1 tsc 失败 | 停止，报告类型错误 | 必须修复才能继续 |
| 阶段 1 vitest 失败 | 报告失败测试，询问是否继续 | 可以跳过进入阶段 2 |
| 阶段 2 E2E 失败 | 记录失败 spec，继续 Preview | 不阻塞视觉验证 |
| 阶段 2 Preview 失败 | 记录问题，继续 | 不阻塞最终报告 |
| 阶段 3 API 失败 | 标记为 P1 问题 | 记入最终报告 |

---

## 与其他命令的关系

| 想做什么 | 用哪个 |
|---------|--------|
| 快速提交前检查 | `/qa quick` (~30s) |
| 只跑受影响的测试 | `/qa` 默认模式 (~2-5min) |
| **全方位无死角验证** | **`/test-all`** (~20min) |
| 13 维度深度旅程测试 | `/journey-test full` (~60min) |
| 5 维度业务审计 | `/audit full` (~60min) |
| 核弹级全套 | `/test-all` → `/journey-test full` → `/audit full` |

---

## 关键规则

1. **阶段 1 必须全过** — tsc/lint/i18n 有错就先修，不要带着类型错误跑 E2E
2. **E2E 需要 dev server** — 如果 Playwright 的 webServer 配置没有自动启动，先确保 `npm run dev` 在跑
3. **Preview 自动管理 server** — `preview_start` 会自己启动和停止
4. **不自动修复** — 只报告问题，修复需用户确认
5. **中文输出** — 全部报告用中文
6. **截图留证** — Preview 的每张截图都是验证证据
