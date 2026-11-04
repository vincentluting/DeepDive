# /perf-audit — 性能瓶颈审计

> 检测加载速度、内存泄漏、LLM 调用延迟、SSE 流式性能、包体积。
> 专为 Deep Dive 高延迟场景定制：报告生成 180s、教练 SSE 流、CJK 字体加载。
> 所有输出使用中文。

## 触发条件

用户说 "性能审计"、"perf audit"、"加载慢"、"内存泄漏"、"性能检查"、"benchmark" 时激活。

## 可用工具

Bash, Read, Write, Edit, Glob, Grep, Agent

## 模式总览

| 模式         | 命令                 | 做什么                                      | 预估耗时 |
| ------------ | -------------------- | ------------------------------------------- | -------- |
| **快速扫描** | `/perf-audit quick`  | 包体积 + 关键路径分析 + 明显泄漏模式        | ~2min    |
| **完整审计** | `/perf-audit` (默认) | 6 维度全面检查                              | ~10min   |
| **LLM 专项** | `/perf-audit llm`    | LLM 调用链延迟、超时、failover、并发        | ~5min    |
| **SSE 专项** | `/perf-audit sse`    | 教练 SSE 流式：连接、断开、内存、背压       | ~5min    |
| **包体积**   | `/perf-audit bundle` | Next.js 包分析、tree-shaking、动态 import   | ~3min    |
| **内存专项** | `/perf-audit memory` | Zustand store、事件监听器、定时器、闭包泄漏 | ~5min    |

---

## 阶段 0 — 环境检查

```bash
# 检查 build 是否成功（性能分析需要 production build）
npm run build 2>&1 | tail -30

# 检查 dev server
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

## 维度 1 — LLM 调用性能

> Deep Dive 最大性能瓶颈：报告生成 2-3 次 LLM 调用，总超时 180s。

### 检查清单

| 检查项               | 文件                     | 风险级别 | 验证方法                            |
| -------------------- | ------------------------ | -------- | ----------------------------------- |
| 超时配置存在且合理   | `lib/ai/model-router.ts` | P0       | timeout ≤ 180s，每次调用 ≤ 60s      |
| Circuit breaker 配置 | 同上                     | P0       | 失败阈值、冷却期、半开状态          |
| Failover 链完整      | 同上                     | P1       | 主模型失败 → 备选模型 → 最终降级    |
| 并发 LLM 调用优化    | `lib/report-generation/` | P1       | 独立章节是否 `Promise.all` 并发     |
| Token 估算 vs 实际   | 同上                     | P2       | prompt 长度是否可能超模型上下文窗口 |
| 重试策略             | `lib/ai/model-router.ts` | P1       | 指数退避、最大重试次数、幂等性      |

### 代码审查要点

```bash
# 查找所有 LLM 调用点
grep -rn "callModel\|routeTask\|generateText\|streamText" lib/ app/api/ --include="*.ts"

# 查找超时配置
grep -rn "timeout\|TIMEOUT\|AbortController\|AbortSignal" lib/ai/ lib/report-generation/ --include="*.ts"

# 查找并发模式
grep -rn "Promise\.all\|Promise\.allSettled\|Promise\.race" lib/report-generation/ --include="*.ts"
```

---

## 维度 2 — SSE 流式性能

> 教练聊天使用 SSE (Server-Sent Events)，长连接场景易出内存泄漏。

### 检查清单

| 检查项                  | 文件                                    | 风险级别 | 验证方法                          |
| ----------------------- | --------------------------------------- | -------- | --------------------------------- |
| ReadableStream 正确关闭 | `app/api/coaching-chat/route.ts`        | P0       | finally 块中 `controller.close()` |
| TextEncoder 复用        | 同上                                    | P2       | 非每次 write 新建                 |
| 客户端 EventSource 清理 | `components/features/coaching-chat.tsx` | P0       | 组件卸载时 `eventSource.close()`  |
| 错误边界处理            | 同上                                    | P1       | SSE 断开后 UI 状态恢复            |
| 背压处理                | API route                               | P2       | 客户端消费慢时不无限缓冲          |
| 心跳/keep-alive         | API route                               | P2       | 长时间无数据时防止连接超时        |

### 代码审查要点

```bash
# 查找 SSE 相关代码
grep -rn "ReadableStream\|EventSource\|text/event-stream\|SSE" app/api/ components/ --include="*.ts" --include="*.tsx"

# 查找清理逻辑
grep -rn "\.close()\|AbortController\|cleanup\|unmount\|useEffect.*return" components/features/coaching-chat.tsx
```

---

## 维度 3 — 内存管理

> Zustand store 在 SPA 导航中持久存在，需要注意泄漏。

### 检查清单

| 检查项                 | 文件                            | 风险级别 | 验证方法                                 |
| ---------------------- | ------------------------------- | -------- | ---------------------------------------- |
| Zustand store 重置逻辑 | `store/questionnaire-store.ts`  | P1       | 流程完成/退出时清理状态                  |
| 事件监听器清理         | 所有 `useEffect`                | P1       | return 中移除监听器                      |
| 定时器清理             | 所有 `setInterval`/`setTimeout` | P1       | return 中 `clearInterval`/`clearTimeout` |
| 大对象引用释放         | `lib/report-generation/`        | P2       | LLM 响应处理完后不持久引用               |
| 图片/资源泄漏          | `components/`                   | P2       | 动态创建的 Image/Blob 及时 revoke        |
| 闭包引用泄漏           | 回调函数中                      | P2       | 避免闭包捕获过多外部状态                 |

### 代码审查要点

```bash
# 查找 Zustand store
grep -rn "create(\|useStore\|zustand" store/ --include="*.ts"

# 查找潜在泄漏模式
grep -rn "addEventListener\|setInterval\|setTimeout\|new Image\|createObjectURL" components/ --include="*.tsx" --include="*.ts"

# 查找 useEffect 缺少清理
grep -rn "useEffect" components/ --include="*.tsx" -A5 | grep -v "return"
```

---

## 维度 4 — 包体积与加载

> CJK 字体是包体积大户，影响首屏加载。

### 检查清单

| 检查项            | 文件                              | 风险级别 | 验证方法                       |
| ----------------- | --------------------------------- | -------- | ------------------------------ |
| 字体加载策略      | `app/layout.tsx` / `app/fonts.ts` | P1       | `display: 'swap'`，CJK subset  |
| 动态 import 使用  | 大型组件                          | P1       | 报告页、教练页使用 `dynamic()` |
| Tree-shaking 有效 | `package.json`                    | P2       | 无 barrel export 导致全量引入  |
| 图片优化          | `next.config.ts`                  | P2       | Next Image + WebP/AVIF         |
| 第三方库体积      | `node_modules`                    | P2       | 无不必要的大型依赖             |

### 代码审查要点

```bash
# 分析 build 输出的包大小
npm run build 2>&1 | grep -E "Route|Size|First Load"

# 查找未动态导入的大组件
grep -rn "^import.*from.*framer-motion\|^import.*from.*recharts\|^import.*from.*@radix" app/ --include="*.tsx" | head -20

# 查找 barrel exports
grep -rn "export \* from" lib/ components/ --include="*.ts" --include="*.tsx"
```

---

## 维度 5 — API 响应性能

### 检查清单

| 检查项          | 文件             | 风险级别 | 验证方法                         |
| --------------- | ---------------- | -------- | -------------------------------- |
| N+1 查询        | `lib/db/`        | P1       | 循环中无单条 SELECT，用 batch/IN |
| 数据库连接池    | `lib/db/neon.ts` | P1       | 使用连接池，非每次新建           |
| API 响应压缩    | `next.config.ts` | P2       | gzip/brotli                      |
| 缓存策略        | API routes       | P2       | 静态数据有 `Cache-Control`       |
| Middleware 性能 | `middleware.ts`  | P2       | 无阻塞操作，快速通过             |

---

## 维度 6 — 前端渲染性能

### 检查清单

| 检查项                 | 文件                     | 风险级别 | 验证方法                                        |
| ---------------------- | ------------------------ | -------- | ----------------------------------------------- |
| 不必要的重渲染         | 使用 `React.memo` 的组件 | P2       | 大列表/频繁更新组件有 memo                      |
| Framer Motion 动画性能 | `components/`            | P2       | 使用 `transform` 而非 `top/left`，`will-change` |
| 虚拟化长列表           | 职业方向列表等           | P2       | >50 条数据使用虚拟滚动                          |
| Hydration 警告         | 开发控制台               | P1       | 无 SSR/CSR 不匹配                               |

---

## 输出格式

```
🔍 性能审计报告

## 维度评分

| 维度 | 评分 | 关键发现 |
|------|------|----------|
| LLM 调用 | 🟢 8/10 | 超时配置正确，failover 完整 |
| SSE 流式 | 🟡 6/10 | 客户端清理存在，但缺少心跳 |
| 内存管理 | 🟡 7/10 | 1 个 useEffect 缺少清理 |
| 包体积 | 🟢 8/10 | CJK 字体已 subset |
| API 响应 | 🟢 9/10 | 连接池正确 |
| 前端渲染 | 🟡 7/10 | 报告页缺少虚拟化 |

## P0/P1 发现

| # | 级别 | 维度 | 文件:行号 | 描述 |
|---|------|------|-----------|------|
| 1 | P1 | SSE | coaching-chat.tsx:42 | EventSource 缺少 error 回调 |

## 优化建议

1. [高] 描述 + 预估收益
2. [中] 描述 + 预估收益

🟡 性能综合评分: 75/100
```

---

## 关键规则

1. **只读审计** — 审计过程中不修改文件，只报告发现和建议
2. **生产视角** — 用 `npm run build` 分析，不只看开发模式
3. **用户感知优先** — 优先关注用户能感知到的延迟（LCP、交互延迟），而非理论指标
4. **Deep Dive 场景优先** — 重点关注报告生成 180s 和教练 SSE 这两个高延迟场景
5. **中文输出** — 所有报告使用中文
6. **量化证据** — 每个发现附带具体数值（ms/KB/次数），不说"可能慢"
