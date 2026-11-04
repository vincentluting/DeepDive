# /qa — 全栈测试统一入口

> 一个命令覆盖所有测试维度：类型检查、单元测试、E2E、API 管道、覆盖缺口分析。
> 所有输出使用中文。

## 触发条件

用户说 "qa"、"测试一下"、"跑个 QA"、"检查页面"、"浏览器测试"、"跑测试"、"test" 时激活。

## 可用工具

Bash, Read, Write, Edit, Glob, Grep, Agent

## 模式总览

| 模式          | 命令                                 | 做什么                                             | 预估耗时  |
| ------------- | ------------------------------------ | -------------------------------------------------- | --------- |
| **快速冒烟**  | `/qa quick`                          | tsc + vitest + lint + i18n lint                    | ~30s      |
| **差异感知**  | `/qa` (默认)                         | 分析 git diff → 只跑受影响的 unit + e2e + 类型检查 | ~2-5min   |
| **完整扫描**  | `/qa full`                           | 全部 vitest + 全部 playwright + API 健康检查       | ~10-15min |
| **API 管道**  | `/qa api`                            | 逐个验证关键 API route (非 LLM 依赖)               | ~3-5min   |
| **回归对比**  | `/qa regression`                     | 与上次基线 JSON 对比，追踪新增/修复问题            | ~5-10min  |
| **覆盖缺口**  | `/qa gaps`                           | 分析覆盖率，找出无测试的 API route/组件，生成建议  | ~1min     |
| **浏览器 QA** | `/qa browser` 或 `/qa browser <URL>` | Playwright 交互式页面测试 + 截图验证               | ~5-15min  |
| **Preview**   | `/qa preview` 或 `/qa preview <URL>` | Claude Preview 内置浏览器实时视觉验证              | ~1-5min   |

---

## 阶段 0 — 环境检查 (所有模式共用)

```bash
# 1. 检查 TypeScript 编译
npx tsc --noEmit 2>&1 | tail -20

# 2. 检查 dev server (仅 E2E/browser 模式需要)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# 3. 检查工作区状态
git status --porcelain | head -20
```

如果 tsc 失败 → 先报告类型错误，询问是否继续。
如果 dev server 未运行且需要 E2E → 提示用户 `npm run dev`。

---

## 模式 1 — 快速冒烟 (`/qa quick`)

> 最快验证：代码能编译、测试能通过、lint 无错。适合提交前快速检查。

按顺序执行，任一步失败立即报告：

```bash
# Step 1: 类型检查
npx tsc --noEmit

# Step 2: 单元测试
npm run test

# Step 3: ESLint
npm run lint

# Step 4: i18n 一致性
npm run lint:i18n
```

**输出格式：**

```
✅ tsc — 0 错误
✅ vitest — 57 文件, 312 测试全部通过
✅ lint — 0 错误
✅ i18n — en/zh 键一致

🟢 快速冒烟通过 — 可以安全提交
```

或：

```
✅ tsc — 0 错误
❌ vitest — 2 个测试失败 (详见下方)
⏭️ lint — 跳过 (vitest 失败)
⏭️ i18n — 跳过

🔴 快速冒烟失败 — 需要修复后重试
```

---

## 模式 2 — 差异感知 (`/qa` 默认)

> 智能检测改动范围，只跑受影响的测试。日常开发最常用。

### Step 1: 分析改动范围

```bash
# 未提交的改动
git diff --name-only HEAD
git diff --name-only --cached

# 如果在 feature 分支，也看与 main 的差异
git diff --name-only main...HEAD 2>/dev/null
```

### Step 2: 影响映射

根据改动文件，映射到需要运行的测试：

| 改动文件模式                      | 触发的测试                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `lib/scoring/**`                  | `lib/scoring/__tests__/**` + `lib/report-generation/__tests__/**` + `lib/profile-generation/__tests__/**` |
| `lib/report-generation/**`        | `lib/report-generation/__tests__/**` + `e2e/report-rendering.spec.ts`                                     |
| `lib/profile-generation/**`       | `lib/profile-generation/__tests__/**`                                                                     |
| `lib/coaching/**`                 | `lib/coaching/__tests__/**` + `e2e/coaching-flow.spec.ts`                                                 |
| `lib/auth/**`                     | `lib/auth/__tests__/**` + `e2e/auth-redirects.spec.ts`                                                    |
| `lib/validation/**`               | `lib/validation/__tests__/**`                                                                             |
| `lib/analytics/**`                | `lib/analytics/__tests__/**` + `e2e/analytics-pipeline.spec.ts`                                           |
| `lib/questionnaire/**`            | `lib/questionnaire/__tests__/**` + `e2e/core-journey.spec.ts`                                             |
| `lib/i18n/**`                     | `lib/i18n/__tests__/**` + `npm run lint:i18n`                                                             |
| `lib/db/**`                       | `lib/__tests__/db-crud.test.ts` + `lib/db/__tests__/**`                                                   |
| `lib/cdse/**`                     | `lib/cdse/__tests__/**`                                                                                   |
| `components/immersive-explore/**` | `components/immersive-explore/__tests__/**`                                                               |
| `store/**`                        | `store/__tests__/**`                                                                                      |
| `app/api/auth/**`                 | `app/api/auth/__tests__/**` + `e2e/auth-redirects.spec.ts`                                                |
| `app/api/score/**`                | `app/api/score/__tests__/**`                                                                              |
| `app/api/generate-report/**`      | `app/api/generate-report/__tests__/**`                                                                    |
| `app/api/coaching-chat/**`        | `app/api/coaching-chat/__tests__/**`                                                                      |
| `app/api/session/**`              | `app/api/session/**/__tests__/**` + `e2e/session-lifecycle.spec.ts`                                       |
| `app/api/quickdive/**`            | `app/api/quickdive/**/__tests__/**` + `e2e/quickdive-flow.spec.ts`                                        |
| `app/api/analytics/**`            | `app/api/analytics/**/__tests__/**`                                                                       |
| `app/[locale]/**` (页面)          | 对应的 E2E spec (通过路由名匹配)                                                                          |
| `components/report/**`            | `e2e/report-rendering.spec.ts`                                                                            |
| `e2e/**`                          | 改动的 spec 文件本身                                                                                      |
| `lib/types/**`                    | 全部 vitest (类型变更影响面广)                                                                            |

### Step 3: 执行

```bash
# 始终跑 tsc
npx tsc --noEmit

# 只跑受影响的 vitest 文件
npx vitest run path/to/affected.test.ts path/to/another.test.ts

# 只跑受影响的 playwright spec (需要 dev server)
npx playwright test e2e/affected.spec.ts --reporter=list

# 如果改了 i18n 字典
npm run lint:i18n
```

### Step 4: 输出差异感知报告

```
📂 检测到 5 个文件变更
📋 影响范围: scoring → report-generation → profile-generation

✅ tsc — 0 错误
✅ vitest — 跑了 8/57 文件, 45 测试通过
✅ playwright — 跑了 2/12 spec, 15 测试通过
⏭️ i18n — 无字典变更，跳过

🟢 差异感知测试通过 — 改动范围内无回归
```

---

## 模式 3 — 完整扫描 (`/qa full`)

> 全量测试。适合大版本发布前、重要 PR 合并前。

### Step 1: 全量静态检查

```bash
npx tsc --noEmit
npm run lint
npm run lint:i18n
```

### Step 2: 全量单元测试 (带覆盖率)

```bash
npx vitest run --coverage
```

记录覆盖率数据，与 vitest.config.ts 中的阈值对比：

- `lib/scoring/**`: lines ≥ 80%
- `lib/report-generation/**`: lines ≥ 70%

### Step 3: 全量 E2E (需要 dev server)

```bash
npx playwright test --reporter=list
```

注意超时设置：coaching-flow 300s, core-journey 150s, report-rendering 180s。

### Step 4: API 健康检查 (非 LLM)

对以下关键端点发送请求验证响应状态码：

```bash
# 公开端点 (应返回 200 或 405)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/me

# 需要 CSRF 的端点 (无 token 应返回 403)
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/analytics/event
```

### Step 5: 生成完整报告

```
🔍 完整扫描报告

✅ tsc — 0 错误
✅ lint — 0 错误
✅ i18n — en/zh 键一致
✅ vitest — 57 文件, 312 测试通过
   📊 覆盖率: scoring 85% (阈值 80%) | report-gen 73% (阈值 70%)
✅ playwright — 12 spec, 89 测试通过
✅ API 健康 — 12/12 端点响应正常

🟢 健康评分: 95/100
```

---

## 模式 4 — API 管道 (`/qa api`)

> 验证 API route 的基本健康：HTTP 方法、认证守卫、CSRF 保护、响应格式。

### Step 1: 扫描所有 API route

```bash
# 列出所有 route.ts 文件
find app/api -name "route.ts" -type f | sort
```

### Step 2: 分类

| 类别                                     | 验证方式              | 期望             |
| ---------------------------------------- | --------------------- | ---------------- |
| **公开端点** (auth/login, auth/register) | GET/POST 无 cookie    | 200/400 (非 500) |
| **受保护端点** (score, generate-report)  | POST 无 session       | 401              |
| **CSRF 保护端点**                        | POST 无 csrf-token    | 403              |
| **Admin 端点**                           | 无 admin cookie       | 401/403          |
| **Cron 端点**                            | 无 CRON_SECRET header | 401              |

### Step 3: 逐端点验证

对每个端点发送裸请求（不带认证），验证是否正确拒绝：

```bash
# 受保护端点应拒绝未认证请求
curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/score

# Admin 端点应拒绝非 admin
curl -s -w "\n%{http_code}" http://localhost:3000/api/admin/users
```

### Step 4: 有 API route 单元测试的，运行它们

```bash
# 收集所有 API 测试
npx vitest run app/api/
```

### Step 5: 输出 API 健康报告

```
🔌 API 管道报告

扫描: 90 个 route.ts
有单元测试: 12 个 (13%)
验证通过: 88 个
异常: 2 个 (详见下方)

❌ POST /api/xxx — 无 session 返回 500 (期望 401)
⚠️ POST /api/yyy — 无 CSRF 返回 200 (期望 403)

📊 API 安全覆盖: 88/90 (98%)
```

---

## 模式 5 — 回归对比 (`/qa regression`)

> 与上次基线对比，追踪问题修复进展和新增回归。

### Step 1: 运行完整测试套件

执行与 `/qa full` 相同的步骤，收集结果。

### Step 2: 加载基线

```bash
# 基线存储位置
cat .qa-reports/baseline.json 2>/dev/null
```

如果无基线，先建立基线然后告知用户。

### Step 3: 对比

比较以下维度：

- 新增失败的测试 (回归)
- 之前失败现在通过的测试 (修复)
- 新增的测试文件
- 覆盖率变化
- API 端点状态变化

### Step 4: 更新基线 & 输出

```
📊 回归对比报告 (vs 2026-03-20 基线)

🆕 新增: 3 个测试文件
✅ 修复: 2 个之前失败的测试
❌ 回归: 0 个新失败
📈 覆盖率: scoring 83% → 85% (+2%)

🟢 无回归 — 基线已更新
```

**基线格式 (`.qa-reports/baseline.json`)：**

```json
{
  "date": "2026-03-23",
  "commit": "abc1234",
  "tsc": { "errors": 0 },
  "vitest": { "files": 57, "tests": 312, "passed": 312, "failed": 0 },
  "playwright": { "specs": 12, "tests": 89, "passed": 89, "failed": 0 },
  "coverage": { "scoring": 85, "reportGen": 73 },
  "apiHealth": { "total": 90, "passed": 88, "issues": ["POST /api/xxx: 500"] },
  "lint": { "errors": 0 },
  "i18n": { "synced": true }
}
```

---

## 模式 6 — 覆盖缺口 (`/qa gaps`)

> 分析测试覆盖率，找出盲区，生成优先级建议。

### Step 1: 扫描 API route 测试覆盖

```bash
# 所有 API route
find app/api -name "route.ts" | wc -l

# 有单元测试的 API route
find app/api -path "*/__tests__/*.test.ts" | wc -l
```

列出无测试的 API route，按重要性排序。

### Step 2: 扫描组件测试覆盖

```bash
# 所有组件目录
find components -name "*.tsx" -not -path "*/__tests__/*" | wc -l

# 有测试的组件
find components -path "*/__tests__/*" | wc -l
```

### Step 3: 扫描 lib 模块测试覆盖

```bash
# 所有 lib 模块
find lib -name "*.ts" -not -path "*/__tests__/*" -not -name "*.d.ts" | wc -l

# 有测试的 lib 模块
find lib -path "*/__tests__/*" | wc -l
```

### Step 4: E2E 路由覆盖

对比 `app/[locale]/` 下的页面路由与 `e2e/*.spec.ts` 中覆盖的路由。

### Step 5: 输出缺口报告 + 优先级建议

```
🔍 测试覆盖缺口分析

## API Route 覆盖
- 总计: 90 个 route.ts
- 有单元测试: 12 个 (13%)
- 🔴 高优先级缺失:
  - app/api/generate-profile/route.ts (核心管道)
  - app/api/memory/route.ts (教练记忆)
  - app/api/journey/route.ts (旅程状态机)

## 单元测试覆盖
- scoring: 85% ✅
- report-generation: 73% ✅
- profile-generation: 有测试 ✅
- coaching: 有测试 ✅
- 🟡 缺失: action-hub (仅部分), cohort, journey

## E2E 路由覆盖
- 总页面路由: ~25 个
- E2E 覆盖: 12 个 spec
- 🟡 缺失: immersive-explore, settings, share 页面

## 建议优先级
1. [高] 为 generate-profile API 添加单元测试
2. [高] 为 immersive-explore 添加 E2E spec
3. [中] 为 journey API 添加单元测试
4. [中] 为 Zustand store 添加单元测试
5. [低] 为 settings 页面添加 E2E spec
```

---

## 模式 7 — 浏览器 QA (`/qa browser`)

> 以用户视角操作页面，截图验证，发现 UI 问题。保留原有浏览器 QA 全部能力。

### Step 1: 确认 dev server

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### Step 2: 确定测试范围

**指定 URL 模式：** 直接测试指定页面。

**差异感知模式（无 URL 参数）：**

```bash
git diff --name-only main...HEAD
# 映射到受影响的页面路由
# app/[locale]/(app)/xxx/page.tsx → /en/xxx + /zh/xxx
# components/xxx/ → 找到使用该组件的页面
```

**完整扫描模式 (`/qa browser full`)：**

- 从 `app/[locale]/` 目录结构映射所有路由
- 按优先级：核心流程页 > 功能页 > 静态页

### Step 3: 系统化测试

对每个目标页面检查：

1. 页面加载无控制台错误
2. 关键元素可见
3. 交互功能正常（按钮、表单、导航）
4. 响应式 (375px / 768px / 1440px)
5. i18n 切换正常 (en ↔ zh)
6. 深色模式无异常（如有）

```bash
# 运行相关 Playwright spec
npx playwright test e2e/xxx.spec.ts --reporter=list

# 截图
npx playwright screenshot http://localhost:3000/en/xxx .qa-reports/screenshots/page-name.png
```

### Step 4: 记录问题

每个问题必须包含：

- **截图证据** — 无截图不算发现
- **严重级别** — P0 (崩溃/数据丢失) / P1 (功能失效) / P2 (体验问题) / P3 (美化)
- **复现步骤**
- **受影响页面**

### Step 5: 分诊 & 修复

| 级别    | 行动                 |
| ------- | -------------------- |
| P0 崩溃 | 立即修复，原子提交   |
| P1 功能 | 本轮修复             |
| P2 体验 | 记录到报告，建议修复 |
| P3 美化 | 仅记录               |

**修复规则：**

- 遵守项目规范：冻结区域、i18n 双语、3 文件限制
- 每个修复一个 commit：`fix(qa): 简要描述`
- 修复后重新测试验证
- 引入回归 → 立即回滚
- 单次最多修复 10 个问题
- 风险评估 > 20% 时停止，报告给用户

### Step 6: 最终验证

重新测试所有受影响页面，确认无新问题引入。

---

## 模式 8 — Preview 视觉验证 (`/qa preview`)

> 使用 Claude Preview 内置浏览器进行实时视觉验证。零配置、AI 驱动、自适应。

**委托执行**: 直接调用 `/preview` Skill。

- 无 URL 参数 → `/preview diff`（差异巡检模式）
- 有 URL 参数 → `/preview <URL>`（快速查看模式）

### 何时用 Preview vs Browser

| 维度 | `/qa preview` | `/qa browser` (Playwright) |
|------|---------------|---------------------------|
| 配置 | 零配置，内置 | 需安装 Playwright MCP |
| 速度 | ~1-5min | ~5-15min |
| 判断 | AI 自适应判断 | 脚本化检查 |
| 可重复 | 不可重复 | 可重复 |
| 像素对比 | 不支持 | 支持 |
| 网络拦截 | 不支持 | 支持 |
| CI 集成 | 不支持 | 支持 |
| 最佳场景 | 开发中快速验证 | 提交前/发布前回归 |

---

## 健康评分体系

> 所有产出报告的模式 (full, regression, browser) 附带健康评分。

### 四级质量门控

| 评分   | 等级            | 含义                 |
| ------ | --------------- | -------------------- |
| 90-100 | 🟢 **PASS**     | 可以安全发布         |
| 70-89  | 🟡 **CONCERNS** | 有注意事项，但不阻塞 |
| 50-69  | 🟠 **REWORK**   | 需要修复后重测       |
| 0-49   | 🔴 **FAIL**     | 严重问题，阻塞发布   |

### 评分维度

| 类别            | 权重 | 评分依据                                |
| --------------- | ---- | --------------------------------------- |
| TypeScript 编译 | 15%  | 0 错误 = 10, 有错误 = 0                 |
| 单元测试        | 20%  | 通过率 × 10                             |
| E2E 测试        | 15%  | 通过率 × 10                             |
| API 安全守卫    | 15%  | 受保护端点正确拒绝未认证请求的比率 × 10 |
| 代码规范        | 10%  | lint 错误数: 0=10, 1-5=7, 6-10=4, >10=0 |
| i18n 一致性     | 10%  | en/zh 键同步 = 10, 不同步 = 0           |
| 覆盖率达标      | 10%  | 达到 vitest.config.ts 阈值 = 10         |
| 控制台错误      | 5%   | 浏览器控制台 0 错误 = 10                |

---

## Flaky 测试检测

> 吸收自 OpenObserve Council of Sub Agents 策略。

当某个测试间歇性失败时：

1. **识别**: 同一测试在连续运行中结果不一致
2. **确认**: 对疑似 flaky 测试跑 3 次

```bash
npx vitest run path/to/suspect.test.ts --reporter=verbose
npx vitest run path/to/suspect.test.ts --reporter=verbose
npx vitest run path/to/suspect.test.ts --reporter=verbose
```

3. **标记**: 如果 3 次中有不一致结果，报告为 flaky 并分析根因
4. **常见根因**: 时间依赖、随机数、异步竞态、环境变量、端口冲突

---

## 关键规则

1. **以用户视角测试** — 浏览器模式不读源码找 bug，而是操作页面发现问题
2. **截图是必须的** — 浏览器模式每个问题至少一张截图
3. **原子提交** — 每个修复一个 commit
4. **遵守项目规范** — 冻结区域、i18n、3 文件限制照常执行
5. **安全优先** — 检测到回归立即回滚
6. **中文输出** — 报告、日志、问题描述全部用中文
7. **不猜测，验证** — 不假设测试会通过，跑了才算
8. **差异感知优先** — 默认只跑受影响的测试，减少等待时间
9. **管道感知** — 理解 Deep Dive 的 6 步管道 (QuickDive → Register → Claim → DeepDive → Score → Profile → Report → Coach)，测试时考虑上下游影响
