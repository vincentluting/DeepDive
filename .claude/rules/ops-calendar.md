# 运维日历 — Claude Code 定期任务

> 自动化任务由 Remote Trigger 在云端执行（管理: https://claude.ai/code/scheduled）。
> 手动任务仍需在本地 session 中触发。

## 🤖 自动化（Remote Trigger — 云端执行）

| 频率         | 触发器名称                | 本地时间 | 包含的检查                                                                                                                |
| ------------ | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| 每周一       | `deep-dive-weekly-ops`    | ~8:57am  | `/weekly-api` · `/weekly-schema` · `/weekly-deps` · `/weekly-tracking` · `/weekly-wiring` · `/docs-sync`                  |
| 每月 1/15 日 | `deep-dive-biweekly-ops`  | ~9:03am  | `/biweekly-dataflow` · `/biweekly-dead-code` · `/biweekly-error-handling`                                                 |
| 每月 2 日    | `deep-dive-monthly-audit` | ~8:47am  | `/monthly-health-report` · `/monthly-security` · `/monthly-db-health` · `/monthly-ux-audit` · `/docs-audit` + memory 清理 |

> ⚠️ 远程 agent 无法访问本地 MCP (Neon/Sentry/Vercel)，涉及 DB 直连的检查可能受限。
> ⚠️ 冬令时 (11月→3月) 本地触发时间会晚 1 小时。

## 🖐️ 手动（需在本地 session 触发）

| 频率                     | 命令                      | 用途                        |
| ------------------------ | ------------------------- | --------------------------- |
| 每次 session 开始        | `/workflow status`        | 查看状态 + 智能调度逾期维护 |
| 每次 commit 前           | `/daily-diff`             | 审查未提交变更              |
| 每天结束（有代码变更时） | `/auto-health`            | 健康检查 + 自动修复 + 提交  |
| 每季度 / 里程碑后        | `/deep-audit` (推荐 Opus) | 全面 bug 审计               |
