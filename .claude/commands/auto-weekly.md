---
disable-model-invocation: true
---

# Auto Weekly — 一键执行所有周度运维任务 + 自动修复 + 提交

> 整合了 weekly-api、weekly-schema、weekly-deps、weekly-tracking、weekly-wiring、docs-sync + 自动修复。
> 一个命令完成你运维日历里所有周任务。

Read CLAUDE.md first — especially 变更影响矩阵.

## Part 1: API 合规检查 (weekly-api)

1. 扫描 `app/api/` 下所有 `route.ts`
2. 检查每个 endpoint 是否有:
   - Zod input validation（引用 `lib/validation/api-schemas.ts`）
   - `guardRoute()` 权限保护
   - try/catch 错误处理
   - 正确的 HTTP status codes
3. 记录不合规的 endpoint

## Part 2: Schema 一致性 (weekly-schema)

1. 以 `scripts/schema.sql` 为权威 DDL,检查 `scripts/migrations/` 下最新迁移是否已反映在 schema.sql
2. 检查所有 `lib/db/*.ts` 模块的 SQL 查询是否引用了 schema 中存在的表和列
3. 检查 `lib/types/` 中的类型定义是否与 schema 匹配
4. 记录不一致项

## Part 3: 依赖安全 (weekly-deps)

1. Run `npm audit 2>&1` — 记录漏洞
2. 检查 `package.json` 中是否有大版本落后的关键依赖（next, react, zod, zustand）
3. 检查是否有 `package.json` 中声明但代码中未引用的依赖
4. 记录发现

## Part 4: 追踪完整性 (weekly-tracking)

1. 检查 `lib/types/platform.ts` 中 FunnelEvent 类型的所有事件
2. 搜索代码确认每个事件至少有一个触发点
3. 检查是否有硬编码的事件名（未使用类型定义）
4. 记录问题

## Part 5: 数据→UI 接线审计 (weekly-wiring)

1. 检查 Quick Dive / Profile / Report 三条链路的引擎输出字段是否都有 UI 消费方
2. 扫描条件门控 (`isReportView &&` 等) — 确认隐藏内容都有明确理由
3. 检查 i18n 幽灵引用 — 代码中 `t.xxx` 引用但字典缺失的 key
4. 检查关键组件的 prop passthrough 完整性
5. 记录所有断层

## Part 6: 文档同步检查 (docs-sync)

1. 对每个 `docs/architecture/*.md` 和 `docs/database/*.md`，读取 frontmatter `sources:`
2. 用 `git log -1 --format=%ci <source-file>` 获取源文件最后修改时间
3. 对比 `docs/_sync/last-verified.json` 中的验证时间
4. 检查 `CLAUDE.md` 关键文件引用表中的路径是否存在
5. 更新 `docs/_sync/drift-report.md` 和 `docs/_sync/last-verified.json`
6. 记录漂移文档

## Part 7: 自动修复（安全项目）

可自动修复的：

- ✅ 缺少的 Zod schema → 生成基础 schema
- ✅ Unused dependencies → 从 package.json 移除
- ✅ `npm audit fix`（仅 non-breaking）
- ✅ 简单的 schema 不一致（类型定义更新）

不自动修复的（仅报告）：

- ⛔ 缺少 guardRoute（涉及权限设计）
- ⛔ 大版本升级（可能有 breaking changes）
- ⛔ Schema 变更（需要 migration）
- ⛔ 冻结区域相关的任何问题

## Part 8: 验证 + 提交

```bash
npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n
```

如果有修改且全部通过：

```bash
git add -A
git commit -m "chore: weekly ops — API/schema/deps/tracking audit [日期]

[逐条列出修复内容]

All checks passed: tsc ✓ vitest ✓ eslint ✓ i18n ✓
Auto-committed by Claude Code"
git push
```

## Part 9: 周报

```
📊 Weekly Ops 报告 [日期]
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔌 API 合规 (X/Y endpoints)
  ✅ 合规: X 个
  ⚠️ 缺 Zod validation: [列表]
  ⚠️ 缺 guardRoute: [列表]

🗄️ Schema 一致性
  ✅ 一致: X 表
  ⚠️ 不一致: [列表]

📦 依赖安全
  ✅ 无漏洞 / ⚠️ X 个漏洞 (X critical, X high)
  📋 未使用依赖: [列表]

📈 追踪完整性
  ✅ X/Y 事件有触发点
  ⚠️ 未触发事件: [列表]

🔌 数据→UI 接线
  ✅ X/Y 引擎字段有 UI 消费方
  ⚠️ 断层: [列表]
  🚪 可疑门控: [列表]

━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 已自动修复: X 项
🟡 需手动处理: X 项
提交: [commit hash / 无变更]
```
