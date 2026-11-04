-- ============================================================
-- Deep Dive — 数据库健康检查 SQL 脚本
-- 运行环境: Neon SQL Editor (直接粘贴)
-- 更新日期: 2026-04-13
-- 表总数: 40 (migration 001-070, CDSEResponse 已在 068 中删除)
-- ============================================================
-- 覆盖范围:
--   1.  表容量概览 (行数 + 磁盘占用)
--   1b. PageVisit / UserFunnel 增长趋势
--   2.  数据完整性: 已完成问卷无评分 (管道断裂)
--   3.  数据完整性: 有评分无报告 (报告生成失败)
--   4.  数据完整性: 有报告无参与度记录 (追踪失效)
--   5.  数据完整性: 有前测无后测 (用户放弃)
--   6.  性能: 索引使用率 (未使用索引)
--   7.  性能: 慢查询 (pg_stat_statements)
--   8.  清理候选: Bot 流量占比
--   9.  清理候选: 废弃问卷 (>30天)
--   10. 补充: 过期 Session 清理
--   11. 补充: 旅程状态一致性交叉校验
--   12. 补充: LLM 调用健康 (近 7 天)
--   13. 补充: JSONB 列大小抽查
--   14. 补充: Dead Tuple 热点 (VACUUM 候选)
--   15. 补充: AnalyticsError 趋势
--   16. 补充: 旅程状态漏斗分布
--   17. 补充: Action Hub 完成率
--   18. 补充: Stripe 购买分布
--   19. 补充: CoachMessage 阅读率
-- ============================================================


-- ============================================================
-- 1. 表容量概览 — 每个表的行数 + 磁盘占用
-- ============================================================
-- 关注: PageVisit > 100MB 或 UserFunnel > 50MB → 考虑归档/分区
-- 关注: ActionItem / LLMUsageLog / CoachMessage 随用户增长

SELECT
  relname AS "表名",
  n_live_tup AS "活跃行数",
  n_dead_tup AS "死元组数",
  CASE WHEN n_live_tup + n_dead_tup > 0
    THEN ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 1)
    ELSE 0
  END AS "死元组占比%",
  pg_size_pretty(pg_total_relation_size(quote_ident(relname))) AS "磁盘占用",
  pg_total_relation_size(quote_ident(relname)) AS "字节(排序用)"
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(quote_ident(relname)) DESC;


-- ============================================================
-- 1b. PageVisit 周增长趋势 (最近 12 周)
-- ============================================================
-- 用于判断是否需要归档策略或按月分区

SELECT
  date_trunc('week', "createdAt")::date AS "周起始",
  COUNT(*) AS "总访问",
  COUNT(*) FILTER (WHERE "isBot" = true) AS "Bot",
  COUNT(*) FILTER (WHERE "isInternal" = true) AS "内部",
  COUNT(*) FILTER (WHERE "isBot" = false AND "isInternal" = false) AS "真实外部",
  COUNT(DISTINCT "ipHash") AS "独立IP"
FROM "PageVisit"
GROUP BY date_trunc('week', "createdAt")
ORDER BY "周起始" DESC
LIMIT 12;


-- ============================================================
-- 1c. UserFunnel 周增长趋势 (最近 12 周)
-- ============================================================

SELECT
  date_trunc('week', "createdAt")::date AS "周起始",
  COUNT(*) AS "事件总数",
  COUNT(DISTINCT "userId") AS "独立用户",
  COUNT(DISTINCT "event") AS "事件类型数"
FROM "UserFunnel"
GROUP BY date_trunc('week', "createdAt")
ORDER BY "周起始" DESC
LIMIT 12;


-- ============================================================
-- 2. 数据完整性: 已完成问卷但无评分结果 (管道断裂)
-- ============================================================
-- 正常: 0 条。有记录 = /api/score 在某些情况下静默失败
-- 注意: 只查 Deep Dive (tier='deep'), Quick Dive 走独立管道

SELECT
  qs."id" AS "会话ID",
  qs."userId" AS "用户ID",
  qs."tier" AS "层级",
  qs."language" AS "语言",
  qs."completedAt" AS "完成时间",
  NOW() - qs."completedAt" AS "距今"
FROM "QuestionnaireSession" qs
LEFT JOIN "AssessmentResult" ar ON ar."sessionId" = qs."id"
WHERE qs."status" = 'completed'
  AND ar."id" IS NULL
ORDER BY qs."completedAt" DESC;


-- ============================================================
-- 3. 数据完整性: 有评分但无报告 (报告生成可能失败)
-- ============================================================
-- 刚完成评分尚未触发报告 = 正常 (看"距今"列)
-- 超过 1 小时仍无报告 = 报告生成超时或 LLM 调用全链路失败
-- 额外: 是否有对应 PersonalProfile (档案应先于报告)

SELECT
  ar."id" AS "评分ID",
  ar."userId" AS "用户ID",
  ar."version" AS "版本",
  ar."createdAt" AS "评分时间",
  NOW() - ar."createdAt" AS "距今",
  CASE WHEN pp."id" IS NOT NULL THEN '有' ELSE '缺失' END AS "有档案?"
FROM "AssessmentResult" ar
LEFT JOIN "CareerReport" cr ON cr."assessmentId" = ar."id"
LEFT JOIN "PersonalProfile" pp ON pp."assessmentId" = ar."id"
WHERE cr."id" IS NULL
ORDER BY ar."createdAt" DESC;


-- ============================================================
-- 4. 数据完整性: 有报告但无参与度记录 (追踪失效)
-- ============================================================
-- 只看 24 小时前的报告 (新报告用户可能还没打开)
-- 超过 50% 的报告无 engagement = sendBeacon 或前端追踪有问题

SELECT
  cr."id" AS "报告ID",
  cr."userId" AS "用户ID",
  cr."createdAt" AS "生成时间",
  NOW() - cr."createdAt" AS "距今"
FROM "CareerReport" cr
LEFT JOIN "ReportEngagement" re ON re."reportId" = cr."id"
WHERE re."id" IS NULL
  AND cr."createdAt" < NOW() - INTERVAL '24 hours'
ORDER BY cr."createdAt" DESC;


-- ============================================================
-- 5. 数据完整性: 有前测(pre)但无后测 (用户放弃研究)
-- ============================================================
-- 研究数据完整性关键指标
-- pre 远多于 post = 用户对后测参与度低, 影响论文样本量

SELECT
  pre."userId" AS "用户ID",
  pre."createdAt" AS "前测时间",
  NOW() - pre."createdAt" AS "距今",
  pre."sccTotalScore" AS "SCC前测分",
  pre."cdseTotalScore" AS "CDSE前测分",
  u."journeyState" AS "旅程状态",
  u."researchGroup" AS "研究组"
FROM "PrePostAssessment" pre
LEFT JOIN "PrePostAssessment" post
  ON post."userId" = pre."userId"
  AND post."assessmentType" IN ('post_immediate', 'post_1week')
LEFT JOIN "User" u ON u."id" = pre."userId"
WHERE pre."assessmentType" = 'pre'
  AND post."id" IS NULL
ORDER BY pre."createdAt" DESC;


-- ============================================================
-- 6. 性能: 索引使用率 — 标记从未使用的索引
-- ============================================================
-- idx_scan = 0 = 从未被查询命中, 浪费写入性能和磁盘
-- 排除主键 (_pkey) — 它们保证数据完整性, 即使不查也必须保留
-- 注意: Neon 重启后统计重置, 至少运行 7 天后再判断

SELECT
  schemaname AS "模式",
  relname AS "表名",
  indexrelname AS "索引名",
  idx_scan AS "扫描次数",
  pg_size_pretty(pg_relation_size(indexrelid)) AS "索引大小",
  CASE
    WHEN idx_scan = 0 THEN '从未使用'
    WHEN idx_scan < 10 THEN '低使用率'
    ELSE '正常'
  END AS "状态"
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;


-- ============================================================
-- 7. 性能: 慢查询 (pg_stat_statements)
-- ============================================================
-- Neon 可能未启用此扩展, 出错跳过即可
-- 替代: 用 7b 的顺序扫描热点 + 死元组检测

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
  ) THEN
    RAISE NOTICE 'pg_stat_statements 已启用 — 请取消注释下方查询单独运行';
  ELSE
    RAISE NOTICE 'pg_stat_statements 未启用 — 跳过慢查询, 使用 7b 替代指标';
  END IF;
END $$;

-- 如果扩展可用, 取消注释:
-- SELECT
--   LEFT(query, 120) AS "查询片段",
--   calls AS "调用次数",
--   ROUND(total_exec_time::numeric, 2) AS "总耗时ms",
--   ROUND(mean_exec_time::numeric, 2) AS "平均耗时ms",
--   ROUND(max_exec_time::numeric, 2) AS "最大耗时ms",
--   rows AS "返回行数"
-- FROM pg_stat_statements
-- WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;


-- 7b. 替代指标: 大表顺序扫描热点 (可能缺少合适索引)
SELECT
  relname AS "表名",
  seq_scan AS "顺序扫描次数",
  seq_tup_read AS "顺序读行数",
  idx_scan AS "索引扫描次数",
  CASE WHEN (seq_scan + idx_scan) > 0
    THEN ROUND(100.0 * seq_scan / (seq_scan + idx_scan), 1)
    ELSE 0
  END AS "顺序扫描占比%",
  n_live_tup AS "行数"
FROM pg_stat_user_tables
WHERE n_live_tup > 100
ORDER BY seq_scan DESC
LIMIT 15;


-- ============================================================
-- 8. 清理候选: Bot 流量占比
-- ============================================================
-- 全量 vs 近 7 天对比, 发现趋势变化
-- bot_pct > 30% → 建议: DELETE FROM "PageVisit"
--   WHERE "isBot" = true AND "createdAt" < NOW() - INTERVAL '90 days'

SELECT
  'all_time' AS "时段",
  COUNT(*) AS "总访问",
  COUNT(*) FILTER (WHERE "isBot" = true) AS "Bot",
  COUNT(*) FILTER (WHERE "isBot" = false OR "isBot" IS NULL) AS "真实",
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "isBot" = true) / NULLIF(COUNT(*), 0), 1
  ) AS "Bot占比%"
FROM "PageVisit"

UNION ALL

SELECT
  'last_7d',
  COUNT(*),
  COUNT(*) FILTER (WHERE "isBot" = true),
  COUNT(*) FILTER (WHERE "isBot" = false OR "isBot" IS NULL),
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "isBot" = true) / NULLIF(COUNT(*), 0), 1
  )
FROM "PageVisit"
WHERE "createdAt" > NOW() - INTERVAL '7 days';


-- ============================================================
-- 9. 清理候选: 废弃问卷 (>30天)
-- ============================================================
-- status='abandoned' 且超过 30 天 → 可安全删除
-- 先查看数量, 确认后取消注释 DELETE

SELECT
  COUNT(*) AS "可清理数量",
  COUNT(*) FILTER (WHERE "userId" IS NULL) AS "其中匿名",
  COUNT(*) FILTER (WHERE "userId" IS NOT NULL) AS "其中注册",
  MIN("lastActiveAt") AS "最早活跃",
  MAX("lastActiveAt") AS "最近活跃"
FROM "QuestionnaireSession"
WHERE "status" = 'abandoned'
  AND "updatedAt" < NOW() - INTERVAL '30 days';

-- 确认后执行清理:
-- DELETE FROM "QuestionnaireSession"
-- WHERE "status" = 'abandoned'
--   AND "updatedAt" < NOW() - INTERVAL '90 days';


-- ============================================================
-- 10. 补充: 过期 UserSession 清理
-- ============================================================
-- 已过期的 session 不影响功能, 可安全删除

SELECT
  COUNT(*) AS "过期会话数",
  MIN("expiresAt") AS "最早过期",
  MAX("expiresAt") AS "最近过期"
FROM "UserSession"
WHERE "expiresAt" < NOW();

-- 确认后执行清理:
-- DELETE FROM "UserSession" WHERE "expiresAt" < NOW();


-- ============================================================
-- 11. 补充: 旅程状态一致性交叉校验
-- ============================================================
-- 正常: 全部 0。非 0 = 状态机 bug 或数据不一致

SELECT '状态声称 report_generated/coaching_unlocked 但无报告' AS "检查项",
  COUNT(*) AS "不一致数量"
FROM "User" u
WHERE u."journeyState" IN ('report_generated', 'coaching_unlocked')
  AND NOT EXISTS (
    SELECT 1 FROM "CareerReport" cr WHERE cr."userId" = u."id"
  )

UNION ALL

SELECT '状态声称 coaching_unlocked 但无教练会话',
  COUNT(*)
FROM "User" u
WHERE u."journeyState" = 'coaching_unlocked'
  AND NOT EXISTS (
    SELECT 1 FROM "CoachingSession" cs WHERE cs."userId" = u."id"
  )

UNION ALL

SELECT '有报告但状态低于 report_generated',
  COUNT(*)
FROM "User" u
WHERE u."journeyState" IN ('not_started', 'quick_dive_complete', 'deep_dive_complete', 'profile_generated')
  AND EXISTS (
    SELECT 1 FROM "CareerReport" cr WHERE cr."userId" = u."id"
  )

UNION ALL

SELECT '状态是 not_started 但有已完成问卷',
  COUNT(*)
FROM "User" u
WHERE u."journeyState" = 'not_started'
  AND EXISTS (
    SELECT 1 FROM "QuestionnaireSession" qs
    WHERE qs."userId" = u."id" AND qs."status" = 'completed'
  );


-- ============================================================
-- 12. 补充: LLM 调用健康 (近 7 天, 仅生产环境)
-- ============================================================
-- success_rate < 95% 的 task+provider 需要立即调查
-- degraded > 0 = 降级到备用 provider (参考 llm-provider-failover.md)

SELECT
  "taskName" AS "任务",
  "provider" AS "提供商",
  COUNT(*) AS "总调用",
  COUNT(*) FILTER (WHERE "success" = true) AS "成功",
  COUNT(*) FILTER (WHERE "success" = false) AS "失败",
  ROUND(100.0 * COUNT(*) FILTER (WHERE "success" = true) / NULLIF(COUNT(*), 0), 1) AS "成功率%",
  COUNT(*) FILTER (WHERE "degraded" = true) AS "降级",
  ROUND(AVG("latencyMs")) AS "平均延迟ms",
  MAX("latencyMs") AS "最大延迟ms",
  SUM(COALESCE("inputTokens", 0) + COALESCE("outputTokens", 0)) AS "Token总量"
FROM "LLMUsageLog"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
  AND "environment" = 'production'
GROUP BY "taskName", "provider"
ORDER BY "成功率%" ASC, "总调用" DESC;


-- ============================================================
-- 13. 补充: JSONB 列大小抽查 (防止膨胀)
-- ============================================================
-- max > 1MB 的列需要关注, 考虑归档或压缩

SELECT 'CareerReport.reportJson' AS "列",
  COUNT(*) AS "行数",
  ROUND(AVG(pg_column_size("reportJson"))) AS "平均字节",
  MAX(pg_column_size("reportJson")) AS "最大字节",
  pg_size_pretty(MAX(pg_column_size("reportJson"))::bigint) AS "最大(可读)"
FROM "CareerReport"

UNION ALL

SELECT 'PersonalProfile.profileJson',
  COUNT(*),
  ROUND(AVG(pg_column_size("profileJson"))),
  MAX(pg_column_size("profileJson")),
  pg_size_pretty(MAX(pg_column_size("profileJson"))::bigint)
FROM "PersonalProfile"

UNION ALL

SELECT 'AssessmentResult.resultJson',
  COUNT(*),
  ROUND(AVG(pg_column_size("resultJson"))),
  MAX(pg_column_size("resultJson")),
  pg_size_pretty(MAX(pg_column_size("resultJson"))::bigint)
FROM "AssessmentResult"

UNION ALL

SELECT 'CoachingSession.messagesJson',
  COUNT(*),
  ROUND(AVG(pg_column_size("messagesJson"))),
  MAX(pg_column_size("messagesJson")),
  pg_size_pretty(MAX(pg_column_size("messagesJson"))::bigint)
FROM "CoachingSession"

UNION ALL

SELECT 'QuestionnaireSession.answersJson',
  COUNT(*),
  ROUND(AVG(pg_column_size("answersJson"))),
  MAX(pg_column_size("answersJson")),
  pg_size_pretty(MAX(pg_column_size("answersJson"))::bigint)
FROM "QuestionnaireSession"

UNION ALL

SELECT 'CoachMessage.content',
  COUNT(*),
  ROUND(AVG(pg_column_size("content"))),
  MAX(pg_column_size("content")),
  pg_size_pretty(MAX(pg_column_size("content"))::bigint)
FROM "CoachMessage"

ORDER BY "最大字节" DESC NULLS LAST;


-- ============================================================
-- 14. 补充: Dead Tuple 热点 (VACUUM 候选)
-- ============================================================
-- 死元组占比 > 20% 且绝对数量 > 1000 → 手动 VACUUM ANALYZE

SELECT
  relname AS "表名",
  n_live_tup AS "活跃行",
  n_dead_tup AS "死元组",
  ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS "占比%",
  last_vacuum AS "上次VACUUM",
  last_autovacuum AS "上次自动VACUUM",
  last_analyze AS "上次ANALYZE",
  CASE
    WHEN n_dead_tup > 1000 AND 100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0) > 20
    THEN '建议: VACUUM ANALYZE "' || relname || '"'
    ELSE '正常'
  END AS "建议"
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY n_dead_tup DESC
LIMIT 10;


-- ============================================================
-- 15. 补充: AnalyticsError 趋势 (近 7 天 vs 前 7 天)
-- ============================================================
-- 错误数上升 = 需要调查对应 layer 的代码

SELECT
  'last_7d' AS "时段",
  "layer" AS "层级",
  COUNT(*) AS "错误数"
FROM "AnalyticsError"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "layer"

UNION ALL

SELECT
  'prev_7d',
  "layer",
  COUNT(*)
FROM "AnalyticsError"
WHERE "createdAt" BETWEEN NOW() - INTERVAL '14 days' AND NOW() - INTERVAL '7 days'
GROUP BY "layer"

ORDER BY "时段", "错误数" DESC;


-- ============================================================
-- 16. 补充: 用户旅程状态漏斗分布
-- ============================================================
-- 大量用户卡在某个状态 = UX 障碍或 API 故障
-- 正常漏斗: not_started → quick_dive → deep_dive → profile → report → coaching

SELECT
  "journeyState" AS "旅程状态",
  COUNT(*) AS "用户数",
  ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER(), 0), 1) AS "占比%"
FROM "User"
GROUP BY "journeyState"
ORDER BY
  CASE "journeyState"
    WHEN 'not_started' THEN 1
    WHEN 'quick_dive_complete' THEN 2
    WHEN 'deep_dive_complete' THEN 3
    WHEN 'profile_generated' THEN 4
    WHEN 'report_generated' THEN 5
    WHEN 'coaching_unlocked' THEN 6
  END;


-- ============================================================
-- 17. 补充: Action Hub 完成率
-- ============================================================

SELECT
  ap."status" AS "计划状态",
  COUNT(DISTINCT ap."id") AS "计划数",
  COUNT(ai."id") AS "行动项总数",
  COUNT(ai."id") FILTER (WHERE ai."status" = 'completed') AS "已完成",
  COUNT(ai."id") FILTER (WHERE ai."status" = 'skipped') AS "已跳过",
  ROUND(
    100.0 * COUNT(ai."id") FILTER (WHERE ai."status" = 'completed')
    / NULLIF(COUNT(ai."id"), 0), 1
  ) AS "完成率%"
FROM "ActionPlan" ap
LEFT JOIN "ActionItem" ai ON ai."planId" = ap."id"
GROUP BY ap."status"
ORDER BY "计划数" DESC;


-- ============================================================
-- 18. 补充: Stripe 购买分布
-- ============================================================
-- refunded 占比 > 5% 需要调查

SELECT
  "tier" AS "层级",
  "status" AS "状态",
  COUNT(*) AS "订单数",
  SUM("amountCents") / 100.0 AS "总收入",
  "currency" AS "币种"
FROM "UserPurchase"
GROUP BY "tier", "status", "currency"
ORDER BY "tier", "状态";


-- ============================================================
-- 19. 补充: CoachMessage 阅读率
-- ============================================================
-- 未读堆积过多 = 推送可能失效或用户不关注消息入口

SELECT
  "type" AS "消息类型",
  COUNT(*) AS "总数",
  COUNT(*) FILTER (WHERE "isRead" = true) AS "已读",
  COUNT(*) FILTER (WHERE "isRead" = false) AS "未读",
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE "isRead" = true) / NULLIF(COUNT(*), 0), 1
  ) AS "阅读率%"
FROM "CoachMessage"
GROUP BY "type"
ORDER BY "总数" DESC;


-- ============================================================
-- 健康检查完成
-- ============================================================
SELECT '数据库健康检查完成 — 2026-04-13' AS "状态";
