# /docs-sync — 文档同步检查

> 检测 `docs/` 文档与源代码的漂移。挂入 `/auto-weekly` 周度流程。

## Phase 1: Frontmatter 源漂移检测

对每个 `docs/architecture/*.md` 和 `docs/database/*.md`:
1. 读取 frontmatter 的 `sources:` 字段
2. 用 `git log -1 --format=%ci <source-file>` 获取源文件最后修改时间
3. 对比 `docs/_sync/last-verified.json` 中的验证时间
4. 如果源文件比文档新 → 标记为 ⚠️ 漂移

## Phase 2: 引用完整性检查

1. 扫描所有 `docs/**/*.md` 文件中的路径引用 (反引号中的文件路径)
2. 检查被引用的文件是否存在
3. 报告断裂引用

## Phase 3: CLAUDE.md 索引验证

1. 读取 `CLAUDE.md` 的「关键文件引用」表
2. 检查每个路径是否存在
3. 报告失效引用

## Phase 4: 更新元数据

1. 更新 `docs/_sync/drift-report.md` — 记录本次检查结果
2. 对已确认无漂移的文档，更新 `docs/_sync/last-verified.json` 时间戳
3. 输出摘要:
   - ✅ N 个文档无漂移
   - ⚠️ N 个文档可能漂移 (列出文件名 + 变更的源文件)
   - ❌ N 个引用断裂 (列出具体位置)

## 输出格式

```
## 文档同步报告 — YYYY-MM-DD

### 漂移检测
✅ 无漂移: 20 个文档
⚠️ 可能漂移: 3 个文档
  - docs/architecture/report-generation.md — lib/report-generation/index.ts 变更于 03-18
  - ...

### 引用完整性
✅ 所有引用有效 / ❌ N 个引用断裂

### 建议操作
- [ ] 审查 report-generation.md 是否需要更新
- [ ] ...
```
