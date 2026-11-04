---
disable-model-invocation: true
---

# Auto Cleanup — 自动清理代码库、验证、提交

> 全自动模式：清理完成且所有检查通过后，自动 commit + push，无需人工审核。
> 如果涉及冻结区域，跳过相关文件，不触碰。

Read CLAUDE.md first — especially 冻结区域 and 变更影响矩阵.

## Phase 1: 扫描

### 1.1 死代码扫描
- 扫描 `lib/` 中所有 `export function` / `export async function`，搜索整个项目的 import 引用
- 扫描 `components/` 中所有导出组件，检查是否有页面或其他组件引用
- 扫描 `lib/types/` 中所有 `export type` / `export interface`，检查引用
- 排除: `lib/db/index.ts` re-exports、`__tests__/` 目录中的引用

### 1.2 Debug 残留
- 搜索 `console.log` / `console.warn` / `console.error`
- 区分有意的错误处理日志（在 catch blocks、带 `[db]`/`[api]`/`[auth]` 前缀）和 debug 残留
- 只清理 debug 残留

### 1.3 Unused Imports
- 使用 `npm run lint` 输出中的 unused-vars warnings 定位

### 1.4 TODO/FIXME 盘点
- 列出所有 TODO/FIXME/HACK 注释，标注文件和行号（仅报告，不自动删除）

## Phase 2: 安全过滤

对所有发现的清理项：
- ⛔ 冻结区域文件 → 跳过，不触碰
- ⛔ 标记 `@deprecated` 但在 CLAUDE.md 中明确说"保留"的 → 跳过
- ⛔ 不确定是否死代码（只有 1 个引用，可能是动态调用）→ 跳过
- ✅ 确认零引用的死代码 → 删除
- ✅ Debug console.log → 删除
- ✅ Unused imports → 删除

## Phase 3: 执行清理

按以下顺序执行：
1. 删除 unused imports（最安全）
2. 删除 debug console.log
3. 删除确认的死代码（函数 → 类型 → 整文件）
4. 每删除一批后运行 `npx tsc --noEmit` 确认不影响编译

## Phase 4: 全量验证

```bash
npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n
```

- 全部通过 → Phase 5
- 失败 → 回滚本批修改，缩小清理范围重试
- 3 轮后仍失败 → `git checkout .`，输出报告，停止

## Phase 5: 自动提交

```bash
git add -A
git commit -m "chore: auto-cleanup — remove dead code and debug artifacts

Removed:
[逐条列出删除内容]

All checks passed: tsc ✓ vitest ✓ eslint ✓ i18n ✓
Auto-committed by Claude Code"
git push
```

## Phase 6: 输出报告

```
🧹 Auto-Cleanup 报告
━━━━━━━━━━━━━━━━━━━━
✅ 已清理:
  - 死代码: X 个函数 / X 个类型 / X 个文件（共 ~X 行）
  - Debug logs: X 处
  - Unused imports: X 处
🔒 跳过（冻结区域）: X 个
📋 TODO/FIXME 盘点: X 处（仅报告）
━━━━━━━━━━━━━━━━━━━━
验证: tsc ✓ | vitest ✓ | eslint ✓ | i18n ✓
提交: [commit hash]
```
