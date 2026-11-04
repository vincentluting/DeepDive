# /docs-audit — 文档完整性审计

> 月度全量文档盘点。检查文件清单、frontmatter 规范、覆盖率、术语一致性。

## Phase 1: 文件清单对齐

1. 扫描 `docs/` 下所有 `.md` 文件
2. 对比 `docs/INDEX.md` 的文件清单
3. 报告:
   - 文件系统中存在但 INDEX.md 未列出的文档
   - INDEX.md 列出但文件系统中不存在的文档
4. 如有差异 → 更新 `docs/INDEX.md`

## Phase 2: Frontmatter 规范检查

对每个 `docs/architecture/*.md` 和 `docs/database/*.md`:

1. 检查是否有 YAML frontmatter
2. 检查必填字段: `title`, `category`, `sources`, `last_verified`
3. 检查 `sources` 中列出的文件是否存在
4. 报告缺失或无效的 frontmatter

## Phase 3: 覆盖率分析

检查以下关键模块是否有对应文档:

- `lib/scoring/` → `docs/architecture/scoring-pipeline.md` ✅
- `lib/report-generation/` → `docs/architecture/report-generation.md` ✅
- `lib/coaching/` → `docs/architecture/coaching-system.md` ✅
- `lib/ai/` → `docs/architecture/ai-routing.md` + `llm-call-inventory.md` ✅
- `lib/analytics/` → `docs/architecture/analytics-architecture.md` ✅
- `lib/db/` → `docs/database/` ✅
- `lib/profile-generation/` → (检查是否有文档)
- `lib/journey/` → (检查是否有文档)
- `lib/cohort/` → (检查是否有文档)

报告未被文档覆盖的关键模块。

## Phase 4: 术语一致性扫描

在所有 `docs/**/*.md` 中搜索以下已废弃术语:

- `DDVQ-21` → 应为 `TwIVI`
- `87 题` / `87 items` → 应为 `86 题`
- `24 型` / `24-type` / `18 型` / `18-type` → 应为 `12 型`
- `Panel 3` → 应为 `career pathway`
- `archetypes-24` / `archetypes-18` → 应为 `archetypes-12`
- `Core/Blend/Bridge` → 应为 `Enhancement/Transcendence`

## Phase 5: 输出审计报告

```
## 文档审计报告 — YYYY-MM-DD

### 文件清单
- 总数: N 个文档
- INDEX.md 对齐: ✅ / ⚠️ N 个差异

### Frontmatter 规范
- 合规: N 个
- 缺失 frontmatter: N 个 (列出)
- 缺失 sources: N 个 (列出)

### 覆盖率
- 已覆盖模块: N/M
- 未覆盖: (列出)

### 术语一致性
- ✅ 无过时术语 / ❌ N 处需修正 (列出)

### 更新操作
- [已自动更新] INDEX.md 文件清单
- [需人工审查] (列出)
```

更新 `docs/_sync/drift-report.md` 和 `docs/_sync/last-verified.json`。
