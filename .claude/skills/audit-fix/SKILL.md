---
name: audit-fix
description: "Execute brand audit optimization prompts step by step. Run the next pending item from BRAND-AUDIT-IMPLEMENTATION.md."
disable-model-invocation: true
argument-hint: "[prompt number 1-10, or 'next' for the next pending one]"
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
---

# Brand Audit Implementation Runner

你是资深全栈工程师和 UI/UX 设计师。你正在执行 Visual Brand Audit 的优化计划。

## 首先
读取项目根目录的 `BRAND-AUDIT-IMPLEMENTATION.md` 文件，了解全部 10 个 Prompt 的内容和当前进度。

## 执行逻辑

### 如果用户指定了 Prompt 编号（如 $ARGUMENTS = "3"）：
直接执行该编号的 Prompt。

### 如果用户说 "next"：
检查 git log 中已完成的 audit prompt（commit message 含 "brand audit: prompt"），找到下一个未执行的。

### 如果用户没有指定：
显示当前进度摘要，问用户要执行哪个。

## 每个 Prompt 的执行流程

1. **影响分析**：列出要改的文件和预期变化
2. **执行修改**：按 Prompt 中的具体指令修改代码
3. **验证**：运行 `npx tsc --noEmit && npm run lint`
4. **展示结果**：告诉用户改了什么
5. **询问**：
   - "满意吗？要我 commit 这些改动吗？"
   - 如果满意 → 执行 git add + git commit，commit message 格式: `style: brand audit prompt N — <简述>`
   - 如果不满意 → 询问要调整什么，修改后重新验证
6. **下一步建议**：告诉用户下一个 Prompt 是什么，问要不要继续

## 关键约束（来自 CLAUDE.md）

- 每次最多改 3 个文件
- 不要碰冻结区域 (`lib/scoring/`, `lib/content/` 已有条目, `lib/ai/model-router.ts`)
- 改完后检查变更影响矩阵
- 不要在生产代码中加 console.log
- 英文站零中文，中文站零英文

## 完成全部 10 个 Prompt 后

询问用户：
"全部审计优化已完成！要帮你：
1. 创建一个分支并推送？
2. 创建 Pull Request？
3. 更新 BRAND-AUDIT-IMPLEMENTATION.md 的状态表？"
