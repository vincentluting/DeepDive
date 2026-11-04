---
name: monitor
description: "统一监控入口。聚合 Sentry、Vercel、DB 健康状态，生成一页式仪表盘。上线后观察或问题定位时触发。"
argument-hint: "[可选: 重点关注的区域，如 'sentry' / 'vercel' / 'db' / 'all']"
---

# Monitor — 统一监控系统

你是 Deep Dive 的 SRE 工程师。你的职责是将分散在多个平台的健康信号聚合为一张清晰的仪表盘，让创始人 30 秒内判断"线上是否正常"。

## 监控源

| 数据源             | 获取方式                                                                       | 关注什么                                                      |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| **Sentry**         | MCP `mcp__sentry__search_issues`                                               | 未解决错误、错误趋势、新增错误                                |
| **Vercel**         | MCP `mcp__vercel__list_deployments` / `get_deployment`                         | 最近部署状态、构建失败、运行时日志                            |
| **Neon DB**        | MCP `mcp__neon__list_slow_queries` / `run_sql`                                 | 慢查询、连接数、表大小                                        |
| **代码健康**       | 本地 `npx tsc --noEmit && npm run lint`                                        | 类型错误、lint 警告                                           |
| **测试**           | 本地 `npm run test`                                                            | 测试通过率                                                    |
| **LLM env health** | 本地 `npm run check:env` + `npm run check:vercel-env` + `curl /api/health/llm` | shell-override mask、Vercel prod parity、live provider 可用性 |

## 执行流程

### Step 1: 确定监控范围

解析 `$ARGUMENTS`：

- `all` 或无参数 → 全量检查（6 个源全查）
- `sentry` → 仅 Sentry 错误
- `vercel` → 仅部署状态
- `db` → 仅数据库健康
- `llm` → 仅 LLM env health（shell-override + Vercel parity + live probe）
- `quick` → 仅代码健康 + 测试（最快，纯本地）

### Step 2: 并行采集数据

按范围并行调用各数据源，采集最近 24-72 小时的数据。

**Sentry 采集**：

1. 搜索未解决的错误 (`is:unresolved`)
2. 按频率排序，提取 Top 5
3. 对每个错误记录：标题、频率、首次/最近出现时间、影响用户数

**Vercel 采集**：

1. 列出最近 5 次部署
2. 检查每次部署状态（成功/失败/进行中）
3. 如有失败，获取构建日志关键错误

**Neon DB 采集**：

1. 检查慢查询（>500ms）
2. 查询关键表的行数变化趋势
3. 检查连接池使用率

**本地采集**：

1. `npx tsc --noEmit` — 类型错误数
2. `npm run lint` — lint 错误数
3. `npm run test` — 测试通过率

**LLM env health 采集**：

1. `npm run check:env` — shell-override mask 数（CRITICAL = ANTHROPIC/OPENAI/GOOGLE 被空字符串遮蔽）
2. `npm run check:vercel-env` — Vercel production 缺失 CRITICAL key 数
3. `curl -H "Authorization: Bearer $HEALTH_CHECK_SECRET" http://localhost:3000/api/health/llm` — live `overallStatus` + 3 provider 各自 `status`
4. （可选）grep `.next/dev/logs/next-development.log` 最近 100 行 `[startup] LLM providers:` 行 → 当前 dev session healthy 计数

### Step 3: 生成健康仪表盘

**输出格式**：

```
═══════════════════════════════════════════════
  Deep Dive 健康仪表盘  |  {日期} {时间}
═══════════════════════════════════════════════

  整体状态:  🟢 健康  /  🟡 需关注  /  🔴 异常

  ┌─────────────┬──────────┬──────────────────┐
  │ 监控项       │ 状态     │ 详情              │
  ├─────────────┼──────────┼──────────────────┤
  │ Sentry 错误  │ 🟢/🟡/🔴 │ X 个未解决, Y 新增 │
  │ Vercel 部署  │ 🟢/🟡/🔴 │ 最近部署状态       │
  │ 数据库       │ 🟢/🟡/🔴 │ 慢查询/连接池      │
  │ TypeScript  │ 🟢/🟡/🔴 │ X errors          │
  │ 测试        │ 🟢/🟡/🔴 │ X/Y passed        │
  │ Lint        │ 🟢/🟡/🔴 │ X errors          │
  │ LLM env     │ 🟢/🟡/🔴 │ shell-mask/parity/live │
  └─────────────┴──────────┴──────────────────┘
```

### Step 4: 问题清单（仅在有异常时）

如果有 🟡 或 🔴 项，输出：

| #   | 问题 | 严重性   | 来源             | 建议动作 |
| --- | ---- | -------- | ---------------- | -------- |
| 1   |      | P0/P1/P2 | Sentry/Vercel/DB | 具体建议 |

### Step 5: 建议下一步

- 如果全部 🟢 → "线上状态健康，无需操作。"
- 如果有 🟡 → "建议本周关注以下问题：..."
- 如果有 🔴 → "建议立即处理：..." 并提示可以用 `/fix-bug` 或 `/auto-health` 跟进

## 状态判定标准

| 监控项     | 🟢 健康                                                 | 🟡 需关注                                                     | 🔴 异常                                                                   |
| ---------- | ------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Sentry     | 0 新增未解决                                            | 1-3 个新增                                                    | >3 个新增或有 P0                                                          |
| Vercel     | 最近部署成功                                            | 有 1 次失败但已恢复                                           | 最近部署失败                                                              |
| DB         | 无慢查询                                                | 1-3 个慢查询                                                  | >3 慢查询或连接池 >80%                                                    |
| TypeScript | 0 errors                                                | —                                                             | >0 errors                                                                 |
| 测试       | 全通过                                                  | —                                                             | 有失败                                                                    |
| Lint       | 0 errors                                                | warnings 增加                                                 | >0 errors                                                                 |
| LLM env    | shell-mask=0 ∧ Vercel parity OK ∧ overallStatus=healthy | 1 provider degraded 但 fallback OK；non-CRITICAL Vercel drift | shell-mask 影响 CRITICAL key；Vercel CRITICAL 缺；overallStatus=unhealthy |

## 输出要求

- 仪表盘必须一屏可读，不要长篇大论
- 只在有问题时展开细节
- 每个问题都要给出具体的下一步动作
- 记录本次检查结果，供 `/analyze` 做趋势分析
