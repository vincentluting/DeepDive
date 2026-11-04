---
disable-model-invocation: true
---

# Auto Health — 全自动健康检查 + 修复 + 提交

> 合并了 daily-health 的检查能力 + auto-fix 的自动修复能力。
> 一个命令搞定：检查 → 发现问题 → 修复 → 验证 → 提交。

Read CLAUDE.md first.

## Phase 1: 全面体检

按顺序执行，收集所有结果：

1. **构建检查**: `npm run build 2>&1` — 记录 errors 和 warnings
2. **类型检查**: `npx tsc --noEmit 2>&1` — 记录类型错误
3. **测试**: `npm run test 2>&1` — 记录失败用例
4. **Lint**: `npm run lint 2>&1` — 记录 errors（warnings 仅统计数量）
5. **i18n**: `npm run lint:i18n 2>&1` — 记录 en/zh 不一致
6. **代码卫生**:
   - 搜索新增的 `console.log` debug 残留（排除有意的错误处理日志）
   - 搜索新增的 `: any` / `as any` / `@ts-ignore`
   - 搜索新增的 `TODO` / `FIXME`（仅报告）

## Phase 2: 分类

把发现的问题分成三类：
- 🟢 **可自动修复**: 类型错误、lint errors、i18n 缺失键值、debug console.log、unused imports
- 🟡 **需确认**: 涉及冻结区域的问题、函数签名变更、测试逻辑错误
- 🔴 **无法自动修复**: 构建错误中的复杂逻辑问题、需要产品判断的问题

## Phase 3: 自动修复（仅 🟢 类）

对每个可安全修复的问题：
1. 最小化修复，不做额外重构
2. i18n 问题确保 en.json 和 zh.json 同步
3. 遵守变更影响矩阵

## Phase 4: 验证

```bash
npx tsc --noEmit && npm run test && npm run lint && npm run lint:i18n
```

- 全部通过且有修改 → Phase 5
- 全部通过但无修改（原本就健康）→ 直接输出报告，跳过提交
- 失败 → 回到 Phase 3 继续修，最多重试 3 轮
- 3 轮后仍有失败 → 回滚 (`git checkout .`)，输出失败报告

## Phase 5: 自动提交（仅有修改时）

```bash
git add -A
git commit -m "fix: auto-health check and fix [日期]

[逐条列出修复内容]

All checks passed: build ✓ tsc ✓ vitest ✓ eslint ✓ i18n ✓
Auto-committed by Claude Code"
git push
```

## Phase 6: 输出报告

```
🏥 Auto-Health 报告 [日期]
━━━━━━━━━━━━━━━━━━━━━━━━━━
构建:    [✅ PASS / ❌ FAIL]
类型:    [✅ 0 errors / ❌ X errors]
测试:    [✅ X passed / ❌ X failed]
Lint:    [✅ 0 errors / ⚠️ X warnings]
i18n:    [✅ 同步 / ❌ X 不一致]
卫生:    [✅ 干净 / ⚠️ X debug logs]
━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 已自动修复: X 个
🟡 需你确认:   X 个
🔴 需手动处理: X 个
━━━━━━━━━━━━━━━━━━━━━━━━━━
[如有 🟡/🔴 类问题，逐条列出具体内容]
```
