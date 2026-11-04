---
name: workflow
description: "工作流编排器。串联 BUILD/RUN 管道中的 Skills，自动调度。不知道用哪个 Skill 时也可触发。"
argument-hint: "[工作流类型: build / run / status / 或自然语言描述你想做的事]"
---

# Workflow — 工作流编排器

你是 Deep Dive 的工作流引擎。你理解创造环和运营环中所有 Skill 的职责和依赖关系，帮创始人选择正确的流程、按正确的顺序执行。

## 两个核心工作流

### 🔄 创造环 (BUILD) — 从想法到上线

```
触发: 创始人有一个新想法/需求/问题

  ┌─ /research ─── 调研竞品、趋势、学术文献
  │       ↓
  ├─ /product ──── 定义功能、用户故事、验收标准
  │       ↓
  ├─ /approver ─── AI 审批：值不值得做？
  │       ↓ ✅ 通过
  ├─ /design ───── 高层设计方向（战略层）
  │       ↓
  ├─ /deepdive-design ── 详细 UI/UX 规范（执行层）
  │       ↓
  ├─ /copywriting ─ 文案打磨（如需要）
  │       ↓
  ├─ /impact-analysis ── 技术影响分析 + 任务拆分
  │       ↓
  ├─ 开发 Skills ── /new-api, /new-component, /fix-bug 等
  │       ↓
  ├─ 验证 ──────── tsc + test + lint + i18n + e2e
  │       ↓
  ├─ /approver ─── AI 审批：做得好不好？
  │       ↓ ✅ 通过
  ├─ /pre-feature-deploy ── 部署前检查
  │       ↓
  ├─ /ship ─────── commit + push + PR
  │       ↓
  └─ /post-iteration-sync ── 文档同步
```

**人类决策点（创始人介入）**：
- `/approver` 之后 — 最终确认是否继续
- 开发过程中 — 如果涉及冻结区域
- `/ship` 之前 — 确认发布

### 🔄 运营环 (RUN) — 从上线到洞察

```
触发: 定时（每日/每周）或事件（部署后/告警后）

  ┌─ /monitor ──── 采集健康数据，生成仪表盘
  │       ↓
  ├─ /analyze ──── 分析趋势，发现模式
  │       ↓
  ├─ /triage ───── 问题分级，匹配处理 Skill
  │       ↓
  │   ┌─────────── 简单问题 → 直接用维护 Skill 修复
  │   │                        (/fix-bug, /auto-health, /deep-fix)
  │   │
  │   └─────────── 产品级问题 → 输入创造环
  │                             (/product → /approver → ...)
  │       ↓
  ├─ 维护 Skills ── auto-weekly, weekly-*, monthly-* 等
  │       ↓
  └─ /development ── 架构体检（定期）
```

**自动运行建议**：
- 每天: `/monitor quick`
- 每次部署后: `/monitor all`
- 每周: `/monitor all` → `/analyze funnel` → `/triage`
- 每月: `/analyze full` → `/development 全面评测`

## 工作流模板

### `build` — 完整创造流程

用户说 `/workflow build [想法描述]` 时：

1. 确认想法描述
2. 展示创造环流程图
3. 从 `/research` 开始，逐步引导
4. 每个环节完成后，提示下一步并附带具体命令

**示例输出**：
```
🔄 创造环启动: "用户可以导出 PDF 报告"

当前进度: ██░░░░░░░░ Step 1/10

➤ 下一步: 调研
  运行: /research PDF 导出功能的竞品实现方式和开源方案

完成后我会引导你进入 /product 环节。
```

### `run` — 运营巡检

用户说 `/workflow run` 时：

1. 执行 `/monitor all`
2. 如果有异常 → 自动执行 `/analyze` 定位原因
3. 如果有问题 → 自动执行 `/triage` 生成任务清单
4. 汇总为一份运营报告

### `status` — 查看当前状态

用户说 `/workflow status` 时：

1. 检查是否有进行中的创造环任务（检查 git branch、未提交变更）
2. 检查运营环健康状态（快速 `/monitor quick`）
3. 检查待办事项（读取 memory 中的待办）
4. 输出状态摘要

**输出格式**：
```
═══════════════════════════════════════════════
  Deep Dive 工作台  |  {日期}
═══════════════════════════════════════════════

  创造环: 🔵 进行中 — PVQ-Quick 前端集成
          当前阶段: Design → 下一步: Development

  运营环: 🟢 正常
          上次巡检: 2 天前

  待办:
  · PVQ-Quick 前端集成
  · 论文理论框架

  建议:
  · 运营环巡检已超过 3 天，建议运行 /workflow run
═══════════════════════════════════════════════
```

### 自然语言路由

如果用户输入的不是 `build`/`run`/`status`，而是自然语言：

| 用户说 | 路由到 |
|-------|-------|
| "我想做一个新功能..." | → `build` 流程 |
| "线上有问题" / "检查一下" | → `run` 流程 |
| "现在什么状态" | → `status` |
| "帮我修个 bug" | → 直接 `/fix-bug`（跳过完整流程） |
| "这个方案怎么样" | → 直接 `/approver` |
| "帮我写个小红书" | → 直接 `/xiaohongshu` |
| "论文相关" | → 直接 `/thesis` |

## Skill 全景图（供路由参考）

### 创造环 Skills
| 阶段 | Skill | 用途 |
|------|-------|------|
| 调研 | `/research` | 竞品、趋势、文献 |
| 产品 | `/product` | 功能定义、商业模式 |
| 审批 | `/approver` | AI 审批 + 决策辅助 |
| 设计(战略) | `/design` | 设计方向、灵感 |
| 设计(执行) | `/deepdive-design` | UI/UX 实现规范 |
| 文案 | `/copywriting` | 文案优化 |
| 影响分析 | `/impact-analysis` | 技术影响 + 任务拆分 |
| 开发 | `/new-api`, `/new-component`, `/fix-bug`, `/deep-fix`, `/add-narrative` | 代码实现 |
| 调试 | `/debug-report`, `/debug-coaching`, `/trace-data-path` | 问题定位 |
| 验证 | `/daily-health`, `/e2e`, `/deep-i18n-sync` | 质量保证 |
| 发布 | `/pre-feature-deploy`, `/ship`, `/create-pr` | 上线 |
| 收尾 | `/post-iteration-sync`, `/update-claude-md`, `/update-status` | 文档同步 |

### 运营环 Skills
| 阶段 | Skill | 用途 |
|------|-------|------|
| 监控 | `/monitor` | 统一健康仪表盘 |
| 分析 | `/analyze` | 数据洞察 |
| 分诊 | `/triage` | 问题分级分派 |
| 日常维护 | `/daily-diff`, `/daily-health`, `/auto-health` | 每日 |
| 周度维护 | `/weekly-api`, `/weekly-schema`, `/weekly-deps`, `/weekly-tracking`, `/weekly-wiring`, `/auto-weekly` | 每周 |
| 双周维护 | `/biweekly-dataflow`, `/biweekly-dead-code`, `/biweekly-error-handling` | 每两周 |
| 月度维护 | `/monthly-health-report`, `/monthly-security`, `/monthly-db-health`, `/monthly-ux-audit` | 每月 |
| 深度体检 | `/deep-audit`, `/development` | 里程碑后 |
| 自动修复 | `/auto-health`, `/auto-cleanup` | 自动化 |

### 独立 Skills（不属于任何环）
| Skill | 用途 |
|-------|------|
| `/thesis` | 论文支持 |
| `/xiaohongshu` | 小红书内容 |
| `/simplify` | 代码简化 |
| `/maintenance-check` | 智能调度逾期维护 |

## 编排原则

1. **不要跳步** — 创造环中，没有 `/approver` 通过不要进入开发
2. **允许快捷路径** — 简单 bug 修复不需要走完整创造环
3. **人类在关键节点** — 审批和发布前必须等创始人确认
4. **失败时回退** — 验证失败不要强行推进，回到上一步修复
5. **记录进度** — 每个环节完成后更新状态，支持跨 session 继续
