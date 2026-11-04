# Prerequisite Gate 政策

> 业务前置条件未满足时禁止 silent redirect，必须显式渲染 `PrerequisiteGate` 解释原因 + 指明下一步。
> 来源：2026-05-21 全站审计发现 13 处 silent redirect，其中 2 处严重（用户菜单点击后被静默踢回）。

## 何时必须用 Gate（不能 redirect）

只要满足以下任一条件，page.tsx 必须用 `<PrerequisiteGate>` 替换 `redirect()`：

- **业务前置条件未满足**：功能存在但需先完成 X（如 Action Hub 需要 Deep Dive 报告）
- **Entitlement 门控**：cohort 不在白名单 / opt-in 未开 / onboarding 未完
- **时间门控**：需等待 N 天才开放（post_assessment 1-week 等）
- **Pipeline failed**：异步管道终态失败，让用户能 retry

## 允许的 `redirect()` 白名单

只有以下场景允许保留 `redirect()`（且不需要注释）：

| 场景            | 目标                           | 原因                           |
| --------------- | ------------------------------ | ------------------------------ |
| 未鉴权          | `/login` / `/register`         | 必要的鉴权兜底，每个 page 都用 |
| Locale 规范化   | `/${defaultLocale}/...`        | 路径标准化                     |
| Legacy alias    | 旧 URL → 新 URL                | 兼容旧分享链接                 |
| Pipeline 进行中 | `/processing?pipelineId=...`   | 活跃异步任务的观察页           |
| Self-view 跳转  | 用户访问自己的某种"别人视角"页 | 进设置/列表更合理（注释说明）  |

ESLint 规则 `local/no-business-redirect-in-page` 会自动检查这些路径。

## 必须明确标注的 redirect

若以上白名单不覆盖你的情况，必须在 `redirect()` 上方添加注释：

```typescript
// gate-redirect-ok: 自我档案不应在公开详情页编辑，回到 Settings 才能改
if (targetId === viewer.id) redirect(`/${locale}/settings`);
```

注释格式：`// gate-redirect-ok: <一句话 reason>`，ESLint 会检测并放行。

## Gate 必须有

每个新增 Gate 配置（在 `lib/journey/prerequisite-gates.ts`）必须满足：

- ✅ `requiredState` 明确（journey FSM state 或 null=非旅程）
- ✅ `steps` 显示 5 步进度可视化
- ✅ `blockedStepKey` 指明阻塞步骤（用于进度条高亮）
- ✅ `primaryCta` 给用户明确的下一步路径
- ✅ `i18nNamespace` 对应 `lib/i18n/dictionaries/<locale>/journeyGate.json` 一个 sub-object
- ✅ `surface` 选择（sanctuary / revelation / utility）
- ✅ 全 11 语言 i18n 同步（en 完整 + zh 完整 + 9 个 fallback 占位）
- ✅ 单测覆盖（至少配置完整性 + 渲染 smoke test）

## 不要做

- ❌ **不要用 `userLevel` 做细粒度门控** — `userLevel >= 2` 只到 `profile_generated`，不等于 `report_generated`。改用 `deriveUnlocked(state).<feature>`。
- ❌ **不要 3 秒 banner 提示** — Banner 会消失，用户无法回看；用 Gate。
- ❌ **不要把 Settings 当万能跳转黑洞** — Settings 是 onboarding，不是错误兜底。
- ❌ **不要暴露 report/profile 存在性** — 防枚举攻击，Gate 文案不说"你的报告 ID 是 X"。
- ❌ **不要复用 AssessmentCard 整张卡** — 它是 explore 业务专用，只共享 surface token。
- ❌ **不要先 fetch heavy data 再 gate 判断** — 反过来，节省查询。

## 添加新 Gate 的步骤

1. 在 `lib/journey/prerequisite-gates.ts`:
   - 添加 `GateFeature` 联合类型字面量
   - 添加 `GATE_CONFIG` 条目
2. 在 `lib/i18n/dictionaries/en/journeyGate.json` + `zh/journeyGate.json` 添加对应 namespace 文案
3. 复制到其他 9 个 locale（`for loc in nl de fr es pt it ru ja ko; do cp en/journeyGate.json $loc/`）
4. 在 page.tsx 用 `resolveGateCopy()` + `<PrerequisiteGate>` 替换 `redirect()`
5. 跑 `npx tsc --noEmit && npm run lint && npm run lint:i18n` 验证
6. 写一个 unit test（参考 `components/journey/__tests__/prerequisite-gate.test.tsx`）

## 长期演进

- `funnel_events` 新增了 `prerequisite_gate_displayed` — 每次显示 Gate 都是一次"用户想用但被挡住"，对产品决策极有价值。后续可在 admin dashboard 加 panel 看哪些 gate 触发最多 → 排优化优先级。
- Stale UserContext recovery (`lib/journey/get-authoritative-report.ts`) 这种模式可以推广到其他 cached IDs（latestProfileId、lastCoachingSession 等）。
- 当我们有 5+ 个 Gate 时，考虑把 funnel event 的 `feature` 维度做成 enum，便于 dashboard 统计。
