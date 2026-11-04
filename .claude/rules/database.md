---
globs: lib/db/**, scripts/**, app/api/**/route.ts
---

# 数据库开发规则

- `scripts/schema.sql` = DDL 唯一来源 (55 表, 迁移 001-105)
- 变更必须同步: `schema.sql` + 新建 `scripts/migrations/NNN_*.sql` 文件
- 变更 `schema.sql` 后 **必须跑 `npm run db:generate-types`** 刷新 `lib/db/schema-generated.ts`,否则 `schema-generated-drift` 测试会失败
- 写 DB 查询时优先从 `lib/db/schema-generated.ts` import `DbXxx` 行类型,避免手写 interface + `as unknown as T` 模式
- (2026-04-08) `lib/db/schema-init.ts` 的 `initTables()` 已删除 —— 它是未使用的 DDL 复制,不再是同步目标
- 新增 DB 表 → 同时创建 `lib/db/` 模块 + `lib/types/` 类型定义
- API route 必须使用 `guardRoute(request, { tier })` + `withLogging` 模式
- 所有 API 输入使用 `lib/validation/api-schemas.ts` 的 Zod schema 验证
- 不要直接导入 `openai-client` 或 `anthropic-client`（必须通过 `model-router`）

## 迁移落库纪律（2026-06-15 起 — 源于 ActionItem 迁移 105 漏跑导致行动计划全挂）

- **迁移自动落库**：push 到 `main` 后,CI 的 `migrate` job(`.github/workflows/ci.yml`)会跑 `npm run db:migrate`。提交了迁移 = 部署后自动应用,不要再靠人手动跑。
- **漂移闸门**：`migrate` job 在 `db:migrate` **之后**跑 `npm run db:migrate:check`(验证库已追平,0 pending);若 migrate 部分失败 → CI 变红。运行时可查 `GET /api/health/db`(Bearer `HEALTH_CHECK_SECRET`)。⚠️ 不要把 `db:migrate:check` 放到 `migrate` 之前的 job(如 test)当门槛 —— 新增迁移在应用前本就是 pending,会把 migrate 自己锁死。
- **⚠️ 自动迁移只对增量式安全**:`ADD COLUMN`(nullable / 带 default)、`CREATE TABLE/INDEX IF NOT EXISTS` —— 旧代码忽略新结构,迁移先于部署落库无害。
- **⛔ 破坏性变更必须 expand-contract 两步发布**,不能直接挂自动迁移:
  1. Expand:先发"加新列/新表 + 双写/兼容读"的代码并落库;
  2. (等旧代码全部下线后)Contract:下一次发布再 `DROP COLUMN` / 改约束。
     把 `DROP`/`RENAME`/收紧 `NOT NULL` 和它依赖的代码塞进同一次发布,自动迁移会和旧实例打架。
- 所有迁移写成幂等(`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`),CI 重复跑才安全。
- **⛔ 不要把"还没准备好应用"的迁移合进 `main`** —— CI 会自动应用它。WIP / 未定稿的迁移留在 feature 分支,定稿再合。(这正是 2026-06-11 漂移的成因:迁移进了仓库但"属进行中改动"未应用,半年后撞 bug。)
- **改名/重排迁移文件后必同步 `_migrations`**:文件重命名后,生产库 `_migrations` 里的旧名行不会自动更新 → 漂移闸门会把它误报成 pending。改名时一并 `UPDATE "_migrations" SET filename=新名 WHERE filename=旧名`(精确 WHERE),否则别改文件名。
