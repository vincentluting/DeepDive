# Prompt: Create /create-pr Command

> 粘贴此 prompt 给 Claude Code 执行。预计耗时 ~5 分钟。

## 目标

创建 `.claude/commands/create-pr.md`，自动从当前分支的 git diff 生成 PR description 并创建 PR。

## 命令规格

### Phase 1: 收集变更信息

```bash
git log main..HEAD --oneline                    # 所有 commits
git diff main..HEAD --stat                       # 文件变更概览
git diff main..HEAD --name-only                  # 变更文件列表
```

### Phase 2: 分析变更

对变更文件列表执行：
1. 按变更影响矩阵（CLAUDE.md）标记涉及的系统区域
2. 检查是否触及冻结区域（如果是 → 在 PR 描述中标注 ⚠️）
3. 统计：新增文件数、修改文件数、删除文件数
4. 识别变更类型：feature / fix / refactor / docs / chore

### Phase 3: 生成 PR

使用 `gh pr create` 生成 PR:

```
## Summary
[1-3 句话概括变更目的]

## Changes
- [按系统区域分组的变更列表]

## Impact
- **Systems affected**: [从影响矩阵提取]
- **Frozen zones**: [None / ⚠️ 列出涉及的冻结区域]
- **i18n**: [是否涉及 / en+zh 已同步]

## Verification
- [ ] `npx tsc --noEmit` ✅
- [ ] `npm run test` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run lint:i18n` ✅
```

### Phase 4: 输出

输出 PR URL，以及变更摘要。

## 约束

- 如果 `gh` CLI 未安装或未认证，输出说明让用户手动操作
- PR title 不超过 70 字符
- 如果 diff 超过 500 行，建议拆分
